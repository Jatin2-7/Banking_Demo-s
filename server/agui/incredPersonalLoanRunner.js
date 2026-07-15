import { randomUUID } from 'node:crypto';
import {
  INCRED_PERSONAL_LOAN_AGENT_ID,
  INCRED_PERSONAL_LOAN_AGENT_SYSTEM,
  INCRED_GENDER_OPTIONS,
  INCRED_EMPLOYMENT_OPTIONS,
  INCRED_MARITAL_OPTIONS,
  INCRED_RESIDENCE_OPTIONS,
  INCRED_PURPOSE_OPTIONS,
  INCRED_COMPANY_OPTIONS,
} from './incredPersonalLoanConfig.js';
import { module_ } from '../lib/log.js';
import { getOpenAIClient, getChatModel, hasLlmConfigured } from '../lib/openaiClient.js';

const log = module_('agui:incred-loan');

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

const LOAN_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'set_field',
      description: 'Set a single loan form field. Updates the UI live.',
      parameters: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            enum: [
              'pan',
              'full_name',
              'dob_day',
              'dob_month',
              'dob_year',
              'gender',
              'pincode',
              'employment_type',
              'net_monthly_income',
              'company_name',
              'marital_status',
              'residence_type',
              'email',
              'purpose',
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
      description: 'Click a UI button: proceed, confirm_yes, edit_details, back_to_home.',
      parameters: {
        type: 'object',
        properties: {
          button: {
            type: 'string',
            enum: ['proceed', 'confirm_yes', 'edit_details', 'back_to_home'],
          },
        },
        required: ['button'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'navigate_phase',
      description: 'Jump to a specific journey phase if needed.',
      parameters: {
        type: 'object',
        properties: {
          phase: {
            type: 'string',
            enum: ['login_info', 'basic_details', 'employment', 'eligibility', 'success'],
          },
        },
        required: ['phase'],
      },
    },
  },
];

const WORD_TO_DIGIT = {
  zero: '0',
  oh: '0',
  o: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
};

function normalizeSpokenPan(value) {
  let t = String(value || '').toLowerCase();
  for (const [word, digit] of Object.entries(WORD_TO_DIGIT)) {
    t = t.replace(new RegExp(`\\b${word}\\b`, 'gi'), digit);
  }
  const compact = t.replace(/[^a-z0-9]/gi, '').toUpperCase();
  const m = compact.match(/[A-Z]{5}\d{4}[A-Z]/);
  return m ? m[0] : compact.replace(/[^A-Z0-9]/g, '').slice(0, 10);
}

function validateField(field, value) {
  const v = String(value).trim();
  if (field === 'gender' && !INCRED_GENDER_OPTIONS.includes(v)) {
    return { ok: false, error: `gender must be: ${INCRED_GENDER_OPTIONS.join(', ')}` };
  }
  if (field === 'employment_type' && !INCRED_EMPLOYMENT_OPTIONS.includes(v)) {
    return { ok: false, error: `employment_type must be: ${INCRED_EMPLOYMENT_OPTIONS.join(', ')}` };
  }
  if (field === 'marital_status' && !INCRED_MARITAL_OPTIONS.includes(v)) {
    return { ok: false, error: `marital_status must be: ${INCRED_MARITAL_OPTIONS.join(', ')}` };
  }
  if (field === 'residence_type' && !INCRED_RESIDENCE_OPTIONS.includes(v)) {
    return { ok: false, error: `residence_type must be: ${INCRED_RESIDENCE_OPTIONS.join(', ')}` };
  }
  if (field === 'purpose' && !INCRED_PURPOSE_OPTIONS.includes(v)) {
    return { ok: false, error: `purpose must be: ${INCRED_PURPOSE_OPTIONS.join(', ')}` };
  }
  if (field === 'company_name' && !INCRED_COMPANY_OPTIONS.includes(v)) {
    return {
      ok: false,
      error: `company_name must be one of: ${INCRED_COMPANY_OPTIONS.join(', ')}`,
    };
  }
  return { ok: true, value: v };
}

function executeIncredLoanTool(name, args, state) {
  if (name === 'set_field' || name === 'select_option') {
    const field = args.field;
    let value = args.value;
    if (field === 'pan') value = normalizeSpokenPan(value);
    if (field === 'dob_day' || field === 'dob_month')
      value = String(value).replace(/\D/g, '').slice(0, 2);
    if (field === 'dob_year') value = String(value).replace(/\D/g, '').slice(0, 4);
    if (field === 'pincode') value = String(value).replace(/\D/g, '').slice(0, 6);
    if (field === 'net_monthly_income') value = String(value).replace(/[^0-9]/g, '');

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

  if (name === 'navigate_phase') {
    state.phase = args.phase;
    return {
      result: { ok: true, phase: args.phase },
      statePatches: [{ op: 'replace', path: '/phase', value: args.phase }],
    };
  }

  return { result: { ok: false, error: `Unknown tool: ${name}` }, statePatches: [] };
}

function buildSystemPrompt(state) {
  return `${INCRED_PERSONAL_LOAN_AGENT_SYSTEM}\n\n## Current form state\n${JSON.stringify(state, null, 2)}`;
}

export async function streamIncredPersonalLoanRun(res, agentId, inputData, { signal } = {}) {
  if (agentId !== INCRED_PERSONAL_LOAN_AGENT_ID) {
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
    const systemTail = systemNotes.length
      ? `\n\n## Notes from the mobile UI\n${systemNotes.join('\n---\n')}`
      : '';
    const messages = [
      { role: 'system', content: buildSystemPrompt(state) + systemTail },
      ...history,
    ];

    for (let step = 0; step < 14; step++) {
      if (signal?.aborted) break;

      const stream = await client.chat.completions.create({
        model,
        messages,
        tools: LOAN_TOOLS,
        stream: true,
      });
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

        const exec = executeIncredLoanTool(slot.name, args, state);
        if (exec.statePatches?.length) write({ type: 'STATE_DELTA', delta: exec.statePatches });

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
    log.error({ err: err?.message || String(err) }, 'incred loan agui stream error');
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
