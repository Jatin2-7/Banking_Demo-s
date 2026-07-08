import { randomUUID } from 'node:crypto';
import { HOME_AGENT_ID, HOME_AGENT_SYSTEM } from './homeAguiConfig.js';
import { module_ } from '../lib/log.js';
import { getOpenAIClient, getChatModel, hasLlmConfigured } from '../lib/openaiClient.js';

const log = module_('home-agui');

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
          function: {
            name: tc.function?.name,
            arguments: tc.function?.arguments || '{}',
          },
        }));
      }
      out.push(entry);
    } else if (role === 'tool') {
      out.push({ role: 'tool', tool_call_id: m.tool_call_id, content });
    }
  }
  return out;
}

function buildRoutingStatus(destination, assistantText) {
  const reason = assistantText.match(/💭\s*([^\n]+)/);
  if (reason?.[1]) return reason[1].trim();
  if (destination === 'upi_payment') return 'Within UPI limit. Redirecting to UPI payment.';
  if (destination === 'fund_transfer') return 'Above UPI limit. Redirecting to fund transfer.';
  if (destination === 'loan_application') return 'Redirecting to loan application.';
  if (destination === 'create_deposit') return 'Redirecting to Create a Deposit.';
  if (destination === 'transaction_history') return 'Opening your account statement.';
  return 'Redirecting you now.';
}

const HOME_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'navigate_to',
      description: 'Navigate the customer to a specific banking journey.',
      parameters: {
        type: 'object',
        properties: {
          destination: {
            type: 'string',
            enum: ['upi_payment', 'fund_transfer', 'loan_application', 'create_deposit', 'transaction_history'],
            description: 'Which journey to open.',
          },
          context: {
            type: 'string',
            description:
              'Short natural-language summary of what the customer said, to be passed to the destination AI as a primer (max 2 sentences).',
          },
        },
        required: ['destination'],
      },
    },
  },
];

export async function streamHomeAguiRun(res, agentId, inputData, { signal } = {}) {
  if (agentId !== HOME_AGENT_ID) {
    res.status(404).type('text/plain').send(`unknown agent: ${agentId}`);
    return;
  }

  if (!hasLlmConfigured()) {
    res.status(503);
    res.setHeader('Content-Type', 'text/event-stream');
    res.write(sseEncode({ type: 'RUN_ERROR', message: 'OpenAI API key not configured.' }));
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

  const onAbort = () => { try { res.end(); } catch { /* ignore */ } };
  signal?.addEventListener('abort', onAbort);

  write({ type: 'RUN_STARTED', thread_id: threadId, run_id: runId });

  try {
    const raw = agUiMessagesToOpenAI(inputData.messages);
    const history = raw.filter((m) => m.role !== 'system');
    const messages = [{ role: 'system', content: HOME_AGENT_SYSTEM }, ...history];

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
      let statusEmitted = false; // only emit status once per reasoning line

      for await (const chunk of stream) {
        if (signal?.aborted) break;
        const choice = chunk.choices?.[0];
        if (!choice?.delta) continue;
        const delta = choice.delta;

        if (delta.content) {
          assistantText += delta.content;
          write({ type: 'TEXT_MESSAGE_CHUNK', message_id: messageId, role: 'assistant', delta: delta.content });

          // Detect a complete 💭 reasoning line and emit it as a STATUS_UPDATE
          if (!statusEmitted && assistantText.includes('💭')) {
            const lineEnd = assistantText.indexOf('\n', assistantText.indexOf('💭'));
            if (lineEnd !== -1) {
              const reasonLine = assistantText
                .slice(assistantText.indexOf('💭'), lineEnd)
                .replace('💭', '')
                .trim();
              if (reasonLine) {
                write({ type: 'STATUS_UPDATE', status: reasonLine });
                statusEmitted = true;
              }
            }
          }
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

        // ── Fallback: model wrote navigate_to as text instead of using the tool ──
        const textLower = assistantText;
        if (/navigate_to/i.test(textLower)) {
          const destMatch = textLower.match(/destination\s*[=:]\s*["']?(upi_payment|fund_transfer|loan_application|create_deposit|transaction_history)["']?/i);
          const ctxMatch = textLower.match(/context\s*[=:]\s*["']([^"'\n]+)["']/i);
          if (destMatch) {
            const args = { destination: destMatch[1], context: ctxMatch?.[1] || '' };
            write({ type: 'STATUS_UPDATE', status: buildRoutingStatus(args.destination, assistantText) });
            write({ type: 'STATE_DELTA', delta: [{ op: 'replace', path: '/navigate_to', value: args }] });
            // Emit synthetic tool events so the client handler fires
            const fakeId = `fallback_${Date.now()}`;
            write({ type: 'TOOL_CALL_START', tool_call_id: fakeId, tool_call_name: 'navigate_to', parent_message_id: messageId });
            write({ type: 'TOOL_CALL_ARGS', tool_call_id: fakeId, delta: JSON.stringify(args) });
            write({ type: 'TOOL_CALL_END', tool_call_id: fakeId });
            write({ type: 'TOOL_CALL_RESULT', message_id: randomUUID(), tool_call_id: fakeId, content: JSON.stringify({ ok: true, destination: args.destination }), role: 'tool' });
          }
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
        try { args = slot.args ? JSON.parse(slot.args) : {}; } catch { args = {}; }

        write({ type: 'STATUS_UPDATE', status: buildRoutingStatus(args.destination, assistantText) });

        // Emit STATE_DELTA so the client can read navigate_to args
        write({
          type: 'STATE_DELTA',
          delta: [{ op: 'replace', path: '/navigate_to', value: args }],
        });

        const result = { ok: true, destination: args.destination };
        write({
          type: 'TOOL_CALL_RESULT',
          message_id: randomUUID(),
          tool_call_id: slot.id,
          content: JSON.stringify(result),
          role: 'tool',
        });

        messages.push({ role: 'tool', tool_call_id: slot.id, content: JSON.stringify(result) });
      }
    }

    write({ type: 'RUN_FINISHED', thread_id: threadId, run_id: runId });
  } catch (err) {
    log.error({ err: err?.message || String(err) }, 'home agui stream error');
    write({ type: 'RUN_ERROR', message: `${err?.name || 'Error'}: ${err?.message || String(err)}` });
  } finally {
    signal?.removeEventListener('abort', onAbort);
    try { res.end(); } catch { /* ignore */ }
  }
}
