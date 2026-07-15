import React, { useMemo, useState } from 'react';
import { OPTIMO, FONTS } from '../../theme.js';
import { calcEmi, formatInrFull } from '../../lib/loanCalc.js';

const TABS = [
  { id: 'emi', label: 'EMI Calculator' },
  { id: 'eligibility', label: 'Check Eligibility' },
  { id: 'property', label: 'Check Property Value' },
];

const TENURE_OPTIONS = Array.from({ length: 15 }, (_, i) => i + 1);

export default function EmiCalculatorSection({ values, onChange, onApply, onScrollRef }) {
  const [activeTab, setActiveTab] = useState('emi');

  const loanAmount = values.loanAmount || '';
  const interestRate = values.interestRate || '';
  const tenureYears = values.tenureYears || '';

  const emi = useMemo(() => {
    const p = Number(String(loanAmount).replace(/,/g, ''));
    const r = Number(interestRate);
    const y = Number(tenureYears);
    if (!p || !r || !y) return 0;
    return calcEmi(p, r, y * 12);
  }, [loanAmount, interestRate, tenureYears]);

  const totalInterest = useMemo(() => {
    const p = Number(String(loanAmount).replace(/,/g, ''));
    const y = Number(tenureYears);
    if (!emi || !y || !p) return 0;
    return Math.max(0, emi * y * 12 - p);
  }, [emi, loanAmount, tenureYears]);

  const setField = (field, value) => onChange?.({ ...values, [field]: value });

  return (
    <section ref={onScrollRef} id="emi-calculator" className="scroll-mt-24 scroll-mb-80">
      <h2
        className="mb-6 text-center"
        style={{ fontFamily: FONTS.display, fontSize: 28, fontWeight: 700, color: OPTIMO.navy }}
      >
        Plan, Check &amp; Value - All in One Place
      </h2>

      <div className="mb-8 flex justify-center">
        <div className="inline-flex rounded-full bg-white p-1.5 shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="rounded-full px-5 py-2.5 text-[14px] font-semibold transition sm:px-7"
              style={{
                fontFamily: FONTS.body,
                backgroundColor: activeTab === tab.id ? OPTIMO.orange : 'transparent',
                color: activeTab === tab.id ? '#fff' : OPTIMO.navy,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'emi' && (
        <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_8px_32px_rgba(15,23,42,0.08)]">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div
              className="relative flex min-h-[220px] flex-col justify-end p-8 lg:min-h-[340px]"
              style={{
                background:
                  'linear-gradient(160deg, #2B3A4E 0%, #1A2332 100%), url(https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80) center/cover',
                backgroundBlendMode: 'overlay',
              }}
            >
              <p style={{ fontFamily: FONTS.display, fontSize: 32, fontWeight: 700, color: '#fff' }}>
                EMI Calculator
              </p>
              <p className="mt-2 max-w-xs" style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
                Quickly estimate EMIs and plan your finances.
              </p>
            </div>

            <div className="p-6 sm:p-8" style={{ backgroundColor: OPTIMO.orange }}>
              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-white">Preferred loan amount</label>
                  <div className="flex overflow-hidden rounded-[10px] bg-white">
                    <span className="flex items-center px-3 text-[15px] font-medium text-[#64748B]">₹</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={loanAmount}
                      onChange={(e) => setField('loanAmount', e.target.value.replace(/[^\d]/g, ''))}
                      placeholder="e.g 200000"
                      className="min-w-0 flex-1 py-3 pr-3 text-[15px] outline-none"
                      style={{ fontFamily: FONTS.body, color: OPTIMO.navy }}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-white">Interest rate (per annum)</label>
                  <div className="flex overflow-hidden rounded-[10px] bg-white">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={interestRate}
                      onChange={(e) => setField('interestRate', e.target.value.replace(/[^\d.]/g, ''))}
                      placeholder="e.g 10%"
                      className="min-w-0 flex-1 px-4 py-3 text-[15px] outline-none"
                      style={{ fontFamily: FONTS.body, color: OPTIMO.navy }}
                    />
                    <span className="flex items-center px-3 text-[15px] font-medium text-[#64748B]">%</span>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-white">Loan tenure (in years)</label>
                  <select
                    value={tenureYears}
                    onChange={(e) => setField('tenureYears', e.target.value)}
                    className="w-full rounded-[10px] bg-white px-4 py-3 text-[15px] outline-none"
                    style={{ fontFamily: FONTS.body, color: tenureYears ? OPTIMO.navy : '#9AA5B4' }}
                  >
                    <option value="">Select</option>
                    {TENURE_OPTIONS.map((y) => (
                      <option key={y} value={String(y)}>
                        {y} {y === 1 ? 'year' : 'years'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-[12px] bg-white px-6 py-5">
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: OPTIMO.navy }}>Estimated EMI</p>
                  <p style={{ fontSize: 12, color: OPTIMO.navySoft }}>per month</p>
                </div>
                <div className="text-right">
                  <p style={{ fontSize: 28, fontWeight: 700, color: OPTIMO.navy }}>{formatInrFull(emi)}</p>
                  <p style={{ fontSize: 12, color: OPTIMO.navySoft }}>Interest payable {formatInrFull(totalInterest)}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onChange?.({ loanAmount: '', interestRate: '', tenureYears: '' })}
                  className="flex items-center gap-2 rounded-full border-2 border-white bg-transparent px-6 py-2.5 text-[14px] font-semibold text-white"
                >
                  ↺ Reset
                </button>
                <button
                  type="button"
                  onClick={onApply}
                  className="rounded-full bg-white px-8 py-2.5 text-[14px] font-bold transition hover:bg-[#FFF6F2]"
                  style={{ color: OPTIMO.orange, fontFamily: FONTS.display }}
                >
                  Apply Now →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab !== 'emi' && (
        <div
          className="rounded-[20px] bg-white px-8 py-16 text-center shadow-[0_8px_32px_rgba(15,23,42,0.08)]"
          style={{ fontFamily: FONTS.body, color: OPTIMO.navySoft }}
        >
          <p className="text-[18px] font-semibold" style={{ color: OPTIMO.navy }}>
            {activeTab === 'eligibility' ? 'Check Eligibility' : 'Check Property Value'}
          </p>
          <p className="mt-2">Start your application to check eligibility with our experts.</p>
          <button
            type="button"
            onClick={onApply}
            className="mt-6 rounded-full px-8 py-3 text-[15px] font-bold text-white"
            style={{ backgroundColor: OPTIMO.orange }}
          >
            Apply Now →
          </button>
        </div>
      )}
    </section>
  );
}
