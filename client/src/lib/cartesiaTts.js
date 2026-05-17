/**
 * Cartesia-only TTS — single app-wide channel (no overlapping audio).
 * Requires CARTESIA_API_KEY in server/.env (proxy at /api/tts).
 */

let globalAudio = null;
let globalUrl = null;
let pendingPlay = null;
let ttsPlaying = false;
const ttsListeners = new Set();

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

/** Strip symbols TTS engines read aloud literally */
export function cleanTextForTts(text) {
  return String(text || '')
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
 * Speak via Cartesia. Cancels any other TTS first (single channel).
 * @returns {Promise<boolean>}
 */
export async function speakViaCartesia(text, { onBeforePlay } = {}) {
  const clean = typeof text === 'string' && text.includes('\n')
    ? textForTtsDisplay(text)
    : cleanTextForTts(text);
  if (!clean) return false;

  stopGlobalCartesiaTts();
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

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean, lang }),
    });

    if (!res.ok) {
      if (res.status === 503) console.warn('[TTS] Cartesia not configured — add CARTESIA_API_KEY to server/.env');
      notifyTtsPlaying(false);
      pendingPlay?.(false);
      return false;
    }

    const blob = await res.blob();
    globalUrl = URL.createObjectURL(blob);
    const audio = new Audio(globalUrl);
    globalAudio = audio;

    return await new Promise((resolve) => {
      resolvePlay = resolve;
      const done = (ok) => {
        if (globalUrl) {
          URL.revokeObjectURL(globalUrl);
          globalUrl = null;
        }
        globalAudio = null;
        notifyTtsPlaying(false);
        pendingPlay?.(ok);
        resolve(ok);
      };
      audio.onended = () => done(true);
      audio.onerror = () => done(false);
      audio.play().catch(() => done(false));
    });
  } catch (err) {
    console.warn('[TTS] Cartesia request failed:', err?.message || err);
    notifyTtsPlaying(false);
    pendingPlay?.(false);
    return false;
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
