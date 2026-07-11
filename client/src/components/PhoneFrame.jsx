import React from 'react';

function StatusBar() {
  const fill = '#1A237E';
  return (
    <div className="absolute top-0 left-0 right-0 h-11 px-7 flex items-center justify-between text-[13px] font-semibold text-[#1A237E] z-30 pointer-events-none">
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
          <rect x="0" y="6" width="3" height="4" rx="0.5" fill={fill} />
          <rect x="4" y="4" width="3" height="6" rx="0.5" fill={fill} />
          <rect x="8" y="2" width="3" height="8" rx="0.5" fill={fill} />
          <rect x="12" y="0" width="3" height="10" rx="0.5" fill={fill} />
        </svg>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
          <path
            d="M7 9.5a1 1 0 100-2 1 1 0 000 2zM3.2 6.4a5.5 5.5 0 017.6 0l1-1a7 7 0 00-9.6 0l1 1zM.4 3.6a9.5 9.5 0 0113.2 0l1-1a11 11 0 00-15.2 0l1 1z"
            fill={fill}
          />
        </svg>
        <div className="ml-1 flex items-center">
          <div className="relative w-6 h-3 rounded-[3px] border border-[#1A237E]/70">
            <div className="absolute inset-[2px] right-[6px] bg-[#1A237E]/90 rounded-[1px]" />
          </div>
          <div className="w-[2px] h-1.5 bg-[#1A237E]/70 rounded-r ml-[1px]" />
        </div>
      </div>
    </div>
  );
}

export default function PhoneFrame({ children, overlay }) {
  return (
    <div className="min-h-full w-full flex items-center justify-center py-6">
      <div
        className="relative bg-ink"
        style={{
          width: '406px',
          height: '860px',
          borderRadius: '52px',
          padding: '8px',
          boxShadow: '0 30px 60px rgba(15, 22, 96, 0.25), inset 0 0 0 1.5px rgba(255,255,255,0.06)',
        }}
      >
        <div
          className="relative overflow-hidden bank-facet-bg"
          style={{
            width: '390px',
            height: '844px',
            borderRadius: '44px',
          }}
        >
          <StatusBar />
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#0D1642] z-40"
            style={{ width: '120px', height: '28px', borderRadius: '14px' }}
          />
          <div
            className="absolute h-full w-full overflow-y-auto no-scrollbar pt-11"
            style={{ borderRadius: '44px' }}
          >
            {children}
          </div>
          <div
            className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-ink z-40"
            style={{ width: '134px', height: '5px', borderRadius: '3px' }}
          />
          {overlay}
        </div>
      </div>
    </div>
  );
}
