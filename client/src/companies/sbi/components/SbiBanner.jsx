import React from 'react';
import { SBI } from '../theme.js';

export function SbiGradientBanner({ title, subtitle, cta, variant = 'purple', onClick }) {
  const bg =
    variant === 'credit'
      ? 'linear-gradient(135deg, #7B2D8E 0%, #9C27B0 50%, #E91E63 100%)'
      : variant === 'savings'
        ? 'linear-gradient(135deg, #6A1B9A 0%, #8E24AA 100%)'
        : variant === 'ipo'
          ? 'linear-gradient(135deg, #FAFAFA 0%, #FFFFFF 100%)'
          : SBI.bannerGrad;

  const isLight = variant === 'ipo';

  return (
    <button
      type="button"
      onClick={onClick}
      className="press mx-4 mt-3 overflow-hidden rounded-2xl text-left shadow-sm"
      style={{ background: bg }}
    >
      <div
        className={`flex items-center justify-between px-4 py-3.5 ${isLight ? 'text-slate-800' : 'text-white'}`}
      >
        <div className="min-w-0 flex-1 pr-3">
          <p className={`text-[13px] font-bold leading-snug ${isLight ? 'text-slate-900' : ''}`}>
            {title}
            {!isLight && <span className="ml-1 opacity-80">&#8250;</span>}
          </p>
          {subtitle && (
            <p
              className={`mt-0.5 text-[10px] leading-snug ${isLight ? 'text-slate-600' : 'opacity-90'}`}
            >
              {subtitle}
            </p>
          )}
          {cta && (
            <span
              className="mt-2 inline-block rounded-full px-3 py-1 text-[10px] font-bold"
              style={{
                backgroundColor: isLight ? '#D32F2F' : 'rgba(255,255,255,0.2)',
                color: '#fff',
              }}
            >
              {cta}
            </span>
          )}
        </div>
        {variant === 'credit' && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
            <svg viewBox="0 0 40 24" className="h-7 w-7" fill="none">
              <path d="M4 20 A16 16 0 0 1 36 20" stroke="white" strokeWidth="2" />
              <line x1="20" y1="20" x2="28" y2="8" stroke="white" strokeWidth="2" />
            </svg>
          </div>
        )}
        {variant === 'pfm' && <div className="shrink-0 text-2xl">📊</div>}
        {variant === 'savings' && <div className="shrink-0 text-2xl">📱</div>}
        {variant === 'ipo' && (
          <div className="shrink-0 text-right">
            <div className="text-[8px] font-bold text-red-600">SBI SECURITIES</div>
            <div className="mt-1 text-2xl">🏆</div>
          </div>
        )}
      </div>
    </button>
  );
}

export function SbiMainTabs({ active = 'banking', onChange }) {
  const tabs = ['Banking', 'Lifestyle', 'Rewards'];
  return (
    <div className="flex border-b bg-white px-2" style={{ borderColor: SBI.border }}>
      {tabs.map((tab) => {
        const id = tab.toLowerCase();
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange?.(id)}
            className="press relative flex-1 pb-2.5 pt-2 text-center text-[13px] font-semibold"
            style={{ color: isActive ? SBI.purple : SBI.muted }}
          >
            {tab}
            {isActive && (
              <span
                className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full"
                style={{ backgroundColor: SBI.purple }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
