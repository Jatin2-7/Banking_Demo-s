import React from 'react';

function ExploreRow({ emoji, title, subtitle, onClick }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#EEEEEE] bg-white px-3 py-3 shadow-abcdCard">
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFF8EE] text-[26px]"
        aria-hidden
      >
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-[#1A1A1A]">{title}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-[#6B7280]">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="shrink-0 rounded-full bg-[#C41E24] px-3.5 py-1.5 text-[12px] font-bold text-white press"
      >
        Explore
      </button>
    </div>
  );
}

export function AbcdLoansTab({ onApplyNewLoan, onNavigate }) {
  return (
    <div className="space-y-3 px-3 pb-4 pt-1">
      <ExploreRow
        emoji="💳"
        title="Credit cards"
        subtitle="Choose from 100+ Credit Cards from Leading Banks"
        onClick={() => onNavigate?.('credit_card')}
      />
      <ExploreRow
        emoji="🏠"
        title="Home Loan"
        subtitle="Get Instant Home Loan Offer Starting at 7.75% p.a."
        onClick={onApplyNewLoan}
      />
      <ExploreRow
        emoji="💰"
        title="Personal loan"
        subtitle="Instant Personal Loans upto Rs. 15 lacs"
        onClick={onApplyNewLoan}
      />
      <ExploreRow
        emoji="📂"
        title="Business Loan"
        subtitle="Fuel your business ambitions"
        onClick={onApplyNewLoan}
      />
      <ExploreRow
        emoji="🥇"
        title="Gold Loan"
        subtitle="Unlock the potential of the Gold you own"
        onClick={onApplyNewLoan}
      />
    </div>
  );
}

export function AbcdInsureTab({ onQuickAction }) {
  return (
    <div className="space-y-3 px-3 pb-4 pt-1">
      <ExploreRow
        emoji="🛡️"
        title="Health insurance"
        subtitle="Pay less on premiums with 0% GST!"
        onClick={() => onQuickAction?.('check_balance')}
      />
      <ExploreRow
        emoji="🚗"
        title="Motor insurance"
        subtitle="Ensure your vehicle safety"
        onClick={() => onQuickAction?.('check_balance')}
      />
      <ExploreRow
        emoji="🏷️"
        title="Wellness Plan"
        subtitle="Starting @ ₹999/year"
        onClick={() => onQuickAction?.('check_balance')}
      />
      <ExploreRow
        emoji="⚡"
        title="Pocket insurance"
        subtitle="Starting @ 176/year"
        onClick={() => onQuickAction?.('check_balance')}
      />
      <ExploreRow
        emoji="✈️"
        title="Travel Insurance"
        subtitle="Starting at just ₹269 for 5 days"
        onClick={() => onQuickAction?.('check_balance')}
      />
    </div>
  );
}

function InvestCard({ title, emoji, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[150px] flex-col rounded-2xl border border-[#E8E8E8] bg-white p-3 text-left shadow-abcdCard press"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-[#1A1A1A]">{title}</h3>
        <span className="text-[#9CA3AF]">›</span>
      </div>
      <div className="my-2 flex flex-1 items-center justify-center text-[40px]" aria-hidden>
        {emoji}
      </div>
      <p className="text-[11px] leading-snug text-[#6B7280]">{desc}</p>
    </button>
  );
}

export function AbcdInvestTab({ onOpenDeposit }) {
  return (
    <div className="px-3 pb-4 pt-1">
      <div className="grid grid-cols-2 gap-3">
        <InvestCard
          title="Gold"
          emoji="🟨"
          desc="Buy 24K pure digital gold"
          onClick={onOpenDeposit}
        />
        <InvestCard
          title="Silver"
          emoji="⬜"
          desc="Diversify, minimize risk with silver"
          onClick={onOpenDeposit}
        />
        <InvestCard
          title="Mutual funds"
          emoji="💵"
          desc="Start with just Rs 100!"
          onClick={onOpenDeposit}
        />
        <InvestCard
          title="Fixed Deposits"
          emoji="🔐"
          desc="Upto 8.50%* returns on FD"
          onClick={onOpenDeposit}
        />
        <InvestCard
          title="Stocks"
          emoji="📈"
          desc="Explore curated Investpacks"
          onClick={onOpenDeposit}
        />
        <InvestCard
          title="NPS"
          emoji="🪑"
          desc="Plan for your retirement"
          onClick={onOpenDeposit}
        />
      </div>
    </div>
  );
}
