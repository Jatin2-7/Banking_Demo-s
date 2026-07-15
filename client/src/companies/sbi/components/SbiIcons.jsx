import React from 'react';

export function SbiIcon({ name, className = 'h-5 w-5' }) {
  const icons = {
    mobile: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M11 18h2" strokeLinecap="round" />
      </svg>
    ),
    upi: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="9" />
        <path d="M4 12h16M12 4v16" strokeLinecap="round" />
      </svg>
    ),
    bank: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 10h18M5 10v8M9 10v8M15 10v8M19 10v8M2 18h20M12 3l9 7H3l9-7z" />
      </svg>
    ),
    txn: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M9 5H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2h-4" />
        <path d="M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        <path d="M9 12h6M9 16h4" strokeLinecap="round" />
      </svg>
    ),
    mf: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 18l4-8 4 4 4-10 4 14" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    demat: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 9h10M7 13h6" strokeLinecap="round" />
      </svg>
    ),
    nps: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="8" r="4" />
        <path d="M6 20v-1a6 6 0 0112 0v1" />
      </svg>
    ),
    ppf: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 2v20M8 6h8M8 18h8" strokeLinecap="round" />
      </svg>
    ),
    fd: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 2v4M8 6h8M6 10h12v10H6z" />
      </svg>
    ),
    rd: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 4a8 8 0 108 8" />
      </svg>
    ),
    life: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="7" r="3" />
        <path d="M6 20v-1a6 6 0 0112 0v1" />
      </svg>
    ),
    health: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 21s-6-4.5-6-9a4 4 0 017-2 4 4 0 017 2c0 4.5-6 9-6 9z" />
        <path d="M12 8v5M9.5 10.5h5" strokeLinecap="round" />
      </svg>
    ),
    car: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M5 17h14l-1.5-5H6.5L5 17z" />
        <circle cx="8" cy="17" r="1.5" />
        <circle cx="16" cy="17" r="1.5" />
      </svg>
    ),
    home: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 10l9-7 9 7v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" />
      </svg>
    ),
    gold: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <ellipse cx="12" cy="14" rx="8" ry="4" />
        <path d="M4 14v2c0 2.2 3.6 4 8 4s8-1.8 8-4v-2" />
        <ellipse cx="12" cy="10" rx="6" ry="3" />
      </svg>
    ),
    personal: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="8" r="4" />
        <path d="M6 20v-1a6 6 0 0112 0v1" />
      </svg>
    ),
    edu: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3L2 8l10 5 10-5-10-5z" />
        <path d="M6 11v4c0 2 2.7 4 6 4s6-2 6-4v-4" />
      </svg>
    ),
    credit: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
    debit: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <circle cx="17" cy="15" r="1.5" fill="currentColor" />
      </svg>
    ),
    building: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 21h18M5 21V7l7-4 7 4v14" />
        <path d="M9 11h2M13 11h2M9 15h2M13 15h2" strokeLinecap="round" />
      </svg>
    ),
    tax: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      </svg>
    ),
    cheque: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="6" width="18" height="12" rx="1" />
        <path d="M7 10h10M7 14h6" strokeLinecap="round" />
      </svg>
    ),
    lock: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 018 0v3" />
      </svg>
    ),
  };
  return icons[name] || null;
}
