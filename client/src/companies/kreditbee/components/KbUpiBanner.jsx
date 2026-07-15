import React from 'react';
import { KB } from '../theme.js';

export default function KbUpiBanner({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press mx-4 mb-3 flex w-[calc(100%-2rem)] items-center gap-3 rounded-2xl px-4 py-3.5 text-left shadow-sm"
      style={{
        background: 'linear-gradient(135deg, #FFF0F0 0%, #FFF5F5 50%, #FFF8F0 100%)',
      }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E85D3B" strokeWidth="1.8">
          <rect x="2" y="6" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
          <circle cx="17" cy="15" r="1.5" fill="#E85D3B" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-bold text-kb-ink">KreditBee UPI</span>
          <span className="rounded-md bg-[#FF6B35]/10 px-2 py-0.5 text-[11px] font-bold text-[#E85D3B]">
            ₹750 Cashback*
          </span>
        </div>
        <p className="mt-0.5 text-[12px] text-kb-muted">Faster and safer payments.</p>
      </div>
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: KB.yellow }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5">
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </button>
  );
}
