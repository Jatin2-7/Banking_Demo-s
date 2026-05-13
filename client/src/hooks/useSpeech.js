// Tiny wrapper around the Web Speech API. Falls back gracefully when missing.
import { useCallback, useEffect, useRef, useState } from 'react';

export function useSpeech({ lang = 'en-IN' } = {}) {
  const SR =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  const supported = !!SR;
  const recRef = useRef(null);
  const onFinalRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);

  // (Re)build the recogniser whenever language changes.
  useEffect(() => {
    if (!supported) return;
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = lang;

    r.onresult = (e) => {
      let final = '';
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setTranscript(final || interim);
      if (final && onFinalRef.current) {
        const cb = onFinalRef.current;
        onFinalRef.current = null;
        cb(final.trim());
      }
    };
    r.onerror = (e) => {
      setError(e.error || 'speech_error');
      setListening(false);
    };
    r.onend = () => {
      setListening(false);
    };

    recRef.current = r;
    return () => {
      try {
        r.abort();
      } catch {}
      recRef.current = null;
    };
  }, [SR, supported, lang]);

  const start = useCallback((onFinal) => {
    if (!recRef.current) return;
    try {
      onFinalRef.current = onFinal;
      setTranscript('');
      setError(null);
      recRef.current.start();
      setListening(true);
    } catch (e) {
      // Already started — ignore
    }
  }, []);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {}
    setListening(false);
  }, []);

  const abort = useCallback(() => {
    try {
      recRef.current?.abort();
    } catch {}
    setListening(false);
    setTranscript('');
    onFinalRef.current = null;
  }, []);

  return { supported, listening, transcript, error, start, stop, abort };
}
