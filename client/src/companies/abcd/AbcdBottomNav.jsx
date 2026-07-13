import React from 'react';
import { getRotatedTabs } from './theme.js';

function TabIcon({ id, active }) {
  const stroke = active ? '#FFFFFF' : '#6B7280';
  const size = active ? 22 : 20;

  if (id === 'home') {
    return (
      <span
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1px',
          fontSize: '8px',
          fontWeight: 900,
          lineHeight: 1,
          color: active ? '#fff' : '#6B7280',
        }}
        aria-hidden
      >
        <span>a</span>
        <span>b</span>
        <span>c</span>
        <span>d</span>
      </span>
    );
  }
  if (id === 'myTrack') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
        <path d="M4 18V10M10 18V6M16 18v-8M20 18H3" strokeLinecap="round" />
        <path d="M14 8l4-3 3 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === 'loans') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v8M9.5 10.5c.6-1 1.5-1.5 2.5-1.5s2 .6 2 1.5-1 1.5-2.5 1.8S9.5 13 9.5 14s1.2 1.5 2.5 1.5 2-.5 2.5-1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === 'insure') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8">
        <path d="M12 3l8 4v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7l8-4z" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8">
      <rect x="4" y="8" width="16" height="10" rx="2" />
      <path d="M8 8V7a4 4 0 018 0v1M8 13h4" strokeLinecap="round" />
    </svg>
  );
}

export default function AbcdBottomNav({ active = 'home', onChange }) {
  const tabs = getRotatedTabs(active);

  return (
    <nav
      className="relative z-20 shrink-0"
      style={{ background: '#F7F0E8', paddingBottom: '6px' }}
      aria-label="ABCD navigation"
    >
      <svg
        className="absolute left-0 right-0 top-0 -translate-y-[calc(100%-1px)]"
        viewBox="0 0 390 28"
        preserveAspectRatio="none"
        style={{ height: '28px', width: '100%' }}
        aria-hidden
      >
        <path
          d="M0 28 C 70 4, 130 0, 195 0 C 260 0, 320 4, 390 28 Z"
          fill="#F7F0E8"
        />
      </svg>

      <div
        className="relative flex items-end justify-between px-2 pb-1 pt-2"
        style={{ minHeight: '72px' }}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === active;
          const isCenter = index === 2;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange?.(tab.id)}
              className="press relative flex flex-1 flex-col items-center gap-0.5"
              style={{ marginTop: isCenter ? '-12px' : '0' }}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.id === 'myTrack' && !isActive ? (
                <span
                  className="absolute text-[8px] font-bold text-white"
                  style={{ top: '-2px', right: '18%', background: '#C41E24', borderRadius: '4px', padding: '1px 4px' }}
                >
                  New
                </span>
              ) : null}
              <span
                className="flex items-center justify-center"
                style={
                  isActive
                    ? {
                        width: '48px',
                        height: '48px',
                        borderRadius: '9999px',
                        background: '#C41E24',
                        boxShadow: '0 4px 12px rgba(196,30,36,0.35)',
                        border: '2px solid #fff',
                      }
                    : { width: '36px', height: '36px' }
                }
              >
                <TabIcon id={tab.id} active={isActive} />
              </span>
              <span
                className="text-[10px] font-semibold"
                style={{ color: isActive ? '#C41E24' : '#6B7280' }}
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
