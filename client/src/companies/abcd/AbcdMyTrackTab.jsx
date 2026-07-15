import React, { useState } from 'react';

function TrackCard({ title, desc, emoji, onClick, descNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex min-h-[148px] flex-col overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white p-3 text-left shadow-abcdCard press"
    >
      <div className="flex items-start justify-between gap-1">
        <h3 className="text-[14px] font-bold text-[#1A1A1A]">{title}</h3>
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#D1D5DB] text-[10px] text-[#6B7280]">
          ›
        </span>
      </div>
      <div className="mt-2 flex flex-1 items-center justify-center text-[42px]" aria-hidden>
        {emoji}
      </div>
      <div className="mt-auto text-[11px] leading-snug text-[#6B7280]">{descNode || desc}</div>
    </button>
  );
}

export default function AbcdMyTrackTab({
  balanceLabel = '₹ 3,52,089.79',
  onOpenTxnHistory,
  onNavigate,
  onQuickAction,
}) {
  const [balanceVisible, setBalanceVisible] = useState(false);

  return (
    <div className="px-3 pb-4 pt-1">
      <div className="grid grid-cols-2 gap-3">
        <TrackCard
          title="Portfolio Track"
          emoji="💼"
          desc="All accounts in one place"
          onClick={onOpenTxnHistory}
        />
        <TrackCard
          title="Credit Track"
          emoji="⏱️"
          desc="Check your score & trends"
          onClick={() => onNavigate?.('credit_card')}
        />
        <TrackCard
          title="Vehicle Track"
          emoji="🛵"
          desc="Add and track all your vehicle info in one place"
          onClick={() => onQuickAction?.('check_balance')}
        />
        <TrackCard
          title="Spend Track"
          emoji="🧮"
          descNode={
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setBalanceVisible((v) => !v);
              }}
              className="font-semibold text-[#C41E24] underline"
            >
              {balanceVisible ? balanceLabel : 'Check Balance'}
            </button>
          }
          onClick={() => setBalanceVisible((v) => !v)}
        />
        <TrackCard
          title="Digital Will"
          emoji="🪶"
          desc="Secure your family's future"
          onClick={() => onQuickAction?.('check_balance')}
        />
      </div>
    </div>
  );
}
