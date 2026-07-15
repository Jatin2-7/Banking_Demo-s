import React from 'react';
import { KB } from '../theme.js';

function IconButton({ children, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full press"
      style={{ backgroundColor: KB.yellow }}
    >
      {children}
    </button>
  );
}

export default function KbHeader() {
  return (
    <header className="flex shrink-0 items-center justify-between bg-white px-4 pb-3 pt-3">
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-black text-kb-ink"
          style={{ backgroundColor: KB.yellow }}
        >
          B
        </div>
        <span className="text-[20px] font-bold tracking-tight text-kb-ink">KreditBee</span>
      </div>
      <div className="flex items-center gap-2">
        <IconButton label="Scan QR">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M14 14h3v3M17 17h4v4M14 20h3" strokeLinecap="round" />
          </svg>
        </IconButton>
        <IconButton label="Profile">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth="2"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
          </svg>
        </IconButton>
        <IconButton label="Help">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9a2.5 2.5 0 015 0c0 2-2.5 1.5-2.5 4" strokeLinecap="round" />
            <circle cx="12" cy="17" r="0.5" fill="#1A1A1A" />
          </svg>
        </IconButton>
      </div>
    </header>
  );
}
