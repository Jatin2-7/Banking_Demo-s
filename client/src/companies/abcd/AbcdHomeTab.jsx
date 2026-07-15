import React from 'react';
import { AbcdOfferingIcon, IconGoldCoin } from './AbcdOfferingIcons.jsx';

const OFFERINGS = [
  { id: 'digitalGold', label: 'Digital Gold', bg: '#FFF3CD', action: 'deposit' },
  { id: 'mutualFunds', label: 'Mutual Funds', bg: '#E8F5E9', action: 'deposit' },
  { id: 'personalLoan', label: 'Personal Loan', bg: '#FCE4EC', action: 'loan' },
  { id: 'motorInsurance', label: 'Motor Insurance', bg: '#E3F2FD', action: 'insure' },
  { id: 'healthInsurance', label: 'Health Insurance', bg: '#FFF3E0', action: 'insure' },
  { id: 'goldLoan', label: 'Gold Loan', bg: '#FFF8E1', action: 'loan' },
  { id: 'digitalSilver', label: 'Digital Silver', bg: '#ECEFF1', action: 'deposit' },
  { id: 'homeLoan', label: 'Home Loan', bg: '#E8F5E9', action: 'loan' },
];

function OfferingTile({ id, label, bg, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 press"
      style={{ minWidth: 0 }}
    >
      <span
        className="flex h-[62px] w-[62px] items-center justify-center rounded-2xl shadow-sm"
        style={{ background: bg }}
      >
        <AbcdOfferingIcon name={id} />
      </span>
      <span className="w-full px-0.5 text-center text-[10px] font-semibold leading-tight text-[#1A1A1A]">
        {label}
      </span>
    </button>
  );
}

export default function AbcdHomeTab({
  onOpenDeposit,
  onApplyNewLoan,
  onNavigate,
  onOpenTxnHistory,
  onGoTab,
}) {
  const handleOffering = (action) => {
    if (action === 'deposit') onOpenDeposit?.();
    else if (action === 'loan') onApplyNewLoan?.();
    else if (action === 'insure') onGoTab?.('insure');
  };

  return (
    <div className="px-3 pb-3 pt-1">
      {/* Gold promo */}
      <button
        type="button"
        onClick={onOpenDeposit}
        className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-[#FFF8E7] px-3 py-3 text-left shadow-sm press"
      >
        <IconGoldCoin />
        <span className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-[#1A1A1A]">
          Own 24K Gold - Digitally, Securely, Instantly
        </span>
        <span className="text-[18px] font-bold text-[#E65100]">»</span>
      </button>

      <h2 className="mb-3 text-[15px] font-bold text-[#1A1A1A]">Explore ABCD Offerings</h2>

      {/* 4×2 grid — explicit CSS so layout never collapses */}
      <div
        className="mb-4 rounded-2xl bg-[#FFF8EE] px-2 py-4"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          columnGap: '4px',
          rowGap: '18px',
        }}
      >
        {OFFERINGS.map((item) => (
          <OfferingTile
            key={item.id}
            id={item.id}
            label={item.label}
            bg={item.bg}
            onClick={() => handleOffering(item.action)}
          />
        ))}
      </div>

      {/* Horizontal cards */}
      <div
        className="mb-4 flex gap-2.5 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <button
          type="button"
          onClick={onOpenTxnHistory}
          className="min-w-[62%] shrink-0 rounded-2xl bg-[#E8F5E9] px-3.5 py-3 text-left press"
        >
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-[#1A1A1A]">Market Pulse</span>
            <span className="rounded bg-[#2E7D32] px-1.5 py-0.5 text-[9px] font-bold text-white">
              Most Used
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-[11px] text-[#4B5563]">Track Market Movements</p>
            <span className="text-[#1A1A1A]">›</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.('credit_card')}
          className="min-w-[62%] shrink-0 rounded-2xl bg-[#FCE4EC] px-3.5 py-3 text-left press"
        >
          <p className="text-[14px] font-bold text-[#1A1A1A]">Credit Cards</p>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-[11px] text-[#4B5563]">Curated card offers</p>
            <span className="text-[#1A1A1A]">›</span>
          </div>
        </button>
      </div>

      <h2 className="mb-2 text-[15px] font-bold text-[#1A1A1A]">Recommended For You</h2>
      <div className="h-16 rounded-2xl bg-[#FAFAFA]" aria-hidden />

      <button
        type="button"
        onClick={() => onGoTab?.('myTrack')}
        className="mt-4 w-full text-left press"
      >
        <h2 className="text-[15px] font-bold text-[#1A1A1A]">My Track</h2>
      </button>
    </div>
  );
}
