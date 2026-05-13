// Thin client-side wrapper around the server engine.
//
// The dialogue state machine lives 100% on the server (server/engine/*).
// This module preserves the V2 function signatures so App.jsx is untouched,
// but every call now becomes a POST /api/engine/turn round-trip and the
// returned SessionView is merged back into the existing session object.
//
// The engine is fully scalable: new actions = new manifest, new tools =
// new register() call, new clients = thin re-implementation of this file.

import { turn } from '../services/engineClient.js';

const _meta = { forceFail: null };

function blankSession({ lang = 'en' } = {}) {
  return {
    id: null,
    lang,
    action: null,
    state: 'IDLE',
    params: {},
    state_bag: {},
    saga: null,
    pending: null,
    history: [],
    result: null,
    thinking: false,
    executing: false,
    forceFail: null,
    lastIntent: null,
    turnCount: 0,
    _initPromise: null,
  };
}

// Mutate `local` to mirror the SessionView returned by the server.
function mergeServer(local, view) {
  if (!view) return local;
  for (const k of Object.keys(local)) {
    if (k === '_initPromise') continue;
    delete local[k];
  }
  Object.assign(local, view);
  return local;
}

async function runTurn(session, input, opts = {}) {
  session.thinking = !!opts.markThinking;
  try {
    const { session: view } = await turn({
      sessionId: session.id || undefined,
      lang: session.lang,
      forceFail: _meta.forceFail,
      input,
    });
    mergeServer(session, view);
  } catch (err) {
    console.error('[engine] turn failed:', err);
    session.thinking = false;
    session.executing = false;
    session.state = 'FAILED';
    session.result = {
      success: false,
      errorCode: 'NETWORK',
      message: 'Network error talking to engine.',
    };
    session.history.push({ role: 'bot', text: 'Network error. Please try again.', t: Date.now() });
  }
  return session;
}

// ── Public API (unchanged signatures) ────────────────────────
export function createSession({ lang = 'en' } = {}) {
  const s = blankSession({ lang });
  s._initPromise = runTurn(s, { type: 'INIT' });
  return s;
}

export function setForceFail(_session, mode) {
  _meta.forceFail = mode || null;
}

export async function setLang(session, lang) {
  session.lang = lang;
  await runTurn(session, { type: 'SET_LANG', lang });
}

export async function reset(session) {
  await runTurn(session, { type: 'RESET' });
}

export async function startAction(session, actionName) {
  await runTurn(session, { type: 'START_ACTION', action: actionName });
}

export async function handleUtterance(session, raw, opts = {}) {
  const text = String(raw || '').trim();
  if (!text) return session;
  // Optimistic: show the user-said bubble + thinking indicator immediately.
  session.history.push({ role: 'user', text, t: Date.now() });
  session.thinking = true;
  opts.onThinking?.(session);
  await runTurn(session, { type: 'TRANSCRIPT', text }, { markThinking: true });
  return session;
}

export async function handleSelection(session, optionId, kind) {
  if (!session.pending) return session;
  await runTurn(session, { type: 'SELECTION', optionId, kind });
  return session;
}

export async function handleConfirmTap(session, confirmed) {
  if (session.state !== 'CONFIRM') return session;
  session.executing = true;
  await runTurn(session, { type: 'CONFIRMATION', confirmed });
  return session;
}

export async function cancelSession(session) {
  await runTurn(session, { type: 'CANCEL' });
  return session;
}
