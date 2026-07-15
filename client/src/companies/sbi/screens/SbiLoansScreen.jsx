import React from 'react';
import { SBI } from '../theme.js';
import { SbiIcon } from '../components/SbiIcons.jsx';

const LOAN_PRODUCTS = [
  { id: 'mutual-fund', label: 'Loan against Mutual Fund', icon: <SbiIcon name="mf" /> },
  { id: 'personal', label: 'Personal Loan', icon: <SbiIcon name="personal" /> },
  { id: 'car', label: 'Car Loan', icon: <SbiIcon name="car" /> },
  { id: 'home', label: 'Home Loan', icon: <SbiIcon name="home" /> },
  { id: 'education', label: 'Education Loan', icon: <SbiIcon name="edu" /> },
  { id: 'gold', label: 'Gold Loan', icon: <SbiIcon name="gold" /> },
  { id: 'overdraft', label: 'Overdraft against Deposit', icon: <SbiIcon name="lock" /> },
];

export default function SbiLoansScreen({ onBack, onSelectLoan }) {
  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: SBI.page }}>
      <header className="flex items-center gap-2 bg-white px-3 py-3 shadow-sm">
        {onBack && (
          <button type="button" onClick={onBack} className="press" aria-label="Back">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke={SBI.purple}
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <h1 className="flex-1 text-[16px] font-bold" style={{ color: SBI.ink }}>
          Loans
        </h1>
        <button type="button" className="press" aria-label="Support" style={{ color: SBI.purple }}>
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M3 11a9 9 0 1018 0" />
            <path d="M12 16v2M9 20h6" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-3 pb-6 pt-4">
        <h2 className="text-[14px] font-bold" style={{ color: SBI.ink }}>
          Apply for a New Loan
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {LOAN_PRODUCTS.map((loan) => (
            <button
              key={loan.id}
              type="button"
              onClick={() => onSelectLoan?.(loan.id)}
              className="press flex items-center gap-2 rounded-lg border bg-white px-2.5 py-3 text-left shadow-sm"
              style={{ borderColor: SBI.border, color: SBI.purple }}
            >
              <div className="shrink-0">{loan.icon}</div>
              <span className="text-[10px] font-semibold leading-tight">{loan.label}</span>
            </button>
          ))}
        </div>

        <div
          className="mt-4 flex items-center justify-between overflow-hidden rounded-xl px-4 py-3.5 text-white"
          style={{ background: SBI.bannerGrad }}
        >
          <p className="text-[13px] font-bold">
            Check your Credit Score <span className="opacity-80">&#8250;</span>
          </p>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <svg viewBox="0 0 40 24" className="h-7 w-7" fill="none">
              <path d="M4 20 A16 16 0 0 1 36 20" stroke="white" strokeWidth="2" />
              <line x1="20" y1="20" x2="30" y2="6" stroke="white" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
