import { useCallback, useEffect, useRef, useState } from 'react';

const SILENCE_TIMEOUT_MS = 6000;

function getRecognitionCtor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function useSpeechRecognition({ lang = 'en-IN' } = {}) {
  const Ctor = getRecognitionCtor();
  const isSupported = !!Ctor;

  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const onResultCbRef = useRef(null);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const armSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      try {
        recognitionRef.current?.stop();
      } catch (_e) {
        /* ignore */
      }
    }, SILENCE_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    if (!isSupported) return undefined;

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setError(null);
      setTranscript('');
      setFinalTranscript('');
      setIsListening(true);
      armSilenceTimer();
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interim += res[0].transcript;
      }
      if (interim) {
        setTranscript(interim);
        armSilenceTimer();
      }
      if (finalText) {
        setFinalTranscript((prev) => (prev + ' ' + finalText).trim());
        setTranscript(finalText);
      }
    };

    recognition.onerror = (event) => {
      setError(event.error || 'speech_error');
      setIsListening(false);
      clearSilenceTimer();
    };

    recognition.onend = () => {
      setIsListening(false);
      clearSilenceTimer();
      const final = (recognition.__finalText || '').trim();
      const cb = onResultCbRef.current;
      if (cb) cb(final);
    };

    const origOnResult = recognition.onresult;
    recognition.onresult = (event) => {
      origOnResult(event);
      let finalText = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
      }
      if (finalText) recognition.__finalText = finalText;
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch (_e) {
        /* ignore */
      }
      recognitionRef.current = null;
      clearSilenceTimer();
    };
  }, [Ctor, isSupported, lang, armSilenceTimer]);

  const start = useCallback((onFinal) => {
    if (!recognitionRef.current) return;
    onResultCbRef.current = onFinal || null;
    try {
      recognitionRef.current.__finalText = '';
      recognitionRef.current.start();
    } catch (e) {
      setError(e?.message || 'start_failed');
    }
  }, []);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch (_e) {
      /* ignore */
    }
  }, []);

  const abort = useCallback(() => {
    onResultCbRef.current = null;
    try {
      recognitionRef.current?.abort();
    } catch (_e) {
      /* ignore */
    }
    setIsListening(false);
    clearSilenceTimer();
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    finalTranscript,
    error,
    start,
    stop,
    abort,
  };
}
