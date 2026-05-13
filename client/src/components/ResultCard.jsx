import React from 'react';
import { motion } from 'framer-motion';
import { STRINGS } from '../i18n/strings.js';

function Confetti() {
  const colors = ['#FF6B00', '#1A237E', '#00875A', '#C2185B', '#5E35B1'];
  const dots = Array.from({ length: 26 });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {dots.map((_, i) => (
        <span
          key={i}
          className="confetti-dot"
          style={{
            left: `${Math.random() * 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${Math.random() * 0.4}s`,
            animationDuration: `${1.4 + Math.random() * 1.2}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function ResultCard({ session, onDone, onRetry, lang }) {
  if (!session) return null;
  const L = STRINGS[lang] || STRINGS.en;

  if (session.state === 'DONE' && session.result?.success) {
    const r = session.result;
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative rounded-2xl bg-white/85 backdrop-blur-xl ring-1 ring-white/60 shadow-xl overflow-hidden"
      >
        <Confetti />
        <div className="px-5 pt-5 pb-4 flex flex-col items-center text-center relative z-10">
          <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl mb-2">
            ✓
          </div>
          <div className="text-[15px] font-bold text-ink">{L.paymentSuccess}</div>
          <div className="text-[12px] text-muted mt-1">{r.message}</div>
          {r.txnId && (
            <div className="mt-3 text-[10px] text-muted">
              Ref: <span className="font-mono">{r.txnId}</span>
            </div>
          )}
        </div>
        <div className="px-3 pb-3">
          <button
            onClick={onDone}
            className="press w-full py-2.5 rounded-xl bg-brand text-white text-[13px] font-semibold"
          >
            {L.done}
          </button>
        </div>
      </motion.div>
    );
  }

  if (session.state === 'FAILED') {
    const r = session.result || {};
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl bg-white/85 backdrop-blur-xl ring-1 ring-white/60 shadow-xl overflow-hidden"
      >
        <div className="px-5 pt-5 pb-4 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-rose-500 flex items-center justify-center text-white text-2xl mb-2">
            !
          </div>
          <div className="text-[15px] font-bold text-ink">{L.paymentFailed}</div>
          <div className="text-[12px] text-muted mt-1">{r.message}</div>
          {r.errorCode && (
            <div className="mt-2 text-[10px] text-rose-600 font-mono">{r.errorCode}</div>
          )}
        </div>
        <div className="px-3 pb-3 flex gap-2">
          <button
            onClick={onDone}
            className="press flex-1 py-2.5 rounded-xl bg-page border border-divider text-ink text-[13px] font-semibold"
          >
            {L.done}
          </button>
          {r.retryable && (
            <button
              onClick={onRetry}
              className="press flex-1 py-2.5 rounded-xl bg-brand text-white text-[13px] font-semibold"
            >
              {L.retry}
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  if (session.state === 'CANCELLED') {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl bg-white/85 backdrop-blur-xl ring-1 ring-white/60 shadow-xl"
      >
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center text-muted text-lg">
            ↩
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-ink">{L.sessionCancelled}</div>
          </div>
          <button
            onClick={onDone}
            className="press px-3 py-1.5 rounded-lg bg-brand text-white text-[12px] font-semibold"
          >
            {L.done}
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
}
