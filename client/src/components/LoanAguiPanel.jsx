import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { applyStateDelta, runAgent, LOAN_AGUI_AGENT_ID, resolveApiBase } from '../lib/aguiClient.js';
import ArmLiveDataFeed from '../companies/kreditbee/arm/components/ArmLiveDataFeed.jsx';
// LOAN_AGUI_AGENT_ID is the default; callers may pass a different agentId prop.
import { useSpeech } from '../hooks/useSpeech.js';
import { useElevenSpeech } from '../hooks/useElevenSpeech.js';
import { ELEVENLABS_STT_ENABLED } from '../config/voiceBackend.js';
import {
  speakViaCartesia,
  stopGlobalCartesiaTts,
  waitUntilTtsIdle,
  onTtsPlayingChange,
  isTtsPlaying,
  textForTtsDisplay,
} from '../lib/cartesiaTts.js';

function tid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `t_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Same wave treatment as `VoiceModal` (uses `.wave-bar` in `index.css`). */
function Wave({ active }) {
  return (
    <div className="flex h-5 items-end justify-center gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="wave-bar"
          style={{
            animationDelay: `${i * 0.12}s`,
            opacity: active ? 1 : 0.25,
          }}
        />
      ))}
    </div>
  );
}

function LoanAssistAvatar({ size = 24 }) {
  return (
    <div
      className="shrink-0 select-none overflow-hidden rounded-full bg-[#004b70] shadow-md ring-2 ring-[#004b70]/30"
      style={{ width: size, height: size }}
    >
      <img
        src="/silversuits-logo.png"
        alt="Silversuits.ai"
        className="h-full w-full object-cover"
        draggable="false"
      />
    </div>
  );
}

/**
 * Bottom dock styled like the UPI `VoiceModal` glass pills: status chip + mic row.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {Record<string, string>} props.formValues
 * @param {(next: Record<string, string>) => void} props.onFormChange
 * @param {(name: string, args: Record<string, unknown>) => void} [props.onToolCall]
 * @param {(text: string) => false | string | true} [props.onUserMessage] - Fired when the user sends voice/text (before the agent run). Return a period label string (or true) if handled locally (e.g. date filter applied).
 * @param {boolean} [props.directHandledReply] - When true, onUserMessage string replies are shown verbatim (ARM/KYC).
 * @param {string} [props.greeting]
 * @param {string} [props.assistTitle]
 * @param {string} [props.assistHint]
 * @param {string | null} [props.primer]
 * @param {string} [props.lang]
 * @param {boolean} [props.showReasoning] - Show thinking/status ticker (for home routing agent)
 * @param {boolean} [props.chatFullscreen] - Full-screen VoiceModal-style chat (fund transfer voice journey)
 */
export default function LoanAguiPanel({
  open,
  onClose,
  formValues,
  onFormChange,
  onToolCall,
  onUserMessage,
  onAfterAssistantReply,
  directHandledReply = false,
  greeting,
  assistTitle = 'Loan form assist',
  assistHint = 'Voice or text — your choice',
  primer = null,
  lang = 'en',
  agentId = LOAN_AGUI_AGENT_ID,
  showReasoning = false,
  navOnly = false,
  onVoiceCommand,
  continuousVoiceActive = false,
  continuousListening = false,
  continuousTranscript = '',
  continuousLiveTranscript = '',
  onStopContinuousVoice,
  onStartContinuousVoice,
  onAutoHide,
  suppressGreeting = false,
  chatFullscreen = false,
  voiceAssist = false,
  handsFree = false,
  /** Arm mic immediately after open — must be set from a user click (e.g. voice FAB). */
  gestureListen = false,
  onGestureListenHandled,
  /** When true, float a compact panel so the journey UI stays visible behind. */
  overlayPeek = false,
  liveFeed = null,
  /** Override default `bottom-[3.85rem]` when a bottom tab bar is present. */
  dockClassName = 'bottom-[3.85rem]',
  /** Pin panel to the viewport (for full-page web demos that scroll). */
  dockFixed = false,
}) {
  // Auto-mic (listen → reply → auto-listen again) applies whenever either
  // `voiceAssist` (Loan/FD Voice Assist demo mode) or `handsFree` (e.g. Fund
  // Transfer, which is always hands-free like the UPI flow) is set.
  const autoMicMode = voiceAssist || handsFree;
  const dockPosition = dockFixed ? 'fixed' : 'absolute';
  const [messages, setMessages] = useState(() => [
    {
      id: 'greet',
      role: 'assistant',
      content: greeting || "Let's fill this form together.",
      pending: false,
    },
  ]);
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [voiceBanner, setVoiceBanner] = useState(null);
  const [statusSteps, setStatusSteps] = useState([]); // reasoning/status ticker
  const statusStepsRef = useRef([]);
  const threadRef = useRef(tid());
  const valuesRef = useRef(formValues);
  const toolCallReg = useRef({});
  const primerSent = useRef(false);
  const runningRef = useRef(false);
  const transcriptScrollRef = useRef(null);
  const panelRef = useRef(null);
  const dragRef = useRef({ dragging: false, startY: 0, startH: 0 });
  const MIN_PANEL_H = 120;
  const MAX_PANEL_H = typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.50) : 360;
  const [panelH, setPanelH] = useState(null); // null = use CSS default

  // Ref to the currently playing Cartesia audio so we can stop it on demand
  const currentAudioRef = useRef(null);

  // STT — always use ElevenSpeech (proven reliable); fall back to browser STT only if unavailable
  const elevenSpeech = useElevenSpeech({ lang: String(lang || 'en').startsWith('hi') ? 'hi-IN' : 'en-IN' });
  const browserSpeech = useSpeech({ lang });
  const browserSpeechRef = useRef(browserSpeech);
  browserSpeechRef.current = browserSpeech;
  const useEleven = ELEVENLABS_STT_ENABLED && elevenSpeech.supported;
  const useBrowserStt = !useEleven && browserSpeech.supported;
  const useActiveEleven = useEleven;
  const useActiveBrowser = useBrowserStt;
  const micActive = useActiveEleven
    ? elevenSpeech.listening
    : useActiveBrowser
      ? browserSpeech.listening
      : false;
  const handsFreeActive = navOnly && continuousVoiceActive;
  const showListening = handsFreeActive ? continuousListening : micActive;
  // While listening, prefer the real-time Web Speech interim text (continuousLiveTranscript)
  // over the ElevenLabs final-only transcript so the user sees words appear as they speak.
  const liveTranscript = handsFreeActive
    ? (continuousListening && continuousLiveTranscript) || continuousTranscript
    : '';

  const skipTtsRef = useRef(false);
  const pendingNavigateRef = useRef(null);

  useEffect(() => {
    statusStepsRef.current = statusSteps;
  }, [statusSteps]);

  const stopAudio = useCallback(() => {
    stopGlobalCartesiaTts();
    currentAudioRef.current = null;
  }, []);

  const speakText = useCallback((text) => speakViaCartesia(text), []);

  useEffect(() => {
    if (!open) stopAudio();
  }, [open, stopAudio]);


  useEffect(() => {
    valuesRef.current = formValues;
  }, [formValues]);

  useEffect(() => {
    if (open) return undefined;
    setVoiceBanner(null);
    try { elevenSpeech.abort(); } catch { /* ignore */ }
    try { browserSpeechRef.current.abort(); } catch { /* ignore */ }
    return undefined;
  }, [open, elevenSpeech]);

  useEffect(() => {
    if (!useBrowserStt || !browserSpeech.error) return;
    const err = String(browserSpeech.error);
    const friendly =
      err === 'not-allowed'
        ? 'Allow microphone in Chrome (lock icon in address bar), then tap the bot again.'
        : `Speech: ${err}`;
    setVoiceBanner(friendly);
  }, [useBrowserStt, browserSpeech.error]);

  const rearmMicTimerRef = useRef(null);
  const clearRearmMicTimer = useCallback(() => {
    if (rearmMicTimerRef.current) {
      clearTimeout(rearmMicTimerRef.current);
      rearmMicTimerRef.current = null;
    }
  }, []);

  const armMic = useCallback((opts = {}) => {
    if (!open || runningRef.current) return;
    stopAudio();
    if (useActiveEleven) {
      if (elevenSpeech.listening) return;
      elevenSpeech.start((text) => {
        const t = String(text || '').trim();
        if (t) {
          setVoiceBanner(null);
          void sendRef.current(t);
        } else {
          setVoiceBanner('No speech detected — speak clearly, then pause for 2 seconds.');
          if (autoMicMode) {
            clearRearmMicTimer();
            rearmMicTimerRef.current = setTimeout(() => {
              rearmMicTimerRef.current = null;
              armMic();
            }, 1400);
          }
        }
      });
      return;
    }
    if (useActiveBrowser) {
      if (browserSpeech.listening) return;
      browserSpeech.start((text) => {
        const t = String(text || '').trim();
        if (t) {
          setVoiceBanner(null);
          void sendRef.current(t);
        } else if (autoMicMode) {
          setVoiceBanner('No speech detected — try again.');
          clearRearmMicTimer();
          rearmMicTimerRef.current = setTimeout(() => {
            rearmMicTimerRef.current = null;
            armMic();
          }, 1400);
        }
      });
    }
  }, [open, useActiveEleven, useActiveBrowser, elevenSpeech, browserSpeech, autoMicMode, clearRearmMicTimer, stopAudio]);

  useEffect(() => {
    if (!useEleven || !elevenSpeech.error) return;
    const err = String(elevenSpeech.error);
    const friendly =
      err === 'empty_audio'
        ? 'No speech detected — speak clearly, then pause for 2 seconds.'
        : err === 'not-allowed'
          ? 'Allow microphone in Chrome (lock icon in address bar), then tap the bot again.'
          : err === 'backend_unreachable'
            ? 'Cannot reach the backend — run npm run dev from the project root, then refresh.'
          : err === 'stt_not_configured'
            ? 'Speech API not configured on the server — check ELEVENLABS_API_KEY in .env.'
          : err === 'stt_payment_required'
            ? 'ElevenLabs speech billing issue — complete payment on elevenlabs.io, or type your commands in the chat box. The AGUI assistant still works via text.'
          : err.startsWith('stt_') || err === 'stt_failed'
            ? 'Server speech-to-text failed — type your command below. The AGUI assistant still works via text.'
            : `Voice error: ${err}`;
    setVoiceBanner(friendly);
    if (autoMicMode && open && !runningRef.current && err !== 'not-allowed' && err !== 'stt_payment_required') {
      clearRearmMicTimer();
      rearmMicTimerRef.current = setTimeout(() => {
        rearmMicTimerRef.current = null;
        void (async () => {
          await waitUntilTtsIdle();
          armMic();
        })();
      }, 1600);
    }
  }, [useEleven, elevenSpeech.error, autoMicMode, open, armMic, clearRearmMicTimer]);

  useEffect(() => () => clearRearmMicTimer(), [clearRearmMicTimer]);

  useEffect(() => {
    if (!open || navOnly) return undefined;
    let cancelled = false;
    void (async () => {
      try {
        const base = resolveApiBase();
        const url = base ? `${base}/api/health` : '/api/health';
        const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!cancelled && !r.ok) {
          setVoiceBanner('Backend not responding — run npm run dev from the project root.');
        }
      } catch {
        if (!cancelled) {
          setVoiceBanner('Cannot reach backend — start the server (npm run dev) and refresh this page.');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [open, navOnly]);

  useEffect(() => {
    if (!open) {
      setMessages([
        {
          id: 'greet',
          role: 'assistant',
          content: greeting || "Let's fill this form together.",
          pending: false,
        },
      ]);
      setInput('');
      setPanelH(null);
      threadRef.current = tid();
      primerSent.current = false;
      setStatusSteps([]);
    } else if (!suppressGreeting && open) {
      // Voice Assist: always speak the greeting so the user hears the first prompt.
      let cancelled = false;
      const t = setTimeout(async () => {
        await waitUntilTtsIdle();
        if (!cancelled && !primer) speakText(greeting || "Let's fill this form together.");
      }, 300);
      return () => { cancelled = true; clearTimeout(t); };
    }
    return undefined;
  }, [open, greeting, speakText, suppressGreeting, autoMicMode, primer]);

  const handleEvent = useCallback(
    (ev, asstId, collected) => {
      if (ev.type === 'TEXT_MESSAGE_CHUNK') {
        const delta = ev.delta;
        if (delta == null || delta === '') return;
        collected.text += delta;
        setMessages((prev) =>
          prev.map((m) => (m.id === asstId ? { ...m, content: m.content + delta } : m)),
        );
      } else if (ev.type === 'STATE_DELTA') {
        for (const patch of ev.delta || []) {
          if (patch.path === '/apply_date_filter' && patch.value) {
            onToolCall?.('apply_date_filter', patch.value);
            continue;
          }
          if (patch.path === '/navigate_to' && patch.value) {
            if (navOnlyRef.current) {
              onToolCall?.('navigate_to', patch.value);
            } else {
              pendingNavigateRef.current = patch.value;
            }
            continue;
          }
          const next = applyStateDelta(valuesRef.current, [patch]);
          valuesRef.current = next;
          onFormChange?.(next);
        }
      } else if (ev.type === 'TOOL_CALL_START') {
        toolCallReg.current[ev.tool_call_id] = { name: ev.tool_call_name, argsRaw: '' };
      } else if (ev.type === 'TOOL_CALL_ARGS') {
        const slot = toolCallReg.current[ev.tool_call_id];
        if (slot) slot.argsRaw += ev.delta;
      } else if (ev.type === 'TOOL_CALL_END') {
        const slot = toolCallReg.current[ev.tool_call_id];
        if (slot) {
          let args = {};
          try {
            args = slot.argsRaw ? JSON.parse(slot.argsRaw) : {};
          } catch {
            args = {};
          }
          if (slot.name === 'navigate_to') {
            const routingStatus = statusStepsRef.current.at(-1)?.text || '';
            const payload = { ...args, routingStatus };
            if (navOnlyRef.current) {
              stopGlobalCartesiaTts();
              onToolCall?.(slot.name, payload);
              skipTtsRef.current = true;
            } else {
              pendingNavigateRef.current = payload;
            }
          } else if (slot.name === 'apply_date_filter') {
            onToolCall?.(slot.name, args);
          } else if (
            slot.name === 'request_field' ||
            slot.name === 'set_field' ||
            slot.name === 'select_option' ||
            slot.name === 'submit_step' ||
            slot.name === 'click_button'
          ) {
            onToolCall?.(slot.name, args);
          }
        }
      } else if (ev.type === 'TOOL_CALL_RESULT') {
        const slot = toolCallReg.current[ev.tool_call_id];
        try {
          const data = JSON.parse(ev.content);
          if (slot?.name === 'set_field' && data?.ok && data.field_id) {
            const next = applyStateDelta(valuesRef.current, [
              { op: 'replace', path: `/${data.field_id}`, value: String(data.value ?? '') },
            ]);
            valuesRef.current = next;
            onFormChange?.(next);
            onToolCall?.(slot.name, { field_id: data.field_id, value: data.value });
          } else if (slot?.name === 'click_button' || slot?.name === 'validate_form' || slot?.name === 'submit_transfer' || slot?.name === 'submit_deposit') {
            onToolCall?.(slot.name, { tool_call_id: ev.tool_call_id, ...data });
          }
        } catch {
          /* ignore */
        }
      } else if (ev.type === 'STATUS_UPDATE') {
        if (ev.status) {
          setStatusSteps((prev) => [...prev, { text: ev.status, ts: Date.now() }]);
        }
      } else if (ev.type === 'RUN_ERROR') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstId ? { ...m, content: `${m.content}\n\n_${ev.message}_`, pending: false } : m,
          ),
        );
      }
    },
    [onFormChange, onToolCall],
  );

  // Voice-to-Command (navigation-only) path. No LLM conversation: the utterance
  // is mapped to a screen via the shared command router (App#handleVoiceCommand)
  // and we just navigate, with a one-line confirmation.
  const navOnlyRef = useRef(navOnly);
  navOnlyRef.current = navOnly;
  const onVoiceCommandRef = useRef(onVoiceCommand);
  onVoiceCommandRef.current = onVoiceCommand;
  const onUserMessageRef = useRef(onUserMessage);
  onUserMessageRef.current = onUserMessage;
  const onAfterAssistantReplyRef = useRef(onAfterAssistantReply);
  onAfterAssistantReplyRef.current = onAfterAssistantReply;
  const directHandledReplyRef = useRef(directHandledReply);
  directHandledReplyRef.current = directHandledReply;
  const continuousVoiceActiveRef = useRef(continuousVoiceActive);
  continuousVoiceActiveRef.current = continuousVoiceActive;
  const onAutoHideRef = useRef(onAutoHide);
  onAutoHideRef.current = onAutoHide;

  const sendNavCommand = useCallback(
    async (userText) => {
      const trimmed = String(userText || '').trim();
      if (!trimmed || runningRef.current) return;
      onUserMessageRef.current?.(trimmed);
      runningRef.current = true;
      setRunning(true);
      setStatusSteps([]);
      setMessages((prev) => [...prev, { id: tid(), role: 'user', content: trimmed }]);

      let reply;
      let matched = false;
      let errored = false;
      try {
        const result = await onVoiceCommandRef.current?.(trimmed);
        const match = result?.match;
        matched = Boolean(match);
        if (match) {
          reply =
            match.destination === 'home' ? 'Taking you back to the home screen.' : `Opening ${match.label}.`;
        } else {
          reply =
            'I can open: Transaction history, Fund transfer, Loan application, Create deposit, UPI payment, Hotel booking, Flight booking, Debit card, or Credit card statement. Which one?';
        }
      } catch {
        errored = true;
        reply = 'Sorry — I could not navigate just now. Please try again.';
      } finally {
        setMessages((prev) => [...prev, { id: tid(), role: 'assistant', content: reply }]);
        runningRef.current = false;
        setRunning(false);
        // Routing/fallback confirmations are already spoken centrally by
        // App#handleVoiceCommandCore (so hands-free mode gets audio feedback
        // too) — only speak here for genuine errors, which never reached it.
        if (matched && continuousVoiceActiveRef.current) {
          onAutoHideRef.current?.();
        } else if (matched) {
          setTimeout(() => onClose?.(), 300);
        } else if (errored) {
          speakText(reply);
        }
      }
    },
    [onClose, speakText],
  );

  const send = useCallback(
    async (userText, opts = {}) => {
      if (navOnlyRef.current) {
        await sendNavCommand(userText);
        return;
      }
      if (runningRef.current) return;
      runningRef.current = true;

      const trimmed = String(userText || '').trim();
      const userMsg = trimmed ? { id: tid(), role: 'user', content: trimmed } : null;

      if (userMsg) {
        const handled = onUserMessageRef.current?.(userMsg.content);
        if (handled && typeof handled === 'object' && !Array.isArray(handled)) {
          if (handled.deferNavigate) {
            const reply =
              typeof handled.reply === 'string' && handled.reply.trim()
                ? handled.reply.trim()
                : 'One moment…';
            setMessages((prev) => [
              ...prev,
              userMsg,
              { id: tid(), role: 'assistant', content: reply, pending: false },
            ]);
            runningRef.current = false;
            void (async () => {
              await speakText(reply);
              await waitUntilTtsIdle();
              onToolCall?.('navigate_to', handled.deferNavigate);
            })();
            return;
          }
          const next = { ...valuesRef.current, ...handled };
          valuesRef.current = next;
          onFormChange?.(next);
        } else if (handled) {
          const handledText =
            typeof handled === 'string' && handled.trim() ? handled.trim() : '';
          // Date-filter path returns a period label; navigation intercepts return a full reply.
          const looksLikeNavReply =
            directHandledReplyRef.current ||
            /opening|redirect|navigat|pin|deposit|transfer|loan|card|otp|email|aadhaar|kyc|thank|consent|please tell|what is your/i.test(
              handledText,
            );
          const reply = looksLikeNavReply
            ? handledText
            : `Done — showing transactions for ${handledText || 'the selected period'}. See the filtered list above.`;
          setMessages((prev) => [
            ...prev,
            userMsg,
            { id: tid(), role: 'assistant', content: reply, pending: false },
          ]);
          runningRef.current = false;
          void speakText(reply);
          return;
        }
      }

      const apiMessages = [];
      for (const m of messages) {
        if (m.role === 'system' || m.role === 'assistant' || m.role === 'user') {
          apiMessages.push({ id: m.id, role: m.role, content: String(m.content ?? '') });
        }
      }
      if (opts.systemNote) {
        apiMessages.push({
          id: tid(),
          role: 'system',
          content: `Context note from the form UI: ${opts.systemNote}`,
        });
      }
      if (userMsg) {
        apiMessages.push({ id: userMsg.id, role: 'user', content: userMsg.content });
        setMessages((prev) => [...prev, userMsg]);
      }

      setRunning(true);
      setStatusSteps([]); // clear previous reasoning steps for this new turn
      const asstId = tid();
      setMessages((prev) => [...prev, { id: asstId, role: 'assistant', content: '', pending: true }]);
      const collected = { text: '' };

      try {
        await runAgent(agentId, threadRef.current, apiMessages, valuesRef.current, {
          onEvent: (ev) => handleEvent(ev, asstId, collected),
        });
      } catch (err) {
        console.error('[loan-agui]', err);
        const hint =
          err?.name === 'AbortError'
            ? 'Request timed out or was cancelled. Check your network and try again.'
            : String(err?.message || err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstId
              ? {
                  ...m,
                  pending: false,
                  content: m.content || `Sorry — could not reach the assistant.\n\n_${hint}_`,
                }
              : m,
          ),
        );
      } finally {
        runningRef.current = false;
        setRunning(false);
        setMessages((prev) => prev.map((m) => (m.id === asstId ? { ...m, pending: false } : m)));
        if (userMsg?.content && collected.text) {
          onAfterAssistantReplyRef.current?.(userMsg.content, collected.text);
        }
        if (collected.text && !skipTtsRef.current) {
          const forTts = textForTtsDisplay(collected.text);
          if (forTts) {
            await speakText(forTts);
            await waitUntilTtsIdle();
          }
        }
        if (pendingNavigateRef.current) {
          const nav = pendingNavigateRef.current;
          pendingNavigateRef.current = null;
          onToolCall?.('navigate_to', nav);
        }
        skipTtsRef.current = false;
      }
    },
    [messages, handleEvent, speakText, sendNavCommand],
  );

  const sendRef = useRef(send);
  sendRef.current = send;

  // Arm mic in the same user-gesture window as the voice FAB click.
  useLayoutEffect(() => {
    if (!open || !gestureListen) return;
    armMic();
    onGestureListenHandled?.();
  }, [open, gestureListen, armMic, onGestureListenHandled]);

  useEffect(() => {
    if (!open || !primer || primerSent.current || running) return;
    primerSent.current = true;
    void sendRef.current('', { systemNote: primer });
  }, [open, primer, running]);

  const handleSend = () => {
    if (!input.trim() || runningRef.current) return;
    const t = input;
    setInput('');
    void send(t);
  };

  // micActive is now derived from whichever STT backend is in use (defined above with the hooks)

  const transcriptRows = useMemo(
    () => messages.filter((m) => m.role === 'user' || m.role === 'assistant'),
    [messages],
  );

  useEffect(() => {
    if (!open) return;
    const el = transcriptScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [open, transcriptRows, running, liveFeed]);

  const toggleMic = () => {
    // Voice-to-Command: yellow mic must drive the SAME continuous session as the bot FAB.
    // Starting a second recogniser here is what forced users to tap twice.
    if (navOnly) {
      if (handsFreeActive || continuousVoiceActive) {
        onStopContinuousVoice?.();
        return;
      }
      setVoiceBanner(null);
      stopAudio();
      onStartContinuousVoice?.();
      return;
    }

    if (runningRef.current) return;
    setVoiceBanner(null);
    stopAudio();

    if (useActiveEleven) {
      if (elevenSpeech.listening) {
        elevenSpeech.stop();
        return;
      }
      armMic();
      return;
    }

    if (useActiveBrowser) {
      if (browserSpeech.listening) {
        browserSpeech.stop();
        return;
      }
      armMic();
      return;
    }

    setVoiceBanner('Voice input not available on this device/browser.');
  };

  // ── Auto-mic: track TTS + auto-arm mic after bot responds ─────────────────
  const [ttsPlayingLocal, setTtsPlayingLocal] = useState(false);
  useEffect(() => {
    if (!autoMicMode) return;
    return onTtsPlayingChange(setTtsPlayingLocal);
  }, [autoMicMode]);

  // After each bot turn finishes and TTS goes idle, auto-arm the microphone.
  // This creates a seamless hands-free conversation loop (Voice Assist mode
  // for Loan/FD, and always-on for Fund Transfer via `handsFree`).
  useEffect(() => {
    if (!autoMicMode || !open) return;
    if (running || micActive || ttsPlayingLocal) return;

    let cancelled = false;
    void (async () => {
      // Wait for any in-flight TTS to finish (covers greetings, bot replies)
      await waitUntilTtsIdle();
      // Short grace so the user doesn't immediately hear their own voice echo
      await new Promise((r) => setTimeout(r, 500));
      // Re-check live TTS state (not just the possibly-stale React state) in
      // case a reply started speaking during the grace window.
      if (cancelled || runningRef.current || micActive || isTtsPlaying()) return;
      if (!open) return;

      armMic();
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMicMode, open, running, micActive, ttsPlayingLocal, messages.length]);

  // Voice Assist: if greeting TTS never starts (or finishes instantly), still
  // arm the mic shortly after open so the user isn't stuck waiting.
  useEffect(() => {
    if (!autoMicMode || !open || navOnly) return undefined;
    let cancelled = false;
    const t = setTimeout(async () => {
      if (cancelled || runningRef.current || micActive) return;
      await waitUntilTtsIdle();
      if (cancelled || runningRef.current || micActive || isTtsPlaying()) return;
      armMic();
    }, 2800);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMicMode, open, navOnly]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          data-loan-assistant
          role="dialog"
          aria-label={chatFullscreen ? 'Fund transfer assistant' : 'Loan assistant'}
          initial={{ opacity: 0, y: chatFullscreen ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: chatFullscreen ? 0 : 14 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className={
            chatFullscreen
              ? 'pointer-events-auto absolute inset-0 z-10 flex min-h-0 flex-col overflow-hidden bg-transparent text-white'
              : overlayPeek
                ? `pointer-events-auto ${dockPosition} ${dockClassName} z-[84] flex min-h-0 flex-col overflow-hidden rounded-t-2xl border border-bank-gold/50 border-b-0 bg-white/97 text-black shadow-[0_-10px_40px_rgba(15,23,42,0.2)] backdrop-blur-md`
                : `pointer-events-auto ${dockPosition} ${dockClassName} left-2 right-2 z-[84] flex min-h-0 flex-col overflow-hidden rounded-2xl border border-bank-gold/50 bg-white/96 text-black shadow-[0_10px_32px_rgba(15,23,42,0.18)] backdrop-blur-md`
          }
          style={
            chatFullscreen
              ? undefined
              : overlayPeek
                ? { height: panelH ? `${panelH}px` : 'min(38vh, 300px)' }
                : { height: panelH ? `${panelH}px` : 'min(34vh, 280px)' }
          }
        >
          {!chatFullscreen && (
          <>
          {/* Drag-to-resize handle */}
          <div
            className="flex shrink-0 cursor-ns-resize items-center justify-center py-1 touch-none select-none"
            onPointerDown={(e) => {
              e.preventDefault();
              const h = panelRef.current?.offsetHeight ?? (panelH ?? 300);
              dragRef.current = { dragging: true, startY: e.clientY, startH: h };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!dragRef.current.dragging) return;
              const delta = dragRef.current.startY - e.clientY; // drag up = bigger, drag down = smaller
              const newH = Math.min(MAX_PANEL_H, Math.max(MIN_PANEL_H, dragRef.current.startH + delta));
              setPanelH(newH);
            }}
            onPointerUp={() => { dragRef.current.dragging = false; }}
            onPointerCancel={() => { dragRef.current.dragging = false; }}
            aria-label="Drag to resize"
            title="Drag up/down to resize"
          >
            <div className="h-1 w-10 rounded-full bg-zinc-300" />
          </div>
          {/* Title bar */}
          <div className="flex shrink-0 items-center gap-2 border-b border-zinc-200 px-2.5 py-2">
            <LoanAssistAvatar size={26} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 leading-tight">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    showListening ? 'animate-pulse bg-bank-gold' : running ? 'bg-amber-400' : handsFreeActive ? 'bg-emerald-400' : 'bg-emerald-400'
                  }`}
                />
                <span className="truncate text-[12px] font-semibold text-black">silversuits.ai</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-lg leading-none text-black ring-1 ring-zinc-300 hover:bg-zinc-200"
              aria-label="Close assistant"
            >
              ×
            </button>
          </div>
          </>
          )}

          {/* Scrollable transcript — user + assistant, rubber-band on iOS */}
          <div
            ref={transcriptScrollRef}
            className={
              chatFullscreen
                ? 'min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-y-auto px-4 py-2 [-webkit-overflow-scrolling:touch]'
                : 'min-h-[72px] max-h-[min(30vh,220px)] flex-1 space-y-1.5 overflow-y-auto overscroll-y-auto px-2.5 py-2 text-black [-webkit-overflow-scrolling:touch]'
            }
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {transcriptRows.map((m) => {
              const isUser = m.role === 'user';
              // Strip 💭 reasoning lines and raw function-call text from the visible transcript
              const rawText = String(m.content ?? '');
              const text = showReasoning
                ? rawText
                    .replace(/💭[^\n]*/g, '')          // remove 💭 reasoning lines
                    .replace(/functions?\.\w+\s*\([^)]*\)/gs, '') // remove functions.navigate_to(...)
                    .replace(/navigate_to\s*\(\s*\{[\s\S]*?\}\s*\)/gs, '') // alternate format
                    .replace(/\{\s*"destination"\s*:\s*"[^"]+"\s*(?:,\s*"context"\s*:\s*"[^"]*")?\s*\}/g, '')
                    .trim()
                : rawText.trim();
              const show = isUser ? text : text || (m.pending ? '…' : '');
              if (!show && !m.pending) return null;
              return (
                <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[94%] whitespace-pre-wrap break-words rounded-lg px-2.5 py-1.5 text-[11px] leading-snug shadow-sm ${
                      chatFullscreen
                        ? isUser
                          ? 'rounded-2xl rounded-br-sm bg-white/15 text-white ring-1 ring-white/20 backdrop-blur-md'
                          : 'rounded-2xl rounded-bl-sm bg-white text-slate-800'
                        : isUser
                          ? 'bg-bank-gold/90 text-black ring-1 ring-bank-gold/55'
                          : 'bg-zinc-100 text-black ring-1 ring-zinc-200'
                    }`}
                  >
                    {isUser ? text : show}
                  </div>
                </div>
              );
            })}
            {liveFeed?.active ? (
              <ArmLiveDataFeed {...liveFeed} variant="chat" />
            ) : messages.length <= 1 ? (
              <p className={`text-[10px] leading-snug ${chatFullscreen ? 'text-white/55' : 'text-black'}`}>
                {assistHint}
              </p>
            ) : null}
          </div>

          {/* Reasoning / status ticker — home routing agent only */}
          {showReasoning && (running || statusSteps.length > 0) && (
            <div className="mx-2 mb-1 shrink-0 space-y-1">
              {/* "Thinking…" spinner when agent is running but no steps yet */}
              {running && statusSteps.length === 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200/60 bg-amber-50/80 px-2.5 py-1.5">
                  <span className="flex gap-[3px]">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </span>
                  <span className="text-[10px] font-medium text-amber-700">Analyzing your request…</span>
                </div>
              )}
              {/* Emitted status steps */}
              <AnimatePresence>
                {statusSteps.map((step, i) => (
                  <motion.div
                    key={step.ts}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    className={`flex items-start gap-2 rounded-lg border px-2.5 py-1.5 ${
                      i === statusSteps.length - 1 && running
                        ? 'border-[#0a3d62]/20 bg-[#0a3d62]/5'
                        : 'border-slate-200/70 bg-slate-50/80'
                    }`}
                  >
                    <span className="mt-0.5 text-[11px] leading-none">
                      {i === statusSteps.length - 1 && running ? '⚡' : '✓'}
                    </span>
                    <span className={`text-[10px] leading-snug font-medium ${
                      i === statusSteps.length - 1 && running ? 'text-[#0a3d62]' : 'text-slate-500'
                    }`}>
                      {step.text}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {navOnly && (
            <p className="mx-2 shrink-0 rounded-lg border border-emerald-300/80 bg-emerald-50 px-2 py-1 text-center text-[10px] leading-snug text-emerald-900">
              {showListening
                ? liveTranscript
                  ? `Listening: "${liveTranscript}"`
                  : 'Listening — speak your command…'
                : continuousVoiceActive
                  ? 'Hands-free on — speak again after each action (no mic tap needed).'
                  : 'Tap the mic once to start listening, or close and reopen the bot.'}
            </p>
          )}

          {autoMicMode && !navOnly && (
            <p className={`mx-2 shrink-0 rounded-lg border px-2 py-1 text-center text-[10px] leading-snug ${
              chatFullscreen
                ? 'border-violet-400/40 bg-violet-500/15 text-violet-100'
                : 'border-violet-300/80 bg-violet-50 text-violet-900'
            }`}>
              {micActive
                ? 'Listening — speak your answer…'
                : ttsPlayingLocal
                  ? 'Assistant is speaking…'
                  : running
                    ? 'Processing…'
                    : 'Hands-free — mic will auto-arm after each response'}
            </p>
          )}

          {voiceBanner ? (
            <p className={`mx-2 shrink-0 rounded-lg border px-2 py-1 text-center text-[10px] leading-snug ${
              chatFullscreen
                ? 'border-amber-300/40 bg-amber-500/15 text-amber-100'
                : 'border-amber-300/80 bg-amber-100/95 text-black'
            }`}>
              {voiceBanner}
            </p>
          ) : null}

          {showListening ? (
            <div className="flex shrink-0 justify-center py-0.5">
              <Wave active />
            </div>
          ) : null}

          <div className={`shrink-0 px-2 pb-2 pt-1.5 ${chatFullscreen ? 'px-3 pb-4' : 'border-t border-zinc-200'}`}>
            <div className={`flex items-center gap-2 rounded-xl p-1.5 ${
              chatFullscreen
                ? 'bg-white/10 ring-1 ring-white/20 backdrop-blur-xl'
                : 'border border-zinc-200 bg-zinc-50 shadow-inner'
            }`}>
              <button
                type="button"
                onClick={() => void toggleMic()}
                disabled={running && !handsFreeActive}
                className={`press flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                  chatFullscreen
                    ? showListening
                      ? 'bg-bank-gold text-bank-purpleDeep ring-4 ring-bank-gold/30'
                      : 'bg-white/20 text-white hover:bg-white/30'
                    : handsFreeActive
                      ? showListening
                        ? 'bg-emerald-500 text-white ring-4 ring-emerald-300/50'
                        : 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
                      : useBrowserStt
                        ? 'bg-bank-gold text-black ring-4 ring-bank-gold/35'
                        : 'bg-zinc-200 text-black ring-1 ring-zinc-300'
                }`}
                title={
                  handsFreeActive
                    ? 'End voice session'
                    : showListening
                      ? 'Tap to finish'
                      : 'Tap to speak'
                }
                aria-label={
                  handsFreeActive
                    ? 'End voice session'
                    : showListening
                      ? 'Stop recording'
                      : 'Start recording'
                }
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z" />
                  <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V20H8a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2h-3v-2.08A7 7 0 0 0 19 11z" />
                </svg>
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type or say something…"
                className={`min-w-0 flex-1 bg-transparent px-1 text-[13px] outline-none ${
                  chatFullscreen ? 'text-white placeholder:text-white/40' : 'text-black placeholder:text-black/40'
                }`}
              />
              {input.trim() ? (
                <button
                  type="button"
                  onClick={() => setInput('')}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm hover:bg-zinc-200 ${
                    chatFullscreen ? 'text-white/55 hover:text-white hover:bg-white/10' : 'text-black/55 hover:text-black'
                  }`}
                  aria-label="Clear"
                >
                  ×
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || running}
                className={`press flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all ${
                  input.trim() && !running
                    ? chatFullscreen
                      ? 'bg-bank-gold text-bank-purpleDeep shadow-sm'
                      : 'bg-gradient-to-br from-bank-gold to-amber-500 text-black shadow-sm ring-1 ring-bank-gold/50'
                    : chatFullscreen
                      ? 'cursor-not-allowed bg-white/10 text-white/30'
                      : 'cursor-not-allowed bg-zinc-200 text-black/35'
                }`}
                aria-label="Send"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M4 12L20 4l-3 16-5-7-8-1z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    fill="currentColor"
                    fillOpacity="0.15"
                  />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
