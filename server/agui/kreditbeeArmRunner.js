import { randomUUID } from 'node:crypto';
import { KREDITBEE_ARM_AGENT_ID, KB_ARM_AGENT_SYSTEM } from './kreditbeeArmConfig.js';
import { executeKreditbeeArmTool, kreditbeeArmOpenAiTools } from './kreditbeeArmTools.js';
import { module_ } from '../lib/log.js';
import { getOpenAIClient, getChatModel, hasLlmConfigured } from '../lib/openaiClient.js';

const log = module_('agui:kb_arm');

function sseEncode(obj) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

function agUiMessagesToOpenAI(messages) {
  const out = [];
  for (const m of messages || []) {
    const role = m.role;
    const content = m.content != null ? String(m.content) : '';
    if (role === 'user' || role === 'system') {
      out.push({ role, content });
    } else if (role === 'assistant') {
      const entry = { role: 'assistant', content: content || '' };
      if (Array.isArray(m.tool_calls) && m.tool_calls.length) {
        entry.tool_calls = m.tool_calls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.function?.name, arguments: tc.function?.arguments || '{}' },
        }));
      }
      out.push(entry);
    } else if (role === 'tool') {
      out.push({ role: 'tool', tool_call_id: m.tool_call_id, content });
    }
  }
  return out;
}

function buildSystemPrompt(state) {
  const tail = `\n\n## Current journey state\n${JSON.stringify(state, null, 2)}`;
  return KB_ARM_AGENT_SYSTEM + tail;
}

function normSpeech(text) {
  return String(text || '')
    .replace(/\[[^\]]*\]/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s@.-]/g, ' ')
    .replace(/\s+/g, ' ');
}

/** Infer select_option value from user speech when the model skips the tool. */
function inferArmSelectValue(journeyStep, userText) {
  const n = normSpeech(userText);
  if (!n) return null;

  switch (journeyStep) {
    case 'terms':
      if (/^(yes|yeah|yep|agree|i agree|accepted|ok|okay)/.test(n)) return 'agree';
      if (/^(no|nope|disagree|decline)/.test(n)) return 'no';
      break;
    case 'aadhaar_consent':
    case 'differently_abled':
    case 'address_same':
      if (/^(yes|yeah|yep|y|agree|i agree|consent|ok|okay|same|correct)/.test(n)) return 'yes';
      if (/^(no|nope|n|different|nahin|nahi)/.test(n)) return 'no';
      break;
    case 'aadhaar_mobile_link':
      if (/different|another|other number/.test(n)) return 'no_different';
      if (/^(yes|yeah|yep|y|linked|same)/.test(n)) return 'yes';
      break;
    case 'marital_status':
      if (/single|unmarried/.test(n)) return 'single';
      if (/married/.test(n)) return 'married';
      if (/divorc/.test(n)) return 'divorced';
      break;
    case 'education':
      if (/10th|tenth/.test(n)) return '10th pass';
      if (/12th|twelfth/.test(n)) return '12th pass';
      if (/diploma/.test(n)) return 'diploma';
      if (/post\s*grad|postgrad/.test(n)) return 'post graduate';
      if (/grad/.test(n)) return 'graduate';
      if (/phd|doctorate/.test(n)) return 'doctorate / phd';
      if (/professional|ca\b|cs\b/.test(n)) return 'professional (ca/cs/etc.)';
      break;
    case 'residence_type':
      if (/owned|own/.test(n)) return 'owned';
      if (/rent/.test(n)) return 'rented';
      if (/\bpg\b/.test(n)) return 'pg';
      if (/office/.test(n)) return 'office provided';
      if (/other/.test(n)) return 'others';
      break;
    case 'income_verify':
      if (/verify|yes|proceed|now/.test(n)) return 'verify';
      if (/skip|later|no|not now/.test(n)) return 'skip';
      break;
    case 'family_reference':
      if (/father|dad|papa/.test(n)) return 'father';
      if (/mother|mom|mummy/.test(n)) return 'mother';
      if (/skip/.test(n)) return 'skip';
      break;
    default:
      break;
  }
  return null;
}

export async function streamKreditbeeArmRun(res, agentId, inputData, { signal } = {}) {
  if (agentId !== KREDITBEE_ARM_AGENT_ID) {
    res.status(404).type('text/plain').send(`unknown agent: ${agentId}`);
    return;
  }

  if (!hasLlmConfigured()) {
    res.status(503);
    res.setHeader('Content-Type', 'text/event-stream');
    res.write(
      sseEncode({
        type: 'RUN_ERROR',
        message: 'LLM not configured. Add Azure OpenAI credentials to .env and restart.',
      }),
    );
    res.end();
    return;
  }

  const model = getChatModel();
  const client = getOpenAIClient();
  const threadId = String(inputData.thread_id || randomUUID());
  const runId = String(inputData.run_id || randomUUID());
  const state = {
    ...(inputData.state && typeof inputData.state === 'object' ? inputData.state : {}),
  };

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  const write = (obj) => {
    if (!res.writableEnded) res.write(sseEncode(obj));
  };

  const onAbort = () => {
    try {
      res.end();
    } catch {
      /* ignore */
    }
  };
  signal?.addEventListener('abort', onAbort);

  write({ type: 'RUN_STARTED', thread_id: threadId, run_id: runId });

  try {
    const raw = agUiMessagesToOpenAI(inputData.messages);
    const systemNotes = [];
    const history = [];
    for (const m of raw) {
      if (m.role === 'system') systemNotes.push(m.content);
      else history.push(m);
    }
    const systemTail =
      systemNotes.length > 0 ? `\n\n## Context from the app\n${systemNotes.join('\n---\n')}` : '';

    const messages = [
      { role: 'system', content: buildSystemPrompt(state) + systemTail },
      ...history,
    ];
    const tools = kreditbeeArmOpenAiTools();

    for (let step = 0; step < 14; step++) {
      if (signal?.aborted) break;

      const stream = await client.chat.completions.create({ model, messages, tools, stream: true });
      const messageId = randomUUID();
      let assistantText = '';
      const toolCallBuf = new Map();
      const openedStart = new Set();

      for await (const chunk of stream) {
        if (signal?.aborted) break;
        const choice = chunk.choices?.[0];
        if (!choice?.delta) continue;
        const delta = choice.delta;

        if (delta.content) {
          assistantText += delta.content;
          write({
            type: 'TEXT_MESSAGE_CHUNK',
            message_id: messageId,
            role: 'assistant',
            delta: delta.content,
          });
        }

        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!toolCallBuf.has(idx)) toolCallBuf.set(idx, { id: '', name: '', args: '' });
            const slot = toolCallBuf.get(idx);
            if (tc.id) slot.id = tc.id;
            if (tc.function?.name) slot.name = tc.function.name;
            if (tc.function?.arguments) slot.args += tc.function.arguments;

            if (slot.id && slot.name && !openedStart.has(idx)) {
              openedStart.add(idx);
              write({
                type: 'TOOL_CALL_START',
                tool_call_id: slot.id,
                tool_call_name: slot.name,
                parent_message_id: messageId,
              });
            }
            if (tc.function?.arguments && slot.id) {
              write({
                type: 'TOOL_CALL_ARGS',
                tool_call_id: slot.id,
                delta: tc.function.arguments,
              });
            }
          }
        }
      }

      for (const [, slot] of toolCallBuf) {
        if (slot.id) write({ type: 'TOOL_CALL_END', tool_call_id: slot.id });
      }

      if (toolCallBuf.size === 0) {
        messages.push({ role: 'assistant', content: assistantText || '' });

        const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
        const inferred = inferArmSelectValue(state.journeyStep || 'terms', lastUser);
        if (inferred) {
          const args = { value: inferred };
          const exec = executeKreditbeeArmTool('select_option', args, state);
          if (exec.statePatches?.length) {
            write({ type: 'STATE_DELTA', delta: exec.statePatches });
          }
          const fakeId = `fallback_${Date.now()}`;
          write({
            type: 'TOOL_CALL_START',
            tool_call_id: fakeId,
            tool_call_name: 'select_option',
            parent_message_id: messageId,
          });
          write({ type: 'TOOL_CALL_ARGS', tool_call_id: fakeId, delta: JSON.stringify(args) });
          write({ type: 'TOOL_CALL_END', tool_call_id: fakeId });
          write({
            type: 'TOOL_CALL_RESULT',
            message_id: randomUUID(),
            tool_call_id: fakeId,
            content: JSON.stringify(exec.result),
            role: 'tool',
          });
        }

        break;
      }

      messages.push({
        role: 'assistant',
        content: assistantText || '',
        tool_calls: Array.from(toolCallBuf.values())
          .filter((s) => s.id)
          .map((s) => ({
            id: s.id,
            type: 'function',
            function: { name: s.name, arguments: s.args || '{}' },
          })),
      });

      for (const slot of toolCallBuf.values()) {
        if (!slot.id) continue;
        let args = {};
        try {
          args = slot.args ? JSON.parse(slot.args) : {};
        } catch {
          args = {};
        }

        const exec = executeKreditbeeArmTool(slot.name, args, state);

        if (exec.statePatches?.length) {
          write({ type: 'STATE_DELTA', delta: exec.statePatches });
        }

        write({
          type: 'TOOL_CALL_RESULT',
          message_id: randomUUID(),
          tool_call_id: slot.id,
          content: JSON.stringify(exec.result),
          role: 'tool',
        });

        messages.push({
          role: 'tool',
          tool_call_id: slot.id,
          content: JSON.stringify(exec.result),
        });
      }

      messages[0] = { role: 'system', content: buildSystemPrompt(state) + systemTail };
    }

    write({ type: 'RUN_FINISHED', thread_id: threadId, run_id: runId });
  } catch (err) {
    log.error({ err: err?.message || String(err) }, 'kreditbee arm agui error');
    write({ type: 'RUN_ERROR', message: err?.message || String(err) });
  } finally {
    signal?.removeEventListener('abort', onAbort);
    try {
      res.end();
    } catch {
      /* ignore */
    }
  }
}
