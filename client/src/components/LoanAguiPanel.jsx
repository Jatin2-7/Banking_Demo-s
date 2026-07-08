import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { applyStateDelta, runAgent, LOAN_AGUI_AGENT_ID } from '../lib/aguiClient.js';
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
      className="flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-bank-gold to-amber-500 font-bold text-black shadow-md ring-2 ring-bank-gold/50"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      B
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
  onAutoHide,
  suppressGreeting = false,
  chatFullscreen = false,
  voiceAssist = false,
  handsFree = false,
}) {
  // Auto-mic (listen → reply → auto-listen again) applies whenever either
  // `voiceAssist` (Loan/FD Voice Assist demo mode) or `handsFree` (e.g. Fund
  // Transfer, which is always hands-free like the UPI flow) is set.
  const autoMicMode = voiceAssist || handsFree;
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
  const micActive = useEleven ? elevenSpeech.listening : (useBrowserStt ? browserSpeech.listening : false);
  const handsFreeActive = navOnly && continuousVoiceActive;
  const showListening = handsFreeActive ? continuousListening : micActive;
  // While listening, prefer the real-time Web Speech interim text (continuousLiveTranscript)
  // over the ElevenLabs final-only transcript so the user sees words appear as they speak.
  const liveTranscript = handsFreeActive
    ? (continuousListening && continuousLiveTranscript) || continuousTranscript
    : '';

  const skipTtsRef = useRef(false);

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
    setVoiceBanner(`Speech: ${browserSpeech.error}`);
  }, [useBrowserStt, browserSpeech.error]);

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
    } else if (!suppressGreeting && (!autoMicMode || !primer)) {
      // Speak greeting only after any ongoing TTS (e.g. routing status) finishes.
      // Skipped when `suppressGreeting` is set (hands-free session start speaks
      // its own greeting synchronously before the mic arms, avoiding a race
      // where this delayed timer fires after the mic has already started).
      // In hands-free auto-mic modes with a `primer`, the agent's own first
      // structured response (triggered by the primer below) is the one that
      // should play instead — speaking this static greeting too would create
      // two overlapping voices. But when there's no primer, nothing else will
      // ever prompt the conversation, so the greeting must still be spoken —
      // otherwise the mic silently auto-arms with no audible cue and the
      // "hands-free" session feels broken/inert.
      let cancelled = false;
      const t = setTimeout(async () => {
        await waitUntilTtsIdle();
        if (!cancelled) speakText(greeting || "Let's fill this form together.");
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
            skipTtsRef.current = true;
            stopGlobalCartesiaTts();
            const routingStatus = statusStepsRef.current.at(-1)?.text || '';
            onToolCall?.(slot.name, { ...args, routingStatus });
          } else if (slot.name === 'apply_date_filter') {
            onToolCall?.(slot.name, args);
          } else if (slot.name === 'request_field' || slot.name === 'set_field') {
            onToolCall?.(slot.name, args);
          }
        }
      } else if (ev.type === 'TOOL_CALL_RESULT') {
        const slot = toolCallReg.current[ev.tool_call_id];
        try {
          const data = JSON.parse(ev.content);
          if (slot?.name === 'click_button' || slot?.name === 'validate_form' || slot?.name === 'submit_transfer' || slot?.name === 'submit_deposit') {
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
        if (handled) {
          const period =
            typeof handled === 'string' && handled.trim()
              ? handled.trim()
              : 'the selected period';
          const reply = `Done — showing transactions for ${period}. See the filtered list above.`;
          setMessages((prev) => [
            ...prev,
            userMsg,
            { id: tid(), role: 'assistant', content: reply, pending: false },
          ]);
          runningRef.current = false;
          speakText(reply);
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
        // Speak assistant reply — skip when redirecting (UPI/IMPS/loan takes over TTS)
        if (collected.text && !skipTtsRef.current) {
          const forTts = textForTtsDisplay(collected.text);
          if (forTts) speakText(forTts);
        }
        skipTtsRef.current = false;
      }
    },
    [messages, handleEvent, speakText, sendNavCommand],
  );

  const sendRef = useRef(send);
  sendRef.current = send;

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
  }, [open, transcriptRows, running]);

  const toggleMic = () => {
    if (runningRef.current) return;
    if (handsFreeActive) {
      onStopContinuousVoice?.();
      return;
    }
    setVoiceBanner(null);

    stopAudio();

    if (useEleven) {
      if (elevenSpeech.listening) {
        elevenSpeech.stop();
        return;
      }
      elevenSpeech.start((text) => {
        const t = String(text || '').trim();
        if (!t) { setVoiceBanner('No words detected — speak closer to the mic and try again.'); return; }
        void sendRef.current(t);
      });
      return;
    }

    if (useBrowserStt) {
      if (browserSpeech.listening) {
        browserSpeech.stop();
        return;
      }
      browserSpeech.start((text) => {
        const t = String(text || '').trim();
        if (t) void sendRef.current(t);
      });
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
      await new Promise((r) => setTimeout(r, 600));
      // Re-check live TTS state (not just the possibly-stale React state) in
      // case a reply started speaking during the grace window.
      if (cancelled || runningRef.current || micActive || isTtsPlaying()) return;

      stopAudio();
      if (useEleven) {
        elevenSpeech.start((text) => {
          const t = String(text || '').trim();
          if (t) void sendRef.current(t);
          else setVoiceBanner('No speech detected — speak closer to the mic and try again.');
        });
      } else if (useBrowserStt) {
        browserSpeech.start((text) => {
          const t = String(text || '').trim();
          if (t) void sendRef.current(t);
        });
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMicMode, open, running, micActive, ttsPlayingLocal, messages.length]);

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
              : 'pointer-events-auto absolute bottom-[3.85rem] left-2 right-2 z-[84] flex min-h-0 flex-col overflow-hidden rounded-2xl border border-bank-gold/50 bg-white/96 text-black shadow-[0_10px_32px_rgba(15,23,42,0.18)] backdrop-blur-md'
          }
          style={chatFullscreen ? undefined : { height: panelH ? `${panelH}px` : 'min(34vh, 280px)' }}
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
                <span className="truncate text-[12px] font-semibold text-black">{assistTitle}</span>
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
            {messages.length <= 1 ? (
              <p className={`text-[10px] leading-snug ${chatFullscreen ? 'text-white/55' : 'text-black'}`}>{assistHint}</p>
            ) : null}
            {transcriptRows.map((m) => {
              const isUser = m.role === 'user';
              // Strip 💭 reasoning lines and raw function-call text from the visible transcript
              const rawText = String(m.content ?? '');
              const text = showReasoning
                ? rawText
                    .replace(/💭[^\n]*/g, '')          // remove 💭 reasoning lines
                    .replace(/functions?\.\w+\s*\([^)]*\)/gs, '') // remove functions.navigate_to(...)
                    .replace(/navigate_to\s*\(\s*\{[\s\S]*?\}\s*\)/gs, '') // alternate format
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

          {handsFreeActive && (
            <p className="mx-2 shrink-0 rounded-lg border border-emerald-300/80 bg-emerald-50 px-2 py-1 text-center text-[10px] leading-snug text-emerald-900">
              {showListening
                ? 'Listening for your command…'
                : liveTranscript
                  ? `Heard: "${liveTranscript}"`
                  : 'Hands-free mode — speak again in a moment after each action.'}
            </p>
          )}

          {autoMicMode && !handsFreeActive && (
            <p className={`mx-2 shrink-0 rounded-lg border px-2 py-1 text-center text-[10px] leading-snug ${
              chatFullscreen
                ? 'border-violet-400/40 bg-violet-500/15 text-violet-100'
                : 'border-violet-300/80 bg-violet-50 text-violet-900'
            }`}>
              {micActive
                ? 'Listening — speak your answer…'
                : ttsPlayingLocal
                  ? 'Aarav is speaking…'
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
