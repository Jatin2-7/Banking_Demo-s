import React from 'react';
import { KB } from '../theme.js';

const STEPS = [
  { id: 'eligibility', label: 'Eligibility', status: 'done' },
  { id: 'kyc', label: 'KYC', status: 'active' },
  { id: 'profile', label: 'Profile', status: 'pending' },
  { id: 'reference', label: 'Reference', status: 'pending' },
];

export default function KbProgressCard({ progress = 25 }) {
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="mx-4 mb-3 flex items-center gap-4 rounded-2xl bg-white px-4 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="relative h-[72px] w-[72px] shrink-0">
        <svg className="-rotate-90" width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="28" fill="none" stroke="#F3F4F6" strokeWidth="6" />
          <circle
            cx="36"
            cy="36"
            r="28"
            fill="none"
            stroke={KB.yellow}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[18px] font-bold leading-none text-kb-ink">{progress}%</span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          {STEPS.map((step, i) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    step.status === 'done'
                      ? 'bg-emerald-500 text-white'
                      : step.status === 'active'
                        ? 'ring-2 ring-kb-yellow ring-offset-1'
                        : 'bg-gray-200'
                  }`}
                  style={step.status === 'active' ? { backgroundColor: KB.yellow } : undefined}
                >
                  {step.status === 'done' ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : step.status === 'active' ? (
                    <span className="h-2 w-2 rounded-full bg-kb-ink" />
                  ) : null}
                </div>
                <span
                  className={`text-[9px] font-semibold ${
                    step.status === 'active' ? 'text-kb-ink' : 'text-kb-muted'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-0.5 mb-4 h-0.5 flex-1 ${
                    step.status === 'done' ? 'bg-emerald-400' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
