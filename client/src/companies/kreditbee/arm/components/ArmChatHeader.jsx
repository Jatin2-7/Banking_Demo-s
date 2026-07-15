import React from 'react';
import { KB } from '../../theme.js';

export default function ArmChatHeader({ onClose }) {
  return (
    <header className="shrink-0 border-b border-kb-border bg-white px-3 pb-2.5 pt-2">
      <div className="flex items-center justify-between gap-2">
        <button type="button" className="flex h-9 w-9 items-center justify-center text-kb-muted press" aria-label="Language">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </button>
        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-[15px] font-bold text-kb-ink">AI Relationship Manager</h1>
          <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-kb-muted">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-kb-success" />
            Secure session · KreditBee
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          <button type="button" className="flex h-9 w-9 items-center justify-center text-kb-muted press" aria-label="New">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center text-kb-muted press"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

export function AiAvatar() {
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-kb-ink"
      style={{ backgroundColor: KB.yellow }}
    >
      AI
    </div>
  );
}

export function ArmHelpBox({ text }) {
  if (!text) return null;
  return (
    <div className="mt-3 flex overflow-hidden rounded-lg border border-kb-border bg-white">
      <div className="w-1 shrink-0" style={{ backgroundColor: KB.yellow }} />
      <p className="px-3 py-2.5 text-[12px] leading-relaxed text-kb-ink/80">{text}</p>
    </div>
  );
}
