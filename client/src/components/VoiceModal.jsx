import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { avatarColor, initialsOf } from '../data/mock.js';
import { LANGUAGES, STRINGS } from '../i18n/strings.js';
import { speakViaCartesia, stopGlobalCartesiaTts } from '../lib/cartesiaTts.js';

/* ─── Helpers ─── */
function pluck(details, ...needles) {
  for (const n of needles) {
    const re = new RegExp(n, 'i');
    const hit = (details || []).find((d) => re.test(d.label || ''));
    if (hit) return hit.value;
  }
  return '';
}

/* ─── Mic wave bars ─── */
function Wave({ active }) {
  return (
    <div className="flex items-end justify-center gap-[3px] h-6">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="wave-bar"
          style={{ animationDelay: `${i * 0.12}s`, opacity: active ? 1 : 0.3 }}
        />
      ))}
    </div>
  );
}

/* ─── UPI stripe logo ─── */
function UpiLogo({ size = 20 }) {
  return (
    <div
      className="rounded overflow-hidden flex shrink-0 shadow-sm"
      style={{ width: size, height: size * 0.7 }}
      aria-hidden
    >
      <div className="flex-1 h-full bg-[#097939]" />
      <div className="flex-1 h-full bg-white" />
      <div className="flex-1 h-full bg-[#E97529]" />
    </div>
  );
}

/* ─── Aarav avatar ─── */
function AaravAvatar({ size = 32, pulse = false }) {
  return (
    <div
      className={`rounded-full bg-gradient-to-br from-bank-gold to-amber-500 flex items-center justify-center font-bold shrink-0 shadow-md select-none ${pulse ? 'ring-4 ring-bank-gold/40 animate-pulse' : 'ring-2 ring-bank-gold/50'}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      <span className="text-bank-purpleDeep" style={{ fontSize: Math.round(size * 0.38) }}>A</span>
    </div>
  );
}

/* ─── Chat bubbles ─── */
function ChatBubble({ role, text }) {
  const isUser = role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && <AaravAvatar size={28} />}
      <div
        className={`max-w-[76%] px-3.5 py-2.5 text-[13px] leading-snug whitespace-pre-line shadow-sm ${
          isUser
            ? 'bg-white/15 text-white rounded-2xl rounded-br-sm backdrop-blur-md ring-1 ring-white/20'
            : 'bg-white text-slate-800 rounded-2xl rounded-bl-sm'
        }`}
      >
        {text}
      </div>
    </motion.div>
  );
}

/* ─── Contact option card ─── */
function OptionCard({ option, kind, onPick }) {
  const isContact = kind === 'contact_pick';
  return (
    <button
      onClick={() => onPick(option.id)}
      className="press w-full text-left flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md ring-1 ring-white/15 rounded-xl px-3 py-2.5 transition-colors"
    >
      {isContact ? (
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
          style={{ background: avatarColor(option.label) }}
        >
          {initialsOf(option.label)}
        </div>
      ) : (
        <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-white text-sm shrink-0">
          {option.label.match(/^\p{Emoji}/u)?.[0] || '•'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-white truncate">
          {option.label.replace(/^\p{Emoji}\s*/u, '')}
        </div>
        {option.sublabel && (
          <div className="text-[11px] text-white/60 truncate">{option.sublabel}</div>
        )}
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
}

/* ─── Dynamic payment summary card ─── */
function PaymentSummaryCard({ session }) {
  const state = session?.state;
  const pending = session?.pending;
  const details = pending?.details || [];

  const amount = pluck(details, '^amount', 'राशि', 'మొత్తం', 'தொகை');
  const to = pluck(details, '^to$', '^biller', '^recipient', 'किसे', 'ఎవరికి', 'யாருக்கு');
  const upiId = pluck(details, '^upi', '^vpa', '^handle');

  const isConfirm = state === 'CONFIRM';
  // DONE/FAILED/CANCELLED handled by ResultCard in inlineExtra — don't double-render
  const isTerminal = ['DONE', 'FAILED', 'CANCELLED'].includes(state);
  if (isTerminal) return null;

  if (isConfirm && (amount || to)) {
    const initials = to ? initialsOf(to) : '₹';
    const avatarBg = to ? avatarColor(to) : '#5B3D8A';
    return (
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mx-4 my-3 rounded-2xl bg-white overflow-hidden shadow-lg"
      >
        <div className="bg-gradient-to-r from-[#3D2666]/10 to-[#5B3D8A]/10 px-4 py-2">
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#3D2666]">Confirm Payment</p>
        </div>
        {amount && (
          <div className="text-center py-3">
            <p className="text-3xl font-black text-slate-800 tracking-tight">{amount}</p>
          </div>
        )}
        {to && (
          <div className="flex items-center gap-3 px-4 pb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ background: avatarBg }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{to}</p>
              {upiId && <p className="text-xs text-slate-500 truncate">{upiId}</p>}
            </div>
            <div className="ml-auto">
              <UpiLogo size={22} />
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // Idle / building state — show animated orb
  return (
    <div className="mx-4 my-3 flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/15 px-4 py-3">
      <div className="relative w-10 h-10 shrink-0">
        <div className="absolute inset-0 rounded-full bg-bank-gold/30 animate-ping" />
        <div className="relative w-10 h-10 rounded-full bg-bank-gold/20 flex items-center justify-center">
          <UpiLogo size={20} />
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-white">UPI Payment</p>
        <p className="text-[11px] text-white/60 mt-0.5">
          {session?.thinking ? 'AI is thinking…' : 'Tell me who to pay and how much'}
        </p>
      </div>
    </div>
  );
}

/* ─── Thinking indicator ─── */
function ThinkingDots() {
  return (
    <div className="flex items-end gap-2 justify-start">
      <AaravAvatar size={28} pulse />
      <div className="bg-white rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-1 shadow-sm">
        {[0, 120, 240].map((delay) => (
          <span
            key={delay}
            className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Processing indicator ─── */
function ProcessingBubble() {
  return (
    <div className="flex items-end gap-2 justify-start">
      <AaravAvatar size={28} />
      <div className="bg-white rounded-2xl rounded-bl-sm px-3.5 py-2 flex items-center gap-2 shadow-sm">
        <svg className="w-4 h-4 animate-spin text-[#3D2666]" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeDasharray="42" strokeLinecap="round" />
        </svg>
        <span className="text-[12px] text-slate-600">Processing payment…</span>
      </div>
    </div>
  );
}

/* ─── Main VoiceModal ─── */
export default function VoiceModal({
  open,
  session,
  liveTranscript,
  isListening,
  speechSupported,
  onClose,
  onSubmitText,
  onMicTap,
  onPick,
  lang,
  onChangeLang,
  inlineExtra,
}) {
  const [text, setText] = useState('');
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const L = STRINGS[lang] || STRINGS.en;

  const stopAudio = useCallback(() => stopGlobalCartesiaTts(), []);
  const speakText = useCallback((t) => speakViaCartesia(t), []);

  const lastBotMessageRef = useRef(null);
  const historyLenWhenOpenedRef = useRef(0);
  const prevOpenRef = useRef(false);

  React.useEffect(() => {
    if (open && !prevOpenRef.current) {
      historyLenWhenOpenedRef.current = session?.history?.length ?? 0;
      lastBotMessageRef.current = null;
    }
    prevOpenRef.current = open;
  }, [open, session?.history?.length]);

  // Speak only new bot messages after modal opens
  React.useEffect(() => {
    if (!open || !session?.history) return;
    const history = session.history;
    if (history.length <= historyLenWhenOpenedRef.current) return;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'bot') {
        const msg = history[i];
        if (msg !== lastBotMessageRef.current) {
          lastBotMessageRef.current = msg;
          speakText(msg.text);
        }
        break;
      }
    }
  }, [open, session?.history, speakText]);

  React.useEffect(() => {
    if (isListening || !open) stopAudio();
  }, [isListening, open, stopAudio]);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    bottomRef.current?.scrollIntoView?.({ block: 'end', behavior: 'smooth' });
    el.scrollTop = el.scrollHeight;
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const r = requestAnimationFrame(scrollToBottom);
    const t = setTimeout(scrollToBottom, 220);
    return () => { cancelAnimationFrame(r); clearTimeout(t); };
  }, [
    scrollToBottom, open, isListening,
    session?.history?.length, session?.pending,
    session?.thinking, session?.executing, session?.state, liveTranscript,
  ]);

  if (!open || !session) return null;

  const submit = () => {
    const v = text.trim();
    if (!v) return;
    setText('');
    onSubmitText(v);
  };

  const pending = session.pending;
  const showOptions =
    pending &&
    Array.isArray(pending.options) &&
    pending.options.length > 0 &&
    !['CONFIRM', 'DONE', 'FAILED', 'CANCELLED'].includes(session.state);

  const isDone = session.state === 'DONE';
  const isFailed = session.state === 'FAILED';
  const isCancelled = session.state === 'CANCELLED';
  const isTerminal = isDone || isFailed || isCancelled;

  return (
    <AnimatePresence>
      <motion.div
        key="upi-screen"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
        className="absolute inset-0 z-50 flex flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #003366 0%, #001F4D 45%, #0A0A2E 100%)',
        }}
      >
        {/* ── Header ── */}
        <div className="shrink-0 px-4 pt-3 pb-2">
          <div className="flex items-center gap-3">
            {/* AI identity */}
            <AaravAvatar size={36} pulse={isListening} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">AI Assistant</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isListening ? 'bg-bank-gold animate-pulse' : session?.thinking ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                  }`}
                />
              </div>
              <p className="text-[10px] text-white/55 leading-tight">
                {isListening
                  ? 'Listening — speak naturally'
                  : session?.thinking
                    ? 'Thinking…'
                    : 'Your Indian Bank AI assistant'}
              </p>
            </div>

            {/* Language switcher */}
            <div className="flex items-center gap-1 shrink-0">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => onChangeLang(l.code)}
                  className={`text-[9px] w-6 h-6 rounded-full font-bold flex items-center justify-center transition-colors ${
                    lang === l.code
                      ? 'bg-bank-gold text-bank-purpleDeep shadow-sm'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                  title={l.label}
                >
                  {l.short}
                </button>
              ))}
            </div>

            {/* Progress badge */}
            {pending?.progress && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-bank-gold/20 text-bank-gold font-bold shrink-0">
                {pending.progress.index}/{pending.progress.total}
              </span>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center shrink-0 text-base leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Dynamic payment card ── */}
        <PaymentSummaryCard session={session} />

        {/* ── Chat area ── */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto px-4 py-2 flex flex-col gap-3 no-scrollbar"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 24px, black 100%)',
            maskImage: 'linear-gradient(to bottom, transparent 0px, black 24px, black 100%)',
          }}
        >
          <div className="flex-1 min-h-[32px]" />

          <AnimatePresence initial={false}>
            {session.history.map((m, i) => (
              <ChatBubble key={`${i}-${m.t || i}`} role={m.role} text={m.text} />
            ))}
          </AnimatePresence>

          {/* Live transcript */}
          {liveTranscript && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
              <div className="text-[12px] text-white/80 italic px-3 py-1.5 rounded-full bg-white/10 ring-1 ring-white/15">
                "{liveTranscript}"
              </div>
            </motion.div>
          )}

          {/* Thinking / processing indicators */}
          {session?.thinking && <ThinkingDots />}
          {session?.executing && <ProcessingBubble />}

          {/* Inline confirm / result (from App.jsx — ConfirmCard, ResultCard) */}
          {inlineExtra}

          {/* Option cards */}
          {showOptions && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-2"
            >
              {pending.options.map((opt) => (
                <OptionCard
                  key={opt.id}
                  option={opt}
                  kind={pending.kind}
                  onPick={(id) => onPick(id, pending.kind)}
                />
              ))}
            </motion.div>
          )}

          <div ref={bottomRef} aria-hidden="true" />
        </div>

        {/* ── Mic wave (above input) ── */}
        {isListening && (
          <div className="shrink-0 flex justify-center pb-1">
            <Wave active />
          </div>
        )}

        {/* ── Input bar ── */}
        {!isTerminal && (
          <div className="shrink-0 px-3 pb-4 pt-1">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl ring-1 ring-white/20 rounded-full px-2 py-1.5">
              {/* Mic button */}
              <button
                onClick={onMicTap}
                disabled={!speechSupported}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm transition-all ${
                  !speechSupported
                    ? 'bg-white/10 opacity-40'
                    : isListening
                      ? 'bg-bank-gold ring-4 ring-bank-gold/30 text-bank-purpleDeep'
                      : 'bg-white/20 hover:bg-white/30'
                }`}
                aria-label={isListening ? 'Stop recording' : 'Start recording'}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z" />
                  <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V20H8a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2h-3v-2.08A7 7 0 0 0 19 11z" />
                </svg>
              </button>

              {/* Text input */}
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                placeholder={L.typeHere || 'Type or speak…'}
                className="flex-1 text-[13px] bg-transparent outline-none text-white placeholder:text-white/40 px-1"
              />

              {/* Clear */}
              {text && (
                <button
                  onClick={() => setText('')}
                  className="w-6 h-6 rounded-full text-white/50 hover:text-white flex items-center justify-center shrink-0 text-sm"
                  aria-label="Clear"
                >
                  ×
                </button>
              )}

              {/* Send */}
              <button
                onClick={submit}
                disabled={!text.trim()}
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  text.trim()
                    ? 'bg-bank-gold text-bank-purpleDeep shadow-sm'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
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
                    fillOpacity="0.18"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Done button for terminal states */}
        {isTerminal && (
          <div className="shrink-0 px-4 pb-6 pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-bank-gold text-bank-purpleDeep font-bold text-sm shadow-lg hover:opacity-90 active:scale-[0.98]"
            >
              {isDone ? 'Done' : 'Close'}
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
