import React from 'react';
import { EmtForexHeader } from '../components/EmtHeader.jsx';
import { EMT } from '../theme.js';

function PartnerCard({ logo, title, description, onBook }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-emt-border bg-white shadow-sm">
      <div
        className="flex h-16 items-center justify-center border-b border-emt-borderLight px-4"
        style={{
          background:
            'repeating-linear-gradient(45deg, #f9f9f9 0, #f9f9f9 2px, #fff 2px, #fff 8px)',
        }}
      >
        {logo}
      </div>
      <div className="p-4">
        <h3 className="text-[15px] font-bold text-emt-ink">{title}</h3>
        <p className="mt-2 text-[12px] leading-relaxed text-emt-muted">{description}</p>
        <button
          type="button"
          onClick={onBook}
          className="mt-4 flex items-center gap-1.5 rounded-full border-2 px-5 py-2 text-[13px] font-semibold press"
          style={{ borderColor: EMT.blue, color: EMT.blue }}
        >
          Book Now
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M7 17L17 7M17 7H9M17 7v8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function GlobalPayLogo() {
  return (
    <div className="text-center">
      <span className="text-[18px] font-bold text-emt-ink">GlobalPay</span>
      <span className="ml-1 text-[12px] font-medium text-emt-muted">wsfx</span>
    </div>
  );
}

function ExTravelLogo() {
  return (
    <div className="text-center">
      <span className="text-[16px] font-bold" style={{ color: EMT.blue }}>
        ex<span style={{ color: '#E53935' }}>●</span>travelmoney
      </span>
      <span className="text-[16px] font-bold" style={{ color: EMT.blue }}>
        .com
      </span>
    </div>
  );
}

export default function ForexLandingScreen({ onBack, onBookGlobalPay, onBookExTravel }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-emt-page">
      <EmtForexHeader onBack={onBack} />
      <div
        className="relative px-4 py-8 text-center text-white"
        style={{
          background: 'linear-gradient(180deg, #0D47A1 0%, #1565C0 100%)',
          minHeight: '10rem',
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Cpath fill='%23fff' d='M0 150 Q100 100 200 130 T400 120 L400 200 L0 200Z'/%3E%3C/svg%3E\")",
            backgroundSize: 'cover',
          }}
        />
        <p className="relative text-[15px] font-semibold leading-relaxed">
          Forex &amp; Money Transfers Made Easy
          <br />
          With GlobalPay &amp; ExTravelMoney
        </p>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <PartnerCard
          logo={<GlobalPayLogo />}
          title="GlobalPay Wsfx"
          description={
            <>
              Ease your Forex with GlobalPay,
              <br />
              Get your <strong>Zero-markup Free forex card</strong> and home delivery of currency
              today
            </>
          }
          onBook={onBookGlobalPay}
        />
        <PartnerCard
          logo={<ExTravelLogo />}
          title="ExTravelMoney"
          description="Your go-to platform for currency exchange & forex cards, with door delivery to 3000+ locations. Powered by India's leading banks and forex providers."
          onBook={onBookExTravel}
        />
      </div>
    </div>
  );
}
