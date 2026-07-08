// Engine — server-side state machine. Single source of truth for dialogue.
//
// 100% manifest-driven. Every flow runs through the saga runner; this file
// only handles the small number of cross-cutting concerns:
//   - applying LLM slot extractions (typed via manifest.params[slot].extraction)
//   - deterministic confirm/cancel parsing (LLM is fallback only)
//   - selection routing (CHOOSE / DISAMBIGUATE → store picked item into the slot)
//   - cancel / reset / language / force-fail demo controls
//
// Inputs (EngineInput):
//   { type: 'INIT' }                       create session, greet
//   { type: 'START_ACTION', action }       open a flow (mic shortcuts)
//   { type: 'TRANSCRIPT', text }           free-form user utterance
//   { type: 'SELECTION', optionId }        user tapped an option
//   { type: 'CONFIRMATION', confirmed }    user tapped yes/no on confirm sheet
//   { type: 'CANCEL' }                     user closed / cancelled
//   { type: 'RESET' }                      reset to greet, keep lang
//   { type: 'SET_LANG', lang }
//   { type: 'SET_FORCE_FAIL', mode }

import { tm } from './i18n.js';
import { extract } from './llm.js';
import { runSaga } from './saga.js';
import { registry } from '../manifestRegistry.js';
import { parseConfirm } from './confirmParser.js';
import { sessionLog } from '../lib/log.js';

function speak(session, text) {
  if (text) session.history.push({ role: 'bot', text, t: Date.now() });
}
function userSaid(session, text) {
  if (text) session.history.push({ role: 'user', text, t: Date.now() });
}

function applyForceFail(session) {
  const m = session.forceFail;
  session.forceFail = null; // single-shot fuse
  return m;
}

// ── public entry ──────────────────────────────────────────────
export async function processInput(session, input) {
  session.turnCount++;
  const log = sessionLog(session, { input_type: input?.type });
  log.debug({ state: session.state }, 'turn in');
  try {
    let s;
    switch (input.type) {
      case 'INIT':
        s = doInit(session);
        break;
      case 'RESET':
        s = doReset(session);
        break;
      case 'SET_LANG':
        session.lang = input.lang || session.lang;
        s = session;
        break;
      case 'SET_FORCE_FAIL':
        session.forceFail = input.mode || null;
        s = session;
        break;
      case 'START_ACTION':
        s = await doStartAction(session, input.action);
        break;
      case 'CANCEL':
        s = await doCancel(session);
        break;
      case 'TRANSCRIPT':
        s = await doTranscript(session, input.text || '');
        break;
      case 'SELECTION':
        s = await doSelection(session, input.optionId);
        break;
      case 'CONFIRMATION':
        s = await doConfirmation(session, !!input.confirmed);
        break;
      default:
        s = session;
    }
    log.debug({ state: s.state, action: s.action }, 'turn out');
    return s;
  } catch (err) {
    log.error({ err: err?.message || String(err), stack: err?.stack }, 'turn error');
    session.state = 'FAILED';
    session.result = { success: false, errorCode: 'ENGINE', message: String(err?.message || err) };
    return session;
  }
}

function doInit(session) {
  speak(session, tm(null, session.lang, 'greet'));
  return session;
}

function doReset(session) {
  session.action = null;
  session.state = 'IDLE';
  session.params = {};
  session.state_bag = {};
  session.saga = null;
  session.pending = null;
  session.result = null;
  session.history = [];
  session.thinking = false;
  session.executing = false;
  speak(session, tm(null, session.lang, 'greet'));
  return session;
}

async function doStartAction(session, actionName) {
  doReset(session);
  session.action = actionName;
  return advance(session);
}

async function doCancel(session) {
  session.state = 'CANCELLED';
  session.pending = null;
  speak(session, tm(currentManifest(session), session.lang, 'cancelled'));
  return session;
}

function currentManifest(session) {
  return session.action ? registry.get(session.action) : null;
}

// ── TRANSCRIPT (free-form) ────────────────────────────────────
async function doTranscript(session, text) {
  userSaid(session, text);

  // 1) Deterministic confirm parser short-circuits when in CONFIRM state.
  if (session.state === 'CONFIRM') {
    const verdict = parseConfirm(text, session.lang);
    if (verdict === 'confirm') return doConfirmation(session, true);
    if (verdict === 'cancel') return doConfirmation(session, false);
    // fall through to LLM only when deterministic parser is uncertain
  }

  const stateContext = {
    dialog_state: session.state,
    action: session.action,
    asking_for: session.pending?.slot || null,
    pending_kind: session.pending?.kind || null,
    last_bot_msg: [...session.history].reverse().find((h) => h.role === 'bot')?.text || null,
    options: (session.pending?.options || []).map((o, i) => ({
      idx: i + 1,
      label: o.label,
      sub: o.sublabel,
    })),
    filled: filledSnapshot(session),
    language: session.lang,
  };
  const history = session.history.slice(0, -1).slice(-6);

  session.thinking = true;
  const intent = await extract({ utterance: text, state: stateContext, history });
  session.thinking = false;
  session.lastIntent = intent;

  if (intent?.language && ['en', 'hi', 'te', 'ta'].includes(intent.language)) {
    session.lang = intent.language;
  }

  if (intent?.error === 'llm_unavailable' || intent?.error === 'llm_quota' || intent?.error === 'llm_auth') {
    speak(session, tm(currentManifest(session), session.lang, intent.error));
    return session;
  }

  return applyIntent(session, intent, text);
}

function filledSnapshot(s) {
  const p = s.params;
  const out = {};
  if (p.amount != null) out.amount = p.amount;
  if (p.contact?.name) out.recipient = p.contact.name;
  else if (p.recipient_handle) out.recipient = p.recipient_handle;
  if (p.from_account?.type) out.from_account = p.from_account.type;
  if (p.to_account?.type) out.to_account = p.to_account.type;
  if (p.biller?.name) out.biller = p.biller.name;
  if (p.target_account) out.target_account = p.target_account;
  if (p.selected_flight?.id) out.flight = p.selected_flight.id;
  for (const k of ['origin', 'destination', 'date', 'passenger_name', 'passenger_phone']) {
    if (p[k]) out[k] = p[k];
  }
  return out;
}

async function applyIntent(session, intent, rawText) {
  const action = intent?.action || intent?.intent || 'unknown';
  const slots = intent?.slots || {};
  const reply = typeof intent?.reply === 'string' ? intent.reply.trim() : '';

  if (action === 'cancel') return doCancel(session);

  // smalltalk / off-topic / hesitation: speak the LLM's contextual reply (which
  // already contains the re-prompt), don't touch state or pending. The user's
  // next turn will resume the flow exactly where it was.
  if (action === 'smalltalk') {
    handleSmalltalk(session, reply);
    return session;
  }

  // CONFIRM state: LLM either confirms, cancels, or restarts the flow with new slots.
  if (session.state === 'CONFIRM') {
    if (action === 'confirm') return doConfirmation(session, true);
    const knownAction = registry.get(action);
    const hasNewSlots = Object.values(slots).some((v) => v != null && v !== '');
    if (knownAction && hasNewSlots) {
      doReset(session);
      session.action = action;
      mergeSlots(session, slots, knownAction);
      return advance(session);
    }
    if (knownAction && !hasNewSlots) return doConfirmation(session, true);
    speak(session, tm(currentManifest(session), session.lang, 'sayYesPrompt'));
    return session;
  }

  // CHOOSE / DISAMBIGUATE: select an option OR provide new material to restart resolution.
  if (session.state === 'DISAMBIGUATE' || session.state === 'CHOOSE') {
    if (action === 'select' && slots.selection != null) {
      return applyLLMSelection(session, slots.selection, rawText);
    }
    const manifest = currentManifest(session);
    const hasMaterial = Object.keys(slots).some(
      (k) => manifest?.params?.[k] && slots[k] != null && slots[k] !== '',
    );
    if (hasMaterial) {
      // Wipe whatever was being asked so the lookup re-runs with new input.
      const slot = session.pending?.slot;
      if (slot) session.params[slot] = null;
      mergeSlots(session, slots, manifest);
      return advance(session);
    }
    speak(session, tm(manifest, session.lang, 'didnt_catch'));
    return session;
  }

  // IDLE / FILL / DONE / FAILED: dispatch to a known action, or fold slots into the current one.
  if (registry.get(action)) {
    if (
      !session.action ||
      ['DONE', 'CANCELLED', 'FAILED'].includes(session.state) ||
      session.action !== action
    ) {
      doReset(session);
      session.action = action;
    }
    mergeSlots(session, slots, registry.get(action));
    return advance(session);
  }

  // Mid-flow but LLM said unknown
  if (session.action && session.state === 'FILL') {
    const manifest = currentManifest(session);
    const matched = Object.keys(slots).filter(
      (k) => manifest?.params?.[k] && slots[k] != null && slots[k] !== '',
    );
    if (matched.length > 0) {
      mergeSlots(session, slots, manifest);
      return advance(session);
    }
    // Narrow free-text fallback: only accept the raw utterance as the slot
    // value if the slot is explicitly opted-in via extraction.accept_freetext
    // (used for passenger_name, target_account, etc). Otherwise fall through
    // to smalltalk so chitchat doesn't become a passenger name.
    const slot = session.pending?.slot;
    const def = slot ? manifest?.params?.[slot] : null;
    if (slot && def && def.extraction?.accept_freetext && looksLikeFreetextValue(rawText)) {
      session.params[slot] = rawText.trim();
      return advance(session);
    }
    handleSmalltalk(session, reply);
    return session;
  }

  handleSmalltalk(session, reply);
  return session;
}

// Heuristic: only accept the raw utterance as a free-text slot value if it
// "looks like" a real value — short, no question marks, no obvious filler
// words. Prevents "uhh let me think" from becoming a passenger name.
const FILLER_RE = /\b(uhh+|umm+|hmm+|wait|hold on|let me think|actually|never mind|forget it)\b/i;
function looksLikeFreetextValue(text) {
  const t = String(text || '').trim();
  if (!t) return false;
  if (t.length > 60) return false;
  if (t.includes('?')) return false;
  if (FILLER_RE.test(t)) return false;
  return true;
}

// Speak the LLM's contextual reply (which already contains a re-prompt). When
// the LLM didn't produce one (or is unavailable), fall back to a generic
// "didn't catch that" plus re-speak the previous bot prompt so the user always
// knows what to answer next.
function handleSmalltalk(session, reply) {
  if (reply) {
    speak(session, reply);
    return;
  }
  const previousBotPrompt = previousBotMessage(session);
  speak(session, tm(currentManifest(session), session.lang, 'didnt_catch'));
  if (previousBotPrompt) speak(session, previousBotPrompt);
}

// The most recent bot message in history, captured BEFORE we push anything new
// this turn. Used to re-ask after a smalltalk reply.
function previousBotMessage(session) {
  const hist = session.history || [];
  for (let i = hist.length - 1; i >= 0; i--) {
    if (hist[i].role === 'bot') return hist[i].text;
  }
  return null;
}

function applyLLMSelection(session, selection, rawText) {
  const opts = session.pending?.options || [];
  if (!opts.length) return advance(session);
  if (typeof selection === 'number') {
    const idx = selection - 1;
    if (idx >= 0 && idx < opts.length) return doSelection(session, opts[idx].id);
  }
  const sel = String(selection).toLowerCase();
  const match = opts.find(
    (o) =>
      (o.label && o.label.toLowerCase().includes(sel)) ||
      (o.sublabel && o.sublabel.toLowerCase().includes(sel)) ||
      sel.includes((o.label || '').toLowerCase()),
  );
  if (match) return doSelection(session, match.id);
  const r = (rawText || '').toLowerCase();
  const fuzzy = opts.find((o) => r.includes((o.label || '').toLowerCase().split(/\s+/)[0]));
  if (fuzzy) return doSelection(session, fuzzy.id);
  speak(session, tm(currentManifest(session), session.lang, 'didnt_catch'));
  return session;
}

// ── SELECTION (UI tap) ────────────────────────────────────────
async function doSelection(session, optionId) {
  if (!session.pending) return session;
  const slot = session.pending.slot;
  const picked = session.pending.options?.find((o) => o.id === optionId);
  if (!picked) return session;
  userSaid(session, picked.label);
  session.params[slot] = picked._data;
  return advance(session);
}

// ── CONFIRMATION (UI tap or deterministic) ────────────────────
async function doConfirmation(session, confirmed) {
  if (session.state !== 'CONFIRM') return session;
  userSaid(session, confirmed ? 'yes' : 'cancel');
  session.params.__confirmed = !!confirmed;
  return advance(session);
}

// ── ADVANCE: run the manifest's saga ──────────────────────────
async function advance(session) {
  if (!session.action) return session;
  const manifest = registry.get(session.action);
  if (!manifest) {
    session.state = 'FAILED';
    session.result = {
      success: false,
      errorCode: 'UNKNOWN_ACTION',
      message: `Unknown action: ${session.action}`,
    };
    return session;
  }
  if (!Array.isArray(manifest.steps) || manifest.steps.length === 0) {
    session.state = 'FAILED';
    session.result = {
      success: false,
      errorCode: 'NO_STEPS',
      message: `Manifest ${session.action} has no steps.`,
    };
    return session;
  }
  return runSaga(session, manifest, { speak, applyForceFail });
}

// ── Generic slot merging ──────────────────────────────────────
//
// Each manifest declares per-slot `extraction` (coerce, regex, enum). We apply
// them generically. Slots not declared in the active manifest are ignored —
// the LLM may emit slots from the global vocabulary that don't apply here.
function mergeSlots(session, slots, manifest) {
  if (!slots || !manifest) return;
  const params = manifest.params || {};
  for (const [k, raw] of Object.entries(slots)) {
    if (raw == null || raw === '') continue;
    const def = params[k];
    if (!def) continue;
    let v = raw;

    // Special amount sentinel: "__default__" → use biller default if present.
    if (v === '__default__') {
      if (k === 'amount' && session.params.biller?.defaultAmount != null) {
        session.params.amount = session.params.biller.defaultAmount;
      }
      continue;
    }

    // Coerce
    const coerce = def.extraction?.coerce || (def.type === 'number' ? 'number' : null);
    if (coerce === 'number') {
      const n = Number(v);
      if (Number.isNaN(n)) continue;
      v = n;
    } else if (coerce === 'boolean') {
      v = !!v;
    } else if (def.type === 'enum') {
      if (!def.enum?.includes(String(v))) continue;
      v = String(v);
    } else {
      v = String(v).trim();
    }

    // Intentionally no constraint check here — the saga's `validate` step is
    // the authoritative validator and produces proper user-facing error messages.
    // Silently dropping a slot value here causes the engine to re-ask the same
    // question with no feedback, which is confusing (e.g. user says "50000" and
    // gets "I didn't catch the amount" instead of "that exceeds the limit").
    if (def.extraction?.regex && !new RegExp(def.extraction.regex).test(String(v))) continue;
    if (def.enum && def.type !== 'enum' && !def.enum.includes(v)) continue;

    // Sentinel for target_account
    if (k === 'target_account' && (v === '__needs_new__' || v === '__use_default__')) {
      if (v === '__use_default__' && session.params.biller?.sample) {
        session.params.target_account = session.params.biller.sample;
      } else if (v === '__needs_new__') {
        session.params.target_account = null;
      }
      continue;
    }

    session.params[k] = v;
  }
}
