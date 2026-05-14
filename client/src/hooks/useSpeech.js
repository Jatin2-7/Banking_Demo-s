// Web Speech API wrapper. Chrome often ends `continuous: false` sessions in ~1s
// with `no-speech` before the user can speak — we use continuous capture + a
// silence timer to auto-stop after a pause (similar to push-to-talk ending).
import { useCallback, useEffect, useRef, useState } from 'react';

const SILENCE_BEFORE_STOP_MS = 2600;

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
  /** True while a capture session is active — avoids overlapping start() calls. */
  const captureActiveRef = useRef(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const scheduleSilenceStop = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      silenceTimerRef.current = null;
      try {
        if (recRef.current && onFinalRef.current) recRef.current.stop();
      } catch {
        /* noop */
      }
    }, SILENCE_BEFORE_STOP_MS);
  }, [clearSilenceTimer]);

  // (Re)build the recogniser whenever language changes.
  useEffect(() => {
    if (!supported) return;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = lang;

    r.onresult = (e) => {
      scheduleSilenceStop();
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
      setError(err);
      setListening(false);
    };

    r.onend = () => {
      clearSilenceTimer();
      captureActiveRef.current = false;
      setListening(false);
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
      try {
        r.abort();
      } catch {
        /* noop */
      }
      recRef.current = null;
    };
  }, [SR, supported, lang, clearSilenceTimer, scheduleSilenceStop]);

  const start = useCallback(
    (onFinal) => {
      if (!recRef.current || captureActiveRef.current) return;
      try {
        abortedRef.current = false;
        onFinalRef.current = onFinal;
        accumulatedFinalRef.current = '';
        latestLineRef.current = '';
        setTranscript('');
        setError(null);
        clearSilenceTimer();
        recRef.current.start();
        captureActiveRef.current = true;
        setListening(true);
        scheduleSilenceStop();
      } catch {
        captureActiveRef.current = false;
        // Already started — ignore
      }
    },
    [clearSilenceTimer, scheduleSilenceStop],
  );

  const stop = useCallback(() => {
    clearSilenceTimer();
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
  }, [clearSilenceTimer]);

  const abort = useCallback(() => {
    abortedRef.current = true;
    captureActiveRef.current = false;
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
