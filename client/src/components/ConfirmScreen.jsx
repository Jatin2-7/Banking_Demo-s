import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { avatarColor, initialsOf } from '../data/mockContacts';

function MicIcon({ size = 18, color = '#FFFFFF' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="12" rx="3" fill={color} />
      <path
        d="M5 11a7 7 0 0014 0M12 18v3M9 21h6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 5v14M6 13l6 6 6-6"
        stroke="#6B7280"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ConfirmScreen({
  details,
  onCancel,
  onConfirm,
  onMicTap,
  isListening,
  liveTranscript,
  speechSupported,
}) {
  if (!details) return null;
  const { contact, account, amount } = details;

  return (
    <motion.div
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -30, opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 bg-page pt-11 px-5 pb-6 flex flex-col"
      style={{ borderRadius: '44px' }}
    >
      <div className="flex items-center justify-between pt-2">
        <button onClick={onCancel} className="text-[13px] font-semibold text-muted press">
          ← Back
        </button>
        <div className="text-[14px] font-bold text-ink">Review payment</div>
        <span className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-[12px] uppercase tracking-wider text-muted">Sending</div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22, delay: 0.05 }}
          className="text-[48px] font-bold text-brand leading-tight mt-1"
        >
          ₹{amount?.toLocaleString('en-IN')}
        </motion.div>
        <div className="my-3">
          <ArrowDown />
        </div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
          className="w-14 h-14 rounded-full flex items-center justify-center text-white text-[16px] font-bold shadow-card"
          style={{ background: avatarColor(contact.name) }}
        >
          {contact.initials || initialsOf(contact.name)}
        </motion.div>
        <div className="text-[18px] font-bold text-ink mt-2">{contact.name}</div>
        <div className="text-[13px] text-muted">{account}</div>

        <div className="w-full mt-7 bg-white border border-divider rounded-2xl shadow-card divide-y divide-divider">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-[12px] text-muted">From</div>
            <div className="text-[13px] font-semibold text-ink">Indian Bank Savings ••4821</div>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-[12px] text-muted">Remarks</div>
            <div className="text-[13px] text-ink">Voice payment</div>
          </div>
        </div>

        <AnimatePresence>
          {isListening && liveTranscript && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-4 text-[12px] text-brand font-medium"
            >
              "{liveTranscript}"
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-3 pb-1">
        <button
          onClick={onCancel}
          className="flex-1 h-12 rounded-xl border border-divider bg-white text-[14px] font-semibold text-ink press"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-[2] h-12 rounded-xl bg-accent text-white text-[14px] font-semibold press shadow-card"
        >
          Confirm & Pay
        </button>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        {speechSupported && (
          <button
            type="button"
            onClick={onMicTap}
            className="relative w-10 h-10 rounded-full flex items-center justify-center press shrink-0"
            style={{ background: isListening ? '#FF6B00' : '#1A237E' }}
            aria-label={isListening ? 'Stop listening' : 'Tap to say yes'}
          >
            <AnimatePresence>
              {isListening && (
                <motion.span
                  key="ring"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: '#FF6B00' }}
                />
              )}
            </AnimatePresence>
            <motion.div
              animate={isListening ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 0.8, repeat: isListening ? Infinity : 0 }}
              className="relative z-10"
            >
              <MicIcon size={16} />
            </motion.div>
          </button>
        )}
        <div className="text-[12px] text-muted">
          {!speechSupported
            ? 'Tap "Confirm & Pay" to complete'
            : isListening
              ? 'Listening… say "yes" or "cancel"'
              : 'Tap mic and say "yes" or "cancel"'}
        </div>
      </div>
    </motion.div>
  );
}
