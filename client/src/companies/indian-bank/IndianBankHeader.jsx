import React from 'react';
import { INDIAN_BANK } from './theme.js';

/** Journey-screen header — purple bar with gold accents */
export function IndianBankAppHeader({
  title,
  onBack,
  onHome,
  onLogout,
  showBack = true,
}) {
  return (
    <header className="shrink-0 px-3 pb-2.5 pt-1" style={{ backgroundColor: INDIAN_BANK.purple }}>
      <div className="flex items-center gap-2">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white press"
            aria-label="Back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <span className="w-9" />
        )}

        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-[15px] font-bold text-white">{title}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 text-white">
          <button type="button" onClick={onHome} className="flex h-9 w-9 items-center justify-center rounded-full press" aria-label="Home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </button>
          <button type="button" onClick={onLogout} className="flex h-9 w-9 items-center justify-center rounded-full press" aria-label="Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v10M8.5 5.5a7 7 0 107 0" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
