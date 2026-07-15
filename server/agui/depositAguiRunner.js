import { randomUUID } from 'node:crypto';
import { DEPOSIT_AGENT_ID, DEPOSIT_AGENT_SYSTEM } from './depositAguiConfig.js';
import { module_ } from '../lib/log.js';
import { getOpenAIClient, getChatModel, hasLlmConfigured } from '../lib/openaiClient.js';

const log = module_('agui-deposit');

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

const DEPOSIT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'set_field',
      description: 'Set a single deposit form field.',
      parameters: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            enum: ['depositType', 'amount', 'years', 'months', 'days'],
          },
          value: { type: 'string', description: 'Value to set.' },
        },
        required: ['field', 'value'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_field',
      description: 'Ask the customer for a specific field.',
      parameters: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          message: { type: 'string', description: 'What to ask the customer.' },
        },
        required: ['field', 'message'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'submit_deposit',
      description: 'Open the deposit after all fields are filled and customer confirmed.',
      parameters: { type: 'object', properties: {} },
    },
  },
];

function executeDepositTool(name, args, state, { allowDepositType = true } = {}) {
  if (name === 'set_field') {
    const { field, value } = args;
    const validFields = ['depositType', 'amount', 'years', 'months', 'days'];
    if (!validFields.includes(field)) {
      return { result: { ok: false, error: `Unknown field: ${field}` }, statePatches: [] };
    }
    // Do not accept product selection until the customer has spoken on this screen.
    if (field === 'depositType' && !allowDepositType) {
      return {
        result: {
          ok: false,
          error:
            'Product not selected yet. Ask the customer which on-screen product they want (Fixed Deposit or Pragati Recurring Deposit), then call set_field(depositType) after they answer.',
        },
        statePatches: [],
      };
    }
    let coerced = value;
    if (field === 'amount' || field === 'years' || field === 'months' || field === 'days') {
      coerced = parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
    }
    state[field] = coerced;
    return {
      result: { ok: true, field, value: coerced },
      statePatches: [{ op: 'replace', path: `/${field}`, value: coerced }],
    };
  }

  if (name === 'request_field') {
    return { result: { ok: true, waiting_for: args.field }, statePatches: [] };
  }

  if (name === 'submit_deposit') {
    return {
      result: { ok: true, submitted: true },
      statePatches: [{ op: 'replace', path: '/submitted', value: true }],
    };
  }

  return { result: { ok: false, error: `Unknown tool: ${name}` }, statePatches: [] };
}

function buildSystemPrompt(state) {
  return DEPOSIT_AGENT_SYSTEM + `\n\n## Current form state\n${JSON.stringify(state, null, 2)}`;
}

export async function streamDepositAguiRun(res, agentId, inputData, { signal } = {}) {
  if (agentId !== DEPOSIT_AGENT_ID) {
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
    const systemTail =
      systemNotes.length > 0
        ? `\n\n## Notes from the mobile UI\n${systemNotes.join('\n---\n')}`
        : '';
    const messages = [
      { role: 'system', content: buildSystemPrompt(state) + systemTail },
      ...history,
    ];
    // Primer-only turns have no user text yet — block depositType until the customer replies.
    const hasUserUtterance = history.some(
      (m) => m.role === 'user' && String(m.content || '').trim().length > 0,
    );

    for (let step = 0; step < 14; step++) {
      if (signal?.aborted) break;

      const stream = await client.chat.completions.create({
        model,
        messages,
        tools: DEPOSIT_TOOLS,
        stream: true,
      });

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

        const exec = executeDepositTool(slot.name, args, state, {
          allowDepositType: hasUserUtterance || Boolean(state.depositType),
        });

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
    log.error({ err: err?.message || String(err) }, 'deposit agui stream error');
    const status = err?.status ?? err?.response?.status;
    const code = err?.code;
    let hint = `${err?.name || 'Error'}: ${err?.message || String(err)}`;
    if (status === 401 || code === 'invalid_api_key') {
      hint = 'OpenAI returned 401 — check OPENAI_API_KEY in server/.env.';
    } else if (status === 429) {
      hint = 'OpenAI rate limit exceeded. Wait and try again.';
    }
    write({ type: 'RUN_ERROR', message: hint });
  } finally {
    signal?.removeEventListener('abort', onAbort);
    try {
      res.end();
    } catch {
      /* noop */
    }
  }
}
