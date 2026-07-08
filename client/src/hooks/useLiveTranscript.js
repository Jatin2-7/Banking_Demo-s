/**
 * useLiveTranscript — provides real-time interim transcript for display purposes.
 *
 * Runs a Web Speech API recogniser in continuous + interimResults mode alongside
 * whatever STT backend (ElevenLabs or native) is doing the real recognition. The
 * result here is NEVER used to drive commands — it exists only so the user can
 * see what they're saying as they say it.
 *
 * Why a separate recogniser?  ElevenLabs streams audio to a server and only
 * returns a result when recording stops, so there are no interim events. The
 * Web Speech API fires on every partial result, making it perfect for live
 * display even if its accuracy is lower than ElevenLabs.
 */
import { useEffect, useRef, useState } from 'react';

const SR =
  typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
    : null;

/**
 * @param {{ enabled: boolean, lang?: string }} opts
 *   enabled — start/stop the recogniser when this toggles
 *   lang    — BCP-47 language tag (e.g. 'en-IN')
 * @returns {string} current interim + partial transcript
 */
export function useLiveTranscript({ enabled = false, lang = 'en-IN' } = {}) {
  const [text, setText] = useState('');
  const recRef = useRef(null);
  const restartRef = useRef(null);

  useEffect(() => {
    if (!SR || !enabled) {
      // Tear down any live recogniser
      if (recRef.current) {
        try { recRef.current.abort(); } catch { /* ignore */ }
        recRef.current = null;
      }
      if (restartRef.current) {
        clearTimeout(restartRef.current);
        restartRef.current = null;
      }
      setText('');
      return;
    }

    let destroyed = false;

    function createRec() {
      if (destroyed) return;
      const r = new SR();
      r.lang = lang;
      r.continuous = true;
      r.interimResults = true;
      r.maxAlternatives = 1;

      r.onresult = (e) => {
        let t = '';
        for (let i = 0; i < e.results.length; i++) {
          t += e.results[i][0].transcript;
        }
        setText(t.trim());
      };

      r.onerror = () => {
        // Absorb — errors are expected (mic permissions already granted by
        // the main STT hook, but the display recogniser might briefly fail).
      };

      r.onend = () => {
        if (destroyed || !enabled) return;
        // Auto-restart after a brief pause so the display stays live.
        restartRef.current = setTimeout(() => {
          if (destroyed) return;
          try { createRec(); } catch { /* ignore */ }
        }, 200);
      };

      try {
        r.start();
        recRef.current = r;
      } catch {
        // If start() fails (e.g. another recognition is already running),
        // back off and retry shortly.
        restartRef.current = setTimeout(() => {
          if (destroyed) return;
          try { createRec(); } catch { /* ignore */ }
        }, 500);
      }
    }

    createRec();

    return () => {
      destroyed = true;
      if (restartRef.current) {
        clearTimeout(restartRef.current);
        restartRef.current = null;
      }
      if (recRef.current) {
        try { recRef.current.abort(); } catch { /* ignore */ }
        recRef.current = null;
      }
      setText('');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, lang]);

  return text;
}
