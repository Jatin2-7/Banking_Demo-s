import React, { useMemo, useState } from 'react';
import AbcdLoanSlider, { AbcdDonutChart } from './AbcdLoanSlider.jsx';
import { calcEmi, calcTotalPayable, formatInrFull } from './loanCalc.js';

const TENURE_MARKS = [
  { value: 12, label: '12mos' },
  { value: 24, label: '24mos' },
  { value: 36, label: '36mos' },
  { value: 48, label: '48mos' },
  { value: 60, label: '60mos' },
];

const AMOUNT_MARKS = [
  { value: 50000, label: '50K' },
  { value: 100000, label: '1L' },
  { value: 200000, label: '2L' },
  { value: 300000, label: '3L' },
  { value: 400000, label: '4L' },
  { value: 500000, label: '5L' },
  { value: 600000, label: '6L' },
  { value: 700000, label: '7L' },
  { value: 800000, label: '8L' },
  { value: 900000, label: '9L' },
  { value: 1000000, label: '10L' },
];

export default function AbcdEmiCalculatorScreen({ onBack }) {
  const [tenure, setTenure] = useState(24);
  const [amount, setAmount] = useState(100000);
  const [rate] = useState(18);
  const [showResult, setShowResult] = useState(false);

  const emi = useMemo(() => calcEmi(amount, rate, tenure), [amount, rate, tenure]);
  const total = useMemo(() => calcTotalPayable(emi, tenure), [emi, tenure]);
  const interest = Math.max(0, total - amount);

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="flex shrink-0 items-center gap-2 border-b border-[#EEEEEE] px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center press"
          aria-label="Back"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth="2.2"
          >
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="min-w-0 flex-1 text-center text-[15px] font-bold text-[#1A1A1A]">
          Personal loan EMI calculator
        </h1>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C41E24] text-[13px] font-bold text-white press"
          aria-label="Help"
        >
          ?
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-4 pb-24 pt-3">
        {!showResult && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#FFF8E1] px-3 py-2.5">
            <span className="text-[20px]">🧮</span>
            <p className="text-[12px] font-medium text-[#5D4037]">
              Use this calculator to plan your instalments better
            </p>
          </div>
        )}

        {showResult && (
          <div className="mb-4 rounded-2xl bg-[#FFF8E1] px-4 py-4">
            <p className="text-center text-[12px] text-[#6B7280]">Total payable amount</p>
            <p className="text-center text-[22px] font-bold text-[#5D4037]">
              {formatInrFull(total)}
            </p>
            <div className="mt-2 flex justify-center gap-4 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#FFC107]" /> Principal Amount
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#4CAF50]" /> Interest Amount
              </span>
            </div>
            <AbcdDonutChart principal={amount} interest={interest} />
            <div className="-mt-2 rounded-xl bg-white px-4 py-3 text-center shadow-sm">
              <p className="text-[11px] text-[#6B7280]">Your Estimated EMI Amount</p>
              <p className="text-[24px] font-bold text-[#1A1A1A]">{formatInrFull(emi)}</p>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-[11px] text-[#9CA3AF]">
            <span>Tenure</span>
            <span>in months</span>
          </div>
          <div className="rounded-xl bg-[#F3F4F6] px-4 py-3 text-[20px] font-bold text-[#1A1A1A]">
            {tenure}
          </div>
          <AbcdLoanSlider
            min={12}
            max={60}
            step={12}
            value={tenure}
            onChange={setTenure}
            marks={TENURE_MARKS}
          />
        </div>

        <div className="mb-4">
          <p className="mb-1 text-[11px] text-[#9CA3AF]">Loan Amount</p>
          <div className="rounded-xl bg-[#F3F4F6] px-4 py-3 text-[20px] font-bold text-[#1A1A1A]">
            {formatInrFull(amount)}
          </div>
          <AbcdLoanSlider
            min={50000}
            max={1000000}
            step={50000}
            value={amount}
            onChange={setAmount}
            marks={AMOUNT_MARKS}
          />
        </div>

        <div className="mb-2">
          <p className="mb-1 text-[11px] text-[#9CA3AF]">Rate of Interest</p>
          <div className="rounded-xl bg-[#F3F4F6] px-4 py-3 text-[20px] font-bold text-[#1A1A1A]">
            {rate}%
          </div>
        </div>

        <p className="mt-4 text-center text-[10px] text-[#9CA3AF]">
          The values mentioned are for indicative purposes only
        </p>
      </div>

      <div className="shrink-0 border-t border-[#EEEEEE] bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => (showResult ? onBack() : setShowResult(true))}
          className="w-full rounded-full bg-[#C41E24] py-3.5 text-[15px] font-bold text-white press"
        >
          {showResult ? 'Explore' : 'Calculate'}
        </button>
      </div>
    </div>
  );
}
