import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#FF6B00', '#1A237E', '#00875A', '#FFB800', '#E91E63'];

function Confetti() {
  const dots = useMemo(() => {
    return Array.from({ length: 22 }).map((_, i) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 0.4;
      const duration = 1.5 + Math.random();
      const color = COLORS[i % COLORS.length];
      return { left, delay, duration, color, key: i };
    });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((d) => (
        <span
          key={d.key}
          className="confetti-dot"
          style={{
            left: `${d.left}%`,
            background: d.color,
            animationDuration: `${d.duration}s`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12.5l4.5 4.5L19 7"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SuccessScreen({ data, onDone }) {
  if (!data) return null;
  const time = new Date(data.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -30, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 bg-page pt-11 px-5 pb-6 flex flex-col items-center"
      style={{ borderRadius: '44px' }}
    >
      <Confetti />
      <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14 }}
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: '#00875A' }}
        >
          <CheckIcon />
        </motion.div>
        <div className="text-[22px] font-bold text-ink mt-5">Payment Successful</div>
        <div className="text-[16px] text-muted mt-1">
          ₹{data.amount?.toLocaleString('en-IN')} to {data.contact?.name}
        </div>

        <div className="w-full mt-6 bg-white border border-divider rounded-2xl shadow-card divide-y divide-divider text-left">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-[12px] text-muted">UPI Ref</div>
            <div className="text-[13px] font-semibold text-ink">{data.txnId}</div>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-[12px] text-muted">To</div>
            <div className="text-[13px] text-ink">{data.account}</div>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-[12px] text-muted">Time</div>
            <div className="text-[13px] text-ink">Just now · {time}</div>
          </div>
        </div>
      </div>
      <button
        onClick={onDone}
        className="w-full h-12 rounded-xl bg-brand text-white text-[14px] font-semibold press shadow-card relative z-10"
      >
        Done
      </button>
    </motion.div>
  );
}
