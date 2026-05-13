// In-memory session store with TTL. Single source of truth for dialogue state.
// Every /api/engine/turn returns a Session view (the entire object), so the
// client is a pure renderer and never holds business state.

import crypto from 'crypto';

const SESSION_TTL_MS = 15 * 60 * 1000;

export function createSession({ lang = 'en' } = {}) {
  return {
    id: 'sess_' + crypto.randomBytes(6).toString('hex'),
    lang,
    action: null,
    state: 'IDLE', // IDLE | FILL | DISAMBIGUATE | CHOOSE | CONFIRM | EXECUTING | DONE | FAILED | CANCELLED
    params: {}, // user-facing slot values (resolved objects, e.g. contact, biller)
    state_bag: {}, // saga: tool outputs, intermediate state
    saga: null, // { manifestId, stepIndex }  set when running a step-based saga
    pending: null, // { kind, slot, prompt, options?, summary?, details?, progress? }
    history: [], // [{ role: 'user' | 'bot', text, t }]
    result: null, // { success, message, txnId, errorCode, retryable, raw }
    thinking: false,
    executing: false,
    forceFail: null,
    lastIntent: null,
    turnCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

class SessionStore {
  constructor({ ttlMs = SESSION_TTL_MS } = {}) {
    this.sessions = new Map();
    this.ttlMs = ttlMs;
    this._gcTimer = setInterval(() => this.gc(), 60_000);
    this._gcTimer.unref?.();
  }
  put(s) {
    s.updatedAt = Date.now();
    this.sessions.set(s.id, s);
    return s;
  }
  get(id) {
    if (!id) return null;
    const s = this.sessions.get(id);
    if (!s) return null;
    if (Date.now() - s.updatedAt > this.ttlMs) {
      this.sessions.delete(id);
      return null;
    }
    return s;
  }
  delete(id) {
    this.sessions.delete(id);
  }
  gc() {
    const now = Date.now();
    for (const [id, s] of this.sessions) {
      if (now - s.updatedAt > this.ttlMs) this.sessions.delete(id);
    }
  }
  size() {
    return this.sessions.size;
  }
}

export const sessions = new SessionStore();
