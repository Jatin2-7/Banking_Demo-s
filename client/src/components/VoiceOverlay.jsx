import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ContactList from './ContactList';
import AccountPicker from './AccountPicker';
import LanguagePicker from './LanguagePicker';
import { LANGUAGES } from '../data/languages';

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="12" rx="3" fill="white" />
      <path
        d="M5 11a7 7 0 0014 0M12 18v3M9 21h6"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Waveform({ active }) {
  const delays = [0, 100, 200, 100, 0];
  return (
    <div className="flex items-end gap-1 h-7">
      {delays.map((d, i) => (
        <div
          key={i}
          className="wave-bar"
          style={{
            animationDelay: `${d}ms`,
            animationPlayState: active ? 'running' : 'paused',
            height: active ? undefined : '4px',
          }}
        />
      ))}
    </div>
  );
}

function BotBubble({ text }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="flex items-end gap-2 max-w-[85%]"
    >
      <div className="w-7 h-7 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center shrink-0">
        BP
      </div>
      <div className="bg-white text-ink text-[13px] px-3 py-2 rounded-2xl rounded-bl-sm shadow">
        {text}
      </div>
    </motion.div>
  );
}

function UserBubble({ text }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="self-end max-w-[80%]"
    >
      <div className="bg-accent text-white text-[13px] px-3 py-2 rounded-2xl rounded-br-sm shadow">
        {text}
      </div>
    </motion.div>
  );
}

export default function VoiceOverlay({
  open,
  voiceState,
  liveTranscript,
  botMessage,
  turnHistory = [],
  disambiguationContacts,
  disambiguationAccounts,
  onSelectContact,
  onSelectAccount,
  onClose,
  onSubmitText,
  speechSupported,
  speechError,
  lang,
  onChangeLang,
}) {
  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
  const [typedInput, setTypedInput] = useState('');
  const scrollerRef = useRef(null);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTo({
        top: scrollerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [turnHistory, botMessage, liveTranscript]);

  const isListening = voiceState === 'listening';
  const isProcessing = voiceState === 'processing';

  const subLabel = (() => {
    if (speechError === 'not-allowed' || speechError === 'service-not-allowed')
      return 'Tap Allow when browser asks for mic access';
    if (isListening) return 'Listening…';
    if (isProcessing) return 'Thinking…';
    if (voiceState === 'bot_speaking') return 'Indian Bank is responding…';
    if (voiceState === 'waiting_input') return 'Tap a choice or speak';
    return 'Tap mic to speak';
  })();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="absolute inset-0 z-50 flex flex-col"
          style={{
            background: 'rgba(26, 26, 46, 0.92)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: '44px',
          }}
        >
          <div className="flex items-center justify-between px-5 pt-12">
            <div className="text-white/90 text-[14px] font-semibold">Indian Bank Voice</div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center press"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="px-3 pt-3">
            <LanguagePicker
              value={lang}
              onChange={onChangeLang}
              disabled={voiceState === 'processing'}
            />
            <div className="text-center text-white/50 text-[11px] mt-1.5">
              Try: <span className="text-white/80">"{currentLang.sample}"</span>
            </div>
          </div>

          <div
            ref={scrollerRef}
            className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 flex flex-col gap-3"
          >
            {turnHistory
              .slice(-3)
              .map((t, i) =>
                t.role === 'bot' ? (
                  <BotBubble key={i} text={t.text} />
                ) : (
                  <UserBubble key={i} text={t.text} />
                ),
              )}
            {!turnHistory.length && botMessage && <BotBubble text={botMessage} />}
            {liveTranscript && isListening && <UserBubble text={liveTranscript} />}
          </div>

          <div className="px-5 pb-10 flex flex-col items-center gap-4">
            <Waveform active={isListening} />
            <div className="text-white/80 text-[13px]">{subLabel}</div>

            {!speechSupported && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (typedInput.trim()) {
                    onSubmitText?.(typedInput.trim());
                    setTypedInput('');
                  }
                }}
                className="w-full"
              >
                <div className="text-white/60 text-[11px] mb-1">
                  Speech not supported in this browser. Type instead:
                </div>
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={typedInput}
                    onChange={(e) => setTypedInput(e.target.value)}
                    placeholder="Type a command…"
                    className="flex-1 bg-white/10 text-white placeholder:text-white/40 rounded-xl px-3 py-2 text-[14px] outline-none border border-white/15"
                  />
                  <button
                    type="submit"
                    className="px-4 rounded-xl bg-accent text-white text-[14px] font-semibold press"
                  >
                    Send
                  </button>
                </div>
              </form>
            )}

            {speechSupported && voiceState === 'idle' && (
              <motion.button
                onClick={() => onSubmitText?.('')}
                whileTap={{ scale: 0.92 }}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shadow-lg"
              >
                <MicIcon />
              </motion.button>
            )}
          </div>

          {disambiguationContacts && disambiguationContacts.length > 0 && (
            <ContactList
              contacts={disambiguationContacts}
              onSelect={onSelectContact}
              onClose={onClose}
            />
          )}

          {disambiguationAccounts && disambiguationAccounts.length > 0 && (
            <AccountPicker
              accounts={disambiguationAccounts}
              contactName="this contact"
              onSelect={onSelectAccount}
              onClose={onClose}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
