// Thin HTTP client for the server-side engine. The server holds all state;
// the client just renders the SessionView returned by every turn.

const API_BASE = (
  import.meta.env?.VITE_API_BASE || (import.meta.env?.DEV ? '' : 'http://localhost:3001')
).replace(/\/$/, '');

export async function turn({ sessionId, lang, forceFail, input }) {
  const r = await fetch(`${API_BASE}/api/engine/turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, lang, forceFail, input }),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => '');
    throw new Error(`engine ${r.status}: ${txt}`);
  }
  return r.json();
}

export async function getAccounts() {
  const r = await fetch(`${API_BASE}/api/mock/accounts`);
  return (await r.json()).accounts || [];
}
export async function resetServerState() {
  await fetch(`${API_BASE}/api/mock/_reset`, { method: 'POST' });
}
