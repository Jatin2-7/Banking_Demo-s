import React from 'react';
import { ABCD_PILLS } from './theme.js';

function YellowShareBtn({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#F5C518] press"
      aria-label="Share"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 17L17 7M10 7h7v7"
          stroke="#C41E24"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function AbcdMascot() {
  return (
    <div
      className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#8B1519] ring-2 ring-white/25"
      aria-hidden
    >
      <svg viewBox="0 0 36 36" width="36" height="36">
        <circle cx="18" cy="18" r="18" fill="#A0181E" />
        <rect x="8" y="10" width="20" height="14" rx="3" fill="#fff" />
        <text x="18" y="20" textAnchor="middle" fontSize="7" fontWeight="800" fill="#C41E24">
          abcd
        </text>
        <circle cx="13" cy="28" r="2" fill="#F5C518" />
        <circle cx="23" cy="28" r="2" fill="#F5C518" />
      </svg>
    </div>
  );
}

function PillIcon({ kind }) {
  if (kind === 'funding') {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF3E0] text-[14px]">
        🪙
      </span>
    );
  }
  if (kind === 'coins') {
    return (
      <span className="flex -space-x-1">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFE082] text-[11px] ring-1 ring-white">
          🪙
        </span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFD54F] text-[11px] ring-1 ring-white">
          🪙
        </span>
      </span>
    );
  }
  if (kind === 'umbrella') {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E3F2FD] text-[13px]">
        ☂️
      </span>
    );
  }
  if (kind === 'invest') {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8F5E9] text-[13px]">
        💼
      </span>
    );
  }
  // pay
  return (
    <span className="flex -space-x-1.5">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFECB3] text-[10px] ring-1 ring-white">
        🧾
      </span>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C8E6C9] text-[10px] ring-1 ring-white">
        🎟️
      </span>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#BBDEFB] text-[10px] ring-1 ring-white">
        📱
      </span>
    </span>
  );
}

/** Red header used on all ABCD tab screens */
export function AbcdHomeHeader({
  tab = 'home',
  pillLabel,
  onPillClick,
  onShare,
  onNotify,
  onProfile,
  initials = 'JA',
}) {
  const pill = ABCD_PILLS[tab] || ABCD_PILLS.home;
  const label = pillLabel || pill.label;

  return (
    <header className="shrink-0 bg-[#C41E24] px-3 pb-4 pt-1">
      <div className="flex items-center justify-between">
        <YellowShareBtn onClick={onShare} />
        <div className="flex items-center gap-2">
          <AbcdMascot />
          <button
            type="button"
            onClick={onNotify}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/35 text-white press"
            aria-label="Notifications"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9a6 6 0 0112 0c0 7 3 7 3 7H3s3 0 3-7" strokeLinecap="round" />
              <path d="M10 20a2 2 0 004 0" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onProfile}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[12px] font-bold text-[#C41E24] press"
            aria-label="Profile"
          >
            {initials}
          </button>
        </div>
      </div>

      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={onPillClick}
          className="flex max-w-[92%] items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 shadow-sm press"
        >
          <PillIcon kind={pill.icon} />
          <span className="truncate text-[13px] font-semibold text-[#1A1A1A]">{label}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6B7280"
            strokeWidth="2.2"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </header>
  );
}

/** Journey-screen header (deposit, txn history, etc.) */
export function AbcdAppHeader({ title, onBack, onHome, showBack = true }) {
  return (
    <header className="shrink-0 bg-[#C41E24] px-3 pb-2.5 pt-1">
      <div className="flex items-center gap-2">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white press"
            aria-label="Back"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <span className="w-9" />
        )}
        <h1 className="min-w-0 flex-1 truncate text-center text-[16px] font-bold text-white">
          {title}
        </h1>
        <button
          type="button"
          onClick={onHome}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white press"
          aria-label="Home"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
