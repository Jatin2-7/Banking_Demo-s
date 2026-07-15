import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STRINGS } from '../i18n/strings.js';

// Demo MPIN. Production replaces this with a tool call (POST /auth/mpin/verify)
// that returns success + a short-lived token, never validates client-side.
const DEMO_MPIN = '1234';
const PIN_LEN = 4;

export default function MpinSheet({ open, lang, onCancel, onSuccess }) {
  const L = STRINGS[lang] || STRINGS.en;
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setPin('');
      setError(null);
      // a tick later so the sheet animates in first
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  function press(d) {
    if (pin.length >= PIN_LEN) return;
    setError(null);
    setPin(pin + d);
  }
  function back() {
    setError(null);
    setPin(pin.slice(0, -1));
  }

  useEffect(() => {
    if (pin.length !== PIN_LEN) return;
    const ok = pin === DEMO_MPIN;
    if (ok) {
      onSuccess();
    } else {
      setError(L.mpinWrong || 'Wrong MPIN. Try again.');
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setPin('');
      }, 350);
    }
  }, [pin, onSuccess, L.mpinWrong]);

  if (!open) return null;

  const dots = Array.from({ length: PIN_LEN }, (_, i) => i < pin.length);
  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', null, '0', '⌫'];

  return (
    <AnimatePresence>
      <motion.div
        key="mpin-back"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[60] flex items-end"
        style={{ background: 'rgba(26,15,48,0.72)' }}
        onClick={onCancel}
      >
        <motion.div
          key="mpin-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 36 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-white rounded-t-3xl shadow-2xl px-5 pt-3 pb-6"
        >
          <div className="w-10 h-1 bg-divider rounded-full mx-auto" />

          <div className="mt-4 flex flex-col items-center">
            <div
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-bank-gold/25 to-amber-500/20 flex items-center justify-center text-bank-purpleMid text-xl ring-1 ring-bank-gold/40"
              aria-hidden
            >
              🔒
            </div>
            <div className="text-[15px] font-bold text-ink mt-3">{L.mpinTitle || 'Enter MPIN'}</div>
            <div className="text-[12px] text-muted mt-0.5 text-center">
              {L.mpinSubtitle || 'Authorise this payment with your 4-digit MPIN.'}
            </div>
          </div>

          <motion.div
            animate={shake ? { x: [-6, 6, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-5 flex items-center justify-center gap-3"
          >
            {dots.map((filled, i) => (
              <span
                key={i}
                className={`w-3.5 h-3.5 rounded-full border-2 transition ${
                  filled ? 'bg-brand border-brand' : 'bg-transparent border-divider'
                }`}
              />
            ))}
          </motion.div>

          {error && (
            <div className="text-center text-[11px] text-red-600 font-medium mt-2">{error}</div>
          )}

          <div className="grid grid-cols-3 gap-2 mt-5">
            {KEYS.map((k, i) =>
              k === null ? (
                <div key={i} />
              ) : k === '⌫' ? (
                <button
                  key={i}
                  onClick={back}
                  className="press py-3 rounded-2xl bg-page text-ink text-[18px] font-semibold border border-divider/60"
                >
                  ⌫
                </button>
              ) : (
                <button
                  key={i}
                  onClick={() => press(k)}
                  className="press py-3 rounded-2xl bg-page text-ink text-[18px] font-semibold border border-divider/60"
                >
                  {k}
                </button>
              ),
            )}
          </div>

          <button
            onClick={onCancel}
            className="press w-full mt-4 py-2.5 rounded-xl bg-white border border-divider text-muted text-[12px] font-semibold"
          >
            {L.cancel || 'Cancel'}
          </button>

          <div className="text-center text-[10px] text-muted mt-2">
            Demo MPIN: <span className="font-mono">{DEMO_MPIN}</span>
          </div>

          <input
            ref={inputRef}
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, PIN_LEN);
              setPin(v);
            }}
            className="absolute opacity-0 pointer-events-none"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
