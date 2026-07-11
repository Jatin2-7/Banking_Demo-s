import { useCallback, useEffect, useRef, useState } from 'react';
import { waitUntilTtsIdle } from '../lib/cartesiaTts.js';

/** Pause after an action finishes (post-TTS) before listening again. */
const GAP_AFTER_ACTION_MS = 2000;

/**
 * Hands-free Voice-to-Command loop: listen → run command → wait → listen again.
 *
 * CRITICAL: the first `speech.start()` must run synchronously inside the user
 * gesture (bot FAB click). Any await before start() breaks Web Speech / getUserMedia
 * permission in Chrome.
 */
export function useContinuousVoiceCommand({ enabled, speech, onCommand, onResult } = {}) {
  const activeRef = useRef(false);
  const loopTokenRef = useRef(0);
  const processingRef = useRef(false);
  const onCommandRef = useRef(onCommand);
  const onResultRef = useRef(onResult);
  const speechRef = useRef(speech);
  const enabledRef = useRef(enabled);

  const [active, setActive] = useState(false);

  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    speechRef.current = speech;
  }, [speech]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const stop = useCallback(() => {
    activeRef.current = false;
    loopTokenRef.current += 1;
    setActive(false);
    try {
      speechRef.current?.stop?.();
    } catch {
      /* noop */
    }
  }, []);

  const armMic = useCallback((token) => {
    if (!activeRef.current || token !== loopTokenRef.current) return;
    if (!enabledRef.current) return;
    const sp = speechRef.current;
    if (!sp?.supported) return;
    if (processingRef.current) return;

    try {
      // useSpeech.start() aborts any in-flight capture first, so this is safe
      // even when listening is still true from a previous turn.
      sp.start(async (finalText) => {
        if (!activeRef.current || token !== loopTokenRef.current) return;

        const text = String(finalText || '').trim();
        if (!text) {
          void (async () => {
            await new Promise((r) => setTimeout(r, 400));
            if (activeRef.current && token === loopTokenRef.current) armMic(token);
          })();
          return;
        }

        processingRef.current = true;
        try {
          const result = await onCommandRef.current?.(text);
          onResultRef.current?.(result ?? { text, match: null });
        } catch {
          onResultRef.current?.({ text, match: null });
        } finally {
          processingRef.current = false;
        }

        if (activeRef.current && token === loopTokenRef.current) {
          void (async () => {
            await waitUntilTtsIdle();
            await new Promise((r) => setTimeout(r, GAP_AFTER_ACTION_MS));
            if (activeRef.current && token === loopTokenRef.current) armMic(token);
          })();
        }
      });
    } catch {
      void (async () => {
        await new Promise((r) => setTimeout(r, 500));
        if (activeRef.current && token === loopTokenRef.current) armMic(token);
      })();
    }
  }, []);

  const start = useCallback(() => {
    if (!enabledRef.current || !speechRef.current?.supported) return;
    activeRef.current = true;
    setActive(true);
    const token = loopTokenRef.current + 1;
    loopTokenRef.current = token;
    // Synchronous — must stay inside the click gesture for Web Speech / mic permission.
    armMic(token);
  }, [armMic]);

  /** Run a command manually (typed / panel) and continue the loop if session is active. */
  const runCommand = useCallback(
    async (text) => {
      const trimmed = String(text || '').trim();
      if (!trimmed) return null;
      processingRef.current = true;
      try {
        const result = await onCommandRef.current?.(trimmed);
        onResultRef.current?.(result ?? { text: trimmed, match: null });
        return result ?? { text: trimmed, match: null };
      } finally {
        processingRef.current = false;
        if (activeRef.current) {
          const token = loopTokenRef.current;
          void (async () => {
            await waitUntilTtsIdle();
            await new Promise((r) => setTimeout(r, GAP_AFTER_ACTION_MS));
            if (activeRef.current && token === loopTokenRef.current) armMic(token);
          })();
        }
      }
    },
    [armMic],
  );

  useEffect(() => {
    if (!enabled) stop();
  }, [enabled, stop]);

  return {
    active,
    start,
    stop,
    runCommand,
    listening: active && Boolean(speech?.listening),
    transcript: active ? speech?.transcript || '' : '',
    supported: Boolean(speech?.supported),
  };
}
