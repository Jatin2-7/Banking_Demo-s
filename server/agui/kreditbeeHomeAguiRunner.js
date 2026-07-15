import { randomUUID } from 'node:crypto';
import { KREDITBEE_HOME_AGENT_ID, KREDITBEE_HOME_AGENT_SYSTEM } from './kreditbeeHomeAguiConfig.js';
import { module_ } from '../lib/log.js';
import { getOpenAIClient, getChatModel, hasLlmConfigured } from '../lib/openaiClient.js';

const log = module_('agui:kb_home');

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

function inferDestination(userText = '', assistantText = '') {
  const t = `${userText} ${assistantText}`.toLowerCase();
  if (/personal\s*loan|apply.*personal/.test(t)) return 'personal_loan';
  if (/business\s*loan|apply.*business/.test(t)) return 'business_loan';
  if (/two[\s-]?wheeler|2[\s-]?wheeler/.test(t)) return 'two_wheeler_loan';
  if (/loan against property|\blap\b|property loan/.test(t)) return 'lap';
  if (/continue|resume|kyc|relationship manager|onboarding/.test(t)) return 'arm_onboarding';
  if (/\bdocuments\b/.test(t)) return 'documents';
  if (/\bexplore\b/.test(t)) return 'explore';
  if (/\bupi\b/.test(t)) return 'kreditbee_upi';
  if (/redirect|opening personal/.test(t)) return 'personal_loan';
  if (/redirect.*business|opening business/.test(t)) return 'business_loan';
  return null;
}

function buildRoutingStatus(destination, assistantText) {
  const reason = assistantText.match(/💭\s*([^\n]+)/);
  if (reason?.[1]) return reason[1].trim();
  const map = {
    arm_onboarding: 'Opening AI Relationship Manager for KYC.',
    personal_loan: 'Opening Personal Loan application.',
    business_loan: 'Opening Business Loan application.',
    two_wheeler_loan: 'Opening Two Wheeler Loan application.',
    lap: 'Opening Loan Against Property application.',
    kreditbee_upi: 'Opening KreditBee UPI.',
    documents: 'Opening Documents.',
    explore: 'Opening Explore.',
    home: 'Returning to KreditBee home.',
  };
  return map[destination] || 'Redirecting you now.';
}

const HOME_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'navigate_to',
      description: 'Navigate the customer to a KreditBee journey or screen.',
      parameters: {
        type: 'object',
        properties: {
          destination: {
            type: 'string',
            enum: [
              'arm_onboarding',
              'personal_loan',
              'business_loan',
              'two_wheeler_loan',
              'lap',
              'kreditbee_upi',
              'documents',
              'explore',
              'home',
            ],
          },
          context: { type: 'string', description: 'Optional context for the destination screen.' },
        },
        required: ['destination'],
      },
    },
  },
];

export async function streamKreditbeeHomeAguiRun(res, agentId, inputData, { signal } = {}) {
  if (agentId !== KREDITBEE_HOME_AGENT_ID) {
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
      { role: 'system', content: KREDITBEE_HOME_AGENT_SYSTEM + systemTail },
      ...history,
    ];

    for (let step = 0; step < 8; step++) {
      if (signal?.aborted) break;

      const stream = await client.chat.completions.create({
        model,
        messages,
        tools: HOME_TOOLS,
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

        const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
        const inferred = inferDestination(lastUser, assistantText);
        if (inferred) {
          const args = { destination: inferred, context: '' };
          const routingStatus = buildRoutingStatus(inferred, assistantText);
          write({ type: 'STATUS_UPDATE', status: routingStatus });
          write({
            type: 'STATE_DELTA',
            delta: [{ op: 'replace', path: '/navigate_to', value: { ...args, routingStatus } }],
          });
          const fakeId = `fallback_${Date.now()}`;
          write({
            type: 'TOOL_CALL_START',
            tool_call_id: fakeId,
            tool_call_name: 'navigate_to',
            parent_message_id: messageId,
          });
          write({ type: 'TOOL_CALL_ARGS', tool_call_id: fakeId, delta: JSON.stringify(args) });
          write({ type: 'TOOL_CALL_END', tool_call_id: fakeId });
          write({
            type: 'TOOL_CALL_RESULT',
            message_id: randomUUID(),
            tool_call_id: fakeId,
            content: JSON.stringify({ ok: true, ...args }),
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

        if (slot.name === 'navigate_to') {
          const routingStatus = buildRoutingStatus(args.destination, assistantText);
          write({
            type: 'STATE_DELTA',
            delta: [{ op: 'replace', path: '/navigate_to', value: { ...args, routingStatus } }],
          });
        }

        write({
          type: 'TOOL_CALL_RESULT',
          message_id: randomUUID(),
          tool_call_id: slot.id,
          content: JSON.stringify({ ok: true, ...args }),
          role: 'tool',
        });

        messages.push({
          role: 'tool',
          tool_call_id: slot.id,
          content: JSON.stringify({ ok: true, ...args }),
        });
      }
    }

    write({ type: 'RUN_FINISHED', thread_id: threadId, run_id: runId });
  } catch (err) {
    log.error({ err: err?.message || String(err) }, 'kreditbee home agui error');
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
