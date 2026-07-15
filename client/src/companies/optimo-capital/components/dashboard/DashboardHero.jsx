import React from 'react';
import { OPTIMO, FONTS } from '../../theme.js';

const BENEFITS = [
  { icon: '🛡️', color: '#22C55E', label: 'No Hidden Charges' },
  { icon: '💰', color: '#EAB308', label: '4-day loan disbursal*' },
  { icon: '📄', color: '#F97316', label: 'Minimal Documentation' },
  { icon: '🚫', color: '#EF4444', label: 'No foreclosure charges after 1.5 years' },
  { icon: '⏱️', color: '#3B82F6', label: 'In-principle sanction within 2 hours*' },
  { icon: '₹', color: '#8B5CF6', label: 'Up to ₹2 Cr' },
];

export default function DashboardHero({ onApplyLoan }) {
  return (
    <section className="relative overflow-hidden rounded-[20px] bg-[#1A2332] shadow-[0_8px_32px_rgba(15,23,42,0.12)]">
      <div className="grid min-h-[320px] lg:grid-cols-[1.1fr_0.9fr] lg:min-h-[380px]">
        <div className="relative z-10 flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12">
          <p
            className="leading-tight"
            style={{
              fontFamily: FONTS.display,
              fontSize: 28,
              fontWeight: 700,
              color: OPTIMO.orangeLight,
            }}
          >
            Loan Against Property
          </p>
          <h1
            className="mt-1 leading-tight"
            style={{ fontFamily: FONTS.display, fontSize: 32, fontWeight: 700, color: '#FFFFFF' }}
          >
            for MSME Business Needs
          </h1>

          <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
            {BENEFITS.map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-2.5 rounded-full bg-white/95 px-4 py-2"
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 12,
                  fontWeight: 500,
                  color: OPTIMO.navy,
                }}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] text-white"
                  style={{ backgroundColor: b.color }}
                >
                  {b.icon}
                </span>
                <span className="leading-snug">{b.label}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onApplyLoan}
            className="mt-8 w-fit rounded-full px-8 py-3 text-[15px] font-bold text-white shadow-lg transition hover:brightness-105"
            style={{ backgroundColor: OPTIMO.orange, fontFamily: FONTS.display }}
          >
            Apply for Loan →
          </button>
        </div>

        <div
          className="relative hidden min-h-[280px] lg:block"
          style={{
            background:
              'linear-gradient(135deg, rgba(241,90,41,0.15) 0%, rgba(26,35,50,0.9) 60%), url(https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80) center/cover no-repeat',
          }}
        />
      </div>
    </section>
  );
}
