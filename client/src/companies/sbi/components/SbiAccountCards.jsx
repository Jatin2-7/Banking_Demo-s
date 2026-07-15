import React, { useState } from 'react';
import { SBI } from '../theme.js';

function AccountSlide({ children, gradient }) {
  return (
    <div className="w-full shrink-0 snap-center px-4">
      <div
        className="relative w-full overflow-hidden rounded-2xl px-4 py-4 text-white shadow-sm"
        style={{ background: gradient }}
      >
        <div
          className="pointer-events-none absolute -right-6 top-0 h-full w-24 opacity-20"
          style={{
            background: 'radial-gradient(circle at center, white 0%, transparent 70%)',
          }}
        />
        {children}
      </div>
    </div>
  );
}

export function SbiAccountCards() {
  const [balanceVisible, setBalanceVisible] = useState(false);

  return (
    <section className="pb-2">
      <div className="no-scrollbar flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth">
        <AccountSlide gradient={SBI.cardGrad}>
          <p className="text-[10px] font-semibold tracking-wide text-white/90">TRANSACTION ACCOUNTS (XX)</p>
          <p className="mt-2 text-[10px] text-white/75">Combined Balance</p>
          <div className="mt-0.5 flex items-center gap-2.5">
            <p className="text-[24px] font-bold leading-none tracking-tight">
              {balanceVisible ? '₹2,542.58' : '₹XXXX.xx'}
            </p>
            <button
              type="button"
              onClick={() => setBalanceVisible((v) => !v)}
              className="press rounded-full p-1 text-white/85 hover:bg-white/10"
              aria-label="Toggle balance"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                {balanceVisible ? (
                  <>
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                ) : (
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </>
                )}
              </svg>
            </button>
            <button type="button" className="press rounded-full p-1 text-white/85 hover:bg-white/10" aria-label="Refresh">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0020.49 15" />
              </svg>
            </button>
          </div>
          <div className="mt-4 flex justify-between border-t border-white/20 px-1 pt-3">
            <button type="button" className="press text-[11px] font-semibold underline underline-offset-2">
              View Accounts
            </button>
            <button type="button" className="press text-[11px] font-semibold underline underline-offset-2">
              Transactions
            </button>
          </div>
        </AccountSlide>

        <AccountSlide gradient={SBI.investGrad}>
          <p className="text-[10px] font-semibold tracking-wide text-white/90">INVESTMENTS</p>
          <p className="mt-4 text-[12px] font-medium leading-snug text-white/95">
            Ready to start investing?
          </p>
          <div className="mt-4 flex justify-center">
            <button type="button" className="press text-[11px] font-semibold underline underline-offset-2">
              Invest Now
            </button>
          </div>
        </AccountSlide>
      </div>

      <div className="mt-2 flex justify-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: SBI.purple }} />
        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
      </div>
    </section>
  );
}
