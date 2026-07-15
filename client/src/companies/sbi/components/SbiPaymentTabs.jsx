import React from 'react';
import { SBI } from '../theme.js';

const PAYMENT_TABS = [
  { id: 'upi', label: 'UPI' },
  { id: 'fund-transfer', label: 'Fund Transfer' },
  { id: 'bills', label: 'Bills' },
  { id: 'yono-cash', label: 'Yono Cash' },
];

export function SbiPaymentTabs({ active = 'upi', onChange }) {
  return (
    <div className="mt-1 px-4">
      <h3 className="text-[13px] font-bold" style={{ color: SBI.ink }}>
        Payments &amp; Transfers
      </h3>
      <div className="no-scrollbar mt-2 flex border-b" style={{ borderColor: SBI.border }}>
        {PAYMENT_TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange?.(tab.id)}
              className="press min-w-0 flex-1 px-1 py-2.5 text-center text-[11px] font-semibold"
              style={{
                color: isActive ? SBI.purple : SBI.muted,
                borderBottom: isActive ? `2px solid ${SBI.purple}` : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {active === 'upi' && (
        <div className="mt-3 space-y-2">
          <div
            className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5"
            style={{ backgroundColor: '#EFEFEF' }}
          >
            <span className="min-w-0 truncate text-[11px] font-medium text-slate-700">
              UPI: 9588828508@sbi
            </span>
            <button
              type="button"
              className="shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold"
              style={{ borderColor: SBI.purple, color: SBI.purple }}
            >
              Enable UPI LITE
            </button>
          </div>
          <button
            type="button"
            className="press flex w-full items-center justify-between rounded-xl px-3 py-2.5"
            style={{ backgroundColor: SBI.alert }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="shrink-0 rounded bg-white/70 px-1.5 py-0.5 text-[9px] font-bold"
                style={{ color: '#5C2D91' }}
              >
                UPI
              </span>
              <span className="truncate text-[11px] font-semibold" style={{ color: SBI.alertText }}>
                Re-verification required
              </span>
            </div>
            <span className="shrink-0 text-lg leading-none" style={{ color: SBI.purple }}>
              &#8250;
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
