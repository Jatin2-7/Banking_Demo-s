// Web Speech API wrapper. Chrome often ends `continuous: false` sessions in ~1s
// with `no-speech` before the user can speak — we use continuous capture + a
// silence timer to auto-stop after a pause (similar to push-to-talk ending).
import { useCallback, useEffect, useRef, useState } from 'react';

// How long the user has to START speaking after the mic arms, before we give
// up and auto-stop. This used to be the same short window as the post-speech
// gap below (2.6s total from mic-on to forced stop) — nowhere near enough
// time to notice the mic is live, formulate a sentence like "send 5000 to
// Rahul Sharma", and say it. A real pause-to-think grace period fixes that.
const INITIAL_LISTEN_GRACE_MS = 7000;

// Once the user has actually started speaking (first interim/final result),
// switch to this much shorter "they've paused, probably done" gap — long
// enough for natural mid-sentence pauses, short enough to feel responsive.
const SILENCE_AFTER_SPEECH_MS = 2200;

export function useSpeech({ lang = 'en-IN' } = {}) {
  const SR =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  const supported = !!SR;
  const recRef = useRef(null);
  const onFinalRef = useRef(null);
  const accumulatedFinalRef = useRef('');
  const latestLineRef = useRef('');
  const abortedRef = useRef(false);
  const silenceTimerRef = useRef(null);
  /** True once at least one result (interim or final) has arrived this session. */
  const heardSpeechRef = useRef(false);
  /** True while a capture session is active — avoids overlapping start() calls. */
  const captureActiveRef = useRef(false);
  /**
   * Chrome cannot start() until the previous recognition's onend has fired.
   * If start() is called while still active, we abort and queue the callback
   * here so onend can begin the new listen (still counts as the user gesture
   * for the first FAB click in practice via the abort→onend→start chain).
   */
  const pendingStartRef = useRef(null);
  const beginCaptureRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const armStopTimer = useCallback((ms) => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      silenceTimerRef.current = null;
      try {
        if (recRef.current && onFinalRef.current) recRef.current.stop();
      } catch {
        /* noop */
      }
    }, ms);
  }, [clearSilenceTimer]);

  const beginCapture = useCallback(
    (onFinal) => {
      if (!recRef.current) return;
      try {
        abortedRef.current = false;
        heardSpeechRef.current = false;
        onFinalRef.current = onFinal;
        accumulatedFinalRef.current = '';
        latestLineRef.current = '';
        setTranscript('');
        setError(null);
        clearSilenceTimer();
        recRef.current.start();
        captureActiveRef.current = true;
        setListening(true);
        armStopTimer(INITIAL_LISTEN_GRACE_MS);
      } catch {
        captureActiveRef.current = false;
        setListening(false);
        // Engine still busy — retry once shortly after onend should have settled.
        pendingStartRef.current = onFinal;
        setTimeout(() => {
          const cb = pendingStartRef.current;
          if (!cb || captureActiveRef.current) return;
          pendingStartRef.current = null;
          beginCaptureRef.current?.(cb);
        }, 80);
      }
    },
    [clearSilenceTimer, armStopTimer],
  );
  beginCaptureRef.current = beginCapture;

  // (Re)build the recogniser whenever language changes.
  useEffect(() => {
    if (!supported) return;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = lang;

    r.onresult = (e) => {
      heardSpeechRef.current = true;
      armStopTimer(SILENCE_AFTER_SPEECH_MS);
      let chunkFinal = '';
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) chunkFinal += t;
        else interim += t;
      }
      if (chunkFinal) {
        accumulatedFinalRef.current = `${accumulatedFinalRef.current} ${chunkFinal}`.trim();
      }
      const line = `${accumulatedFinalRef.current}${interim ? ` ${interim}` : ''}`.trim();
      latestLineRef.current = line;
      setTranscript(line);
    };

    r.onerror = (ev) => {
      const err = ev.error || 'speech_error';
      clearSilenceTimer();
      captureActiveRef.current = false;
      if (err === 'aborted') {
        setListening(false);
        return;
      }
      if (err === 'no-speech' && onFinalRef.current) {
        const fromFinals = accumulatedFinalRef.current.trim();
        const fallback = latestLineRef.current.trim();
        const text = fromFinals || fallback;
        accumulatedFinalRef.current = '';
        latestLineRef.current = '';
        const cb = onFinalRef.current;
        onFinalRef.current = null;
        setListening(false);
        if (text) cb(text);
        return;
      }
      setError(err);
      setListening(false);
    };

    r.onend = () => {
      clearSilenceTimer();
      captureActiveRef.current = false;
      setListening(false);

      const pending = pendingStartRef.current;
      if (pending) {
        pendingStartRef.current = null;
        abortedRef.current = false;
        accumulatedFinalRef.current = '';
        latestLineRef.current = '';
        onFinalRef.current = null;
        // Defer one tick — Chrome needs the engine fully idle after onend.
        setTimeout(() => beginCaptureRef.current?.(pending), 0);
        return;
      }

      if (abortedRef.current) {
        abortedRef.current = false;
        accumulatedFinalRef.current = '';
        latestLineRef.current = '';
        onFinalRef.current = null;
        return;
      }
      const fromFinals = accumulatedFinalRef.current.trim();
      const fallback = latestLineRef.current.trim();
      const text = fromFinals || fallback;
      accumulatedFinalRef.current = '';
      latestLineRef.current = '';
      const cb = onFinalRef.current;
      onFinalRef.current = null;
      if (text && cb) cb(text);
    };

    recRef.current = r;
    return () => {
      clearSilenceTimer();
      captureActiveRef.current = false;
      pendingStartRef.current = null;
      try {
        r.abort();
      } catch {
        /* noop */
      }
      recRef.current = null;
    };
  }, [SR, supported, lang, clearSilenceTimer, armStopTimer]);

  const start = useCallback(
    (onFinal) => {
      if (!recRef.current) return;

      // Already capturing — queue a restart after abort/onend (Chrome rule).
      if (captureActiveRef.current) {
        pendingStartRef.current = onFinal;
        abortedRef.current = true;
        clearSilenceTimer();
        try {
          recRef.current.abort();
        } catch {
          /* noop */
        }
        return;
      }

      beginCapture(onFinal);
    },
    [beginCapture, clearSilenceTimer],
  );

  const stop = useCallback(() => {
    clearSilenceTimer();
    pendingStartRef.current = null;
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
  }, [clearSilenceTimer]);

  const abort = useCallback(() => {
    abortedRef.current = true;
    captureActiveRef.current = false;
    pendingStartRef.current = null;
    clearSilenceTimer();
    try {
      recRef.current?.abort();
    } catch {
      /* noop */
    }
    setListening(false);
    setTranscript('');
    onFinalRef.current = null;
    accumulatedFinalRef.current = '';
    latestLineRef.current = '';
  }, [clearSilenceTimer]);

  return { supported, listening, transcript, error, start, stop, abort };
}
