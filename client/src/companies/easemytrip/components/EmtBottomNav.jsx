import React from 'react';
import { EMT } from '../theme.js';

const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'bookings', label: 'Bookings', icon: 'bookings' },
  { id: 'voice', label: 'Voice Search', icon: 'mic', center: true },
  { id: 'wallet', label: 'Wallet', icon: 'wallet' },
  { id: 'profile', label: 'Profile', icon: 'profile' },
];

function TabIcon({ type, active }) {
  const color = active ? EMT.blue : EMT.muted;
  const props = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8 };

  switch (type) {
    case 'home':
      return (
        <svg {...props} fill={active ? EMT.blue : 'none'}>
          <path d="M3 11l9-7 9 7v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" />
        </svg>
      );
    case 'bookings':
      return (
        <svg {...props}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 2v4M16 2v4M4 10h16" strokeLinecap="round" />
        </svg>
      );
    case 'wallet':
      return (
        <svg {...props}>
          <rect x="2" y="6" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
          <circle cx="17" cy="14" r="1.5" fill={color} stroke="none" />
        </svg>
      );
    case 'profile':
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="4" />
          <path d="M6 20v-1a6 6 0 0112 0v1" />
        </svg>
      );
    default:
      return null;
  }
}

export default function EmtBottomNav({ activeTab, onTabChange, onMicTap }) {
  return (
    <nav className="relative shrink-0 border-t border-emt-border bg-white px-2 pb-5 pt-2">
      <div className="flex items-end justify-around">
        {TABS.map((tab) => {
          if (tab.center) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={onMicTap}
                aria-label="Voice Search"
                className="press -mt-7 flex flex-col items-center"
              >
                <div
                  className="flex h-[3.5rem] w-[3.5rem] items-center justify-center rounded-full shadow-lg ring-4 ring-white"
                  style={{ backgroundColor: EMT.brandBlue }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 006 6.92V21h2v-3.08A7 7 0 0019 11h-2z" />
                  </svg>
                </div>
                <span className="mt-1 text-[9px] font-semibold" style={{ color: EMT.blue }}>
                  Voice Search
                </span>
              </button>
            );
          }

          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="flex min-w-[3rem] flex-col items-center gap-0.5 py-1 press"
            >
              <TabIcon type={tab.icon} active={active} />
              <span
                className="text-[10px] font-semibold"
                style={{ color: active ? EMT.blue : EMT.muted }}
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
