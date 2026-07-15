import React from 'react';
import { SBI } from '../theme.js';

export function SbiHeader({ userName = 'Jatin', initials = 'JB' }) {
  return (
    <header className="shrink-0 bg-white px-4 pb-1 pt-2">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
          style={{ backgroundColor: SBI.magenta }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] leading-snug text-slate-600">
            Hello <span className="font-bold text-slate-800">{userName}</span>,
          </p>
          <p className="text-[12px] font-semibold text-slate-800">Let&apos;s get started!</p>
        </div>
        <div className="flex shrink-0 items-center gap-3.5" style={{ color: SBI.purple }}>
          <button type="button" className="press" aria-label="Search">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" strokeLinecap="round" />
            </svg>
          </button>
          <button type="button" className="press" aria-label="Notifications">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
              <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" />
            </svg>
          </button>
          <button type="button" className="press" aria-label="Logout">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
