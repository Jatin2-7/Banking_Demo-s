import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SBI } from '../theme.js';

const DEMO_CURRENT_PIN = '1234';
const PIN_LEN = 4;

const PIN_STEPS = {
  current: { title: 'Enter Current PIN', subtitle: 'Enter your 4-digit SBI credit card PIN' },
  new: { title: 'Set New PIN', subtitle: 'Choose a new 4-digit PIN' },
  confirm: { title: 'Confirm New PIN', subtitle: 'Re-enter your new PIN to confirm' },
};

function PinDots({ value, len }) {
  return (
    <div className="flex justify-center gap-3">
      {Array.from({ length: len }, (_, i) => (
        <div
          key={i}
          className="h-3.5 w-3.5 rounded-full border-2 transition-all duration-150"
          style={{
            borderColor: SBI.purple,
            backgroundColor: i < value.length ? SBI.purple : 'transparent',
          }}
        />
      ))}
    </div>
  );
}

function PinKeypad({ value, maxLen, onPress, onBack }) {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'back'];
  return (
    <div className="grid grid-cols-3 gap-2 px-8">
      {keys.map((k, i) => {
        if (k === null) return <div key="pin-keypad-spacer" />;
        if (k === 'back') {
          return (
            <button
              key="back"
              type="button"
              onClick={onBack}
              className="press flex h-12 items-center justify-center rounded-xl text-lg"
              style={{ color: SBI.purple, backgroundColor: `${SBI.purple}12` }}
              aria-label="Delete"
            >
              ⌫
            </button>
          );
        }
        return (
          <button
            key={k}
            type="button"
            onClick={() => value.length < maxLen && onPress(String(k))}
            className="press flex h-12 items-center justify-center rounded-xl text-[17px] font-bold"
            style={{ color: SBI.ink, backgroundColor: `${SBI.purple}10` }}
          >
            {k}
          </button>
        );
      })}
    </div>
  );
}

function CardPreview() {
  return (
    <div
      className="mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl px-5 py-4 text-white shadow-lg"
      style={{ background: SBI.cardGrad }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-white/75">
            SBI Credit Card
          </p>
          <p className="mt-1 text-[11px] font-bold">YONO SBI Card</p>
        </div>
        <div className="rounded bg-white/20 px-2 py-0.5 text-[8px] font-bold">VISA</div>
      </div>
      <p className="mt-6 font-mono text-[14px] tracking-[0.2em]">•••• •••• •••• 4829</p>
      <div className="mt-4 flex justify-between text-[9px] text-white/80">
        <span>VALID THRU 09/28</span>
        <span>JATIN K.</span>
      </div>
    </div>
  );
}

export default function SbiCreditCardPinScreen({ onBack }) {
  const [pinStep, setPinStep] = useState('current');
  const [entry, setEntry] = useState('');
  const [savedNew, setSavedNew] = useState('');
  const [error, setError] = useState(null);
  const [shake, setShake] = useState(false);

  const { title, subtitle } = PIN_STEPS[pinStep] || PIN_STEPS.current;

  function triggerShake(msg) {
    setError(msg);
    setShake(true);
    setEntry('');
    setTimeout(() => setShake(false), 500);
  }

  function handlePress(d) {
    setError(null);
    const next = entry + d;
    setEntry(next);
    if (next.length < PIN_LEN) return;

    if (pinStep === 'current') {
      if (next !== DEMO_CURRENT_PIN) {
        triggerShake('Incorrect PIN. Demo PIN is 1234.');
      } else {
        setEntry('');
        setPinStep('new');
      }
    } else if (pinStep === 'new') {
      setSavedNew(next);
      setEntry('');
      setPinStep('confirm');
    } else if (pinStep === 'confirm') {
      if (next !== savedNew) {
        triggerShake('PINs do not match. Please try again.');
        setSavedNew('');
        setPinStep('new');
      } else {
        setPinStep('success');
      }
    }
  }

  function handleBack() {
    setError(null);
    setEntry((v) => v.slice(0, -1));
  }

  if (pinStep === 'success') {
    return (
      <div className="flex min-h-full flex-col bg-white">
        <header
          className="flex items-center gap-2 border-b px-3 py-3"
          style={{ borderColor: SBI.border }}
        >
          <button type="button" onClick={onBack} className="press -ml-1 p-1" aria-label="Back">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke={SBI.purple}
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="flex-1 text-[15px] font-bold" style={{ color: SBI.ink }}>
            Change PIN
          </h1>
        </header>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-1 flex-col items-center justify-center gap-5 px-8 pb-16"
        >
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: SBI.successBg }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-10 w-10"
              fill="none"
              stroke={SBI.success}
              strokeWidth="2.5"
            >
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-[18px] font-bold" style={{ color: SBI.ink }}>
              PIN Changed Successfully!
            </p>
            <p className="mt-2 text-[12px] text-slate-500">
              Your SBI credit card PIN has been updated. Use your new PIN for ATM and POS
              transactions.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="press mt-4 w-full max-w-xs rounded-xl py-3.5 text-[14px] font-bold text-white"
            style={{ backgroundColor: SBI.purple }}
          >
            Back to YONO Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-white">
      <header
        className="flex items-center gap-2 border-b px-3 py-3"
        style={{ borderColor: SBI.border }}
      >
        <button type="button" onClick={onBack} className="press -ml-1 p-1" aria-label="Back">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke={SBI.purple}
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="flex-1 text-[15px] font-bold" style={{ color: SBI.ink }}>
          Change Credit Card PIN
        </h1>
      </header>

      <div className="flex flex-1 flex-col px-4 pb-8 pt-5">
        <CardPreview />

        <AnimatePresence mode="wait">
          <motion.div
            key={pinStep}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className={`mt-8 flex flex-col items-center ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
          >
            <p className="text-[16px] font-bold" style={{ color: SBI.ink }}>
              {title}
            </p>
            <p className="mt-1 text-center text-[11px] text-slate-500">{subtitle}</p>
            <div className="mt-6">
              <PinDots value={entry} len={PIN_LEN} />
            </div>
            {error && (
              <p
                className="mt-3 text-center text-[11px] font-medium"
                style={{ color: SBI.alertText }}
              >
                {error}
              </p>
            )}
            {pinStep === 'current' && (
              <p className="mt-3 text-[10px] text-slate-400">Demo: use PIN 1234</p>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-auto pt-8">
          <PinKeypad value={entry} maxLen={PIN_LEN} onPress={handlePress} onBack={handleBack} />
        </div>
      </div>
    </div>
  );
}
