import { randomUUID } from 'node:crypto';
import {
  EASEMYTRIP_VISA_AGENT_ID,
  EASEMYTRIP_VISA_AGENT_SYSTEM,
  VISA_DESTINATIONS,
  VISA_TYPES,
  VISA_DURATIONS,
  ENTRY_TYPES,
  VISA_STEPS,
} from './easemytripVisaAguiConfig.js';
import { module_ } from '../lib/log.js';
import { getOpenAIClient, getChatModel, hasLlmConfigured } from '../lib/openaiClient.js';

const log = module_('agui:easemytrip_visa');

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

const VISA_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'set_field',
      description: 'Set a visa form field. Updates the UI live.',
      parameters: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            enum: [
              'destination', 'search_query', 'travellers', 'visa_type', 'duration', 'entry_type',
              'departure_date', 'traveller_name', 'traveller_passport', 'traveller_dob',
              'photo_uploaded', 'passport_scanned', 'current_step', 'phase',
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
      description: 'Select dropdown option.',
      parameters: {
        type: 'object',
        properties: { field: { type: 'string' }, value: { type: 'string' } },
        required: ['field', 'value'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'click_button',
      description: 'Click UI button.',
      parameters: {
        type: 'object',
        properties: {
          button: {
            type: 'string',
            enum: [
              'start_application', 'proceed_date', 'upload_photo', 'scan_passport',
              'next_step', 'submit_application', 'back_to_home', 'search',
            ],
          },
        },
        required: ['button'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'navigate_to',
      description: 'Navigate within visa journey.',
      parameters: {
        type: 'object',
        properties: {
          destination: { type: 'string', enum: ['visa_home', 'visa_destination', 'visa_wizard', 'home'] },
        },
        required: ['destination'],
      },
    },
  },
];

function validateVisaField(field, value) {
  const v = String(value).trim();
  if (field === 'destination' && !VISA_DESTINATIONS.includes(v)) {
    return { ok: false, error: `destination must be: ${VISA_DESTINATIONS.join(', ')}` };
  }
  if (field === 'visa_type' && !VISA_TYPES.includes(v)) {
    return { ok: false, error: `visa_type must be: ${VISA_TYPES.join(', ')}` };
  }
  if (field === 'duration' && !VISA_DURATIONS.includes(v)) {
    return { ok: false, error: `duration must be: ${VISA_DURATIONS.join(', ')}` };
  }
  if (field === 'entry_type' && !ENTRY_TYPES.includes(v)) {
    return { ok: false, error: `entry_type must be: ${ENTRY_TYPES.join(', ')}` };
  }
  if (field === 'current_step' && !VISA_STEPS.includes(v)) {
    return { ok: false, error: `current_step must be: ${VISA_STEPS.join(', ')}` };
  }
  if (field === 'photo_uploaded' || field === 'passport_scanned') {
    return { ok: true, value: v === 'true' || v === true };
  }
  return { ok: true, value: v };
}

function executeVisaTool(name, args, state) {
  if (name === 'set_field' || name === 'select_option') {
    const field = args.field;
    const check = validateVisaField(field, args.value);
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
  if (name === 'navigate_to') {
    state.navigate_to = { destination: args.destination };
    return {
      result: { ok: true, destination: args.destination },
      statePatches: [{ op: 'replace', path: '/navigate_to', value: { destination: args.destination } }],
    };
  }
  return { result: { ok: false, error: `Unknown tool: ${name}` }, statePatches: [] };
}

export async function streamEasemytripVisaAguiRun(res, agentId, inputData, { signal } = {}) {
  if (agentId !== EASEMYTRIP_VISA_AGENT_ID) {
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
    try { res.end(); } catch { /* noop */ }
  };
  signal?.addEventListener('abort', onAbort);

  write({ type: 'RUN_STARTED', thread_id: threadId, run_id: runId });

  const buildSystem = () =>
    `${EASEMYTRIP_VISA_AGENT_SYSTEM}\n\n## Current form state\n${JSON.stringify(state, null, 2)}`;

  try {
    const raw = agUiMessagesToOpenAI(inputData.messages);
    const systemNotes = [];
    const history = [];
    for (const m of raw) {
      if (m.role === 'system') systemNotes.push(m.content);
      else history.push(m);
    }
    const systemTail = systemNotes.length ? `\n\n## Notes from the mobile UI\n${systemNotes.join('\n---\n')}` : '';
    const messages = [{ role: 'system', content: buildSystem() + systemTail }, ...history];

    for (let step = 0; step < 14; step++) {
      if (signal?.aborted) break;

      const stream = await client.chat.completions.create({ model, messages, tools: VISA_TOOLS, stream: true });
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
        try { args = slot.args ? JSON.parse(slot.args) : {}; } catch { args = {}; }

        const exec = executeVisaTool(slot.name, args, state);
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

      messages[0] = { role: 'system', content: buildSystem() + systemTail };
    }

    write({ type: 'RUN_FINISHED', thread_id: threadId, run_id: runId });
  } catch (err) {
    log.error({ err: err?.message || String(err) }, 'easemytrip visa agui stream error');
    write({ type: 'RUN_ERROR', message: err?.message || String(err) });
  } finally {
    signal?.removeEventListener('abort', onAbort);
    try { res.end(); } catch { /* noop */ }
  }
}
