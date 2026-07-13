import React, { useMemo, useState } from 'react';
import AbcdLoanSlider from './AbcdLoanSlider.jsx';
import {
  calcPrincipalFromEmi,
  formatInrFull,
} from './loanCalc.js';

const TENURE_MARKS = [
  { value: 12, label: '12mos' },
  { value: 24, label: '24mos' },
  { value: 36, label: '36mos' },
  { value: 48, label: '48mos' },
  { value: 60, label: '60mos' },
];

const EMI_MARKS = [
  { value: 1000, label: '1k' },
  { value: 3000, label: '3k' },
  { value: 5000, label: '5k' },
  { value: 7000, label: '7k' },
  { value: 9000, label: '9k' },
  { value: 11000, label: '11k' },
  { value: 13000, label: '13k' },
  { value: 15000, label: '15k' },
  { value: 17000, label: '17k' },
  { value: 19000, label: '19k' },
  { value: 21000, label: '21k' },
  { value: 23000, label: '23k' },
  { value: 25000, label: '25k' },
];

export default function AbcdLoanAmountCalculatorScreen({ onBack }) {
  const [tenure, setTenure] = useState(24);
  const [emi, setEmi] = useState(1000);
  const [rate] = useState(18);
  const [showResult, setShowResult] = useState(false);

  const loanAmount = useMemo(
    () => calcPrincipalFromEmi(emi, rate, tenure),
    [emi, rate, tenure],
  );

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="flex shrink-0 items-center gap-2 border-b border-[#EEEEEE] px-3 py-2.5">
        <button type="button" onClick={onBack} className="flex h-9 w-9 items-center justify-center press" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.2">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="min-w-0 flex-1 text-center text-[14px] font-bold leading-tight text-[#1A1A1A]">
          Personal loan amount calculator
        </h1>
        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C41E24] text-[13px] font-bold text-white press" aria-label="Help">
          ?
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-4 pb-28 pt-3">
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#FFF8E1] px-3 py-2.5">
          <span className="text-[20px]">🧮</span>
          <p className="text-[12px] font-medium text-[#5D4037]">
            Use this calculator to plan your instalments better
          </p>
        </div>

        {showResult && (
          <div className="mb-4 rounded-2xl bg-[#FFF8E1] px-4 py-4 text-center">
            <p className="text-[12px] text-[#6B7280]">Eligible loan amount</p>
            <p className="text-[24px] font-bold text-[#5D4037]">{formatInrFull(loanAmount)}</p>
          </div>
        )}

        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-[11px] text-[#9CA3AF]">
            <span>Tenure</span>
            <span>in months</span>
          </div>
          <div className="rounded-xl bg-[#F3F4F6] px-4 py-3 text-[20px] font-bold text-[#1A1A1A]">{tenure}</div>
          <AbcdLoanSlider min={12} max={60} step={12} value={tenure} onChange={setTenure} marks={TENURE_MARKS} />
        </div>

        <div className="mb-4">
          <p className="mb-1 text-[11px] text-[#9CA3AF]">EMI Amount</p>
          <div className="rounded-xl bg-[#F3F4F6] px-4 py-3 text-[20px] font-bold text-[#1A1A1A]">
            {formatInrFull(emi)}
          </div>
          <AbcdLoanSlider min={1000} max={25000} step={1000} value={emi} onChange={setEmi} marks={EMI_MARKS} />
        </div>

        <div className="mb-2">
          <p className="mb-1 text-[11px] text-[#9CA3AF]">Rate of Interest</p>
          <div className="rounded-xl bg-[#F3F4F6] px-4 py-3 text-[20px] font-bold text-[#1A1A1A]">{rate}%</div>
        </div>
      </div>

      <div className="shrink-0 border-t border-[#EEEEEE] bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => (showResult ? onBack() : setShowResult(true))}
          className="w-full rounded-full bg-[#C41E24] py-3.5 text-[15px] font-bold text-white press"
        >
          {showResult ? 'Explore' : 'Calculate'}
        </button>
        <p className="mt-3 text-center text-[9px] leading-snug text-[#9CA3AF]">
          Disclaimer : The aforementioned values, calculations and results are for illustrative and
          informational purposes only, and may vary basis various parameters laid down by Aditya Birla
          Capital Limited.
        </p>
      </div>
    </div>
  );
}
