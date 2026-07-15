import { randomUUID } from 'node:crypto';
import { OPTIMO_HOME_AGENT_ID, OPTIMO_HOME_AGENT_SYSTEM, OPTIMO_HOME_EMI_FIELDS } from './optimoHomeAguiConfig.js';
import { module_ } from '../lib/log.js';
import { getOpenAIClient, getChatModel, hasLlmConfigured } from '../lib/openaiClient.js';

const log = module_('optimo-home-agui');

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

function buildRoutingStatus(destination) {
  const map = {
    lap_application: 'Opening Loan Against Property application.',
    loan_application: 'Opening Loan Against Property application.',
    lap_balance_transfer: 'Opening LAP Balance Transfer application.',
    lap_top_up: 'Opening LAP Top-Up application.',
    check_eligibility: 'Scrolling to eligibility & EMI calculator.',
    emi_calculator: 'Opening EMI calculator.',
    dashboard: 'Returning to Optimo Capital home.',
  };
  return map[destination] || 'Redirecting you now.';
}

function resolveNavigationIntentFromSpeech(text) {
  const t = String(text || '').toLowerCase().trim();
  if (!t) return null;
  if (/calculate\s+emi|emi\s+calculat|monthly\s+instal|check\s+emi/.test(t)) return 'emi_calculator';
  if (/check\s+eligibility/.test(t)) return 'check_eligibility';
  if (/balance\s+transfer/.test(t)) return 'lap_balance_transfer';
  if (/top[\s-]?up|additional\s+loan/.test(t)) return 'lap_top_up';
  if (
    /apply\s+(for\s+)?(a\s+)?loan/.test(t)
    || /loan\s+application/.test(t)
    || /open\s+(the\s+)?(loan\s+)?application/.test(t)
    || /start\s+(the\s+)?(loan\s+)?application/.test(t)
    || /(want|need)\s+(to\s+)?apply/.test(t)
    || /(loan\s+against\s+property|business\s+loan|lap\b)/.test(t) && /apply|want|need|open|start/.test(t)
  ) {
    return 'lap_application';
  }
  if (/(go\s+)?(back\s+)?(to\s+)?(home|dashboard|main\s+page)/.test(t)) return 'dashboard';
  return null;
}

function parseNavigationDestinationFromText(text) {
  const raw = String(text || '');
  const jsonMatch = raw.match(/\{\s*"destination"\s*:\s*"([^"]+)"\s*(?:,\s*"context"\s*:\s*"[^"]*")?\s*\}/i);
  if (jsonMatch) return jsonMatch[1];
  const fnMatch = raw.match(/navigate_to\s*\(\s*\{[^}]*"destination"\s*:\s*"([^"]+)"/i);
  if (fnMatch) return fnMatch[1];
  return null;
}

function emitNavigateFallback(write, destination) {
  const args = { destination, context: '' };
  write({ type: 'STATUS_UPDATE', status: buildRoutingStatus(destination) });
  write({ type: 'STATE_DELTA', delta: [{ op: 'replace', path: '/navigate_to', value: args }] });
}

function normalizeEmiValue(fieldId, raw) {
  const s = raw == null ? '' : String(raw).trim();
  if (fieldId === 'interest_rate') {
    return s.replace(/[^\d.]/g, '');
  }
  if (fieldId === 'tenure_years') {
    const m = s.match(/(\d{1,2})/);
    return m ? m[1] : s.replace(/[^\d]/g, '');
  }
  if (fieldId === 'loan_amount') {
    const lower = s.toLowerCase();
    const crore = lower.match(/(\d+(?:\.\d+)?)\s*crore/);
    if (crore) return String(Math.round(Number(crore[1]) * 10000000));
    const lakh = lower.match(/(\d+(?:\.\d+)?)\s*lakh/);
    if (lakh) return String(Math.round(Number(lakh[1]) * 100000));
    return s.replace(/[^\d]/g, '');
  }
  return s;
}

function validateEmiField(fieldId, raw) {
  const value = normalizeEmiValue(fieldId, raw);
  if (fieldId === 'loan_amount') {
    const n = Number(value);
    if (!value || Number.isNaN(n) || n <= 0) return 'Loan amount must be positive.';
    return null;
  }
  if (fieldId === 'interest_rate') {
    const n = Number(value);
    if (!value || Number.isNaN(n) || n <= 0 || n > 50) return 'Interest rate must be between 0 and 50.';
    return null;
  }
  if (fieldId === 'tenure_years') {
    const n = Number(value);
    if (!value || Number.isNaN(n) || n < 1 || n > 15) return 'Tenure must be 1–15 years.';
    return null;
  }
  return `Unknown field: ${fieldId}`;
}

function executeHomeTool(toolName, args, state) {
  if (toolName === 'set_field') {
    const { field_id, value } = args;
    if (!OPTIMO_HOME_EMI_FIELDS.includes(field_id)) {
      return { result: { ok: false, error: `Unknown field_id: ${field_id}` }, statePatches: [] };
    }
    const err = validateEmiField(field_id, value);
    if (err) return { result: { ok: false, field_id, error: err }, statePatches: [] };
    state[field_id] = normalizeEmiValue(field_id, value);
    return {
      result: { ok: true, field_id, value: state[field_id] },
      statePatches: [{ op: 'replace', path: `/${field_id}`, value: state[field_id] }],
    };
  }
  return { result: { ok: false, error: `Unknown tool: ${toolName}` }, statePatches: [] };
}

const OPTIMO_HOME_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'navigate_to',
      description: 'Navigate the customer to a page or section on the Optimo Capital website.',
      parameters: {
        type: 'object',
        properties: {
          destination: {
            type: 'string',
            enum: [
              'dashboard',
              'lap_application',
              'loan_application',
              'lap_balance_transfer',
              'lap_top_up',
              'check_eligibility',
              'emi_calculator',
            ],
          },
          context: { type: 'string', description: 'Short internal note.' },
        },
        required: ['destination'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_field',
      description: 'Set EMI calculator field on the dashboard.',
      parameters: {
        type: 'object',
        properties: {
          field_id: { type: 'string', enum: OPTIMO_HOME_EMI_FIELDS },
          value: { type: 'string' },
        },
        required: ['field_id', 'value'],
      },
    },
  },
];

export async function streamOptimoHomeAguiRun(res, agentId, inputData, { signal } = {}) {
  if (agentId !== OPTIMO_HOME_AGENT_ID) {
    res.status(404).type('text/plain').send(`unknown agent: ${agentId}`);
    return;
  }

  if (!hasLlmConfigured()) {
    res.status(503);
    res.setHeader('Content-Type', 'text/event-stream');
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
  const onAbort = () => { try { res.end(); } catch { /* ignore */ } };
  signal?.addEventListener('abort', onAbort);

  write({ type: 'RUN_STARTED', thread_id: threadId, run_id: runId });

  try {
    const raw = agUiMessagesToOpenAI(inputData.messages);
    const history = raw.filter((m) => m.role !== 'system');
    const stateNote = `\n\n## Current screen state\n${JSON.stringify(state, null, 2)}`;
    const messages = [{ role: 'system', content: OPTIMO_HOME_AGENT_SYSTEM + stateNote }, ...history];

    for (let step = 0; step < 8; step++) {
      if (signal?.aborted) break;

      const stream = await client.chat.completions.create({
        model,
        messages,
        tools: OPTIMO_HOME_TOOLS,
        stream: true,
      });

      const messageId = randomUUID();
      let assistantText = '';
      const toolCallBuf = new Map();
      const openedStart = new Set();
      let statusEmitted = false;

      for await (const chunk of stream) {
        if (signal?.aborted) break;
        const delta = chunk.choices?.[0]?.delta;
        if (!delta) continue;

        if (delta.content) {
          assistantText += delta.content;
          write({ type: 'TEXT_MESSAGE_CHUNK', message_id: messageId, role: 'assistant', delta: delta.content });
          if (!statusEmitted && assistantText.includes('💭')) {
            const lineEnd = assistantText.indexOf('\n', assistantText.indexOf('💭'));
            if (lineEnd !== -1) {
              const reasonLine = assistantText.slice(assistantText.indexOf('💭'), lineEnd).replace('💭', '').trim();
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
        const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
        const fallbackDest =
          parseNavigationDestinationFromText(assistantText)
          || resolveNavigationIntentFromSpeech(lastUser);
        if (fallbackDest) emitNavigateFallback(write, fallbackDest);
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

        if (slot.name === 'navigate_to') {
          write({ type: 'STATUS_UPDATE', status: buildRoutingStatus(args.destination) });
          write({ type: 'STATE_DELTA', delta: [{ op: 'replace', path: '/navigate_to', value: args }] });
          const result = { ok: true, destination: args.destination };
          write({ type: 'TOOL_CALL_RESULT', message_id: randomUUID(), tool_call_id: slot.id, content: JSON.stringify(result), role: 'tool' });
          messages.push({ role: 'tool', tool_call_id: slot.id, content: JSON.stringify(result) });
        } else {
          const exec = executeHomeTool(slot.name, args, state);
          if (exec.statePatches?.length) write({ type: 'STATE_DELTA', delta: exec.statePatches });
          write({ type: 'TOOL_CALL_RESULT', message_id: randomUUID(), tool_call_id: slot.id, content: JSON.stringify(exec.result), role: 'tool' });
          messages.push({ role: 'tool', tool_call_id: slot.id, content: JSON.stringify(exec.result) });
        }
      }

      messages[0] = { role: 'system', content: OPTIMO_HOME_AGENT_SYSTEM + `\n\n## Current screen state\n${JSON.stringify(state, null, 2)}` };
    }

    write({ type: 'RUN_FINISHED', thread_id: threadId, run_id: runId });
  } catch (err) {
    log.error({ err: err?.message || String(err) }, 'optimo home agui error');
    write({ type: 'RUN_ERROR', message: `${err?.name || 'Error'}: ${err?.message || String(err)}` });
  } finally {
    signal?.removeEventListener('abort', onAbort);
    try { res.end(); } catch { /* ignore */ }
  }
}
