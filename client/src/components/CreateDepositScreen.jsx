import React, { useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoanAguiPanel from './LoanAguiPanel.jsx';
import MpinSheet from './MpinSheet.jsx';
import { DEPOSIT_AGUI_AGENT_ID } from '../lib/aguiClient.js';
import { useRageDetect } from '../hooks/useRageDetect.js';
import RMHelpPrompt from './RMHelpPrompt.jsx';
import { CompanyAppHeader } from '../shared/ui/CompanyAppHeader.jsx';

function computeInterestRate(years, months, days) {
  const totalDays = years * 365 + months * 30 + days;
  if (totalDays < 181) return 0.0;
  if (totalDays < 270) return 4.5;
  if (totalDays < 365) return 4.75;
  if (totalDays < 365 * 1 + 1) return 7.9;
  if (totalDays < 365 * 2) return 7.5;
  if (totalDays < 365 * 3) return 7.25;
  if (totalDays < 365 * 5) return 7.0;
  return 6.75;
}

function computeMaturity(amount, years, months, days, rate) {
  const totalDays = years * 365 + months * 30 + days;
  if (totalDays < 1 || !amount || !rate) return { amount: 0, interest: 0, date: null };
  const maturityAmount = amount * Math.pow(1 + rate / 100 / 365, totalDays);
  const maturityDate = new Date();
  maturityDate.setDate(maturityDate.getDate() + totalDays);
  return { amount: maturityAmount, interest: maturityAmount - amount, date: maturityDate };
}

function formatInr(n) {
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatInrFull(n) {
  return `₹ ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d) {
  if (!d) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const MATURITY_OPTIONS = [
  { id: 'renew', label: 'Renew Principal Amount', short: 'Renew Principal', desc: 'Your original deposit is renewed for the same tenure. Interest is credited separately.' },
  { id: 'savings', label: 'Credit to Savings Account', short: 'Credit to Savings', desc: 'Principal and earned interest are credited to your savings account.' },
  { id: 'linked', label: 'Transfer to Linked Account', short: 'Transfer to Linked', desc: 'The maturity amount is transferred to your linked bank account.' },
];

const PRODUCTS = [
  {
    id: 'fd',
    name: 'DCB Fixed Deposit',
    features: [
      'Competitive Interest Rates',
      'Compounding Power',
      'Flexible Tenure Options',
      'Flexible Interest Payment Options',
    ],
    graphic: 'chart',
  },
  {
    id: 'rd',
    name: 'DCB Pragati Recurring Deposit',
    features: ['Set Your Target', 'Effortless Savings', 'Grow Your Wealth', 'Payment Flexibility'],
    graphic: 'people',
  },
];

function ProductGraphic({ type }) {
  if (type === 'people') {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 11a3 3 0 100-6 3 3 0 000 6zM8 11a3 3 0 100-6 3 3 0 000 6zm8 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5c0-2.3-4.7-3.5-7-3.5zM8 13c-.3 0-.6 0-1 .1C4.7 13.6 2 14.7 2 16.5V19h5v-2.5c0-.9.3-2.2 1.4-3.2-.1 0-.3-.3-.4-.3z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex h-16 w-16 items-end justify-center gap-1 pb-2">
      {[10, 16, 22, 28, 34].map((h, i) => (
        <span
          key={i}
          className="w-2.5 rounded-t-sm"
          style={{
            height: h,
            background: `hsl(${175 + i * 12}, 55%, ${42 + i * 5}%)`,
          }}
        />
      ))}
    </div>
  );
}

const BALANCE = 352089.79;

function resolveDepositProduct(value) {
  const v = String(value || '').toLowerCase();
  if (/\b(rd|recurring|pragati)\b/.test(v) || /recurring\s*deposit/.test(v)) return 'rd';
  if (/\b(fd|fixed)\b/.test(v) || /fixed\s*deposit/.test(v)) return 'fd';
  // MMD is not on this DCB menu — treat as Fixed Deposit only when explicitly requested.
  if (/\bmmd\b|money\s*multiplier/.test(v)) return 'fd';
  // Unknown / empty — do not guess; keep the customer on the product menu.
  return null;
}

export default function CreateDepositScreen({ onClose, onNavigate, lang, aiPrimer: aiPrimerProp, voiceAssist = false }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [phase, setPhase] = useState('select'); // select | form | returns | maturityInfo | mpin | success
  const [years, setYears] = useState(1);
  const [months, setMonths] = useState(0);
  const [days, setDays] = useState(0);
  const [amount, setAmount] = useState(10000);
  const [taxSaver, setTaxSaver] = useState(false);
  const [durationMode, setDurationMode] = useState('duration'); // duration | maturity
  const [maturityInstr, setMaturityInstr] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showRates, setShowRates] = useState(false);
  const [mpinOpen, setMpinOpen] = useState(false);
  const [rmPromptOpen, setRmPromptOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(() => !!aiPrimerProp || voiceAssist);
  // Always force FD vs RD choice on the Term Deposit menu — never inherit a
  // product-skipping primer from home (e.g. "Customer wants fixed deposit").
  const [aiPrimer] = useState(() => {
    if (!aiPrimerProp && !voiceAssist) return null;
    const src = String(aiPrimerProp || '');
    const amountHint = src.match(/₹\s*([\d]+)/)?.[1];
    const tenureHint = src.match(/(\d+)\s*(year|years|yr|yrs|month|months|mo)\b/i);
    let text =
      'Customer is on the DCB Term Deposit menu with two on-screen options: DCB Fixed Deposit and DCB Pragati Recurring Deposit. Ask which one they want. Do NOT call set_field(depositType) until they clearly choose. After they choose, help fill the deposit form step by step.';
    if (amountHint || tenureHint) {
      text += ' After product selection, reuse any amount/tenure already mentioned.';
      if (amountHint) text += ` Amount mentioned: ₹${amountHint}.`;
      if (tenureHint) text += ` Tenure mentioned: ${tenureHint[0]}.`;
    }
    return text;
  });
  // Block auto-select on the primer turn — only accept depositType after the customer speaks.
  const userRepliedRef = useRef(false);

  const formStateRef = useRef({ depositType: null, amount: 10000, years: 1, months: 0, days: 0 });

  const { containerProps: rageProps, dismiss: dismissRage } = useRageDetect({
    onFrustrated: () => {
      if (!aiOpen) setRmPromptOpen(true);
    },
  });

  const rate = useMemo(() => computeInterestRate(years, months, days), [years, months, days]);
  const maturity = useMemo(
    () => computeMaturity(amount, years, months, days, rate),
    [amount, years, months, days, rate],
  );

  const setFvFromAgent = useCallback((field, value) => {
    if (field === 'depositType') {
      // Primer turn must not auto-open a form — wait until the customer speaks.
      if (!userRepliedRef.current) return;
      const id = resolveDepositProduct(value);
      // Ignore ambiguous depositType until the customer clearly picks FD or RD.
      if (!id) return;
      setSelectedProduct(id);
      formStateRef.current.depositType = id;
      setPhase('form');
      // Stay in Voice Assist while filling the form.
      setAiOpen(true);
    } else if (field === 'amount') {
      const n = parseFloat(String(value)) || 10000;
      setAmount(Math.max(1000, n));
      formStateRef.current.amount = n;
    } else if (field === 'years') {
      const n = Math.min(10, Math.max(0, parseInt(value) || 0));
      setYears(n);
      formStateRef.current.years = n;
    } else if (field === 'months') {
      const n = Math.min(11, Math.max(0, parseInt(value) || 0));
      setMonths(n);
      formStateRef.current.months = n;
    } else if (field === 'days') {
      const n = Math.min(30, Math.max(0, parseInt(value) || 0));
      setDays(n);
      formStateRef.current.days = n;
    }
  }, []);

  const handleUserMessage = useCallback((text) => {
    if (String(text || '').trim()) userRepliedRef.current = true;
    return false;
  }, []);

  const handleToolCall = useCallback(
    (toolName, args) => {
      if (toolName === 'set_field') {
        setFvFromAgent(args.field, args.value);
      } else if (toolName === 'submit_deposit') {
        setPhase('returns');
        setMpinOpen(true);
      } else if (toolName === 'navigate_to') {
        const { destination, context, routingStatus } = args;
        onNavigate?.(destination, context || '', routingStatus || '');
      }
    },
    [setFvFromAgent, onNavigate],
  );

  const openProduct = (id) => {
    setSelectedProduct(id);
    formStateRef.current.depositType = id;
    setPhase('form');
  };

  const handleBack = () => {
    if (phase === 'success' || phase === 'select') onClose();
    else if (phase === 'form') setPhase('select');
    else if (phase === 'returns' || phase === 'maturityInfo') setPhase('form');
    else onClose();
  };

  const selectedMaturity = MATURITY_OPTIONS.find((o) => o.id === maturityInstr);

  const pinkField =
    'w-full rounded-xl bg-[#F8E8E0] px-3 py-2.5 text-[15px] font-semibold text-[#1A237E] outline-none border-0';

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="absolute inset-0 z-40 flex flex-col bg-[#F5F7FA]"
      {...rageProps}
    >
      {phase === 'select' ? (
        <CompanyAppHeader title="Term Deposit" onBack={onClose} onHome={onClose} />
      ) : phase === 'success' ? null : phase === 'mpin' || mpinOpen ? (
        <CompanyAppHeader title="Confirm with MPIN" onBack={handleBack} onHome={onClose} />
      ) : (
        <CompanyAppHeader title="Open New Deposit" onBack={handleBack} onHome={onClose} />
      )}

      <div className="relative flex-1 overflow-y-auto no-scrollbar pb-20">
        <AnimatePresence mode="wait">
          {/* ── Product selection ── */}
          {phase === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 px-4 pb-4 pt-4"
            >
              {PRODUCTS.map((prod) => (
                <div
                  key={prod.id}
                  className="rounded-2xl border border-[#C5CAE9] bg-white p-4 shadow-[0_2px_12px_rgba(26,35,126,0.06)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[15px] font-bold text-[#1A237E]">{prod.name}</h2>
                      <ul className="mt-3 space-y-1.5">
                        {prod.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-[12px] text-[#1A237E]">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-[#FFD600]" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <ProductGraphic type={prod.graphic} />
                  </div>
                  <button
                    type="button"
                    onClick={() => openProduct(prod.id)}
                    className="mt-4 rounded-xl bg-[#1A237E] px-5 py-2.5 text-[13px] font-bold text-white shadow press"
                  >
                    Apply Now
                  </button>
                </div>
              ))}
            </motion.div>
          )}

          {/* ── Form ── */}
          {(phase === 'form' || phase === 'returns' || phase === 'maturityInfo') && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="px-4 pb-4 pt-2"
            >
              {/* Balance bar */}
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-[#E8EDF5] px-3 py-2.5">
                <span className="h-5 w-0.5 bg-[#1A237E]" />
                <p className="text-[18px] font-bold text-[#1A237E]">{formatInrFull(BALANCE)}</p>
              </div>

              <input
                type="number"
                value={amount}
                min={1000}
                onChange={(e) => setAmount(Math.max(1000, parseFloat(e.target.value) || 1000))}
                className={`${pinkField} mb-2`}
                aria-label="Deposit amount"
              />
              <input
                type="text"
                value={amount}
                readOnly
                className={`${pinkField} mb-3 opacity-90`}
                aria-label="Deposit amount confirm"
              />

              <div className="mb-3 flex items-center justify-between gap-2">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={taxSaver}
                    onChange={(e) => setTaxSaver(e.target.checked)}
                    className="h-4 w-4 accent-[#1A237E]"
                  />
                  <span className="text-[13px] font-semibold text-[#1A237E]">Tax Saver</span>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1565C0] text-[9px] font-bold text-white">
                    i
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowRates((v) => !v)}
                  className="text-[12px] font-semibold text-[#1565C0] underline"
                >
                  Check Interest Rates
                </button>
              </div>

              {showRates && (
                <div className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600">
                  Up to <strong className="text-[#1A237E]">7.90% p.a.</strong> for 1-year tenure. Senior citizens may get additional benefits.
                </div>
              )}

              <div className="mb-3 flex items-center gap-5">
                <label className="flex cursor-pointer items-center gap-2">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                      durationMode === 'duration' ? 'border-[#1A237E]' : 'border-slate-400'
                    }`}
                  >
                    {durationMode === 'duration' && <span className="h-2 w-2 rounded-full bg-[#1A237E]" />}
                  </span>
                  <button type="button" onClick={() => setDurationMode('duration')} className="text-[13px] font-semibold text-[#1A237E]">
                    Deposit Duration
                  </button>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                      durationMode === 'maturity' ? 'border-[#1A237E]' : 'border-slate-400'
                    }`}
                  >
                    {durationMode === 'maturity' && <span className="h-2 w-2 rounded-full bg-[#1A237E]" />}
                  </span>
                  <button type="button" onClick={() => setDurationMode('maturity')} className="text-[13px] font-semibold text-[#1A237E]">
                    Maturity Date
                  </button>
                </label>
              </div>

              <div className="mb-2 grid grid-cols-3 gap-2">
                {[
                  { label: 'Year', value: years, set: setYears, max: 10 },
                  { label: 'Month', value: months, set: setMonths, max: 11 },
                  { label: 'Days', value: days, set: setDays, max: 30 },
                ].map((f) => (
                  <div key={f.label}>
                    <input
                      type="number"
                      value={f.value}
                      min={0}
                      max={f.max}
                      onChange={(e) => f.set(Math.min(f.max, Math.max(0, parseInt(e.target.value) || 0)))}
                      className={`${pinkField} text-center`}
                      aria-label={f.label}
                    />
                    <p className="mt-0.5 text-center text-[10px] text-slate-500">{f.label}</p>
                  </div>
                ))}
              </div>

              <div className="mb-3 rounded-xl bg-[#E8EDF5] px-3 py-2.5 text-[14px] font-semibold text-[#1A237E]">
                {formatDate(maturity.date)}
              </div>

              {/* Estimated returns (shown after amount/tenure set) */}
              {phase === 'returns' || amount >= 1000 ? (
                <div className="mb-3 rounded-xl bg-[#ECEFF5] px-3.5 py-3">
                  <p className="text-[11px] font-bold tracking-wide text-[#5E35B1]">ESTIMATED RETURNS</p>
                  <div className="mt-2 space-y-1.5 text-[13px]">
                    <div className="flex justify-between text-[#1A237E]">
                      <span>Principal</span>
                      <span className="font-semibold">{formatInr(amount)}</span>
                    </div>
                    <div className="flex justify-between text-[#1A237E]">
                      <span>Rate</span>
                      <span className="font-semibold">{rate.toFixed(1)}% p.a.</span>
                    </div>
                    <div className="flex justify-between text-[#1A237E]">
                      <span>Tenure</span>
                      <span className="font-semibold">
                        {years > 0 ? `${years} year${years > 1 ? 's' : ''}` : ''}
                        {months > 0 ? ` ${months} mo` : ''}
                        {days > 0 ? ` ${days} d` : ''}
                      </span>
                    </div>
                    <div className="my-1.5 border-t border-slate-300/80" />
                    <div className="flex justify-between">
                      <span className="text-[#1A237E]">Interest Earned</span>
                      <span className="font-bold text-[#2E7D32]">{formatInr(Math.round(maturity.interest))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-[#1A237E]">Maturity Value</span>
                      <span className="font-bold text-[#2E7D32]">{formatInr(Math.round(maturity.amount))}</span>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Maturity instructions */}
              <p className="mb-1 text-[12px] font-semibold text-[#1A237E]">Maturity Instructions*</p>
              <div className="relative mb-2">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className={`${pinkField} flex items-center justify-between text-left`}
                >
                  <span className={selectedMaturity ? '' : 'font-medium text-[#1A237E]/60'}>
                    {selectedMaturity?.label || 'Select an option'}
                  </span>
                  <span className="text-[#1A237E]">▾</span>
                </button>
                {dropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    {MATURITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setMaturityInstr(opt.id);
                          setDropdownOpen(false);
                          setPhase('maturityInfo');
                        }}
                        className="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2.5 text-left text-[13px] text-[#1A237E] last:border-0 hover:bg-slate-50"
                      >
                        {opt.label}
                        {maturityInstr === opt.id && (
                          <span className="h-2.5 w-2.5 rounded-full bg-[#7C4DFF]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {phase === 'maturityInfo' && (
                <div className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <p className="text-[11px] font-bold tracking-wide text-[#1A237E]">WHAT HAPPENS AT MATURITY?</p>
                  <div className="mt-2 grid grid-cols-[1fr_1.4fr] gap-x-2 gap-y-2 text-[10px]">
                    <p className="font-bold text-slate-500">OPTION</p>
                    <p className="font-bold text-slate-500">WHAT HAPPENS AT MATURITY</p>
                    {MATURITY_OPTIONS.map((opt) => (
                      <React.Fragment key={opt.id}>
                        <p className={`font-bold ${maturityInstr === opt.id ? 'text-[#7C4DFF]' : 'text-[#1A237E]'}`}>
                          {opt.short}
                        </p>
                        <p className="text-slate-600">{opt.desc}</p>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={!maturityInstr || amount < 1000}
                onClick={() => {
                  setPhase('returns');
                  setMpinOpen(true);
                }}
                className="mt-2 w-full rounded-xl bg-[#1A237E] py-3 text-[14px] font-bold text-white shadow disabled:opacity-40 press"
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* ── Success ── */}
          {phase === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center px-6 pt-16 text-center"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#28A745] text-white shadow-lg">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="mt-5 text-[22px] font-bold text-[#1A237E]">Congratulations!</h2>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
                Your deposit request has been submitted successfully. You will receive a confirmation shortly. Thank
                you for banking with DCB Bank.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-8 w-full rounded-full bg-[#1A237E] py-3.5 text-[15px] font-bold text-white shadow press"
              >
                Back to Home
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 rounded-full bg-slate-200/80 px-5 py-2 text-[12px] font-semibold text-slate-600"
              >
                No, I&apos;m good
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MPIN overlay styled like mock */}
      <AnimatePresence>
        {mpinOpen && (
          <motion.div
            key="mpin-dcb"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col bg-[#B3D4FC]/40 backdrop-blur-[1px]"
          >
            <CompanyAppHeader
              title="Confirm with MPIN"
              onBack={() => {
                setMpinOpen(false);
                setPhase('form');
              }}
              onHome={onClose}
            />
            <div className="flex flex-1 flex-col px-4 pt-4">
              <div className="rounded-2xl bg-white px-4 py-5 shadow-lg">
                <MpinInline
                  onSuccess={() => {
                    setMpinOpen(false);
                    setPhase('success');
                  }}
                  onCancel={() => {
                    setMpinOpen(false);
                    setPhase('form');
                  }}
                />
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-[11px] font-bold tracking-wide text-slate-500">DEPOSIT SUMMARY</p>
                  <div className="mt-2 divide-y divide-slate-100">
                    {[
                      ['Amount', formatInr(amount)],
                      ['Interest Rate', `${rate.toFixed(2)}% p.a.`],
                      ['Tenure', years === 1 && !months && !days ? '1 Year' : `${years}Y ${months}M ${days}D`],
                      ['Maturity Value', formatInr(Math.round(maturity.amount))],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between py-2.5 text-[13px]">
                        <span className="text-slate-500">{k}</span>
                        <span className="font-bold text-[#1A237E]">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden legacy MpinSheet unused — keep import path for AI flows that may open it */}
      <MpinSheet open={false} lang={lang} onCancel={() => {}} onSuccess={() => {}} />

      <RMHelpPrompt
        open={rmPromptOpen}
        onHelp={() => {
          setRmPromptOpen(false);
          dismissRage();
          setAiOpen(true);
        }}
        onDismiss={() => {
          setRmPromptOpen(false);
          dismissRage();
        }}
      />

      {!aiOpen && phase !== 'mpin' && phase !== 'success' && !mpinOpen && (
        <button
          type="button"
          onClick={() => setAiOpen(true)}
          className="absolute bottom-6 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-200/80 bg-white text-xl shadow-lg"
          aria-label="Open AI Assistant"
        >
          🧑‍💼
        </button>
      )}

      {phase !== 'success' && !mpinOpen && (
        <LoanAguiPanel
          agentId={DEPOSIT_AGUI_AGENT_ID}
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          greeting={
            phase === 'select'
              ? 'I can see two options on your screen — DCB Fixed Deposit and DCB Pragati Recurring Deposit. Which one would you like to open?'
              : 'Great — I will help you fill this deposit form. How much would you like to deposit?'
          }
          assistTitle={voiceAssist ? 'AI Assistant · Voice Assist' : 'AI Assistant'}
          assistHint={
            voiceAssist
              ? 'I will speak and listen — answer hands-free after I finish.'
              : 'Voice or text — I will fill it for you'
          }
          primer={aiPrimer || null}
          formValues={formStateRef.current}
          onToolCall={handleToolCall}
          onUserMessage={handleUserMessage}
          lang={lang}
          voiceAssist={voiceAssist}
        />
      )}
    </motion.div>
  );
}

/** Compact inline 4-digit MPIN matching Confirm with MPIN mock */
function MpinInline({ onSuccess, onCancel }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const DEMO = '1234';

  React.useEffect(() => {
    if (pin.length !== 4) return;
    if (pin === DEMO) onSuccess();
    else {
      setError('Wrong MPIN. Try again.');
      setTimeout(() => {
        setPin('');
        setError(null);
      }, 400);
    }
  }, [pin, onSuccess]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50"
          >
            {i < pin.length ? <span className="h-3 w-3 rounded-full bg-[#1A237E]" /> : null}
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-500">
        Enter the 4-digit MPIN you set during registration.
      </p>
      {error && <p className="mt-1 text-[11px] font-semibold text-red-600">{error}</p>}
      <div className="mt-4 grid w-full max-w-[240px] grid-cols-3 gap-2">
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
              className="rounded-xl bg-slate-100 py-2.5 text-[16px] font-bold text-[#1A237E] press hover:bg-slate-200"
            >
              {k}
            </button>
          ),
        )}
      </div>
      <button type="button" onClick={onCancel} className="mt-3 text-[12px] font-semibold text-slate-500">
        Cancel
      </button>
    </div>
  );
}
