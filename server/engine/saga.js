// Generic saga runner — manifest-driven dialogue execution.
//
// Walks a manifest's `steps` array forward, suspending at any step that needs
// user input (ASK / DISAMBIGUATE / CHOOSE / CONFIRM). Tool calls run inline,
// failures trigger compensations, validators can jump back to earlier steps.
//
// Step types:
//   { id, type: 'ask',          slot, prompt_key, prompt_args?, kind?, skip_if? }
//   { id, type: 'default_fill', slot, tool?, input_map?, value?, skip_if? }
//   { id, type: 'lookup',       tool, input_map, output_slot, label_template,
//                                sublabel_template?, prompt_key, empty_prompt_key?,
//                                on_empty_goto?, auto_select_if_single?, kind?, skip_if? }
//   { id, type: 'choose',       from?|from_state?|tool?, store_to_slot, label_template,
//                                sublabel_template?, prompt_key, on_empty_goto?,
//                                auto_select_if_single?, kind?, exclude_path?, skip_if? }
//   { id, type: 'validate',     slot, rules:[{type,value?,path?,msg_key?,msg_args?}],
//                                on_fail_goto, clear_on_fail?, skip_if? }
//   { id, type: 'tool_call',    tool, input_map, output_key?, output_slot?,
//                                compensation?, compensation_input_map?, force_failable? }
//   { id, type: 'confirm',      prompt_key, prompt_args?, summary_template?, details? }
//   { id, type: 'result',       success_key?, args?, text_template?, from_state?,
//                                item_template?, join? }
//
// Templates: {slots.x.y} {state.x} {item.x} resolved against the saga ctx.
// Path inputs: "$slots.x" / "$state.x" raw lookup in input_map.
// Predicates (skip_if): "slots.x && !slots.y" — see expr.js.

import { tools } from './tools.js';
import { tm } from './i18n.js';
import { bindInputs, evalExpr, lookupPath, render } from './expr.js';

function buildCtx(session, extra = {}) {
  return {
    slots: session.params,
    state: session.state_bag,
    lang: session.lang,
    session: { id: session.id, lang: session.lang, action: session.action },
    ...extra,
  };
}

function findStepIndex(manifest, id) {
  if (!id) return -1;
  return manifest.steps.findIndex((s) => s.id === id);
}

function progress(session, manifest, step) {
  return {
    index: session.saga.stepIndex + 1,
    total: manifest.steps.length,
    label: step.id,
  };
}

function speakKey(session, manifest, key, args = []) {
  return tm(manifest, session.lang, key, ...args);
}

export async function runSaga(session, manifest, { speak, applyForceFail }) {
  if (!session.saga) {
    session.saga = {
      manifestId: manifest.action,
      stepIndex: 0,
      compensations: [],
    };
  }

  // Hard cap to prevent infinite loops via mis-configured jumps.
  let safety = (manifest.steps.length + 5) * 8;

  while (session.saga.stepIndex < manifest.steps.length) {
    if (--safety < 0) {
      session.state = 'FAILED';
      session.result = {
        success: false,
        errorCode: 'SAGA_LOOP',
        message: 'Internal error: dialogue step loop.',
      };
      speak(session, session.result.message);
      return session;
    }

    const step = manifest.steps[session.saga.stepIndex];
    const ctx = buildCtx(session);

    if (step.skip_if && evalExpr(step.skip_if, ctx)) {
      session.saga.stepIndex++;
      continue;
    }

    switch (step.type) {
      case 'ask': {
        const cur = lookupPath(`slots.${step.slot}`, ctx);
        if (cur != null && cur !== '' && cur !== '__needs_new__') {
          session.saga.stepIndex++;
          continue;
        }
        const args = (step.prompt_args || []).map((a) => render(a, ctx));
        const prompt = speakKey(session, manifest, step.prompt_key, args);
        session.state = 'FILL';
        session.pending = {
          kind: step.kind || 'free_text',
          slot: step.slot,
          prompt,
          progress: progress(session, manifest, step),
        };
        speak(session, prompt);
        return session;
      }

      case 'default_fill': {
        const cur = lookupPath(`slots.${step.slot}`, ctx);
        if (cur != null && cur !== '') {
          session.saga.stepIndex++;
          continue;
        }
        let val;
        if (step.tool) {
          const input = bindInputs(step.input_map, ctx);
          val = await tools.call(step.tool, input, {});
        } else {
          val = step.value;
        }
        if (val != null) session.params[step.slot] = val;
        session.saga.stepIndex++;
        continue;
      }

      case 'lookup': {
        const cur = lookupPath(`slots.${step.output_slot}`, ctx);
        if (cur != null) {
          session.saga.stepIndex++;
          continue;
        }
        const input = bindInputs(step.input_map, ctx);
        const items = await tools.call(step.tool, input, {});
        const arr = Array.isArray(items) ? items : items?.results || [];

        if (arr.length === 0) {
          if (step.empty_prompt_key) {
            const args = (step.empty_prompt_args || []).map((a) => render(a, ctx));
            speak(session, speakKey(session, manifest, step.empty_prompt_key, args));
          }
          if (step.on_empty_goto) {
            const idx = findStepIndex(manifest, step.on_empty_goto);
            if (idx >= 0) {
              // Clear the input slot the user was asked for so we re-prompt.
              const targetStep = manifest.steps[idx];
              if (targetStep?.slot) session.params[targetStep.slot] = null;
              session.saga.stepIndex = idx;
              continue;
            }
          }
          // No goto — present an empty list as a hard FAIL.
          session.state = 'FAILED';
          session.result = {
            success: false,
            errorCode: 'NO_OPTIONS',
            message: speakKey(session, manifest, step.empty_prompt_key || 'didnt_catch'),
          };
          return session;
        }

        if (arr.length === 1 && step.auto_select_if_single !== false) {
          session.params[step.output_slot] = arr[0];
          if (step.state_key) session.state_bag[step.state_key] = arr;
          session.saga.stepIndex++;
          continue;
        }

        // Many → DISAMBIGUATE
        if (step.state_key) session.state_bag[step.state_key] = arr;
        const options = arr.map((it, i) => ({
          id: it.id ?? String(i + 1),
          label: render(step.label_template, { ...ctx, item: it }),
          sublabel: step.sublabel_template
            ? render(step.sublabel_template, { ...ctx, item: it })
            : undefined,
          _data: it,
        }));
        const args = (step.prompt_args || []).map((a) => render(a, { ...ctx, count: arr.length }));
        session.state = 'DISAMBIGUATE';
        session.pending = {
          kind: step.kind || 'disambig',
          slot: step.output_slot,
          prompt: speakKey(session, manifest, step.prompt_key, [arr.length, ...args]),
          options,
          progress: progress(session, manifest, step),
        };
        speak(session, session.pending.prompt);
        return session;
      }

      case 'choose': {
        const stored = lookupPath(`slots.${step.store_to_slot}`, ctx);
        if (stored != null) {
          session.saga.stepIndex++;
          continue;
        }
        let arr = [];
        if (step.from) {
          const v = lookupPath(step.from.replace(/^\$/, ''), ctx);
          arr = Array.isArray(v) ? v : [];
        } else if (step.from_state) {
          const v = lookupPath(`state.${step.from_state}`, ctx);
          arr = Array.isArray(v) ? v : [];
        } else if (step.tool) {
          const input = bindInputs(step.input_map, ctx);
          const v = await tools.call(step.tool, input, {});
          arr = Array.isArray(v) ? v : v?.results || [];
        }
        if (step.exclude_path) {
          const ex = lookupPath(step.exclude_path.replace(/^\$/, ''), ctx);
          if (ex && ex.id) arr = arr.filter((x) => x.id !== ex.id);
          else if (ex && typeof ex === 'string') arr = arr.filter((x) => x !== ex);
        }

        if (arr.length === 0) {
          const emptyArgs = (step.empty_prompt_args || []).map((a) => {
            if (typeof a === 'string' && a.startsWith('$')) return lookupPath(a.slice(1), ctx);
            return render(a, ctx);
          });
          const msg = speakKey(session, manifest, step.empty_prompt_key || 'didnt_catch', emptyArgs);
          if (step.on_empty_goto) {
            speak(session, msg);
            const idx = findStepIndex(manifest, step.on_empty_goto);
            if (idx >= 0) {
              // Mirror the lookup-step behaviour: clear the target step's slot so
              // it re-prompts. Without this, an `ask` step with the slot already
              // filled would skip and we'd fall straight back into the same
              // empty `choose` — a saga loop.
              const targetStep = manifest.steps[idx];
              if (targetStep?.slot) session.params[targetStep.slot] = null;
              // Optional: clear additional slots so downstream steps re-run.
              // Useful when the empty-goto restarts the flow from a default_fill
              // and we need a later validate to actually re-trigger.
              if (Array.isArray(step.clear_slots_on_empty)) {
                for (const s of step.clear_slots_on_empty) session.params[s] = null;
              }
              session.saga.stepIndex = idx;
              continue;
            }
          }
          session.state = 'FAILED';
          session.result = { success: false, errorCode: 'NO_OPTIONS', message: msg };
          speak(session, msg);
          return session;
        }

        if (arr.length === 1 && step.auto_select_if_single) {
          session.params[step.store_to_slot] = arr[0];
          session.saga.stepIndex++;
          continue;
        }

        const options = arr.map((it, i) => ({
          id: it.id ?? String(i + 1),
          label: render(step.label_template, { ...ctx, item: it }),
          sublabel: step.sublabel_template
            ? render(step.sublabel_template, { ...ctx, item: it })
            : undefined,
          _data: it,
        }));
        const args = (step.prompt_args || []).map((a) => render(a, { ...ctx, count: arr.length }));
        session.state = 'CHOOSE';
        session.pending = {
          kind: step.kind || 'saga_choose',
          slot: step.store_to_slot,
          prompt: speakKey(session, manifest, step.prompt_key, args),
          options,
          progress: progress(session, manifest, step),
        };
        speak(session, session.pending.prompt);
        return session;
      }

      case 'validate': {
        const value = lookupPath(`slots.${step.slot}`, ctx);
        let failed = null;
        for (const rule of step.rules || []) {
          if (!checkRule(value, rule, ctx)) {
            failed = rule;
            break;
          }
        }
        if (failed) {
          const args = (failed.msg_args || []).map((a) => {
            if (typeof a === 'string' && (a.startsWith('$') || a.includes('{'))) {
              if (a.startsWith('$')) return lookupPath(a.slice(1), ctx);
              return render(a, ctx);
            }
            return a;
          });
          if (failed.msg_key) {
            speak(session, speakKey(session, manifest, failed.msg_key, args));
          }
          if (step.clear_on_fail !== false) session.params[step.slot] = null;
          // clear_slots_on_fail: explicit list of additional slots to null out,
          // useful when the validation logically points at a different slot
          // than `slot` (e.g. balance failure → clear from_account, not amount).
          if (Array.isArray(step.clear_slots_on_fail)) {
            for (const s of step.clear_slots_on_fail) session.params[s] = null;
          }
          const idx = findStepIndex(manifest, step.on_fail_goto);
          if (idx >= 0) {
            session.saga.stepIndex = idx;
            continue;
          }
        }
        session.saga.stepIndex++;
        continue;
      }

      case 'tool_call': {
        try {
          const input = bindInputs(step.input_map, ctx);
          session.executing = true;
          const result = await tools.call(step.tool, input, {
            forceFail: step.force_failable === false ? null : applyForceFail(session),
          });
          session.executing = false;
          if (step.output_key) session.state_bag[step.output_key] = result;
          if (step.output_slot) session.params[step.output_slot] = result;
          if (step.compensation) {
            session.saga.compensations.push({
              tool: step.compensation,
              input: bindInputs(step.compensation_input_map || {}, buildCtx(session)),
            });
          }
          session.saga.stepIndex++;
          continue;
        } catch (err) {
          session.executing = false;
          await runCompensations(session);
          const code = err?.code || 'TOOL_FAILED';
          const msg = err?.message || speakKey(session, manifest, 'network_error');
          session.state = 'FAILED';
          session.result = {
            success: false,
            errorCode: code,
            message: msg,
            retryable: err?.retryable !== false,
          };
          speak(session, msg);
          return session;
        }
      }

      case 'confirm': {
        if (session.params.__confirmed === true) {
          delete session.params.__confirmed;
          session.saga.stepIndex++;
          continue;
        }
        if (session.params.__confirmed === false) {
          delete session.params.__confirmed;
          await runCompensations(session);
          session.state = 'CANCELLED';
          const msg = speakKey(session, manifest, 'cancelled');
          speak(session, msg);
          session.result = {
            success: false,
            errorCode: 'USER_CANCELLED',
            message: msg,
            retryable: false,
          };
          return session;
        }
        const summary = step.summary_template ? render(step.summary_template, ctx) : '';
        const details = (step.details || []).map((d) => ({
          label: d.label,
          value: render(d.value, ctx),
        }));
        const args = (step.prompt_args || []).map((a) => {
          if (typeof a === 'string' && a.startsWith('$')) return lookupPath(a.slice(1), ctx);
          return render(a, ctx);
        });
        const prompt = speakKey(session, manifest, step.prompt_key, args);
        session.state = 'CONFIRM';
        session.pending = {
          kind: 'confirm',
          summary,
          details,
          prompt,
          progress: progress(session, manifest, step),
        };
        speak(session, prompt);
        return session;
      }

      case 'result': {
        let msg;
        if (step.text_template) {
          msg = render(step.text_template, ctx);
        } else if (step.from_state && step.item_template) {
          const arr = lookupPath(`state.${step.from_state}`, ctx) || [];
          const lines = (Array.isArray(arr) ? arr : []).map((item) =>
            render(step.item_template, { ...ctx, item }),
          );
          msg = lines.join(step.join ?? '\n');
        } else if (step.success_key) {
          const args = (step.args || []).map((a) => {
            if (typeof a === 'string' && a.startsWith('$')) return lookupPath(a.slice(1), ctx);
            return render(a, ctx);
          });
          msg = speakKey(session, manifest, step.success_key, args);
        } else {
          msg = '';
        }
        const success = step.success !== false;
        session.state = success ? 'DONE' : 'FAILED';
        session.result = { success, message: msg, raw: session.state_bag };
        if (msg) speak(session, msg);
        return session;
      }

      default:
        // unknown step — skip rather than hang
        session.saga.stepIndex++;
        continue;
    }
  }

  session.state = 'DONE';
  if (!session.result) session.result = { success: true, message: '' };
  return session;
}

function checkRule(value, rule, ctx) {
  switch (rule.type) {
    case 'positive':
      return Number(value) > 0;
    case 'min':
      return Number(value) >= Number(rule.value);
    case 'max':
      return Number(value) <= Number(rule.value);
    case 'max_path': {
      const target = Number(lookupPath(rule.path?.replace(/^\$/, ''), ctx));
      if (!Number.isFinite(target)) return true; // can't check → pass (don't false-fail)
      return Number(value) <= target;
    }
    case 'eq_path':
      return value === lookupPath(rule.path?.replace(/^\$/, ''), ctx);
    case 'not_eq_path':
      return value !== lookupPath(rule.path?.replace(/^\$/, ''), ctx);
    case 'regex':
      return new RegExp(rule.value).test(String(value ?? ''));
    default:
      return true;
  }
}

async function runCompensations(session) {
  const list = (session.saga?.compensations || []).slice().reverse();
  for (const c of list) {
    try {
      await tools.call(c.tool, c.input || {}, {});
    } catch (e) {
      // Phase 3 will route this to a DLQ. For now, capture as audit-grade warn.
      console.warn(`[saga] compensation ${c.tool} failed:`, e?.message);
    }
  }
  if (session.saga) session.saga.compensations = [];
}
