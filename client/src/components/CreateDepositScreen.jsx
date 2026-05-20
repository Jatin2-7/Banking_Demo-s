import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoanAguiPanel from './LoanAguiPanel.jsx';
import MpinSheet from './MpinSheet.jsx';
import { DEPOSIT_AGUI_AGENT_ID } from '../lib/aguiClient.js';
import { useRageDetect } from '../hooks/useRageDetect.js';
import RMHelpPrompt from './RMHelpPrompt.jsx';

/* ─── Interest rate lookup (simplified) ─── */
function computeInterestRate(years, months, days) {
  const totalDays = years * 365 + months * 30 + days;
  if (totalDays < 181) return 0.0;
  if (totalDays < 270) return 4.5;
  if (totalDays < 365) return 4.75;
  if (totalDays < 365 * 1 + 1) return 6.1;
  if (totalDays < 365 * 2) return 6.2;
  if (totalDays < 365 * 3) return 6.15;
  if (totalDays < 365 * 5) return 6.05;
  return 6.0;
}

function computeMaturity(amount, years, months, days, rate) {
  const totalDays = years * 365 + months * 30 + days;
  if (totalDays < 1 || !amount || !rate) return { amount: 0, date: null };
  const maturityAmount = amount * Math.pow(1 + rate / 100 / 365, totalDays);
  const maturityDate = new Date();
  maturityDate.setDate(maturityDate.getDate() + totalDays);
  return { amount: maturityAmount, date: maturityDate };
}

function formatInr(n) {
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d) {
  if (!d) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTenure(y, m, d) {
  const parts = [];
  if (y) parts.push(`${y}Y`);
  if (m) parts.push(`${m}M`);
  if (d) parts.push(`${d}D`);
  return parts.length ? parts.join('-') : '0';
}

/* ─── Slider ─── */
function SliderInput({ label, value, min, max, onChange, unit }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700">{label} *</label>
        <span className="text-xs font-bold text-[#003D7C]">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-1 w-full cursor-pointer accent-[#003D7C]"
      />
      <div className="flex justify-between text-[9px] text-slate-400">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

/* ─── Product card ─── */
const PRODUCTS = [
  {
    id: 'fd',
    name: 'Fixed Deposit',
    rateLabel: '4.50 % - 6.60 %',
    color: 'from-blue-600 to-blue-800',
    illustration: (
      <div className="flex items-center justify-center text-4xl">💰</div>
    ),
  },
  {
    id: 'mmd',
    name: 'Money Multiplier Deposit',
    rateLabel: '4.50 % - 6.60 %',
    color: 'from-emerald-600 to-teal-700',
    illustration: (
      <div className="flex items-center justify-center text-4xl">🌱</div>
    ),
    badge: true,
  },
  {
    id: 'rd',
    name: 'Recurring Deposit',
    rateLabel: '4.50 % - 6.20 %',
    color: 'from-purple-600 to-indigo-700',
    illustration: (
      <div className="flex items-center justify-center text-4xl">📅</div>
    ),
  },
];

/* ─── Main component ─── */
export default function CreateDepositScreen({ onClose, onNavigate, lang, aiPrimer }) {
  /* form state */
  const [selectedProduct, setSelectedProduct] = useState(null); // 'fd' | 'mmd' | 'rd'
  const [phase, setPhase] = useState('select'); // 'select' | 'form' | 'review' | 'mpin' | 'success'
  const [years, setYears] = useState(1);
  const [months, setMonths] = useState(6);
  const [days, setDays] = useState(0);
  const [amount, setAmount] = useState(1000);
  const [agreedTnc, setAgreedTnc] = useState(false);
  const [mpinOpen, setMpinOpen] = useState(false);
  const [rmPromptOpen, setRmPromptOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(true);

  /* ag-ui ref for form sync */
  const formStateRef = useRef({ depositType: null, amount: 1000, years: 1, months: 6, days: 0 });

  const { containerProps: rageProps, dismiss: dismissRage } = useRageDetect({
    onFrustrated: () => { if (!aiOpen) setRmPromptOpen(true); },
  });

  /* ─── Computed values ─── */
  const rate = useMemo(() => computeInterestRate(years, months, days), [years, months, days]);
  const maturity = useMemo(() => computeMaturity(amount, years, months, days, rate), [amount, years, months, days, rate]);
  const totalDays = years * 365 + months * 30 + days;
  const minTenureMet = selectedProduct === 'mmd' ? totalDays >= 365 + 6 * 30 : totalDays >= 181;

  /* ─── AI tool call handler ─── */
  const setFvFromAgent = useCallback((field, value) => {
    if (field === 'depositType') {
      const id = String(value).toLowerCase();
      setSelectedProduct(id);
      formStateRef.current.depositType = id;
      setPhase('form');
    } else if (field === 'amount') {
      const n = parseFloat(String(value)) || 1000;
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

  const handleToolCall = useCallback((toolName, args) => {
    if (toolName === 'set_field') {
      setFvFromAgent(args.field, args.value);
    } else if (toolName === 'submit_deposit') {
      setAgreedTnc(true);
      setPhase('review');
    } else if (toolName === 'navigate_to') {
      const { destination, context, routingStatus } = args;
      onNavigate?.(destination, context || '', routingStatus || '');
    }
  }, [setFvFromAgent, onNavigate]);

  /* ─── MPIN ─── */
  const handleMpinSuccess = () => {
    setMpinOpen(false);
    setPhase('success');
  };

  /* ─── Select product ─── */
  const openProduct = (id) => {
    setSelectedProduct(id);
    formStateRef.current.depositType = id;
    setPhase('form');
  };

  const productInfo = PRODUCTS.find((p) => p.id === selectedProduct);
  const productDisplayName = productInfo?.name || 'Deposit';

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="absolute inset-0 z-40 flex flex-col bg-white"
      {...rageProps}
    >
      {/* Header */}
      <div className="shrink-0 bg-gradient-to-r from-[#003D7C] to-[#0055B3]">
        <div className="flex items-center gap-3 px-3 pt-2 pb-1.5">
          <button
            type="button"
            onClick={phase !== 'select' && phase !== 'success' ? () => setPhase('select') : onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="flex-1 text-base font-bold text-white">Create a Deposit</h1>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bank-gold text-bank-purpleDeep hover:opacity-90"
            aria-label="Home"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ── Product selection ── */}
          {phase === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 pb-4 pt-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700">Choose Your Deposit Plan</p>
                <div className="flex flex-col items-end gap-0.5">
                  <button type="button" className="text-[10px] font-semibold text-[#003D7C] hover:underline">DEPOSIT CALCULATOR</button>
                  <button type="button" className="text-[10px] font-semibold text-[#003D7C] hover:underline">VIEW DEPOSIT INTEREST RATES</button>
                </div>
              </div>

              <div className="mt-3 space-y-4">
                {PRODUCTS.map((prod) => (
                  <div key={prod.id} className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    {prod.badge && (
                      <div className="flex items-center justify-center gap-2 bg-red-600 py-1.5">
                        <span className="text-[10px] font-bold italic text-white tracking-wide">Special Products Available</span>
                      </div>
                    )}
                    <div className="bg-white px-4 py-4">
                      <p className="text-center text-base font-bold text-slate-800">{prod.name}</p>
                      <div className="my-3 flex h-20 items-center justify-center">{prod.illustration}</div>
                      <p className="text-center text-xs text-slate-500">Interest Rates</p>
                      <p className="text-center text-lg font-black text-slate-800">{prod.rateLabel}</p>
                      <button
                        type="button"
                        onClick={() => openProduct(prod.id)}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#003D7C] px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-[#0055B3] active:scale-[0.98]"
                      >
                        Open Now
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-40" />
            </motion.div>
          )}

          {/* ── Form ── */}
          {phase === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="px-4 pb-4 pt-3"
            >
              {/* Selected account */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#003D7C]">Selected account</p>
                  <button type="button" className="text-xs font-semibold text-[#003D7C] hover:underline">Change</button>
                </div>
                <div className="mt-1.5 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bank-gold font-bold text-xs text-bank-purpleDeep">
                    PA
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Prateek Agrawal</p>
                    <p className="text-[10px] text-slate-500">XXXXXX1762 — Savings</p>
                    <p className="text-[10px] font-semibold text-slate-600">₹2,51,000.00</p>
                  </div>
                  <div className="ml-auto flex items-center gap-0.5">
                    <div className="h-4 w-4 rounded-full border-2 border-[#003D7C] bg-[#003D7C] flex items-center justify-center">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-[9px] font-semibold text-bank-gold">Primary</span>
                  </div>
                </div>
              </div>

              {/* Form title */}
              <div className="mt-3 rounded-xl border border-[#003D7C]/20 bg-[#003D7C]/5 px-3 py-2">
                <p className="text-xs font-bold text-[#003D7C]">Set your {productDisplayName} Amount and Tenure</p>
                <p className="mt-1 text-[10px] text-slate-500">
                  NOTE: You are eligible for interest rate applicable to public who is a resident of India.
                </p>
              </div>

              {/* Tenure sliders */}
              <div className="mt-3 space-y-3">
                <SliderInput label="Years" value={years} min={0} max={10} onChange={setYears} unit=" yr" />
                <SliderInput label="Months" value={months} min={0} max={11} onChange={setMonths} unit=" mo" />
                <SliderInput label="Days" value={days} min={0} max={30} onChange={setDays} unit=" d" />
              </div>

              {/* Min/Max tenure */}
              <div className="mt-2 rounded-lg bg-slate-50 px-2 py-1.5 text-[10px] text-slate-500">
                <p>Min Tenure (D-M-Y): {selectedProduct === 'mmd' ? '1-6-0' : '0-6-0'}</p>
                <p>Max Tenure (D-M-Y): 0-0-10</p>
              </div>

              {!minTenureMet && selectedProduct === 'mmd' && (
                <div className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10px] text-amber-700">
                  MMD requires a minimum tenure of 1 year 6 months.
                </div>
              )}

              {/* Amount */}
              <div className="mt-3">
                <label className="text-xs font-semibold text-slate-700">Deposit Amount *</label>
                <input
                  type="number"
                  value={amount}
                  min={1000}
                  max={29999999}
                  onChange={(e) => setAmount(Math.max(1000, parseFloat(e.target.value) || 1000))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-[#003D7C] focus:outline-none"
                />
                <div className="mt-1 flex justify-between text-[9px] text-slate-400">
                  <span>Min Amount: 1,000.00</span>
                  <span>Max Amount: 2,99,99,999.00</span>
                </div>
              </div>

              {/* Live calculation */}
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Maturity Date</span>
                  <span className="font-bold text-slate-800">{formatDate(maturity.date)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Interest Rate</span>
                  <span className="font-bold text-slate-800">{rate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Maturity Amount</span>
                  <span className="font-bold text-[#003D7C]">{maturity.amount > 0 ? formatInr(maturity.amount) : '—'}</span>
                </div>
              </div>

              {/* T&C */}
              <label className="mt-3 flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={agreedTnc}
                  onChange={(e) => setAgreedTnc(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-[#003D7C]"
                />
                <span className="text-[11px] text-slate-600">I have read all the Terms &amp; Conditions</span>
              </label>

              {/* Actions */}
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPhase('select')}
                  className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!agreedTnc || !minTenureMet || amount < 1000}
                  onClick={() => setPhase('review')}
                  className="flex-1 rounded-lg bg-[#003D7C] py-2.5 text-sm font-bold text-white shadow disabled:opacity-40 hover:bg-[#0055B3] active:scale-[0.98]"
                >
                  Continue
                </button>
              </div>
              <div className="h-44" />
            </motion.div>
          )}

          {/* ── Success ── */}
          {phase === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center gap-4 px-6 pt-16 text-center"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl shadow-lg">
                🎉
              </div>
              <h2 className="text-xl font-black text-slate-800">Deposit Opened!</h2>
              <p className="text-sm text-slate-600">
                Your {productDisplayName} of {formatInr(amount)} has been successfully created.
              </p>
              <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Product</span>
                  <span className="font-bold text-slate-800">{productDisplayName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-bold text-[#003D7C]">{formatInr(amount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Tenure</span>
                  <span className="font-bold text-slate-800">{formatTenure(years, months, days)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Maturity Amount</span>
                  <span className="font-bold text-green-700">{formatInr(maturity.amount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Maturity Date</span>
                  <span className="font-bold text-slate-800">{formatDate(maturity.date)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 w-full rounded-xl bg-[#003D7C] py-3 text-sm font-bold text-white shadow hover:bg-[#0055B3]"
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Review modal */}
      <AnimatePresence>
        {phase === 'review' && (
          <motion.div
            key="review-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-end justify-center bg-black/40"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="w-full rounded-t-2xl bg-white px-4 py-5 shadow-xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">Review &amp; Confirm the Details</p>
                <button
                  type="button"
                  onClick={() => setPhase('form')}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  ['From', `Savings | XXXXXX1762 — ₹2,51,000.00`],
                  ['Deposit Amount', formatInr(amount)],
                  ['Product', productDisplayName],
                  ['Tenure', `${years}Y-${months}M-${days}D`],
                  ['Interest Rate', `${rate.toFixed(2)}%`],
                  ['Maturity Amount', formatInr(maturity.amount)],
                  ['Maturity Date', formatDate(maturity.date)],
                  ['Whether Queer Community', 'No'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between py-2 text-xs">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-800 text-right max-w-[55%]">{val}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPhase('form')}
                  className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => { setPhase('mpin'); setMpinOpen(true); }}
                  className="flex-1 rounded-xl bg-[#003D7C] py-2.5 text-sm font-bold text-white shadow hover:bg-[#0055B3]"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MPIN Sheet */}
      <MpinSheet
        open={mpinOpen}
        lang={lang}
        onCancel={() => { setMpinOpen(false); setPhase('review'); }}
        onSuccess={handleMpinSuccess}
      />

      {/* RM Help Prompt */}
      <RMHelpPrompt
        open={rmPromptOpen}
        onHelp={() => { setRmPromptOpen(false); dismissRage(); setAiOpen(true); }}
        onDismiss={() => { setRmPromptOpen(false); dismissRage(); }}
      />

      {/* AI FAB — only when panel is closed and not in review/mpin/success */}
      {!aiOpen && phase !== 'mpin' && phase !== 'success' && (
        <button
          type="button"
          onClick={() => setAiOpen(true)}
          className="absolute bottom-6 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-200/80 bg-white text-xl shadow-lg"
          aria-label="Open AI Assistant"
        >
          🧑‍💼
        </button>
      )}

      {/* AI Overlay (only when not in review/mpin/success phase) */}
      {phase !== 'mpin' && phase !== 'success' && (
        <LoanAguiPanel
          agentId={DEPOSIT_AGUI_AGENT_ID}
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          greeting={
            selectedProduct === 'mmd'
              ? "Great choice! The Money Multiplier Deposit gives you compounded returns — better than a regular FD. How much would you like to deposit? (Minimum ₹1,000)"
              : "Let me help you open a deposit. Would you like a Fixed Deposit (FD), Money Multiplier Deposit (MMD) — which gives compounded returns, or a Recurring Deposit (RD)?"
          }
          assistTitle="Deposit Assistant"
          assistHint="Voice or text — I'll fill it for you"
          formValues={formStateRef.current}
          onToolCall={handleToolCall}
          lang={lang}
        />
      )}
    </motion.div>
  );
}
