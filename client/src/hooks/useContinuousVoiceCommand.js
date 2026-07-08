import { useCallback, useEffect, useRef, useState } from 'react';
import { waitUntilTtsIdle } from '../lib/cartesiaTts.js';

/** Pause after an action finishes (post-TTS) before listening again. */
const GAP_AFTER_ACTION_MS = 2500;

/**
 * Small safety buffer before the very first listen of a session (audio
 * device / UI settle time). Callers that speak their own greeting should
 * await it fully before calling `start()` — this is just a light buffer,
 * not a substitute for that sequencing.
 */
const INITIAL_SETTLE_MS = 250;

/**
 * Hands-free Voice-to-Command loop: listen → run command → wait → listen again.
 * Uses a dedicated STT instance (cmdSpeech) so it works on any screen.
 */
export function useContinuousVoiceCommand({ enabled, speech, onCommand, onResult } = {}) {
  const activeRef = useRef(false);
  const loopTokenRef = useRef(0);
  const processingRef = useRef(false);
  const onCommandRef = useRef(onCommand);
  const onResultRef = useRef(onResult);

  const [active, setActive] = useState(false);

  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const stop = useCallback(() => {
    activeRef.current = false;
    loopTokenRef.current += 1;
    setActive(false);
    try {
      speech?.stop?.();
    } catch {
      /* noop */
    }
  }, [speech]);

  const listenOnce = useCallback(
    async (token, { skipGap = false, initialSettleMs = 0 } = {}) => {
      if (!activeRef.current || token !== loopTokenRef.current) return;
      if (!enabled || !speech?.supported) return;
      if (processingRef.current) return;

      if (initialSettleMs) {
        await new Promise((r) => setTimeout(r, initialSettleMs));
        if (!activeRef.current || token !== loopTokenRef.current) return;
      }

      await waitUntilTtsIdle();
      if (!activeRef.current || token !== loopTokenRef.current) return;

      if (!skipGap) {
        await new Promise((r) => setTimeout(r, GAP_AFTER_ACTION_MS));
        if (!activeRef.current || token !== loopTokenRef.current) return;
      }

      if (processingRef.current || speech.listening) return;

      speech.start(async (finalText) => {
        if (!activeRef.current || token !== loopTokenRef.current) return;

        const text = String(finalText || '').trim();
        if (!text) {
          listenOnce(token);
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
          listenOnce(token);
        }
      });
    },
    [enabled, speech],
  );

  const start = useCallback(() => {
    if (!enabled || !speech?.supported) return;
    activeRef.current = true;
    setActive(true);
    const token = loopTokenRef.current + 1;
    loopTokenRef.current = token;
    void listenOnce(token, { skipGap: true, initialSettleMs: INITIAL_SETTLE_MS });
  }, [enabled, speech, listenOnce]);

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
          void listenOnce(token);
        }
      }
    },
    [listenOnce],
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
