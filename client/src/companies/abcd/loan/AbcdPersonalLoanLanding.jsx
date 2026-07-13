import React from 'react';
import {
  IconEmiCalc,
  IconInstantDisbursal,
  IconLoanAmount,
  IconNoPaperwork,
  IconProcessingFee,
  IconRateTag,
  IconRoi,
  IconTenure,
} from './AbcdLoanIcons.jsx';

function SectionTitle({ children }) {
  return (
    <div className="my-4 flex items-center gap-2">
      <div className="h-px flex-1 bg-[#E5E7EB]" />
      <span className="shrink-0 text-[13px] font-bold text-[#374151]">{children}</span>
      <div className="h-px flex-1 bg-[#E5E7EB]" />
    </div>
  );
}

function RateRow({ icon, title, subtitle }) {
  return (
    <div className="mb-2.5 flex items-center gap-3 rounded-xl bg-[#F9FAFB] px-3 py-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
        {icon}
      </span>
      <div>
        <p className="text-[13px] font-bold text-[#1A1A1A]">{title}</p>
        <p className="text-[11px] text-[#6B7280]">{subtitle}</p>
      </div>
    </div>
  );
}

function BenefitTile({ icon, label }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
        {icon}
      </div>
      <p className="max-w-[88px] text-center text-[9px] font-semibold leading-tight text-white/95">
        {label}
      </p>
    </div>
  );
}

export default function AbcdPersonalLoanLanding({
  pan,
  onPanChange,
  onOpenCalculators,
}) {
  return (
    <div className="pb-4">
      {/* Hero */}
      <div
        className="px-4 pb-5 pt-2 text-white"
        style={{
          background: 'linear-gradient(180deg, #7A1423 0%, #8C1D24 55%, #9B2430 100%)',
        }}
      >
        <div className="flex items-center justify-between">
          <span className="w-9" />
          <h1 className="text-[16px] font-bold">Personal Loan</h1>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white press"
            aria-label="Help"
          >
            ?
          </button>
        </div>

        <p className="mt-4 text-[18px] font-bold leading-snug">
          Apply for an Instant Personal Loan Up to{' '}
          <span className="text-[#FFD54F]">₹15 Lakh</span>, in Minutes!
        </p>

        <p className="mt-4 text-[12px] font-semibold text-white/90">Benefits and Features</p>
        <div className="mt-3 flex gap-3">
          <BenefitTile icon={<IconInstantDisbursal />} label="Instant Disbursal" />
          <BenefitTile icon={<IconNoPaperwork />} label="No Paperwork Required" />
          <BenefitTile icon={<IconRoi />} label="ROI Starting at 10.5%" />
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-4">
        <input
          type="text"
          value={pan}
          onChange={(e) => onPanChange(e.target.value.toUpperCase())}
          placeholder="PAN"
          maxLength={10}
          className="w-full rounded-full bg-[#F3F4F6] px-4 py-3.5 text-[15px] font-semibold uppercase text-[#1A1A1A] outline-none placeholder:font-normal placeholder:text-[#9CA3AF]"
        />

        <SectionTitle>Personal Loan Eligibility</SectionTitle>
        <div
          className="mb-2 flex items-center gap-3 rounded-2xl px-4 py-4"
          style={{ background: 'linear-gradient(90deg, #FFF8E1 0%, #F3E5F5 100%)' }}
        >
          <ul className="flex-1 space-y-2 text-[12px] font-medium text-[#374151]">
            <li className="flex items-center gap-2">
              <span className="text-[#4CAF50]">✓</span> Age: 19 to 60 years
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#4CAF50]">✓</span> Income: Min. ₹10,000/m
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#4CAF50]">✓</span> Residency: Resident of India
            </li>
          </ul>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#7E57C2] text-[28px] text-white shadow-lg">
            ✓
          </div>
        </div>

        <SectionTitle>Rates and Charges</SectionTitle>
        <RateRow icon={<IconLoanAmount />} title="Loan Amount" subtitle="Min. ₹5,000 and Max. 15 Lakhs" />
        <RateRow icon={<IconTenure />} title="Repayment Tenure" subtitle="6 months to 60 months" />
        <RateRow icon={<IconRateTag />} title="Rate of Interest" subtitle="10.99% to 30 per annum" />
        <RateRow icon={<IconProcessingFee />} title="Processing Fees:" subtitle="1.18% - 4.13% of Loan amount incl. GST." />

        <h3 className="mt-4 text-[15px] font-bold text-[#1A1A1A]">Financial tools &amp; calculators</h3>
        <div
          className="mt-2 flex items-center gap-3 rounded-2xl px-3 py-3"
          style={{ background: 'linear-gradient(90deg, #FFF8E1 0%, #FFFDE7 100%)' }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-[#1A1A1A]">EMI for your Personal Loan</p>
            <p className="text-[11px] text-[#6B7280]">Calculate your potential EMI in seconds</p>
            <button
              type="button"
              onClick={onOpenCalculators}
              className="mt-2 rounded-full bg-[#C41E24] px-5 py-1.5 text-[12px] font-bold text-white press"
            >
              Calculate
            </button>
          </div>
          <IconEmiCalc />
        </div>

        <button
          type="button"
          className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-[#F3E5F5] px-3 py-3 text-left press"
        >
          <span className="text-[24px]">💬</span>
          <span className="flex-1 text-[13px] font-semibold text-[#374151]">Frequently asked questions</span>
          <span className="text-[#C41E24]">›</span>
        </button>

        <div className="mt-4 rounded-xl bg-[#EDE7F6] px-3 py-3 text-center">
          <p className="text-[12px] font-bold text-[#5E35B1]">🛡️ Our Trusted Lending Partners 🛡️</p>
          <div className="mt-2 flex justify-center gap-2">
            {['ABCL', 'Poonawalla', 'Prefr'].map((p) => (
              <span
                key={p}
                className="rounded-lg bg-white px-2 py-1 text-[9px] font-bold text-[#374151] shadow-sm"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
