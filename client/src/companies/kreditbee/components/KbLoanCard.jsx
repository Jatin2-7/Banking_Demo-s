import React from 'react';
import { KB } from '../theme.js';

function LoanIcon({ type }) {
  const props = { width: 28, height: 28, viewBox: '0 0 24 24', fill: 'none', stroke: '#1A1A1A', strokeWidth: 1.6 };
  switch (type) {
    case 'coin':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v8M9 10h6M9 14h6" strokeLinecap="round" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...props}>
          <rect x="3" y="7" width="18" height="12" rx="2" />
          <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      );
    case 'bike':
      return (
        <svg {...props}>
          <circle cx="6" cy="17" r="3" />
          <circle cx="18" cy="17" r="3" />
          <path d="M6 17l4-8h4l2 4 2-4h2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'home':
      return (
        <svg {...props}>
          <path d="M3 11l9-7 9 7v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" />
          <path d="M10 21V12h4v9" />
        </svg>
      );
    default:
      return null;
  }
}

function TagIcon({ tag }) {
  if (tag.includes('Instant')) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="#F5A623">
        <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
      </svg>
    );
  }
  if (tag.includes('Business')) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#66BB6A" strokeWidth="2">
        <rect x="3" y="7" width="18" height="12" rx="1" />
        <path d="M8 7V5h8v2" />
      </svg>
    );
  }
  if (tag.includes('Low')) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#AB47BC" strokeWidth="2">
        <circle cx="6" cy="17" r="2" />
        <circle cx="18" cy="17" r="2" />
        <path d="M6 17h4l2-6h4" />
      </svg>
    );
  }
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#26A69A" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 2v4M16 2v4" />
    </svg>
  );
}

export default function KbLoanCard({ product, onAction }) {
  const isContinue = product.inProgress;

  return (
    <div className="mx-4 mb-3 overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ backgroundColor: product.accent, borderBottom: `1px solid ${product.accentBorder}` }}
      >
        <span className="text-[14px] font-bold text-kb-ink">{product.title}</span>
        <span className="flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-kb-ink/70">
          <TagIcon tag={product.tag} />
          {product.tag}
        </span>
      </div>

      <div className="flex items-center gap-3 px-4 py-3.5">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: product.accent }}
        >
          <LoanIcon type={product.icon} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[13px] font-bold text-kb-ink ${product.id !== 'lap' ? 'uppercase tracking-wide' : ''}`}>
            {product.amount}
          </p>
          {product.tenure && (
            <p className="mt-0.5 text-[12px] text-kb-muted">{product.tenure}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onAction(product.id)}
          className={`shrink-0 rounded-full px-5 py-2 text-[13px] font-bold press ${
            isContinue
              ? 'text-kb-ink shadow-sm'
              : 'border-2 bg-white text-kb-ink'
          }`}
          style={
            isContinue
              ? { backgroundColor: KB.yellow }
              : { borderColor: KB.yellow, color: KB.yellowDark }
          }
        >
          {isContinue ? 'Continue' : 'Apply now'}
        </button>
      </div>
    </div>
  );
}
