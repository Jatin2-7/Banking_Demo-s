import React from 'react';
import { INCRED } from '../theme.js';

const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'loans', label: 'My Loans', icon: 'loans' },
  { id: 'voice', label: '', icon: 'mic', center: true },
  { id: 'profile', label: 'Profile', icon: 'profile' },
];

function TabIcon({ type, active }) {
  const color = active ? INCRED.orange : INCRED.muted;
  if (type === 'home') {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={active ? INCRED.orange : 'none'}
        stroke={color}
        strokeWidth="1.8"
      >
        <path d="M3 11l9-7 9 7v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" />
      </svg>
    );
  }
  if (type === 'loans') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fill={color}
          fontSize="10"
          fontWeight="bold"
          stroke="none"
        >
          ₹
        </text>
      </svg>
    );
  }
  if (type === 'mic') {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
        <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 006 6.92V21h2v-3.08A7 7 0 0019 11h-2z" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.5 19c1.5-2.5 3.5-3.5 5.5-3.5s4 2 5.5 3.5" strokeLinecap="round" />
    </svg>
  );
}

export default function IncredBottomNav({ activeTab, onTabChange, onMicTap }) {
  return (
    <nav className="relative shrink-0 border-t border-incred-border bg-white px-2 pb-5 pt-2">
      <div className="flex items-end justify-around">
        {TABS.map((tab) => {
          if (tab.center) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={onMicTap}
                aria-label="Voice assistant"
                className="press -mt-6 flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full shadow-lg ring-4 ring-white"
                style={{ backgroundColor: INCRED.orange }}
              >
                <TabIcon type="mic" active={false} />
              </button>
            );
          }
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="flex min-w-[3.5rem] flex-col items-center gap-0.5 py-1 press"
            >
              <TabIcon type={tab.icon} active={active} />
              <span
                className="text-[11px] font-medium"
                style={{ color: active ? INCRED.orange : INCRED.muted }}
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
