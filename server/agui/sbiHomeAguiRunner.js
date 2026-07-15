import { randomUUID } from 'node:crypto';
import { SBI_HOME_AGENT_ID, SBI_HOME_AGENT_SYSTEM } from './sbiHomeAguiConfig.js';
import { module_ } from '../lib/log.js';
import { getOpenAIClient, getChatModel, hasLlmConfigured } from '../lib/openaiClient.js';

const log = module_('agui:sbi_home');

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

function buildRoutingStatus(destination, context, assistantText) {
  const reason = assistantText.match(/💭\s*([^\n]+)/);
  if (reason?.[1]) return reason[1].trim();
  const map = {
    loan_application: 'Opening your SBI YONO home loan application.',
    credit_card: context === 'change_pin'
      ? 'Opening SBI credit card PIN change.'
      : 'Opening credit card services.',
    loans: 'Opening SBI loans.',
    home: 'Returning to YONO home.',
  };
  return map[destination] || 'Opening the requested screen.';
}

function getLastUserText(history) {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'user') return String(history[i].content || '');
  }
  return '';
}

function inferDestination(userText = '', assistantText = '') {
  const t = `${userText} ${assistantText}`.toLowerCase();
  if (/\b(change|reset|update).{0,24}(credit\s*)?(card\s*)?pin\b|\bpin\s*change\b/.test(t)) {
    return { destination: 'credit_card', context: 'change_pin' };
  }
  if (
    /\b(home\s*loan|apply.{0,30}loan|loan\s*application|mortgage|ghar.{0,12}loan|loan\s*chahiye|fill.{0,30}loan|loan\s*form)\b/.test(t) ||
    /^apply$/i.test(userText.trim()) ||
    /\bnext\s+screen\b/.test(assistantText.toLowerCase()) && /\b(apply|loan)\b/.test(t)
  ) {
    return { destination: 'loan_application', context: userText || 'Customer wants SBI home loan' };
  }
  if (/\b(open\s+)?loans?\b/.test(t) && !/\bhome\s*loan\b/.test(t)) {
    return { destination: 'loans', context: '' };
  }
  return null;
}

function emitNavigateFallback(write, messageId, args) {
  const routingStatus = buildRoutingStatus(args.destination, args.context || '', '');
  const payload = { ...args, routingStatus };
  write({
    type: 'STATE_DELTA',
    delta: [{ op: 'replace', path: '/navigate_to', value: payload }],
  });
  const fakeId = `fallback_${Date.now()}`;
  write({ type: 'TOOL_CALL_START', tool_call_id: fakeId, tool_call_name: 'navigate_to', parent_message_id: messageId });
  write({ type: 'TOOL_CALL_ARGS', tool_call_id: fakeId, delta: JSON.stringify(payload) });
  write({ type: 'TOOL_CALL_END', tool_call_id: fakeId });
  write({
    type: 'TOOL_CALL_RESULT',
    message_id: randomUUID(),
    tool_call_id: fakeId,
    content: JSON.stringify({ ok: true, destination: args.destination }),
    role: 'tool',
  });
}

const HOME_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'navigate_to',
      description: 'Navigate the customer to an SBI YONO screen or journey.',
      parameters: {
        type: 'object',
        properties: {
          destination: {
            type: 'string',
            enum: ['loan_application', 'credit_card', 'loans', 'home'],
          },
          context: {
            type: 'string',
            description: 'For credit card PIN change use exactly "change_pin". Optional note for loan_application.',
          },
        },
        required: ['destination'],
      },
    },
  },
];

export async function streamSbiHomeAguiRun(res, agentId, inputData, { signal } = {}) {
  if (agentId !== SBI_HOME_AGENT_ID) {
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
    const messages = [
      {
        role: 'system',
        content: `${SBI_HOME_AGENT_SYSTEM}\n\n## Current state\n${JSON.stringify(state, null, 2)}${systemTail}`,
      },
      ...history,
    ];

    for (let step = 0; step < 10; step++) {
      if (signal?.aborted) break;

      const stream = await client.chat.completions.create({ model, messages, tools: HOME_TOOLS, stream: true });
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
              write({
                type: 'TOOL_CALL_START',
                tool_call_id: slot.id,
                tool_call_name: slot.name,
                parent_message_id: messageId,
              });
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

        const lastUser = getLastUserText(history);
        const textLower = assistantText.toLowerCase();
        let inferred = inferDestination(lastUser, assistantText);

        if (!inferred && /navigate_to/i.test(textLower)) {
          const destMatch = textLower.match(
            /destination\s*[=:]\s*["']?(loan_application|credit_card|loans|home)["']?/i,
          );
          const ctxMatch = textLower.match(/context\s*[=:]\s*["']([^"'\n]+)["']/i);
          if (destMatch) {
            inferred = { destination: destMatch[1], context: ctxMatch?.[1] || '' };
          }
        }

        if (inferred?.destination) {
          emitNavigateFallback(write, messageId, inferred);
        }
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

        if (slot.name === 'navigate_to') {
          if (!args.destination) {
            const lastUser = getLastUserText(history);
            const inferred = inferDestination(lastUser, assistantText);
            if (inferred) args = { ...inferred, ...args };
          }
          const routingStatus = buildRoutingStatus(args.destination, args.context || '', assistantText);
          const payload = { ...args, routingStatus };
          write({
            type: 'STATE_DELTA',
            delta: [{
              op: 'replace',
              path: '/navigate_to',
              value: payload,
            }],
          });
        }

        write({
          type: 'TOOL_CALL_RESULT',
          message_id: randomUUID(),
          tool_call_id: slot.id,
          content: JSON.stringify({ ok: true, destination: args.destination }),
          role: 'tool',
        });
        messages.push({ role: 'tool', tool_call_id: slot.id, content: JSON.stringify({ ok: true }) });
      }
    }

    write({ type: 'RUN_FINISHED', thread_id: threadId, run_id: runId });
  } catch (err) {
    log.error({ err: err?.message || String(err) }, 'sbi home agui stream error');
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
