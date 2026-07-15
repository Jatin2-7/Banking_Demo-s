import React from 'react';
import { SBI } from '../theme.js';

const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'loans', label: 'Loans', icon: 'loans' },
  { id: 'scan', label: 'Scan QR', icon: 'scan' },
  { id: 'insurance', label: 'Insurance', icon: 'insurance' },
  { id: 'investments', label: 'Investments', icon: 'investments' },
];

function NavIcon({ type, active }) {
  const color = active ? SBI.purple : SBI.muted;
  if (type === 'scan') {
    return (
      <div
        className="flex h-[3.25rem] w-[3.25rem] -mt-5 items-center justify-center rounded-2xl shadow-lg"
        style={{ backgroundColor: SBI.purple }}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h2v2h-2zM18 14h3v3h-3zM14 18h2v3h-2zM18 21h3v-3h-3z" fill="currentColor" stroke="none" />
        </svg>
      </div>
    );
  }
  const paths = {
    home: <path d="M3 10l9-7 9 7v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" />,
    loans: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M8 20v-1a4 4 0 018 0v1" />
      </>
    ),
    insurance: <path d="M12 3l8 4v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7l8-4z" />,
    investments: (
      <>
        <path d="M12 20V10" />
        <path d="M8 14l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 20h12" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" className="h-[1.35rem] w-[1.35rem]" fill="none" stroke={color} strokeWidth="1.8">
      {paths[type]}
    </svg>
  );
}

export function SbiBottomNav({ active = 'home', onChange }) {
  return (
    <nav
      className="shrink-0 border-t bg-white px-1 pb-1.5 pt-1.5"
      style={{ borderColor: SBI.border, minHeight: '3.75rem' }}
    >
      <div className="flex items-end justify-around">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          const isScan = tab.id === 'scan';
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange?.(tab.id)}
              className={`press flex min-w-0 flex-1 flex-col items-center ${isScan ? 'px-0' : 'gap-0.5 py-0.5'}`}
            >
              <NavIcon type={tab.icon} active={isScan || isActive} />
              <span
                className={`text-[9px] font-semibold leading-none ${isScan ? 'mt-1' : ''}`}
                style={{ color: isScan || isActive ? SBI.purple : SBI.muted }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
