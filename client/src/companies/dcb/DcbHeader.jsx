import React from 'react';
import { DCB } from './theme.js';

/** Light-blue app header used across DCB journey screens */
export function DcbAppHeader({
  title,
  onBack,
  onHome,
  onLogout,
  showBack = true,
  variant = 'light',
  brandPill = false,
}) {
  const isNavy = variant === 'navy';
  const bg = isNavy ? 'bg-[#1A237E]' : 'bg-[#B3D4FC]';
  const fg = isNavy ? 'text-white' : 'text-[#1A237E]';

  return (
    <header className={`shrink-0 ${bg} px-3 pb-2.5 pt-1`}>
      <div className="flex items-center gap-2">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full press ${fg}`}
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

        <div className="min-w-0 flex-1 text-center">
          {brandPill ? (
            <span className="inline-block rounded-full bg-[#1A237E] px-4 py-1 text-[12px] font-bold tracking-wide text-white">
              DCB BANK
            </span>
          ) : (
            <h1 className={`truncate text-[16px] font-bold ${fg}`}>{title}</h1>
          )}
        </div>

        <div className={`flex shrink-0 items-center gap-0.5 ${fg}`}>
          <button
            type="button"
            onClick={onHome}
            className="flex h-9 w-9 items-center justify-center rounded-full press"
            aria-label="Home"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex h-9 w-9 items-center justify-center rounded-full press"
            aria-label="Logout"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2v10M8.5 5.5a7 7 0 107 0" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
      {brandPill && title ? (
        <p className={`mt-2 text-center text-[17px] font-bold ${fg}`}>{title}</p>
      ) : null}
    </header>
  );
}

/** Home-screen header: menu + DCB BANK pill + search/logout */
export function DcbHomeHeader({ onMenu, onSearch, onLogout }) {
  return (
    <header className="shrink-0 px-3 pb-2.5 pt-1" style={{ backgroundColor: DCB.accent }}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMenu}
          className="flex h-9 w-9 shrink-0 items-center justify-center press"
          style={{ color: DCB.navy }}
          aria-label="Menu"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex min-w-0 flex-1 justify-center">
          <span
            className="inline-block rounded-lg px-5 py-1.5 text-[13px] font-bold tracking-wide text-white shadow-sm"
            style={{ backgroundColor: DCB.navy }}
          >
            DCB BANK
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-0.5" style={{ color: DCB.navy }}>
          <button
            type="button"
            onClick={onSearch}
            className="flex h-9 w-9 items-center justify-center press"
            aria-label="Search"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="10" cy="10" r="6" />
              <path d="M15 15l5 5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex h-9 w-9 items-center justify-center press"
            aria-label="Logout"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2v10M8.5 5.5a7 7 0 107 0" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
