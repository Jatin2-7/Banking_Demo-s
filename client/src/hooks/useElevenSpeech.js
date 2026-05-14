// ElevenLabs STT hook — drop-in replacement for useSpeech.
//
// Same public surface as the Web Speech API hook so the rest of the app
// doesn't have to care which backend transcribed the user's voice:
//   { supported, listening, transcript, error, start, stop, abort }
//
// How it works:
//   1. start(onFinal) → request mic, spin up MediaRecorder + an AnalyserNode
//      that watches the input RMS.
//   2. As soon as we detect speech (RMS over a small threshold for a few
//      frames) we arm a 1.5 s silence timer that auto-stops recording when
//      the user pauses — gives the hands-free feel users expect.
//   3. On stop, the captured Blob is POSTed to /api/stt (server proxy that
//      forwards to ElevenLabs scribe_v2) and the returned transcript is
//      handed back via onFinal(text).
//
// Manual stop() / abort() also work for tap-to-stop or cancel-on-close.

import { useCallback, useEffect, useRef, useState } from 'react';

const API_BASE = (import.meta.env?.VITE_API_BASE || 'http://localhost:3001').replace(/\/$/, '');

const SILENCE_MS = 2200; // pause length that ends an utterance
const MIN_SPEECH_MS = 400; // ignore very short blips before arming silence
const MAX_DURATION_MS = 15000; // hard cap so a stuck recorder can't run forever
const SILENCE_THRESHOLD = 0.012; // RMS — calibrated empirically against laptop mics
const LOUD_FRAMES_NEEDED = 4; // require sustained audio before treating as "speech started"

function pickMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  for (const m of candidates) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return '';
}

export function useElevenSpeech({ lang = 'en-IN' } = {}) {
  const supported =
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    !!navigator?.mediaDevices?.getUserMedia;

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const hardTimerRef = useRef(null);
  const speechStartedAtRef = useRef(0);
  const loudStreakRef = useRef(0);
  const onFinalRef = useRef(null);
  const abortedRef = useRef(false);
  const langRef = useRef(lang);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const cleanupAudio = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
    if (hardTimerRef.current) clearTimeout(hardTimerRef.current);
    hardTimerRef.current = null;
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {
        /* noop */
      }
      analyserRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {
        /* noop */
      }
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          /* noop */
        }
      });
      streamRef.current = null;
    }
    speechStartedAtRef.current = 0;
    loudStreakRef.current = 0;
  }, []);

  // Tear everything down on unmount so a route change can't leak the mic.
  useEffect(() => () => cleanupAudio(), [cleanupAudio]);

  const stopRecorder = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      try {
        rec.stop();
      } catch {
        /* noop */
      }
    }
  }, []);

  const start = useCallback(
    async (onFinal) => {
      if (!supported) {
        setError('not_supported');
        return;
      }
      if (recorderRef.current) return; // already recording

      abortedRef.current = false;
      onFinalRef.current = onFinal || null;
      setTranscript('');
      setError(null);

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (e) {
        setError(e?.name === 'NotAllowedError' ? 'not-allowed' : e?.message || 'mic_failed');
        return;
      }
      streamRef.current = stream;

      const mime = pickMime() || '';
      const chunks = [];

      let rec;
      try {
        rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      } catch (e) {
        cleanupAudio();
        setError(e?.message || 'recorder_failed');
        return;
      }
      const effectiveMime = rec.mimeType || mime || 'audio/webm';

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size) chunks.push(e.data);
      };

      rec.onstop = async () => {
        cleanupAudio();
        recorderRef.current = null;
        setListening(false);

        if (abortedRef.current) return;
        if (!chunks.length) {
          setError('empty_audio');
          return;
        }

        const blob = new Blob(chunks, { type: effectiveMime });
        const langCode = String(langRef.current || 'en')
          .split('-')[0]
          .toLowerCase();

        try {
          const r = await fetch(`${API_BASE}/api/stt?lang=${encodeURIComponent(langCode)}`, {
            method: 'POST',
            headers: { 'Content-Type': effectiveMime },
            body: blob,
          });
          const data = await r.json().catch(() => ({}));
          if (!r.ok) {
            setError(data?.error || `stt_${r.status}`);
            return;
          }
          const finalText = String(data?.text || '').trim();
          setTranscript(finalText);
          if (finalText && onFinalRef.current) {
            const cb = onFinalRef.current;
            onFinalRef.current = null;
            cb(finalText);
          }
        } catch (e) {
          setError(e?.message || 'stt_failed');
        }
      };

      // ── VAD: stop after silence once real speech has started ──
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctx();
        audioCtxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        src.connect(analyser);
        analyserRef.current = analyser;

        const buf = new Float32Array(analyser.fftSize);

        const armSilence = () => {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(stopRecorder, SILENCE_MS);
        };

        const tick = () => {
          if (!analyserRef.current) return;
          analyser.getFloatTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
          const rms = Math.sqrt(sum / buf.length);

          const now = performance.now();
          if (rms > SILENCE_THRESHOLD) {
            loudStreakRef.current += 1;
            if (loudStreakRef.current >= LOUD_FRAMES_NEEDED) {
              if (!speechStartedAtRef.current) speechStartedAtRef.current = now;
              armSilence();
            }
          } else {
            loudStreakRef.current = 0;
            if (
              speechStartedAtRef.current &&
              now - speechStartedAtRef.current > MIN_SPEECH_MS &&
              !silenceTimerRef.current
            ) {
              armSilence();
            }
          }
          rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
      } catch {
        // VAD is best-effort — if AudioContext creation fails we fall back
        // to manual / hard-timeout stop only.
      }

      hardTimerRef.current = setTimeout(stopRecorder, MAX_DURATION_MS);

      recorderRef.current = rec;
      try {
        rec.start(250); // emit chunks every 250 ms
      } catch (e) {
        cleanupAudio();
        recorderRef.current = null;
        setError(e?.message || 'recorder_start_failed');
        return;
      }
      setListening(true);
    },
    [supported, cleanupAudio, stopRecorder],
  );

  const stop = useCallback(() => {
    stopRecorder();
  }, [stopRecorder]);

  const abort = useCallback(() => {
    abortedRef.current = true;
    onFinalRef.current = null;
    stopRecorder();
    cleanupAudio();
    recorderRef.current = null;
    setListening(false);
    setTranscript('');
  }, [stopRecorder, cleanupAudio]);

  return { supported, listening, transcript, error, start, stop, abort };
}
