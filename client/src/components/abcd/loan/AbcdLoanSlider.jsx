import React from 'react';

export default function AbcdLoanSlider({ min, max, step, value, onChange, marks = [] }) {
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;

  return (
    <div className="mt-2">
      <div className="relative h-2 rounded-full bg-[#B3E5FC]">
        <div
          className="absolute left-0 top-0 h-2 rounded-full bg-[#FF9800]"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-2 w-full cursor-pointer opacity-0"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />
        <div
          className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-[3px] border-white bg-[#C41E24] shadow"
          style={{ left: `calc(${pct}% - 10px)` }}
        />
      </div>
      {marks.length > 0 && (
        <div className="mt-2 flex justify-between text-[9px] text-[#9CA3AF]">
          {marks.map((m) => (
            <span
              key={m.value}
              className={value === m.value ? 'font-bold text-[#1A1A1A]' : ''}
            >
              {m.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function AbcdDonutChart({ principal, interest }) {
  const total = principal + interest;
  const pPct = total ? (principal / total) * 100 : 50;
  const circumference = 2 * Math.PI * 42;
  const pLen = (pPct / 100) * circumference;
  const iLen = circumference - pLen;

  return (
    <svg width="120" height="120" viewBox="0 0 100 100" className="mx-auto">
      <circle cx="50" cy="50" r="42" fill="none" stroke="#E5E7EB" strokeWidth="12" />
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="#FFC107"
        strokeWidth="12"
        strokeDasharray={`${pLen} ${circumference}`}
        strokeDashoffset={circumference * 0.25}
        transform="rotate(-90 50 50)"
      />
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="#4CAF50"
        strokeWidth="12"
        strokeDasharray={`${iLen} ${circumference}`}
        strokeDashoffset={circumference * 0.25 - pLen}
        transform="rotate(-90 50 50)"
      />
    </svg>
  );
}
