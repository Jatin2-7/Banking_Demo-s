/**
 * Minimal AG-UI SSE client (compatible with Form-Agent event shapes).
 */

/** @returns {string} Base URL without trailing slash, or '' to use same origin (Vite dev proxy → /api). */
export function resolveApiBase() {
  const fromEnv = String(import.meta.env?.VITE_API_BASE || '').trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (import.meta.env?.DEV) return '';
  return 'http://localhost:3001';
}

const API_BASE = resolveApiBase();

export const LOAN_AGUI_AGENT_ID = 'indian_bank_loan_los';
export const ABCD_PERSONAL_LOAN_AGENT_ID = 'abcd_personal_loan';
export const IMPS_AGUI_AGENT_ID = 'indian_bank_imps_transfer';
export const HOME_AGUI_AGENT_ID = 'indian_bank_home_assistant';
export const DEPOSIT_AGUI_AGENT_ID = 'indian_bank_deposit';
export const TXN_HISTORY_AGUI_AGENT_ID = 'indian_bank_txn_history';

export function applyStateDelta(state, patches) {
  const next = { ...state };
  for (const patch of patches || []) {
    const key = String(patch.path || '')
      .replace(/^\//, '')
      .replace(/~1/g, '/')
      .replace(/~0/g, '~');
    if (patch.op === 'remove') delete next[key];
    else next[key] = patch.value;
  }
  return next;
}

async function consumeSSE(body, onFrame) {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      if (frame.trim()) onFrame(frame);
    }
  }
  if (buffer.trim()) onFrame(buffer);
}

function parseEventFrame(frame) {
  const dataLines = [];
  for (const line of frame.split(/\r?\n/)) {
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
  }
  if (dataLines.length === 0) return null;
  const json = dataLines.join('\n');
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * @param {string} agentId
 * @param {string} threadId
 * @param {Array<{id:string,role:string,content:string}>} messages
 * @param {Record<string, unknown>} state
 * @param {{ onEvent?: (ev: unknown) => void, signal?: AbortSignal }} handlers
 */
export async function runAgent(agentId, threadId, messages, state, handlers = {}) {
  const runId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `run_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const body = {
    thread_id: threadId,
    run_id: runId,
    state,
    messages,
    tools: [],
    context: [],
    forwarded_props: {},
  };

  const url = `${API_BASE}/api/agui/${encodeURIComponent(agentId)}`;
  const streamSignal =
    handlers.signal ||
    (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
      ? AbortSignal.timeout(120000)
      : undefined);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
    signal: streamSignal,
  });

  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => '');
    throw new Error(`agui run failed: ${res.status} ${t.slice(0, 200)}`);
  }

  await consumeSSE(res.body, (frame) => {
    const ev = parseEventFrame(frame);
    if (ev && handlers.onEvent) handlers.onEvent(ev);
  });
}
