import React from 'react';
import { useCompanyOptional } from '../context/CompanyContext.jsx';

function StatusBar() {
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex h-11 items-center justify-between px-7 text-[13px] font-semibold text-white">
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
          <rect x="0" y="6" width="3" height="4" rx="0.5" fill="white" />
          <rect x="4" y="4" width="3" height="6" rx="0.5" fill="white" />
          <rect x="8" y="2" width="3" height="8" rx="0.5" fill="white" />
          <rect x="12" y="0" width="3" height="10" rx="0.5" fill="white" />
        </svg>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
          <path
            d="M7 9.5a1 1 0 100-2 1 1 0 000 2zM3.2 6.4a5.5 5.5 0 017.6 0l1-1a7 7 0 00-9.6 0l1 1zM.4 3.6a9.5 9.5 0 0113.2 0l1-1a11 11 0 00-15.2 0l1 1z"
            fill="white"
          />
        </svg>
        <div className="ml-1 flex items-center">
          <div className="relative h-3 w-6 rounded-[3px] border border-white/70">
            <div className="absolute inset-[2px] right-[6px] rounded-[1px] bg-white/90" />
          </div>
          <div className="ml-[1px] h-1.5 w-[2px] rounded-r bg-white/70" />
        </div>
      </div>
    </div>
  );
}

export default function PhoneFrame({ children, overlay }) {
  const company = useCompanyOptional();
  const primary = company?.theme?.primary ?? '#C41E24';
  const phoneShadow =
    company?.theme?.phoneShadow ??
    '0 30px 60px rgba(120, 20, 24, 0.28), inset 0 0 0 1.5px rgba(255,255,255,0.06)';

  return (
    <div className="flex min-h-full w-full items-center justify-center py-6">
      <div
        className="relative bg-[#1A1A1A]"
        style={{
          width: '406px',
          height: '860px',
          borderRadius: '52px',
          padding: '8px',
          boxShadow: phoneShadow,
        }}
      >
        <div
          className="relative flex h-full w-full flex-col overflow-hidden"
          style={{
            width: '390px',
            height: '844px',
            borderRadius: '44px',
            backgroundColor: primary,
          }}
        >
          <StatusBar />
          <div
            className="absolute left-1/2 top-2 z-40 -translate-x-1/2 bg-black"
            style={{ width: '120px', height: '28px', borderRadius: '14px' }}
          />
          {/* App shell — no outer scroll; screens manage their own scroll areas */}
          <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden pt-11">
            {children}
          </div>
          <div
            className="absolute bottom-2 left-1/2 z-40 -translate-x-1/2 bg-black"
            style={{ width: '134px', height: '5px', borderRadius: '3px' }}
          />
          {overlay}
        </div>
      </div>
    </div>
  );
}
