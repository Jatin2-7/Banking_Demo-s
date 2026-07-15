import React, { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LoanAguiPanel from './LoanAguiPanel.jsx';
import MpinSheet from './MpinSheet.jsx';
import { DEPOSIT_AGUI_AGENT_ID } from '../lib/aguiClient.js';

const PRODUCT_LABELS = {
  fd: 'Fixed Deposit (FD)',
  mmd: 'Money Multiplier Deposit (MMD)',
  rd: 'Recurring Deposit (RD)',
};

function computeInterestRate(years, months, days) {
  const totalDays = years * 365 + months * 30 + days;
  if (totalDays < 181) return 0;
  if (totalDays < 270) return 4.5;
  if (totalDays < 365) return 4.75;
  if (totalDays < 365 * 1 + 1) return 6.1;
  if (totalDays < 365 * 2) return 6.2;
  if (totalDays < 365 * 3) return 6.15;
  if (totalDays < 365 * 5) return 6.05;
  return 6;
}

function computeMaturity(amount, years, months, days, rate) {
  const totalDays = years * 365 + months * 30 + days;
  if (totalDays < 1 || !amount || !rate) return { amount: 0, date: null };
  const maturityAmount = amount * (1 + rate / 100 / 365) ** totalDays;
  const maturityDate = new Date();
  maturityDate.setDate(maturityDate.getDate() + totalDays);
  return { amount: maturityAmount, date: maturityDate };
}

function formatInr(n) {
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatTenure(y, m, d) {
  const parts = [];
  if (y) parts.push(`${y} year${y > 1 ? 's' : ''}`);
  if (m) parts.push(`${m} month${m > 1 ? 's' : ''}`);
  if (d) parts.push(`${d} day${d > 1 ? 's' : ''}`);
  return parts.length ? parts.join(' ') : '—';
}

function AaravAvatar({ size = 32 }) {
  return (
    <div
      className="flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-bank-gold to-amber-500 font-bold shadow-md ring-2 ring-bank-gold/50"
      style={{ width: size, height: size }}
    >
      <span className="text-bank-purpleDeep" style={{ fontSize: Math.round(size * 0.38) }}>
        A
      </span>
    </div>
  );
}

function DepositIcon({ size = 20 }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-emerald-600/90 text-lg shadow-sm"
      style={{ width: size, height: size }}
      aria-hidden
    >
      💰
    </div>
  );
}

function DepositSummaryCard({ fv, phase, rate, maturity }) {
  const productLabel = PRODUCT_LABELS[fv.depositType] || null;
  const tenureLabel = formatTenure(fv.years, fv.months, fv.days);

  if (phase === 'review' && fv.amount) {
    return (
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mx-4 my-2 overflow-hidden rounded-2xl bg-white shadow-lg"
      >
        <div className="bg-gradient-to-r from-emerald-600/10 to-[#003D7C]/10 px-4 py-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-800">
            Confirm deposit
          </p>
        </div>
        <div className="py-3 text-center">
          <p className="text-3xl font-black tracking-tight text-slate-800">
            {formatInr(fv.amount)}
          </p>
          {productLabel && <p className="mt-1 text-xs text-slate-600">{productLabel}</p>}
        </div>
        {maturity.amount > 0 && (
          <p className="px-4 pb-3 text-center text-[11px] text-slate-500">
            Maturity ~ {formatInr(maturity.amount)} · {rate.toFixed(2)}% p.a.
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <div className="mx-4 my-2 flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur-md">
      <div className="relative h-10 w-10 shrink-0">
        <div className="absolute inset-0 animate-ping rounded-full bg-bank-gold/30" />
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-bank-gold/20">
          <DepositIcon size={20} />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white">Create Deposit</p>
        <p className="mt-0.5 truncate text-[11px] text-white/60">
          {productLabel
            ? `${productLabel}${fv.amount ? ` · ${formatInr(fv.amount)}` : ''}${tenureLabel !== '—' ? ` · ${tenureLabel}` : ''}`
            : 'Choose FD, MMD, or RD — then amount and tenure'}
        </p>
      </div>
    </div>
  );
}

function ReviewCard({ fv, rate, maturity, onConfirm, onEdit }) {
  const productLabel = PRODUCT_LABELS[fv.depositType] || fv.depositType || '—';
  const rows = [
    ['Product', productLabel],
    ['Amount', formatInr(fv.amount)],
    ['Tenure', formatTenure(fv.years, fv.months, fv.days)],
    ['Interest rate', `${rate.toFixed(2)}% p.a.`],
    ['Maturity amount', maturity.amount > 0 ? formatInr(maturity.amount) : '—'],
    [
      'Maturity date',
      maturity.date
        ? maturity.date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : '—',
    ],
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-3 overflow-hidden rounded-2xl bg-white/95 shadow-xl ring-2 ring-bank-gold/25"
    >
      <div className="space-y-0 px-4 py-2">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between border-b border-slate-100 py-2.5 text-xs last:border-0"
          >
            <span className="text-slate-500">{k}</span>
            <span className="max-w-[58%] truncate text-right font-semibold text-slate-800">
              {v}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-slate-100 px-3 py-3">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-700 press"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-[1.4] rounded-xl bg-[#003D7C] py-2.5 text-[13px] font-bold text-white press"
        >
          Confirm &amp; Open
        </button>
      </div>
    </motion.div>
  );
}

function SuccessOverlay({ fv, maturity, onDone }) {
  const productLabel = PRODUCT_LABELS[fv.depositType] || 'Deposit';
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[90] flex flex-col items-center justify-center bg-[#0a1f3d] px-6"
    >
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-4xl shadow-xl">
        🎉
      </div>
      <p className="text-xl font-bold text-white">Deposit opened!</p>
      <p className="mt-2 text-center text-sm text-white/70">
        Your {productLabel} of {formatInr(fv.amount)} has been created successfully.
      </p>
      {maturity.amount > 0 && (
        <p className="mt-2 text-center text-xs text-emerald-300">
          Maturity amount ~ {formatInr(maturity.amount)}
        </p>
      )}
      <button
        type="button"
        onClick={onDone}
        className="mt-8 w-full max-w-[220px] rounded-xl bg-[#f5a623] py-3 text-[14px] font-bold text-[#0a1f3d] press"
      >
        Done
      </button>
    </motion.div>
  );
}

export default function CreateDepositVoiceScreen({ onClose, lang, aiPrimer, voiceAssist = false }) {
  const [depositType, setDepositType] = useState('');
  const [amount, setAmount] = useState('');
  const [years, setYears] = useState(0);
  const [months, setMonths] = useState(0);
  const [days, setDays] = useState(0);
  const [phase, setPhase] = useState('chat');
  const [showMpin, setShowMpin] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fv = useMemo(
    () => ({ depositType, amount, years, months, days }),
    [depositType, amount, years, months, days],
  );

  const numericAmount = Number(amount) || 0;
  const rate = useMemo(() => computeInterestRate(years, months, days), [years, months, days]);
  const maturity = useMemo(
    () => computeMaturity(numericAmount, years, months, days, rate),
    [numericAmount, years, months, days, rate],
  );

  const applyField = useCallback((field, value) => {
    if (field === 'depositType') setDepositType(String(value).toLowerCase());
    if (field === 'amount') setAmount(String(value).replace(/[^\d.]/g, ''));
    if (field === 'years') setYears(Math.min(10, Math.max(0, parseInt(value, 10) || 0)));
    if (field === 'months') setMonths(Math.min(11, Math.max(0, parseInt(value, 10) || 0)));
    if (field === 'days') setDays(Math.min(30, Math.max(0, parseInt(value, 10) || 0)));
  }, []);

  const setFvFromAgent = useCallback((next) => {
    if (next.depositType !== undefined) setDepositType(String(next.depositType).toLowerCase());
    if (next.amount !== undefined) setAmount(String(next.amount).replace(/[^\d.]/g, ''));
    if (next.years !== undefined) setYears(Math.min(10, Math.max(0, Number(next.years) || 0)));
    if (next.months !== undefined) setMonths(Math.min(11, Math.max(0, Number(next.months) || 0)));
    if (next.days !== undefined) setDays(Math.min(30, Math.max(0, Number(next.days) || 0)));
  }, []);

  const handleAgentToolCall = useCallback(
    (name, args) => {
      if (name === 'set_field' && args.field) {
        applyField(args.field, args.value);
      }
      if (name === 'submit_deposit' && (args.ok || args.submitted)) {
        setPhase('review');
      }
    },
    [applyField],
  );

  const greeting =
    depositType === 'mmd'
      ? 'Great choice! MMD gives you compounded returns. How much would you like to deposit? (Minimum ₹1,000)'
      : depositType === 'fd'
        ? 'Fixed Deposit — how much would you like to deposit? (Minimum ₹1,000)'
        : depositType === 'rd'
          ? 'Recurring Deposit — how much would you like to save each month? (Minimum ₹100)'
          : 'Let me help you open a deposit. Would you like a Fixed Deposit (FD), Money Multiplier Deposit (MMD), or Recurring Deposit (RD)?';

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="absolute inset-0 z-50 flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #003366 0%, #001F4D 45%, #0A0A2E 100%)',
      }}
    >
      <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <AaravAvatar size={36} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">Create Deposit</p>
            <p className="text-[10px] text-white/55">Voice-guided · FD, MMD, or RD</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-base text-white/80 hover:bg-white/20"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>

      <DepositSummaryCard fv={fv} phase={phase} rate={rate} maturity={maturity} />

      <div className="relative min-h-0 flex-1">
        <LoanAguiPanel
          chatFullscreen
          open={phase === 'chat'}
          onClose={onClose}
          formValues={fv}
          onFormChange={setFvFromAgent}
          onToolCall={handleAgentToolCall}
          agentId={DEPOSIT_AGUI_AGENT_ID}
          greeting={greeting}
          primer={aiPrimer || 'Customer opened create deposit via voice navigation.'}
          assistHint="Say FD, MMD, or RD · then amount and tenure (e.g. 2 years 6 months)"
          lang={lang || 'en'}
          voiceAssist={voiceAssist}
        />

        {phase === 'review' && (
          <div className="absolute inset-0 flex flex-col justify-end pb-2">
            <ReviewCard
              fv={fv}
              rate={rate}
              maturity={maturity}
              onConfirm={() => setShowMpin(true)}
              onEdit={() => setPhase('chat')}
            />
          </div>
        )}
      </div>

      <MpinSheet
        open={showMpin}
        lang={lang || 'en'}
        onCancel={() => setShowMpin(false)}
        onSuccess={() => {
          setShowMpin(false);
          setShowSuccess(true);
        }}
      />

      <AnimatePresence>
        {showSuccess && <SuccessOverlay fv={fv} maturity={maturity} onDone={onClose} />}
      </AnimatePresence>
    </motion.div>
  );
}
