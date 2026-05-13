import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { avatarColor, initialsOf } from '../data/mock.js';
import { LANGUAGES, STRINGS } from '../i18n/strings.js';

// "Light, transparent, floating" overlay. The home screen behind stays
// visible (subtle blur, no dark backdrop). Bubbles, cards and input bar are
// glass elements that float over the app.

function Wave({ active }) {
  return (
    <div className="flex items-end justify-center gap-1 h-5">
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

function BotAvatar({ size = 26 }) {
  return (
    <div
      className="rounded-full bg-gradient-to-br from-brand to-brand-light flex items-center justify-center text-white font-bold shrink-0 shadow-md select-none ring-1 ring-white/60"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      B
    </div>
  );
}

function ChatBubble({ role, text }) {
  const isUser = role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && <BotAvatar />}
      <div
        className={`max-w-[78%] px-3.5 py-2 text-[13px] leading-snug whitespace-pre-line shadow-md ${
          isUser
            ? 'bg-brand/90 text-white rounded-2xl rounded-br-md backdrop-blur-md ring-1 ring-white/15'
            : 'bg-white/75 text-ink rounded-2xl rounded-bl-md backdrop-blur-md ring-1 ring-white/60'
        }`}
      >
        {text}
      </div>
    </motion.div>
  );
}

function OptionCard({ option, kind, onPick }) {
  const isContact = kind === 'contact_pick';
  return (
    <button
      onClick={() => onPick(option.id)}
      className="press w-full text-left flex items-center gap-3 bg-white/85 backdrop-blur-md ring-1 ring-white/60 hover:ring-brand/40 rounded-xl px-3 py-2.5 shadow-md"
    >
      {isContact ? (
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-semibold shrink-0"
          style={{ background: avatarColor(option.label) }}
        >
          {initialsOf(option.label)}
        </div>
      ) : (
        <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center text-brand text-sm shrink-0">
          {option.label.match(/^\p{Emoji}/u)?.[0] || '•'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-ink truncate">
          {option.label.replace(/^\p{Emoji}\s*/u, '')}
        </div>
        {option.sublabel && (
          <div className="text-[11px] text-muted truncate">{option.sublabel}</div>
        )}
      </div>
      <div className="text-muted text-lg">›</div>
    </button>
  );
}

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

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    const sentinel = bottomRef.current;
    if (!el) return;
    if (sentinel?.scrollIntoView) {
      sentinel.scrollIntoView({ block: 'end', behavior: 'auto' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    scrollToBottom();
    const r = requestAnimationFrame(scrollToBottom);
    const t = setTimeout(scrollToBottom, 240);
    return () => {
      cancelAnimationFrame(r);
      clearTimeout(t);
    };
  }, [
    scrollToBottom,
    open,
    isListening,
    session?.history?.length,
    session?.pending,
    session?.thinking,
    session?.executing,
    session?.state,
    liveTranscript,
  ]);

  if (!open || !session) return null;

  const submit = () => {
    const v = text.trim();
    if (!v) return;
    setText('');
    onSubmitText(v);
  };

  const pending = session.pending;
  const showOptions = pending && Array.isArray(pending.options) && pending.options.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        // Pointer events disabled on the root so the home screen behind
        // stays interactive in empty zones; we re-enable on actual UI.
        className="absolute inset-0 z-50 flex flex-col pointer-events-none"
      >
        {/* Soft veil — barely-there blur of the home screen behind. No dark fill. */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 backdrop-blur-[3px]"
          style={{
            background:
              'linear-gradient(180deg, rgba(245,246,250,0.35) 0%, rgba(245,246,250,0.05) 30%, rgba(245,246,250,0.35) 100%)',
          }}
          onClick={onClose}
        />

        {/* Floating status chip (pill) */}
        <motion.div
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="relative z-10 px-3 pt-3 pointer-events-auto"
        >
          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xl ring-1 ring-white/60 shadow-lg rounded-full pl-2 pr-1.5 py-1.5">
            <BotAvatar size={24} />
            <div className="min-w-0 flex-1">
              <div className="text-[11.5px] font-semibold text-ink leading-tight truncate flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isListening ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'
                  }`}
                />
                {isListening
                  ? L.listening
                  : session.state === 'CONFIRM'
                    ? L.confirmTitle
                    : 'Indian Bank assistant'}
              </div>
              <div className="text-[9.5px] text-muted leading-tight truncate">
                {isListening
                  ? 'Speak naturally — I’m listening'
                  : 'Voice or text — your choice'}
              </div>
            </div>
            {session?.pending?.progress && (
              <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-brand/10 text-brand font-bold shrink-0">
                {session.pending.progress.index}/{session.pending.progress.total}
              </span>
            )}
            <div className="flex items-center gap-0.5 shrink-0">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => onChangeLang(l.code)}
                  className={`text-[9.5px] w-6 h-6 rounded-full font-semibold flex items-center justify-center transition-colors ${
                    lang === l.code
                      ? 'bg-brand text-white'
                      : 'bg-white/80 text-muted hover:text-ink ring-1 ring-divider/60'
                  }`}
                  title={l.label}
                >
                  {l.short}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="ml-0.5 w-7 h-7 rounded-full bg-white/80 ring-1 ring-divider/60 text-muted hover:text-ink text-base leading-none flex items-center justify-center shrink-0"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </motion.div>

        {/* Floating chat area — bottom-anchored, fades into the app at the top */}
        <div
          ref={scrollRef}
          className="relative z-10 flex-1 min-h-0 overflow-y-auto px-3 pt-3 pb-2 flex flex-col gap-2.5 no-scrollbar pointer-events-auto"
          style={{
            scrollPaddingBottom: '24px',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0px, black 36px, black calc(100% - 4px), transparent 100%)',
            maskImage:
              'linear-gradient(to bottom, transparent 0px, black 36px, black calc(100% - 4px), transparent 100%)',
          }}
        >
          {/* Spacer so first message starts near the bottom on a fresh chat */}
          <div className="flex-1 min-h-[120px]" />

          <AnimatePresence initial={false}>
            {session.history.map((m, i) => (
              <ChatBubble key={`${i}-${m.t || i}`} role={m.role} text={m.text} />
            ))}
          </AnimatePresence>

          {liveTranscript && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-end"
            >
              <div className="text-[12px] text-brand italic px-3 py-1 rounded-full bg-white/70 backdrop-blur-md ring-1 ring-brand/20 shadow-sm">
                "{liveTranscript}"
              </div>
            </motion.div>
          )}

          {session?.thinking && (
            <div className="flex items-end gap-2 justify-start">
              <BotAvatar />
              <div className="bg-white/75 backdrop-blur-md ring-1 ring-white/60 rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-1 shadow-md">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-muted/70 animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-muted/70 animate-bounce"
                  style={{ animationDelay: '120ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-muted/70 animate-bounce"
                  style={{ animationDelay: '240ms' }}
                />
              </div>
            </div>
          )}

          {session?.executing && (
            <div className="flex items-end gap-2 justify-start">
              <BotAvatar />
              <div className="bg-white/75 backdrop-blur-md ring-1 ring-white/60 rounded-2xl rounded-bl-md px-3.5 py-2 flex items-center gap-2 shadow-md">
                <svg className="w-4 h-4 animate-spin text-brand" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray="42"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-[12px] text-muted">Processing payment…</span>
              </div>
            </div>
          )}

          {/* Inline confirm / result cards */}
          {inlineExtra}

          {/* Inline option list */}
          {showOptions &&
            session.state !== 'CONFIRM' &&
            session.state !== 'DONE' &&
            session.state !== 'FAILED' &&
            session.state !== 'CANCELLED' && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-2 mt-1"
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

        {/* Floating input pill */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 16, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="relative z-10 px-3 pb-3 pt-1 pointer-events-auto"
        >
          {isListening && (
            <div className="mb-1.5 flex justify-center">
              <Wave active />
            </div>
          )}
          <div className="flex items-center gap-2 bg-white/75 backdrop-blur-xl ring-1 ring-white/60 shadow-lg rounded-full p-1.5">
            <button
              onClick={onMicTap}
              disabled={!speechSupported}
              className={`press w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm transition-all ${
                !speechSupported
                  ? 'bg-muted/40'
                  : isListening
                    ? 'bg-orange-500 ring-4 ring-orange-500/25'
                    : 'bg-gradient-to-br from-brand to-brand-light'
              }`}
              title={speechSupported ? 'Tap to record' : 'Voice not supported in this browser'}
              aria-label={isListening ? 'Stop recording' : 'Start recording'}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z" />
                <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V20H8a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2h-3v-2.08A7 7 0 0 0 19 11z" />
              </svg>
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
              placeholder={L.typeHere}
              className="flex-1 text-[13px] bg-transparent outline-none placeholder:text-muted/70 px-1"
            />
            {text && (
              <button
                onClick={() => setText('')}
                className="w-6 h-6 rounded-full text-muted hover:text-ink hover:bg-page/60 text-sm flex items-center justify-center shrink-0"
                aria-label="Clear"
              >
                ×
              </button>
            )}
            <button
              onClick={submit}
              disabled={!text.trim()}
              className={`press w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 transition-all ${
                text.trim()
                  ? 'bg-gradient-to-br from-brand to-brand-dark shadow-sm'
                  : 'bg-brand/30 cursor-not-allowed'
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
