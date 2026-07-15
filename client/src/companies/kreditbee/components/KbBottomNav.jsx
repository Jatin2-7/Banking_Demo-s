import React from 'react';
import { KB } from '../theme.js';

const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'documents', label: 'Documents', icon: 'documents' },
  { id: 'voice', label: '', icon: 'mic', center: true },
  { id: 'explore', label: 'Explore', icon: 'explore' },
  { id: 'sdk', label: 'SDK', icon: 'sdk' },
];

function TabIcon({ type, active }) {
  const color = active ? KB.yellow : '#9CA3AF';
  const stroke = active ? KB.yellowDark : '#9CA3AF';
  const props = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: 1.8,
  };

  switch (type) {
    case 'home':
      return (
        <svg {...props} fill={active ? KB.yellow : 'none'}>
          <path d="M3 11l9-7 9 7v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" />
        </svg>
      );
    case 'documents':
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
          <path d="M14 2v6h6M8 13h8M8 17h8" strokeLinecap="round" />
        </svg>
      );
    case 'explore':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case 'sdk':
      return (
        <svg {...props}>
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function KbBottomNav({ activeTab, onTabChange, onMicTap }) {
  return (
    <nav className="relative shrink-0 border-t border-kb-border bg-white px-2 pb-5 pt-2">
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
                style={{ backgroundColor: KB.yellow }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#1A1A1A">
                  <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 006 6.92V21h2v-3.08A7 7 0 0019 11h-2z" />
                </svg>
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
                className={`text-[10px] font-semibold ${active ? 'text-kb-ink' : 'text-kb-muted'}`}
                style={active ? { color: KB.yellowDark } : undefined}
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
