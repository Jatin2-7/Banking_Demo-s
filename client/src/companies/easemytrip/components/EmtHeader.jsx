import React from 'react';
import { EMT } from '../theme.js';

/** EaseMyTrip paper-plane logo mark */
function EmtPlaneIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M3.5 16.2L28.5 5.5L17.8 27.2L13.8 16.8L3.5 16.2Z" fill={EMT.brandBlue} />
      <path d="M13.8 16.8L17.8 27.2L15.2 19.8L13.8 16.8Z" fill={EMT.brandBlueDark} opacity="0.55" />
    </svg>
  );
}

/** Centered EaseMyTrip wordmark + tagline */
export function EmtLogo({ compact = false }) {
  return (
    <div className="flex items-center gap-[5px]">
      <EmtPlaneIcon size={compact ? 22 : 26} />
      <div className="flex flex-col items-center leading-none">
        <span
          className="font-bold tracking-[-0.02em]"
          style={{
            color: EMT.brandBlue,
            fontSize: compact ? '14px' : '17px',
            lineHeight: 1.1,
          }}
        >
          EaseMyTrip
        </span>
        {!compact && (
          <span
            className="mt-[3px] whitespace-nowrap font-medium"
            style={{
              color: EMT.taglineOrange,
              fontSize: '7.5px',
              letterSpacing: '0.01em',
              lineHeight: 1,
            }}
          >
            — Bharat ka Travel App —
          </span>
        )}
      </div>
    </div>
  );
}

function CountryPill() {
  return (
    <button
      type="button"
      className="press flex shrink-0 items-center gap-[3px] rounded-full bg-white px-[10px] py-[5px]"
      style={{ border: `1px solid ${EMT.pillBorder}` }}
      aria-label="Select country"
    >
      <span className="text-[11px] font-bold leading-none text-black">IN</span>
      <span className="text-[11px] font-normal leading-none text-black">India</span>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function EmtHomeHeader({ onMenu }) {
  return (
    <header className="shrink-0 bg-white">
      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center px-3.5 py-[10px]">
        <button
          type="button"
          onClick={onMenu}
          className="press w-8 justify-self-start p-0.5"
          aria-label="Menu"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#000"
            strokeWidth="2.2"
          >
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>

        <div className="justify-self-center">
          <EmtLogo />
        </div>

        <div className="justify-self-end pr-0.5">
          <CountryPill />
        </div>
      </div>
    </header>
  );
}

export function EmtForexHeader({ title = 'Forex Cash & Cards', onBack }) {
  return (
    <header className="shrink-0 px-3 py-3 text-white" style={{ backgroundColor: EMT.blueHeader }}>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} className="press p-1" aria-label="Back">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
          >
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-[15px] font-semibold">{title}</h1>
      </div>
    </header>
  );
}

export function EmtPartnerLogos() {
  return (
    <div className="flex items-center justify-between bg-white px-4 py-2">
      <EmtLogo compact />
      <div className="text-right">
        <span className="text-[13px] font-bold text-emt-ink">GlobalPay</span>
        <span className="ml-1 text-[10px] font-medium text-emt-muted">wsfx</span>
      </div>
    </div>
  );
}
