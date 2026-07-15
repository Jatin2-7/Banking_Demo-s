import { randomUUID } from 'node:crypto';
import {
  EASEMYTRIP_FOREX_AGENT_ID,
  EASEMYTRIP_FOREX_AGENT_SYSTEM,
  FOREX_CITIES,
  FOREX_CURRENCIES,
  FOREX_TABS,
  FOREX_TX_TYPES,
  FOREX_CARD_ACTIONS,
} from './easemytripForexAguiConfig.js';
import { parseIndianMoneyAmount } from './optimoMoneyParse.js';
import { module_ } from '../lib/log.js';
import { getOpenAIClient, getChatModel, hasLlmConfigured } from '../lib/openaiClient.js';

const log = module_('agui:easemytrip_forex');

function sseEncode(obj) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

function agUiMessagesToOpenAI(messages) {
  const out = [];
  for (const m of messages || []) {
    const role = m.role;
    const content = m.content != null ? String(m.content) : '';
    if (role === 'user' || role === 'system') out.push({ role, content });
    else if (role === 'assistant') {
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

const FOREX_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'set_field',
      description: 'Set a single forex form field. Updates the UI live.',
      parameters: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            enum: [
              'city', 'foreign_currency', 'foreign_amount', 'inr_amount',
              'transaction_type', 'card_action', 'active_tab', 'card_type',
              'mobile', 'email', 'otp', 'consent_given',
            ],
          },
          value: { type: 'string' },
        },
        required: ['field', 'value'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'select_option',
      description: 'Select an option for dropdown/radio fields.',
      parameters: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          value: { type: 'string' },
        },
        required: ['field', 'value'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'click_button',
      description: 'Click a UI button: order_now, proceed, confirm_order, back_to_home.',
      parameters: {
        type: 'object',
        properties: {
          button: { type: 'string', enum: ['order_now', 'proceed', 'confirm_order', 'back_to_home'] },
        },
        required: ['button'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'navigate_tab',
      description: 'Switch forex tab.',
      parameters: {
        type: 'object',
        properties: {
          tab: { type: 'string', enum: FOREX_TABS },
        },
        required: ['tab'],
      },
    },
  },
];

function validateField(field, value) {
  const v = String(value).trim();
  if (field === 'city' && !FOREX_CITIES.includes(v)) {
    return { ok: false, error: `city must be: ${FOREX_CITIES.join(', ')}` };
  }
  if (field === 'foreign_currency' && !FOREX_CURRENCIES.includes(v.toUpperCase())) {
    return { ok: false, error: `foreign_currency must be: ${FOREX_CURRENCIES.join(', ')}` };
  }
  if (field === 'transaction_type' && !FOREX_TX_TYPES.includes(v)) {
    return { ok: false, error: `transaction_type must be: ${FOREX_TX_TYPES.join(', ')}` };
  }
  if (field === 'card_action' && !FOREX_CARD_ACTIONS.includes(v)) {
    return { ok: false, error: `card_action must be: ${FOREX_CARD_ACTIONS.join(', ')}` };
  }
  if (field === 'active_tab' && !FOREX_TABS.includes(v)) {
    return { ok: false, error: `active_tab must be: ${FOREX_TABS.join(', ')}` };
  }
  if (field === 'mobile') {
    const digits = v.replace(/\D/g, '');
    if (digits.length < 10) return { ok: false, error: 'mobile must be 10 digits' };
    return { ok: true, value: digits.slice(0, 10) };
  }
  if (field === 'foreign_currency') return { ok: true, value: v.toUpperCase() };
  if (field === 'consent_given') return { ok: true, value: v === 'true' || v === true };
  return { ok: true, value: v };
}

function executeForexTool(name, args, state) {
  if (name === 'set_field' || name === 'select_option') {
    const field = args.field;
    let value = args.value;
    if (field === 'foreign_amount' || field === 'inr_amount') {
      const fromWords = field === 'inr_amount' ? parseIndianMoneyAmount(String(value)) : null;
      value = fromWords || String(value).replace(/[^0-9.]/g, '');
    }
    if (field === 'otp') value = String(value).replace(/\D/g, '').slice(0, 6);

    const check = validateField(field, value);
    if (!check.ok) return { result: check, statePatches: [] };

    state[field] = check.value;
    return {
      result: { ok: true, field, value: check.value },
      statePatches: [{ op: 'replace', path: `/${field}`, value: check.value }],
    };
  }

  if (name === 'click_button') {
    return {
      result: { ok: true, button: args.button },
      statePatches: [{ op: 'replace', path: '/__action', value: { button: args.button } }],
    };
  }

  if (name === 'navigate_tab') {
    state.active_tab = args.tab;
    return {
      result: { ok: true, tab: args.tab },
      statePatches: [{ op: 'replace', path: '/active_tab', value: args.tab }],
    };
  }

  return { result: { ok: false, error: `Unknown tool: ${name}` }, statePatches: [] };
}

function buildSystemPrompt(state) {
  return `${EASEMYTRIP_FOREX_AGENT_SYSTEM}\n\n## Current form state\n${JSON.stringify(state, null, 2)}`;
}

export async function streamEasemytripForexAguiRun(res, agentId, inputData, { signal } = {}) {
  if (agentId !== EASEMYTRIP_FOREX_AGENT_ID) {
    res.status(404).type('text/plain').send(`unknown agent: ${agentId}`);
    return;
  }

  if (!hasLlmConfigured()) {
    res.status(503).setHeader('Content-Type', 'text/event-stream');
    res.write(sseEncode({ type: 'RUN_ERROR', message: 'LLM not configured.' }));
    res.end();
    return;
  }

  const model = getChatModel();
  const client = getOpenAIClient();
  const threadId = String(inputData.thread_id || randomUUID());
  const runId = String(inputData.run_id || randomUUID());
  const state = { ...(inputData.state && typeof inputData.state === 'object' ? inputData.state : {}) };

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
      /* noop */
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
    const systemTail = systemNotes.length ? `\n\n## Notes from the mobile UI\n${systemNotes.join('\n---\n')}` : '';
    const messages = [{ role: 'system', content: buildSystemPrompt(state) + systemTail }, ...history];

    for (let step = 0; step < 14; step++) {
      if (signal?.aborted) break;

      const stream = await client.chat.completions.create({ model, messages, tools: FOREX_TOOLS, stream: true });
      const messageId = randomUUID();
      let assistantText = '';
      const toolCallBuf = new Map();
      const openedStart = new Set();

      for await (const chunk of stream) {
        if (signal?.aborted) break;
        const delta = chunk.choices?.[0]?.delta;
        if (!delta) continue;
        if (delta.content) {
          assistantText += delta.content;
          write({ type: 'TEXT_MESSAGE_CHUNK', message_id: messageId, role: 'assistant', delta: delta.content });
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
              write({ type: 'TOOL_CALL_START', tool_call_id: slot.id, tool_call_name: slot.name, parent_message_id: messageId });
            }
            if (tc.function?.arguments && slot.id) {
              write({ type: 'TOOL_CALL_ARGS', tool_call_id: slot.id, delta: tc.function.arguments });
            }
          }
        }
      }

      for (const [, slot] of toolCallBuf) {
        if (slot.id) write({ type: 'TOOL_CALL_END', tool_call_id: slot.id });
      }

      if (toolCallBuf.size === 0) {
        messages.push({ role: 'assistant', content: assistantText || '' });
        break;
      }

      messages.push({
        role: 'assistant',
        content: assistantText || '',
        tool_calls: Array.from(toolCallBuf.values())
          .filter((s) => s.id)
          .map((s) => ({ id: s.id, type: 'function', function: { name: s.name, arguments: s.args || '{}' } })),
      });

      for (const slot of toolCallBuf.values()) {
        if (!slot.id) continue;
        let args = {};
        try {
          args = slot.args ? JSON.parse(slot.args) : {};
        } catch {
          args = {};
        }

        const exec = executeForexTool(slot.name, args, state);
        if (exec.statePatches?.length) write({ type: 'STATE_DELTA', delta: exec.statePatches });

        write({
          type: 'TOOL_CALL_RESULT',
          message_id: randomUUID(),
          tool_call_id: slot.id,
          content: JSON.stringify(exec.result),
          role: 'tool',
        });
        messages.push({ role: 'tool', tool_call_id: slot.id, content: JSON.stringify(exec.result) });
      }

      messages[0] = { role: 'system', content: buildSystemPrompt(state) + systemTail };
    }

    write({ type: 'RUN_FINISHED', thread_id: threadId, run_id: runId });
  } catch (err) {
    log.error({ err: err?.message || String(err) }, 'easemytrip forex agui stream error');
    write({ type: 'RUN_ERROR', message: err?.message || String(err) });
  } finally {
    signal?.removeEventListener('abort', onAbort);
    try {
      res.end();
    } catch {
      /* noop */
    }
  }
}
