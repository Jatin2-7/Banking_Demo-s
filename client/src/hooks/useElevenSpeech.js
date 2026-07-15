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
//      frames) we arm a 2.2 s silence timer that auto-stops recording when
//      the user pauses — gives the hands-free feel users expect.
//   3. On stop, the captured Blob is POSTed to /api/stt (server proxy that
//      forwards to ElevenLabs scribe_v2) and the returned transcript is
//      handed back via onFinal(text).
//
// Manual stop() / abort() also work for tap-to-stop or cancel-on-close.
//
// Mic warm-keeping: `getUserMedia` + building the AudioContext/AnalyserNode
// is not instant — re-requesting it on every single turn (as this hook used
// to) added a real, user-visible delay between "assistant stops talking"
// and "recorder is actually capturing audio", during which the first word
// or two the user speaks is silently lost ("gives no time to speak"). We now
// keep the mic stream + audio graph alive across stop()/start() cycles
// (only releasing on unmount or `abort()`), so every turn after the first in
// a conversation starts capturing essentially instantly.

import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveApiBase } from '../lib/aguiClient.js';

const SILENCE_MS = 2200;       // pause length that ends an utterance
const MIN_SPEECH_MS = 400;     // ignore very short blips before arming silence
const MIN_RECORDING_MS = 900;  // never stop before this — avoids corrupt tiny clips
const MIN_AUDIO_BYTES = 3500;  // reject clips too small for ElevenLabs
const MAX_DURATION_MS = 15000; // hard cap so a stuck recorder can't run forever
const SILENCE_THRESHOLD = 0.02; // RMS — tuned for typical laptop mics in demo rooms
const VAD_STARTUP_MS = 250;    // ignore the first N ms after mic start (mic settle + echo tail)
const SPEECH_ONSET_MS = 150;   // require this many ms of continuous loud audio to confirm speech

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
  const loudSinceRef = useRef(0);   // timestamp when current loud streak began (0 = quiet)
  const vadStartTimeRef = useRef(0); // timestamp when the current VAD session started
  const onFinalRef = useRef(null);
  const abortedRef = useRef(false);
  const recordingStartedAtRef = useRef(0);
  const langRef = useRef(lang);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  // Stops the per-utterance VAD loop / timers only — leaves the mic stream
  // and AudioContext alive so the next start() can begin capturing instantly
  // instead of re-requesting getUserMedia from scratch.
  const cleanupTurn = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
    if (hardTimerRef.current) clearTimeout(hardTimerRef.current);
    hardTimerRef.current = null;
    speechStartedAtRef.current = 0;
    loudSinceRef.current = 0;
    vadStartTimeRef.current = 0;
  }, []);

  // Fully releases the mic stream + audio graph. Only called on unmount or
  // an explicit abort — normal per-utterance stop() keeps the mic warm.
  const releaseAudio = useCallback(() => {
    cleanupTurn();
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
  }, [cleanupTurn]);

  // Tear everything down on unmount so a route change can't leak the mic.
  useEffect(() => () => releaseAudio(), [releaseAudio]);

  const stopRecorder = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      const elapsed = performance.now() - (recordingStartedAtRef.current || 0);
      if (elapsed > 0 && elapsed < MIN_RECORDING_MS) return;
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
      if (recorderRef.current) {
        if (recorderRef.current.state === 'inactive') recorderRef.current = null;
        else return; // already recording
      }

      abortedRef.current = false;
      onFinalRef.current = onFinal || null;
      setTranscript('');
      setError(null);

      // Reuse an already-live mic stream from a previous turn if we have
      // one — skips the getUserMedia round-trip entirely so capture begins
      // right away instead of leaving a gap where the user's first words
      // are spoken before the recorder is actually listening.
      let stream = streamRef.current;
      const streamIsLive = stream && stream.getTracks().every((t) => t.readyState === 'live');
      if (!streamIsLive) {
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
      }

      const mime = pickMime() || '';
      const chunks = [];

      let rec;
      try {
        rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      } catch (e) {
        cleanupTurn();
        setError(e?.message || 'recorder_failed');
        return;
      }
      const effectiveMime = rec.mimeType || mime || 'audio/webm';

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size) chunks.push(e.data);
      };

      rec.onstop = async () => {
        cleanupTurn();
        recorderRef.current = null;
        setListening(false);

        if (abortedRef.current) return;
        if (!chunks.length) {
          setError('empty_audio');
          return;
        }

        const blob = new Blob(chunks, { type: effectiveMime });
        if (blob.size < MIN_AUDIO_BYTES) {
          setError('empty_audio');
          return;
        }
        const langCode = String(langRef.current || 'en')
          .split('-')[0]
          .toLowerCase();

        try {
          const r = await fetch(`${resolveApiBase()}/api/stt?lang=${encodeURIComponent(langCode)}`, {
            method: 'POST',
            headers: { 'Content-Type': effectiveMime },
            body: blob,
          });
          const data = await r.json().catch(() => ({}));
          if (!r.ok) {
            const detail = String(data?.detail || data?.message || '');
            if (
              detail.includes('invalid_audio')
              || detail.includes('invalid_content')
              || detail.includes('corrupted')
            ) {
              setError('empty_audio');
            } else if (r.status === 503) {
              setError('stt_not_configured');
            } else if (data?.error === 'stt_payment_required' || /payment_issue|payment_required/i.test(detail)) {
              setError('stt_payment_required');
            } else {
              setError(data?.error || `stt_${r.status}`);
            }
            return;
          }
          const finalText = String(data?.text || '').trim();
          setTranscript(finalText);
          setError(null);
          if (finalText && onFinalRef.current) {
            const cb = onFinalRef.current;
            onFinalRef.current = null;
            cb(finalText);
          } else if (!finalText) {
            setError('empty_audio');
          }
        } catch (e) {
          const msg = String(e?.message || e || '');
          if (/failed to fetch|network|load/i.test(msg)) {
            setError('backend_unreachable');
          } else {
            setError('stt_failed');
          }
        }
      };

      // ── VAD: stop after silence once real speech has started ──
      try {
        if (analyserRef.current) {
          try {
            analyserRef.current.disconnect();
          } catch {
            /* noop */
          }
          analyserRef.current = null;
        }
        // Reuse the AudioContext across turns too — creating one is not
        // free, and browsers can auto-suspend a freshly-created context
        // until the next user gesture.
        let ctx = audioCtxRef.current;
        if (!ctx || ctx.state === 'closed') {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          ctx = new Ctx();
          audioCtxRef.current = ctx;
        } else if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
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

        // Mark when this VAD session began so the startup quiet period works.
        vadStartTimeRef.current = performance.now();
        loudSinceRef.current = 0;

        const tick = () => {
          if (!analyserRef.current) return;

          const now = performance.now();

          // ── Startup quiet period ──────────────────────────────────────────────
          // Skip VAD decisions for the first VAD_STARTUP_MS ms after the mic
          // opens.  This prevents mic-hardware self-noise, residual TTS echo, and
          // AudioContext warm-up artefacts from being mistaken for speech.
          if (now - vadStartTimeRef.current < VAD_STARTUP_MS) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }

          analyser.getFloatTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
          const rms = Math.sqrt(sum / buf.length);

          if (rms > SILENCE_THRESHOLD) {
            // Track when this continuous loud streak began.
            if (!loudSinceRef.current) loudSinceRef.current = now;
            const onsetMs = now - loudSinceRef.current;

            // Only confirm "speech started" once we've had SPEECH_ONSET_MS of
            // continuous audio above the threshold.  Brief noise bursts (door
            // slam, mic thump, single-frame spike) won't reach this gate.
            if (onsetMs >= SPEECH_ONSET_MS) {
              if (!speechStartedAtRef.current) speechStartedAtRef.current = now;
              armSilence(); // reset/extend the silence countdown while speaking
            }
          } else {
            // Any quiet frame resets the loud-streak clock — a fresh burst of
            // speech must again sustain for SPEECH_ONSET_MS before being counted.
            loudSinceRef.current = 0;

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
        cleanupTurn();
        recorderRef.current = null;
        setError(e?.message || 'recorder_start_failed');
        return;
      }
      recordingStartedAtRef.current = performance.now();
      setListening(true);
    },
    [supported, cleanupTurn, stopRecorder],
  );

  const stop = useCallback(() => {
    stopRecorder();
  }, [stopRecorder]);

  const abort = useCallback(() => {
    abortedRef.current = true;
    onFinalRef.current = null;
    stopRecorder();
    // Keep the mic stream warm (see cleanupTurn) — abort() is used for
    // mid-conversation interruptions (MPIN sheet, language change, etc.),
    // not just "leave for good". Only unmount does a full releaseAudio().
    cleanupTurn();
    recorderRef.current = null;
    setListening(false);
    setTranscript('');
  }, [stopRecorder, cleanupTurn]);

  return { supported, listening, transcript, error, start, stop, abort };
}
