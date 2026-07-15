import React from 'react';
import { EMT } from '../theme.js';

const CATEGORIES = [
  { id: 'activities', label: 'Activities', icon: '🎈' },
  { id: 'giftcard', label: 'Gift Card', icon: '🎁' },
  { id: 'visa', label: 'Visa', icon: '🛂' },
  { id: 'metro', label: 'Metro', icon: '🚇' },
  { id: 'emt_cards', label: 'EMT Card', icon: '💳' },
];

function CountryPill() {
  return (
    <button
      type="button"
      className="press flex shrink-0 items-center gap-1 rounded-full bg-white px-2 py-1"
      style={{ border: `1px solid ${EMT.pillBorder}` }}
    >
      <span className="text-sm leading-none">🇮🇳</span>
      <span className="text-[11px] font-medium text-black">India</span>
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
        <path d="M6 9l6 6 6-6" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export function VisaCategoryTabs({ active = 'visa' }) {
  return (
    <div className="flex gap-4 overflow-x-auto border-b border-emt-borderLight bg-white px-4 py-3">
      {CATEGORIES.map((cat) => {
        const isActive = cat.id === active;
        return (
          <div key={cat.id} className="flex shrink-0 flex-col items-center gap-1">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
              style={{
                backgroundColor: isActive ? '#E8F3FF' : 'transparent',
              }}
            >
              {cat.icon}
            </div>
            <span
              className="text-[9px] font-medium"
              style={{ color: isActive ? EMT.brandBlue : EMT.muted }}
            >
              {cat.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function VisaShell({ title = 'Visa', onBack, children, showTabs = true }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <header className="shrink-0 bg-white px-3 py-2.5">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onBack} className="press flex items-center gap-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[15px] font-semibold text-black">{title}</span>
          </button>
          <CountryPill />
        </div>
      </header>
      {showTabs && <VisaCategoryTabs />}
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

export function OrangeButton({ children, onClick, className = '', disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-full py-3.5 text-[14px] font-bold text-white press disabled:opacity-50 ${className}`}
      style={{ backgroundColor: '#EF6614' }}
    >
      {children}
    </button>
  );
}

export function PaymentLogos() {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-emt-border bg-white px-4 py-3"
    >
      <span className="text-[11px] font-medium text-emt-muted">We Accept:</span>
      <div className="flex flex-1 items-center justify-around gap-1">
        <span className="text-[9px] font-bold text-[#EB001B]">●●</span>
        <span className="rounded bg-[#006FCF] px-1 text-[8px] font-bold text-white">AMEX</span>
        <span className="text-[10px] font-bold italic text-[#1A1F71]">VISA</span>
        <span className="text-[8px] text-emt-muted">🏛️ Bank</span>
      </div>
    </div>
  );
}

export function EstimatedDateBanner({ dateLabel }) {
  return (
    <div
      className="flex items-center gap-2 rounded-t-xl px-4 py-3 text-white"
      style={{ backgroundColor: EMT.brandBlue }}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6L12 2z" />
        </svg>
      </div>
      <div>
        <p className="text-[10px] opacity-90">Estimated Date</p>
        <p className="text-[12px] font-bold">{dateLabel}</p>
      </div>
    </div>
  );
}

export function TravellerStepper({ count, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-emt-border bg-white px-4 py-3">
      <span className="text-[13px] font-medium text-emt-ink">Add Travellers</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, count - 1))}
          className="press flex h-7 w-7 items-center justify-center rounded-full border-2 font-bold"
          style={{ borderColor: EMT.brandBlue, color: EMT.brandBlue }}
        >
          −
        </button>
        <span className="min-w-[1rem] text-center text-[15px] font-bold">{count}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(9, count + 1))}
          className="press flex h-7 w-7 items-center justify-center rounded-full border-2 font-bold"
          style={{ borderColor: EMT.brandBlue, color: EMT.brandBlue }}
        >
          +
        </button>
      </div>
    </div>
  );
}
