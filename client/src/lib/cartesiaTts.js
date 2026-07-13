/**
 * Cartesia-only TTS — single app-wide channel (no overlapping audio).
 * Requires CARTESIA_API_KEY in server/.env (proxy at /api/tts).
 */
import { resolveApiBase } from './aguiClient.js';

let globalAudio = null;
let globalUrl = null;
let pendingPlay = null;
let ttsPlaying = false;
let ttsEnabled = true;
let activeSpeechId = 0;
let activeFetchController = null;
const ttsListeners = new Set();

/**
 * App-wide TTS kill switch. When disabled, `speakViaCartesia` becomes a no-op
 * (no network request, no audio) — used to keep Voice-to-Command mode fully
 * silent while Voice Assist mode (and normal conversational chat) still speak.
 */
export function setTtsEnabled(enabled) {
  ttsEnabled = Boolean(enabled);
  if (!ttsEnabled) stopGlobalCartesiaTts();
}

export function isTtsEnabled() {
  return ttsEnabled;
}

function notifyTtsPlaying(playing) {
  ttsPlaying = playing;
  ttsListeners.forEach((cb) => {
    try {
      cb(playing);
    } catch {
      /* ignore */
    }
  });
}

/** True while assistant speech audio is playing */
export function isTtsPlaying() {
  return ttsPlaying;
}

/** Subscribe to TTS play/stop (for gating auto-mic) */
export function onTtsPlayingChange(cb) {
  ttsListeners.add(cb);
  cb(ttsPlaying);
  return () => ttsListeners.delete(cb);
}

/** Resolves when no TTS is playing (polls until idle or timeout) */
export function waitUntilTtsIdle(maxMs = 120000) {
  if (!ttsPlaying) return Promise.resolve();
  return new Promise((resolve) => {
    const t0 = Date.now();
    const tick = () => {
      if (!ttsPlaying) {
        resolve();
        return;
      }
      if (Date.now() - t0 > maxMs) {
        resolve();
        return;
      }
      setTimeout(tick, 80);
    };
    tick();
  });
}

/** Stop any in-flight TTS immediately */
export function stopGlobalCartesiaTts() {
  activeSpeechId += 1;
  if (activeFetchController) {
    activeFetchController.abort();
    activeFetchController = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
  if (globalAudio) {
    try {
      globalAudio.pause();
      globalAudio.src = '';
    } catch { /* ignore */ }
    globalAudio = null;
  }
  if (globalUrl) {
    URL.revokeObjectURL(globalUrl);
    globalUrl = null;
  }
  if (pendingPlay) {
    pendingPlay(false);
    pendingPlay = null;
  }
  notifyTtsPlaying(false);
}

// ── Indian number-to-words ────────────────────────────────────────────────────

const _ONES = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
  'sixteen', 'seventeen', 'eighteen', 'nineteen',
];
const _TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function _b100(n) {
  if (n < 20) return _ONES[n];
  const t = _TENS[Math.floor(n / 10)];
  const o = _ONES[n % 10];
  return o ? `${t} ${o}` : t;
}

function _b1000(n) {
  if (n < 100) return _b100(n);
  return `${_ONES[Math.floor(n / 100)]} hundred${n % 100 ? ` ${_b100(n % 100)}` : ''}`;
}

/**
 * Convert a non-negative integer to spoken Indian-system words.
 * e.g. 100000 → "one lakh", 2500000 → "twenty-five lakh", 10000000 → "one crore"
 */
function toIndianWords(n) {
  n = Math.round(Math.abs(n));
  if (n === 0) return 'zero';
  const parts = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh  = Math.floor(n / 100000);   n %= 100000;
  const thou  = Math.floor(n / 1000);     n %= 1000;
  if (crore) parts.push(`${_b100(crore)} crore`);
  if (lakh)  parts.push(`${_b100(lakh)} lakh`);
  if (thou)  parts.push(`${_b100(thou)} thousand`);
  if (n)     parts.push(_b1000(n));
  return parts.join(' ');
}

const MONEY_CONTEXT_TERMS = [
  '₹', 'rs', 'rupee', 'amount', 'income', 'salary', 'emi', 'loan', 'deposit',
  'balance', 'payment', 'transfer', 'रुपये', 'रुपए', 'राशि', 'आय', 'वेतन', 'किस्त',
];
const IDENTIFIER_CONTEXT_TERMS = [
  'pan', 'pincode', 'pin code', 'mpin', 'otp', 'account number', 'account no',
  'phone', 'mobile', 'ifsc',
];

function includesAnyTerm(value, terms) {
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function normalizeDevanagariDigits(text) {
  return String(text).replace(/[०-९]/g, (digit) => String(digit.codePointAt(0) - 0x0966));
}

function replaceContextualAmounts(text) {
  return text.replace(/\b\d{4,9}\b/g, (match, offset, fullText) => {
    const before = fullText.slice(Math.max(0, offset - 32), offset);
    const after = fullText.slice(offset + match.length, offset + match.length + 24);
    const nearby = `${before} ${after}`;
    if (
      includesAnyTerm(nearby, IDENTIFIER_CONTEXT_TERMS) ||
      !includesAnyTerm(nearby, MONEY_CONTEXT_TERMS)
    ) {
      return match;
    }

    const amount = Number.parseInt(match, 10);
    return Number.isNaN(amount) ? match : toIndianWords(amount);
  });
}

/**
 * Pre-process financial text so TTS reads numbers naturally.
 *  ₹1,00,000    → "one lakh rupees"
 *  ₹25,500.50   → "twenty-five thousand five hundred rupees"
 *  6.2% p.a.    → "six point two percent per annum"
 *  1,00,000     → "one lakh"   (standalone Indian-comma number)
 */
function formatNumbersForTts(text) {
  const formatted = normalizeDevanagariDigits(text)
    // ── Currency: ₹1,00,000.50 ──────────────────────────────────────────────
    .replace(/₹\s*([\d,]+)(?:\.\d{0,2})?/g, (_, intPart) => {
      const n = parseInt(intPart.replace(/,/g, ''), 10);
      if (isNaN(n)) return _;
      return `${toIndianWords(n)} rupees`;
    })
    // ── Percentage with decimal: 6.2% ───────────────────────────────────────
    .replace(/\b(\d{1,3})\.(\d{1,2})\s*%/g, (_, int, dec) => {
      const decWords = dec.split('').map((d) => _ONES[parseInt(d, 10)] || d).join(' ');
      return `${toIndianWords(parseInt(int, 10))} point ${decWords} percent`;
    })
    // ── Percentage without decimal: 6% ──────────────────────────────────────
    .replace(/\b(\d{1,3})\s*%/g, (_, n) => `${toIndianWords(parseInt(n, 10))} percent`)
    // ── p.a. → "per annum" ──────────────────────────────────────────────────
    .replace(/\bp\.?a\.\b/gi, 'per annum')
    // ── Indian-comma numbers ≥ 1,000 (e.g. 1,00,000 / 25,000) ──────────────
    // Only matches numbers that contain commas — avoids stomping on plain
    // small integers the TTS engine already reads correctly.
    .replace(/\b(\d{1,2}(?:,\d{2})*,\d{3}|\d{1,3}(?:,\d{3})+)\b/g, (match) => {
      const n = parseInt(match.replace(/,/g, ''), 10);
      if (isNaN(n) || n < 1000) return match;
      return toIndianWords(n);
    });

  return replaceContextualAmounts(formatted);
}

/** Strip symbols TTS engines read aloud literally */
export function cleanTextForTts(text) {
  return formatNumbersForTts(String(text || ''))
    .replace(/\p{Emoji_Presentation}/gu, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[✦•·★☆©®™°🙏💭]/g, '')
    .replace(/[*_`#~|]/g, '')
    .replace(/[—–]/g, ',')
    .replace(/[!？！]/g, '.')
    .replace(/[?]/g, '')
    .replace(/:{1,}/g, ',')
    .replace(/\.{2,}/g, '.')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Remove reasoning / tool-call lines before speaking assistant text */
export function textForTtsDisplay(raw) {
  return cleanTextForTts(
    String(raw || '')
      .split('\n')
      .filter((line) => {
        const t = line.trim();
        if (!t) return false;
        if (t.startsWith('💭')) return false;
        if (/functions?\.\w+\s*\(/i.test(t)) return false;
        if (/navigate_to\s*\(/i.test(t)) return false;
        return true;
      })
      .join(' '),
  );
}

export function detectTtsLang(text) {
  const devanagari = (text.match(/[\u0900-\u097F]/g) || []).length;
  return devanagari / (text.replace(/\s/g, '').length || 1) > 0.05 ? 'hi' : 'en';
}

function waitForCurrentTtsEnd() {
  if (!pendingPlay) return Promise.resolve();
  return new Promise((resolve) => {
    const prev = pendingPlay;
    pendingPlay = (ok) => {
      prev?.(ok);
      resolve();
    };
  });
}

/**
 * Speak via Cartesia when configured; otherwise fall back to browser speechSynthesis
 * so Voice Assist still talks without CARTESIA_API_KEY.
 * @returns {Promise<boolean>}
 */
export async function speakViaCartesia(text, { onBeforePlay } = {}) {
  if (!ttsEnabled) return false;
  const clean = typeof text === 'string' && text.includes('\n')
    ? textForTtsDisplay(text)
    : cleanTextForTts(text);
  if (!clean) return false;

  stopGlobalCartesiaTts();
  const speechId = activeSpeechId;
  const fetchController = new AbortController();
  activeFetchController = fetchController;
  onBeforePlay?.();
  // Block auto-mic during fetch + playback (not only after audio starts)
  notifyTtsPlaying(true);

  const lang = detectTtsLang(clean);

  let resolvePlay;
  pendingPlay = (ok) => {
    resolvePlay?.(ok);
    resolvePlay = null;
    pendingPlay = null;
  };

  const speakBrowserFallback = () =>
    new Promise((resolve) => {
      if (speechId !== activeSpeechId) {
        resolve(false);
        return;
      }
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        notifyTtsPlaying(false);
        pendingPlay?.(false);
        resolve(false);
        return;
      }
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      utter.rate = 1.05;
      const done = (ok) => {
        if (speechId !== activeSpeechId) {
          resolve(false);
          return;
        }
        notifyTtsPlaying(false);
        pendingPlay?.(ok);
        resolve(ok);
      };
      utter.onend = () => done(true);
      utter.onerror = () => done(false);
      try {
        window.speechSynthesis.speak(utter);
      } catch {
        done(false);
      }
    });

  try {
    const res = await fetch(`${resolveApiBase()}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean, lang }),
      signal: fetchController.signal,
    });

    if (speechId !== activeSpeechId) return false;

    if (!res.ok) {
      if (res.status === 503) {
        console.warn('[TTS] Cartesia not configured — using browser speechSynthesis fallback');
        return speakBrowserFallback();
      }
      console.warn('[TTS] Cartesia error', res.status, '— using browser speechSynthesis fallback');
      return speakBrowserFallback();
    }

    const blob = await res.blob();
    if (speechId !== activeSpeechId) return false;

    activeFetchController = null;
    const audioUrl = URL.createObjectURL(blob);
    globalUrl = audioUrl;
    const audio = new Audio(audioUrl);
    globalAudio = audio;

    return await new Promise((resolve) => {
      resolvePlay = resolve;
      const done = (ok) => {
        URL.revokeObjectURL(audioUrl);
        if (speechId !== activeSpeechId) {
          resolve(false);
          return;
        }
        if (globalUrl === audioUrl) {
          globalUrl = null;
        }
        if (globalAudio === audio) globalAudio = null;
        notifyTtsPlaying(false);
        pendingPlay?.(ok);
        resolve(ok);
      };
      audio.onended = () => done(true);
      audio.onerror = () => done(false);
      audio.play().catch(() => done(false));
    });
  } catch (err) {
    if (err?.name === 'AbortError' || speechId !== activeSpeechId) return false;
    activeFetchController = null;
    console.warn('[TTS] Cartesia request failed — using browser fallback:', err?.message || err);
    return speakBrowserFallback();
  }
}

/** Queue speech after current clip ends */
export async function speakViaCartesiaQueued(text) {
  await waitForCurrentTtsEnd();
  return speakViaCartesia(text);
}

/** @deprecated use stopGlobalCartesiaTts */
export function stopCartesiaAudio(ref) {
  stopGlobalCartesiaTts();
  if (ref?.current) ref.current = null;
}
