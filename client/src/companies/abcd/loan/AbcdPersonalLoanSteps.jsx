import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const DEMO_MPIN = '1234';

function LoanHeader({ title = 'Personal Loan', onBack, onHelp }) {
  return (
    <header className="flex shrink-0 items-center gap-2 border-b border-[#EEEEEE] bg-white px-3 py-2.5">
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
      <h1 className="min-w-0 flex-1 text-center text-[16px] font-bold text-[#1A1A1A]">{title}</h1>
      <button
        type="button"
        onClick={onHelp}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C41E24] text-[13px] font-bold text-white press"
        aria-label="Help"
      >
        ?
      </button>
    </header>
  );
}

function FooterBranding() {
  return (
    <>
      <p className="mt-3 flex items-center justify-center gap-1 text-[9px] font-semibold text-[#6B7280]">
        <span className="text-[#4CAF50]">🛡️</span> YOUR DATA IS SECURE WITH US
      </p>
      <p className="mt-1 text-center text-[9px] text-[#9CA3AF]">
        Powered by Aditya Birla Capital Digital Ltd
      </p>
    </>
  );
}

function ProgressBlock({ step, total = 5, label = 'Basic details' }) {
  const pct = (step / total) * 100;
  return (
    <div className="border-b border-[#EEEEEE] bg-white px-4 py-3">
      <p className="text-[13px] font-bold text-[#1A1A1A]">{label}</p>
      <div className="mt-1 flex items-center gap-1 text-[12px] text-[#6B7280]">
        <span>
          Step {step}/{total}
        </span>
        <span>∨</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E5E7EB]">
        <div className="h-full rounded-full bg-[#43A047]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function AbcdLoanJourneyIntro({ onGotIt, onClose }) {
  const steps = [
    {
      n: 1,
      title: 'Check Your Eligibility',
      desc: 'Check your eligibility and see your estimated loan amount.',
      status: 'done',
    },
    {
      n: 2,
      title: 'Build Your Application',
      desc: 'Add details to match with the right lenders.',
      status: 'active',
    },
    {
      n: 3,
      title: 'Lender Assessment',
      desc: 'Your application is being reviewed by the lender.',
      time: 'About 5 min',
    },
    {
      n: 4,
      title: 'Lender offer Generated',
      desc: 'Your loan details are finalised.',
      time: 'About 4 min',
    },
    {
      n: 5,
      title: 'Agreement & Disbursal',
      desc: 'Funds are credited to your bank account.',
      time: 'About 5 min',
    },
  ];

  return (
    <div className="flex h-full flex-col bg-white">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-10 text-[#9CA3AF] press"
        aria-label="Close"
      >
        ✕
      </button>
      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-5 pb-4 pt-8 text-center">
        <div className="mx-auto mb-3 text-[48px]">🪙</div>
        <h2 className="text-[18px] font-bold text-[#1A1A1A]">
          Complete your personal loan application
        </h2>
        <p className="mt-2 text-[12px] leading-snug text-[#6B7280]">
          To comply with regulations, we need to collect and verify your information.
        </p>
        <div className="mt-6 space-y-4 text-left">
          {steps.map((s, i) => (
            <div key={s.n} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                    s.status === 'done'
                      ? 'bg-[#43A047] text-white'
                      : s.status === 'active'
                        ? 'border-2 border-[#FF9800] text-[#FF9800]'
                        : 'border border-[#D1D5DB] text-[#9CA3AF]'
                  }`}
                >
                  {s.status === 'done' ? '✓' : s.n}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`mt-1 w-0.5 flex-1 min-h-[24px] ${s.status === 'done' ? 'bg-[#43A047]' : 'bg-[#E5E7EB]'}`}
                  />
                )}
              </div>
              <div className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] font-bold text-[#1A1A1A]">{s.title}</p>
                  {s.status === 'done' && (
                    <span className="rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[9px] font-bold text-[#2E7D32]">
                      Completed
                    </span>
                  )}
                  {s.status === 'active' && (
                    <span className="rounded-full bg-[#FFF3E0] px-2 py-0.5 text-[9px] font-bold text-[#EF6C00]">
                      In progress
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-[#6B7280]">{s.desc}</p>
                {s.time && (
                  <p className="mt-1 text-[10px] font-semibold text-[#2E7D32]">⏱ {s.time}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="shrink-0 px-4 py-3">
        <button
          type="button"
          onClick={onGotIt}
          className="w-full rounded-full bg-[#C41E24] py-3.5 text-[15px] font-bold text-white press"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

function FieldShell({ label, locked, children, error }) {
  return (
    <div className="mb-3">
      {label && <p className="mb-1 text-[11px] text-[#9CA3AF]">{label}</p>}
      <div className="relative">
        {children}
        {locked && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" aria-hidden>
            🔒
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-[11px] font-semibold text-[#C41E24]">◆ {error}</p>}
    </div>
  );
}

function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-[12px] font-semibold press ${
        active ? 'bg-[#C41E24] text-white' : 'bg-[#F3F4F6] text-[#374151]'
      }`}
    >
      {children}
    </button>
  );
}

const PIN_LOCATIONS = {
  413001: 'Solapur, Maharashtra',
  400001: 'Mumbai, Maharashtra',
  110001: 'New Delhi, Delhi',
};

export function AbcdLoanBasicDetails({
  pan,
  gender,
  onGenderChange,
  dob,
  onDobChange,
  employment,
  onEmploymentChange,
  monthlyIncome,
  onMonthlyIncomeChange,
  pincode,
  onPincodeChange,
  email,
  onEmailChange,
  onBack,
  onVerify,
}) {
  const incomeNum = Number(String(monthlyIncome).replace(/\D/g, ''));
  const incomeError =
    monthlyIncome && incomeNum < 10000 ? 'Minimum monthly income should be ₹ 10,000' : null;
  const location = PIN_LOCATIONS[pincode] || (pincode.length === 6 ? 'Maharashtra, India' : '');

  const canVerify = useMemo(() => {
    return (
      gender &&
      dob.length >= 8 &&
      employment &&
      incomeNum >= 10000 &&
      /^\d{6}$/.test(pincode) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );
  }, [gender, dob, employment, incomeNum, pincode, email]);

  return (
    <div className="flex h-full flex-col bg-white">
      <LoanHeader onBack={onBack} />
      <ProgressBlock step={2} />
      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-4 pb-4 pt-4">
        <h2 className="text-[18px] font-bold text-[#1A1A1A]">Verify your personal details</h2>
        <p className="mt-1 text-[11px] leading-snug text-[#6B7280]">
          For your loan application please enter accurate information that matches your KYC
          document.
        </p>

        <div className="mt-4">
          <FieldShell label="Full name as per PAN" locked>
            <input
              readOnly
              value="Jatin"
              className="w-full rounded-xl bg-[#F3F4F6] px-4 py-3.5 text-[14px] font-semibold text-[#1A1A1A] outline-none"
            />
          </FieldShell>
          <FieldShell label="PAN" locked>
            <input
              readOnly
              value={pan}
              className="w-full rounded-xl bg-[#F3F4F6] px-4 py-3.5 text-[14px] font-semibold uppercase text-[#1A1A1A] outline-none"
            />
          </FieldShell>

          <p className="mb-2 text-[13px] font-bold text-[#1A1A1A]">Gender</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {['Male', 'Female', 'Other'].map((g) => (
              <Chip key={g} active={gender === g} onClick={() => onGenderChange?.(g)}>
                {g}
              </Chip>
            ))}
          </div>

          <FieldShell label="Date of birth (Required)">
            <input
              type="text"
              placeholder="DD/MM/YYYY"
              value={dob}
              onChange={(e) => onDobChange?.(e.target.value)}
              className="w-full rounded-xl bg-[#F3F4F6] px-4 py-3.5 text-[14px] text-[#1A1A1A] outline-none"
            />
          </FieldShell>

          <p className="mb-2 text-[13px] font-bold text-[#1A1A1A]">Employment type</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {['Salaried', 'Self-employed'].map((e) => (
              <Chip key={e} active={employment === e} onClick={() => onEmploymentChange?.(e)}>
                {e}
              </Chip>
            ))}
          </div>

          <FieldShell label="Monthly income (Required)" error={incomeError}>
            <input
              type="text"
              inputMode="numeric"
              placeholder="₹0"
              value={monthlyIncome}
              onChange={(ev) => onMonthlyIncomeChange?.(ev.target.value.replace(/[^\d]/g, ''))}
              className="w-full rounded-xl bg-[#F3F4F6] px-4 py-3.5 text-[14px] text-[#1A1A1A] outline-none"
            />
          </FieldShell>

          <FieldShell label="Pincode (Required)">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Pincode (Required)"
              value={pincode}
              onChange={(e) => onPincodeChange?.(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full rounded-xl bg-[#F3F4F6] px-4 py-3.5 text-[14px] text-[#1A1A1A] outline-none"
            />
          </FieldShell>
          {location && (
            <p className="-mt-1 mb-3 text-[11px] font-semibold text-[#C41E24]">📍 {location}</p>
          )}

          <FieldShell label="Email (Required)">
            <input
              type="email"
              placeholder="Email (Required)"
              value={email}
              onChange={(e) => onEmailChange?.(e.target.value)}
              className="w-full rounded-xl bg-[#F3F4F6] px-4 py-3.5 text-[14px] text-[#1A1A1A] outline-none"
            />
          </FieldShell>
        </div>
      </div>
      <div className="shrink-0 border-t border-[#EEEEEE] px-4 py-3">
        <button
          type="button"
          disabled={!canVerify}
          onClick={() =>
            onVerify?.({
              gender,
              dob,
              employment,
              income: incomeNum,
              pincode,
              email,
            })
          }
          className="w-full rounded-full py-3.5 text-[15px] font-bold text-white press disabled:cursor-not-allowed disabled:bg-[#BDBDBD] enabled:bg-[#C41E24]"
        >
          Verify details
        </button>
        <FooterBranding />
      </div>
    </div>
  );
}

export function AbcdLoanOffers({ onBack, onApply }) {
  return (
    <div className="flex h-full flex-col bg-[#FAFAFA]">
      <LoanHeader onBack={onBack} />
      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-4 pb-4 pt-3">
        <p className="text-[11px] text-[#6B7280]">
          ⓘ Ranking based on loan amount provided by lenders
        </p>
        <div className="mt-3 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#1A1A1A]">Loan offers for you</h2>
          <button type="button" className="text-[12px] font-bold text-[#C41E24] press">
            View all →
          </button>
        </div>

        <div className="mt-3 rounded-2xl border border-[#EEEEEE] bg-white p-4 shadow-sm">
          <div className="text-center">
            <p className="text-[22px] font-black italic text-[#1A237E]">fibe</p>
            <p className="text-[12px] font-semibold text-[#6B7280]">Fibe</p>
          </div>
          <div className="mt-3 rounded-xl bg-[#FFF8E1] px-4 py-3 text-center">
            <p className="text-[11px] text-[#6B7280]">Loan amount</p>
            <p className="text-[22px] font-bold text-[#1A1A1A]">₹ 25,988*</p>
          </div>
          <div className="mt-3 space-y-2 border-t border-[#EEEEEE] pt-3 text-[12px]">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Monthly EMI</span>
              <span className="font-bold">₹ 866</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Tenure</span>
              <span className="font-bold">36 months</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">APR</span>
              <span className="font-bold">14.37%</span>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-full bg-[#F3F4F6] py-2.5 text-[12px] font-bold text-[#C41E24] press"
            >
              View KFS →
            </button>
            <button
              type="button"
              onClick={onApply}
              className="flex-1 rounded-full bg-[#C41E24] py-2.5 text-[12px] font-bold text-white press"
            >
              Apply now
            </button>
          </div>
        </div>

        <div className="mx-auto mt-3 h-1 w-8 rounded-full bg-[#C41E24]" />

        <button
          type="button"
          className="mt-4 flex w-full items-center gap-2 rounded-xl border border-[#EEEEEE] bg-white px-3 py-3 text-left press"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF8E1] text-[14px]">
            ?
          </span>
          <span className="flex-1 text-[12px] font-semibold text-[#374151]">
            What are KFS &amp; APR?
          </span>
          <span className="text-[#C41E24]">›</span>
        </button>
        <p className="mt-2 text-[10px] text-[#6B7280]">*Amount is indicative</p>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#F3F4F6] px-3 py-3">
          <p className="flex-1 text-[11px] text-[#6B7280]">
            These lenders were unable to provide an offer at this time.
          </p>
          <div className="flex -space-x-1">
            {['ABCL', 'L&T', 'P'].map((x) => (
              <span
                key={x}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[8px] font-bold shadow-sm"
              >
                {x}
              </span>
            ))}
          </div>
          <span className="text-[#C41E24]">›</span>
        </div>
      </div>
    </div>
  );
}

export function AbcdLoanRedirectSheet({ open, onDone }) {
  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => onDone?.(), 2200);
    return () => clearTimeout(t);
  }, [open, onDone]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-[80] flex items-end bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="w-full rounded-t-[24px] bg-white px-6 pb-8 pt-6 text-center"
          >
            <h3 className="text-[18px] font-bold text-[#1A1A1A]">Redirecting</h3>
            <p className="mt-2 text-[13px] text-[#6B7280]">
              We are now sending your application to our lending partner
            </p>
            <p className="mt-4 text-[24px] font-black italic text-[#1A237E]">fibe</p>
            <p className="text-[12px] font-semibold text-[#6B7280]">Fibe</p>
            <div className="mt-6 flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 animate-pulse rounded-full bg-[#C41E24]"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AbcdLoanMpinStep({ onBack, onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (pin.length !== 4) return;
    if (pin === DEMO_MPIN) onSuccess?.();
    else {
      setError('Wrong MPIN. Try again.');
      setTimeout(() => {
        setPin('');
        setError(null);
      }, 400);
    }
  }, [pin, onSuccess]);

  return (
    <div className="flex h-full flex-col bg-white">
      <LoanHeader title="Confirm with MPIN" onBack={onBack} />
      <ProgressBlock step={5} label="Agreement & Disbursal" />
      <div className="flex flex-1 flex-col items-center px-4 pt-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF8E1] text-[28px]">
          🔐
        </div>
        <h2 className="mt-4 text-[18px] font-bold text-[#1A1A1A]">Enter MPIN to complete</h2>
        <p className="mt-2 max-w-[280px] text-center text-[12px] text-[#6B7280]">
          Authorise your personal loan application with the 4-digit MPIN you set during
          registration.
        </p>
        <div className="mt-6 flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#E5E7EB] bg-[#F9FAFB]"
            >
              {i < pin.length ? <span className="h-3 w-3 rounded-full bg-[#C41E24]" /> : null}
            </div>
          ))}
        </div>
        {error && <p className="mt-2 text-[12px] font-semibold text-[#C41E24]">{error}</p>}
        <p className="mt-2 text-[11px] text-[#9CA3AF]">Demo MPIN: 1234</p>
        <div className="mt-6 grid w-full max-w-[260px] grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, idx) =>
            k === '' ? (
              <span key={idx} />
            ) : (
              <button
                key={k}
                type="button"
                onClick={() => {
                  if (k === '⌫') setPin((p) => p.slice(0, -1));
                  else if (pin.length < 4) setPin((p) => p + k);
                }}
                className="rounded-xl bg-[#F3F4F6] py-3 text-[16px] font-bold text-[#1A1A1A] press"
              >
                {k}
              </button>
            ),
          )}
        </div>
      </div>
      <div className="shrink-0 px-4 py-3">
        <FooterBranding />
      </div>
    </div>
  );
}

export function AbcdLoanSuccess({ onDone }) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-white px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#E8F5E9] text-[40px]">
        ✓
      </div>
      <h2 className="mt-4 text-[20px] font-bold text-[#1A1A1A]">Application submitted!</h2>
      <p className="mt-2 text-[13px] leading-snug text-[#6B7280]">
        Your personal loan application has been sent to Fibe. Funds will be credited after final
        lender approval.
      </p>
      <p className="mt-4 rounded-xl bg-[#FFF8E1] px-4 py-3 text-[12px] font-semibold text-[#5D4037]">
        Reference: PL-{Date.now().toString().slice(-8)}
      </p>
      <button
        type="button"
        onClick={onDone}
        className="mt-8 w-full max-w-[280px] rounded-full bg-[#C41E24] py-3.5 text-[15px] font-bold text-white press"
      >
        Back to Home
      </button>
      <FooterBranding />
    </div>
  );
}
