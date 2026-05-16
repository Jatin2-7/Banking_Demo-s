import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ACCOUNTS as FALLBACK_ACCOUNTS } from '../data/mock.js';
import { STRINGS } from '../i18n/strings.js';
import LoanAguiPanel from './LoanAguiPanel.jsx';
import MpinSheet from './MpinSheet.jsx';
import RMHelpPrompt from './RMHelpPrompt.jsx';
import { useRageDetect } from '../hooks/useRageDetect.js';
import { IMPS_AGUI_AGENT_ID } from '../lib/aguiClient.js';

const HDR_BLUE = '#0a3d62';
const GOLD_BAR = '#f5c518';

/* ─── tiny primitives ────────────────────────────────────────── */

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-3 py-1.5 text-[12px] font-semibold transition-colors press ${
        active ? 'bg-[#0a3d62] text-white' : 'border border-[#0a3d62]/40 bg-white text-[#0a3d62]'
      }`}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children, required }) {
  return (
    <p className="mb-1 text-[12px] font-medium text-slate-800">
      {children}
      {required && <span className="ml-0.5 text-red-600">*</span>}
    </p>
  );
}

function TInput({ value, onChange, onBlur, placeholder, inputMode = 'text', highlight, maxLength, disabled }) {
  return (
    <input
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      inputMode={inputMode}
      maxLength={maxLength}
      disabled={disabled}
      className={`w-full rounded border px-3 py-2 text-[13px] text-slate-900 outline-none transition-colors ${
        disabled
          ? 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500'
          : highlight
            ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-400/50'
            : 'border-slate-300 bg-white focus:border-[#0a3d62] focus:ring-1 focus:ring-[#0a3d62]/30'
      }`}
    />
  );
}

function StepCircle({ n, active, done }) {
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
        done ? 'bg-white text-[#0a3d62]' : active ? 'bg-[#f5a623] text-white' : 'border-2 border-white/60 bg-transparent text-white/70'
      }`}
    >
      {done ? '✓' : n}
    </div>
  );
}

function ProgressBar({ phase }) {
  const step = ['type_select', 'within_bank', 'other_bank'].includes(phase) ? 0 : phase === 'review' ? 1 : 2;
  return (
    <div className="flex items-center gap-1 px-6 py-2">
      <StepCircle n={1} active={step === 0} done={step > 0} />
      <div className={`h-[2px] flex-1 ${step > 0 ? 'bg-white' : 'bg-white/30'}`} />
      <StepCircle n={2} active={step === 1} done={step > 1} />
      <div className={`h-[2px] flex-1 ${step > 1 ? 'bg-white' : 'bg-white/30'}`} />
      <StepCircle n={3} active={step === 2} done={false} />
    </div>
  );
}

function FromAccountCard({ account }) {
  return (
    <div className="mx-3 mt-3 overflow-hidden rounded-lg border border-slate-200 bg-[#eef6fc]">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-1.5">
        <span className="text-[11px] font-semibold text-slate-700">Selected From Account</span>
        <button type="button" className="text-[11px] font-semibold text-[#0a3d62] press">Change</button>
      </div>
      <div className="flex items-start gap-2 px-3 py-2">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0a3d62]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-900">{account?.label || 'Prateek Agrawal'}</span>
            <span className="text-[11px] font-semibold text-orange-600">♛ Primary</span>
          </div>
          <p className="text-[12px] text-slate-700">XXXXXX{account?.last4 || '1762'} ⓘ</p>
          <p className="text-[12px] text-slate-700">Savings</p>
          <p className="text-[12px] font-semibold text-slate-900">
            ₹ {account?.balance ? Number(account.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '2,450.00'}
          </p>
        </div>
      </div>
    </div>
  );
}

function BankModal({ open, onClose, onSelect }) {
  const BANKS = ['Indian Bank', 'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Punjab National Bank', 'Bank of Baroda', 'Canara Bank', 'Union Bank of India', 'Kotak Mahindra Bank', 'Yes Bank', 'IndusInd Bank'];
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-[82] flex items-end bg-black/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="w-full rounded-t-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <span className="text-[13px] font-semibold">Select Payee Bank</span>
              <button type="button" onClick={onClose} className="text-xl leading-none text-slate-500 press">×</button>
            </div>
            <ul className="max-h-[52vh] overflow-y-auto no-scrollbar">
              {BANKS.map((b) => (
                <li key={b} className="border-b border-slate-100 last:border-0">
                  <button type="button" onClick={() => onSelect(b)} className="w-full px-4 py-3 text-left text-[13px] text-slate-900 press hover:bg-slate-50">{b}</button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Processing overlay ── */
const PROCESSING_STEPS = [
  { label: 'Initiating IMPS transfer…', ms: 800 },
  { label: 'Connecting to NPCI…', ms: 1100 },
  { label: 'Verifying beneficiary account…', ms: 1400 },
  { label: 'Debiting your account…', ms: 1000 },
  { label: 'Transfer successful!', ms: 0 },
];

function ProcessingOverlay({ amount, rrn, onDone }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    let cancelled = false;
    function advance() {
      if (cancelled) return;
      if (i >= PROCESSING_STEPS.length - 1) { setDone(true); return; }
      const ms = PROCESSING_STEPS[i].ms;
      i += 1;
      setStepIdx(i);
      setTimeout(advance, ms);
    }
    const t = setTimeout(advance, PROCESSING_STEPS[0].ms);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-[90] flex flex-col items-center justify-center bg-[#0a1f3d]"
      style={{ borderRadius: '44px' }}
    >
      {/* Indian Bank header */}
      <div className="absolute top-10 left-0 right-0 flex flex-col items-center">
        <img src="/indian-bank-banner.png" alt="Indian Bank" className="h-10 max-w-[160px] object-contain opacity-90" />
        <div className="mt-1 h-1 w-24 rounded-full" style={{ background: GOLD_BAR }} />
      </div>

      {/* Amount badge */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
        className="mb-8 text-center"
      >
        <p className="text-[13px] font-semibold text-white/60 uppercase tracking-widest">Transferring</p>
        <p className="mt-1 text-[42px] font-bold text-white leading-none">
          ₹{Number(amount || 0).toLocaleString('en-IN')}
        </p>
      </motion.div>

      {/* Spinner / checkmark */}
      {!done ? (
        <div className="relative mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
            className="h-14 w-14 rounded-full border-[3px] border-white/20 border-t-[#f5a623]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-[#f5a623]/20" />
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 14 }}
          className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      )}

      {/* Processing steps */}
      <div className="flex flex-col items-center gap-1 px-8">
        {PROCESSING_STEPS.slice(0, stepIdx + 1).map((s, idx) => (
          <motion.p
            key={idx}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: idx === stepIdx ? 1 : 0.38, y: 0 }}
            className={`text-center text-[13px] font-medium ${idx === stepIdx ? (done && idx === PROCESSING_STEPS.length - 1 ? 'text-emerald-400' : 'text-[#f5a623]') : 'text-white/40'}`}
          >
            {idx < stepIdx ? '✓ ' : ''}{s.label}
          </motion.p>
        ))}
      </div>

      {/* RRN + Done button — appear after success */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 24 }}
            className="mt-6 flex flex-col items-center gap-3 px-8 w-full"
          >
            {rrn && (
              <p className="font-mono text-[11px] text-white/50">Ref: {rrn}</p>
            )}
            <button
              type="button"
              onClick={onDone}
              className="w-full max-w-[200px] rounded-xl bg-[#f5a623] py-3 text-[14px] font-bold text-[#0a1f3d] press shadow-lg"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="absolute bottom-8 text-[10px] text-white/25">Secured by NPCI · Demo only</p>
    </motion.div>
  );
}

/* ── Confetti ── */
const CONF_COLORS = ['#f5a623', '#0a3d62', '#00875A', '#e91e63', '#3f51b5'];
function Confetti() {
  const dots = useMemo(
    () => Array.from({ length: 24 }, (_, i) => ({
      key: i, left: Math.random() * 100, delay: Math.random() * 0.5,
      duration: 1.4 + Math.random(), color: CONF_COLORS[i % CONF_COLORS.length],
    })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d) => (
        <span key={d.key} className="confetti-dot" style={{ left: `${d.left}%`, background: d.color, animationDuration: `${d.duration}s`, animationDelay: `${d.delay}s` }} />
      ))}
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────── */

export default function ImpsFundTransferScreen({ onClose, lang, accounts, aiPrimer: aiPrimerProp }) {
  const liveAccounts = accounts?.length ? accounts : FALLBACK_ACCOUNTS;
  const fromAcc = liveAccounts[0];

  /* phases: type_select → within_bank / other_bank → review → success */
  const [phase, setPhase] = useState('type_select');
  const [transferType, setTransferType] = useState('within');
  const [payeeType, setPayeeType] = useState('account');

  /* form fields */
  const [payeeName, setPayeeName] = useState('');
  const [payeeAccountNo, setPayeeAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [payeeBank, setPayeeBank] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');

  /* UI state */
  const [bankModal, setBankModal] = useState(false);
  const [showMpin, setShowMpin] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [rrn, setRrn] = useState('');

  /* AI overlay */
  const [aiOpen, setAiOpen] = useState(() => !!aiPrimerProp);
  const [highlightField, setHighlightField] = useState(null);
  const [rmPromptOpen, setRmPromptOpen] = useState(false);
  const aiOpenRef = useRef(false);
  useEffect(() => { aiOpenRef.current = aiOpen; }, [aiOpen]);
  const { containerProps: rageProps, markInvalidField, dismiss: dismissRage } = useRageDetect({
    onFrustrated: () => { if (!aiOpenRef.current) setRmPromptOpen(true); },
  });
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    if (!highlightField) return;
    const t = setTimeout(() => setHighlightField(null), 2200);
    return () => clearTimeout(t);
  }, [highlightField]);

  /* AI form values */
  const fv = useMemo(
    () => ({ transferType, payeeType, payeeName, payeeAccountNo, ifsc, payeeBank, mobileNo, amount, remarks }),
    [transferType, payeeType, payeeName, payeeAccountNo, ifsc, payeeBank, mobileNo, amount, remarks],
  );

  // Track the previous agent state so we can detect which field was JUST patched
  const agentPrevRef = useRef({});

  const setFvFromAgent = useCallback((next) => {
    const prev = agentPrevRef.current;
    agentPrevRef.current = next;

    // Helper: did this specific field change to a non-empty value in this update?
    const justSet = (id) => next[id] !== undefined && next[id] !== (prev[id] ?? '') && String(next[id]).trim() !== '';

    // ── Apply field values directly ──
    if (next.payeeName !== undefined) setPayeeName(String(next.payeeName));
    if (next.payeeAccountNo !== undefined) setPayeeAccountNo(String(next.payeeAccountNo).replace(/\D/g, '').slice(0, 18));
    if (next.ifsc !== undefined) setIfsc(String(next.ifsc).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11));
    if (next.payeeBank !== undefined) setPayeeBank(String(next.payeeBank));
    if (next.mobileNo !== undefined) setMobileNo(String(next.mobileNo).replace(/\D/g, '').slice(0, 10));
    if (next.amount !== undefined) setAmount(String(next.amount).replace(/[^\d.]/g, ''));
    if (next.remarks !== undefined) setRemarks(String(next.remarks).slice(0, 50));

    // ── Navigate / switch tabs based on ONLY what was just set ──

    // Explicit transferType from agent
    if (justSet('transferType')) {
      const tt = String(next.transferType);
      setTransferType(tt);
      if (['type_select', 'within_bank', 'other_bank'].includes(phaseRef.current))
        setPhase(tt === 'other' ? 'other_bank' : 'within_bank');
    }

    // Explicit payeeType from agent
    if (justSet('payeeType')) {
      const pt = String(next.payeeType);
      setPayeeType(pt);
      if (phaseRef.current === 'type_select') { setTransferType('other'); setPhase('other_bank'); }
    }

    // Infer OTHER bank from ifsc being set (only if transferType not explicitly changed this tick)
    if (justSet('ifsc') && !justSet('transferType')) {
      setTransferType('other');
      if (['type_select', 'within_bank', 'other_bank'].includes(phaseRef.current)) setPhase('other_bank');
      if (!justSet('payeeType')) setPayeeType('account');
    }

    // Infer OTHER bank + mobile from mobileNo being set
    if (justSet('mobileNo') && !justSet('transferType')) {
      setTransferType('other');
      if (['type_select', 'within_bank', 'other_bank'].includes(phaseRef.current)) setPhase('other_bank');
      if (!justSet('payeeType')) setPayeeType('mobile');
    }

    // Navigate into within_bank if payeeName/payeeAccountNo set while still on type_select
    if ((justSet('payeeName') || justSet('payeeAccountNo')) && phaseRef.current === 'type_select') {
      setPhase('within_bank');
    }
  }, []);

  const handleAgentToolCall = useCallback((name, args) => {
    if (name === 'set_field' && args.field_id) setHighlightField(String(args.field_id));
    // submit_transfer result comes via TOOL_CALL_RESULT with {ok:true}
    if (name === 'submit_transfer' && args.ok === true) {
      setAiOpen(false);
      const p = phaseRef.current;
      if (['type_select', 'within_bank', 'other_bank'].includes(p)) setPhase('review');
    }
  }, []);

  /* validation */
  const withinValid = payeeName.trim().length >= 2 && /^\d{9,18}$/.test(payeeAccountNo) && Number(amount) > 0;
  const otherAccountValid = /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(ifsc) && /^\d{9,18}$/.test(payeeAccountNo) && Number(amount) > 0;
  const otherMobileValid = payeeBank.trim().length >= 2 && /^\d{10}$/.test(mobileNo) && Number(amount) > 0;
  const step1Valid = transferType === 'within' ? withinValid : payeeType === 'account' ? otherAccountValid : otherMobileValid;

  /* navigation helpers */
  const headerTitle = phase === 'within_bank' ? 'Transfers - Within' : phase === 'other_bank' ? 'Transfers - Other' : phase === 'review' ? 'Transfers - Review' : phase === 'success' ? 'Transfers - Status' : 'Transfers';

  const handleBack = () => {
    if (phase === 'within_bank' || phase === 'other_bank') { setAiOpen(false); setPhase('type_select'); }
    else if (phase === 'review') setPhase(transferType === 'within' ? 'within_bank' : 'other_bank');
    else if (phase === 'success') { handleDone(); }
    else { setAiOpen(false); onClose?.(); }
  };

  const handleMpinSuccess = () => {
    setShowMpin(false);
    const id = `IMPS${Date.now().toString(36).toUpperCase().slice(-10)}`;
    setRrn(id);
    setShowProcessing(true);
  };

  const handleProcessingDone = () => {
    setShowProcessing(false);
    handleDone();
  };

  const handleDone = () => {
    setPhase('type_select');
    setTransferType('within'); setPayeeType('account');
    setPayeeName(''); setPayeeAccountNo(''); setIfsc('');
    setPayeeBank(''); setMobileNo(''); setAmount(''); setRemarks('');
    setRrn(''); setAiOpen(false);
    agentPrevRef.current = {};
    onClose?.();
  };

  const isFormPhase = ['type_select', 'within_bank', 'other_bank'].includes(phase);
  const aiPanelOpen = aiOpen && isFormPhase;

  const amtHl = highlightField === 'amount';

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-[60] flex flex-col overflow-hidden bg-white"
      style={{ borderRadius: '44px' }}
      {...rageProps}
    >
      {/* ── Header ── */}
      <div className="shrink-0 pt-10" style={{ backgroundColor: HDR_BLUE }}>
        <div className="flex items-center gap-2 px-2 pb-1">
          <button type="button" onClick={handleBack} className="press-bright flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white" aria-label="Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="flex-1 text-center text-[15px] font-bold text-white">{headerTitle}</span>
          <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f5a623]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
            </div>
            <span className="mt-0.5 text-[8px] leading-none text-white/80">HOME</span>
          </div>
        </div>
        <div className="h-1 w-full" style={{ backgroundColor: GOLD_BAR }} />
        <ProgressBar phase={phase} />
      </div>

      {/* ── Scrollable body ── */}
      <div className={`min-h-0 flex-1 overflow-y-auto no-scrollbar bg-[#f5f7fa] ${isFormPhase && aiPanelOpen ? 'pb-[clamp(160px,28vh,240px)]' : 'pb-24'}`}>

        {/* PHASE: type_select */}
        {phase === 'type_select' && (
          <>
            <FromAccountCard account={fromAcc} />
            <div className="mx-3 mt-4">
              <p className="mb-2 text-[12px] font-semibold text-slate-700">Transfer Type</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {[['within', 'Within Bank'], ['other', 'Other Banks']].map(([v, label]) => (
                  <button key={v} type="button" onClick={() => setTransferType(v)}
                    className={`shrink-0 rounded px-4 py-1.5 text-[12px] font-semibold transition-colors press ${transferType === v ? 'bg-[#0a3d62] text-white' : 'border border-slate-300 bg-white text-slate-700'}`}
                  >{label}</button>
                ))}
                <button type="button" className="shrink-0 rounded border border-slate-300 bg-white px-4 py-1.5 text-[12px] font-semibold text-slate-700 press">Favourite Transac...</button>
              </div>
            </div>
            <div className="mx-3 mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-[#e8f4fd] px-3 py-2">
                <span className="text-[12px] font-semibold text-slate-800">Select Payee</span>
              </div>
              <button type="button" onClick={() => setPhase(transferType === 'within' ? 'within_bank' : 'other_bank')}
                className="flex w-full items-center gap-2 px-4 py-3 text-[13px] font-semibold text-[#0a3d62] press hover:bg-slate-50"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#0a3d62] text-[14px] font-bold leading-none">+</span>
                SEND TO A NEW PAYEE
              </button>
            </div>
            <div className="mt-8 flex justify-center opacity-30">
              <svg width="80" height="80" viewBox="0 0 64 64" fill="none">
                <rect x="8" y="28" width="48" height="32" rx="2" fill="#f5a623" />
                <polygon points="8,28 32,14 56,28" fill="#e09010" />
                <rect x="24" y="28" width="16" height="16" rx="1" fill="#fff6" />
                <line x1="32" y1="14" x2="32" y2="4" stroke="#aaa" strokeWidth="1.5" strokeDasharray="3,2" />
                <circle cx="32" cy="4" r="2" fill="#888" />
              </svg>
            </div>
          </>
        )}

        {/* PHASE: within_bank */}
        {phase === 'within_bank' && (
          <>
            <FromAccountCard account={fromAcc} />
            <div className="mx-3 mt-4 space-y-3">
              <div>
                <p className="mb-2 text-[12px] font-semibold text-slate-700">Transfer Type</p>
                <div className="flex gap-2">
                  <Chip active={true} onClick={() => {}}>Within Bank</Chip>
                  <Chip active={false} onClick={() => { setTransferType('other'); setPhase('other_bank'); }}>Other Bank</Chip>
                </div>
              </div>
              <div>
                <FieldLabel required>Payee Account Number</FieldLabel>
                <TInput value={payeeAccountNo} onChange={(e) => setPayeeAccountNo(e.target.value.replace(/\D/g, '').slice(0, 18))} onBlur={() => { if (!/^\d{9,18}$/.test(payeeAccountNo)) markInvalidField('payeeAccountNo'); }} placeholder="Please Type Here...." inputMode="numeric" highlight={highlightField === 'payeeAccountNo'} />
              </div>
              <div>
                <FieldLabel required>Payee Name</FieldLabel>
                <TInput value={payeeName} onChange={(e) => setPayeeName(e.target.value)} onBlur={() => { if (payeeName.trim().length < 2) markInvalidField('payeeName'); }} placeholder="Please Type Here...." highlight={highlightField === 'payeeName'} />
              </div>
              <div>
                <FieldLabel required>Amount (₹)</FieldLabel>
                <div className={`flex items-center gap-1 rounded border px-3 py-2 transition-colors ${amtHl ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-400/50' : 'border-slate-300 bg-white focus-within:border-[#0a3d62] focus-within:ring-1 focus-within:ring-[#0a3d62]/30'}`}>
                  <span className="text-[13px] font-semibold text-slate-600">₹</span>
                  <input className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] outline-none" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} onBlur={() => { if (!amount || Number(amount) <= 0) markInvalidField('amount'); }} placeholder="0.00" />
                </div>
              </div>
              <div>
                <FieldLabel>Remarks (optional)</FieldLabel>
                <TInput value={remarks} onChange={(e) => setRemarks(e.target.value.slice(0, 50))} placeholder="Max 50 characters" highlight={highlightField === 'remarks'} />
              </div>
            </div>
          </>
        )}

        {/* PHASE: other_bank */}
        {phase === 'other_bank' && (
          <>
            <FromAccountCard account={fromAcc} />
            <div className="mx-3 mt-4 space-y-3">
              <div>
                <p className="mb-2 text-[12px] font-semibold text-slate-700">Transfer Type</p>
                <div className="flex gap-2">
                  <Chip active={false} onClick={() => { setTransferType('within'); setPhase('within_bank'); }}>Within Bank</Chip>
                  <Chip active={true} onClick={() => {}}>Other Bank</Chip>
                </div>
              </div>
              <div>
                <p className="mb-2 text-[12px] font-semibold text-slate-700">Payee Type</p>
                <div className="flex gap-2">
                  <Chip active={payeeType === 'account'} onClick={() => setPayeeType('account')}>Account Number</Chip>
                  <Chip active={payeeType === 'mobile'} onClick={() => setPayeeType('mobile')}>Mobile Number</Chip>
                </div>
              </div>

              {payeeType === 'account' && (
                <>
                  <div>
                    <FieldLabel required>Choose New Bank IFSC</FieldLabel>
                    <div className="flex gap-2">
                      <TInput value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))} onBlur={() => { if (!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(ifsc)) markInvalidField('ifsc'); }} placeholder="Please Type Here...." highlight={highlightField === 'ifsc'} />
                      <button type="button" className="shrink-0 rounded bg-[#0a3d62] px-3 py-2 text-[11px] font-bold text-white press">Search IFSC</button>
                    </div>
                  </div>
                  <div>
                    <FieldLabel required>Payee Account Number</FieldLabel>
                    <TInput value={payeeAccountNo} onChange={(e) => setPayeeAccountNo(e.target.value.replace(/\D/g, '').slice(0, 18))} onBlur={() => { if (!/^\d{9,18}$/.test(payeeAccountNo)) markInvalidField('payeeAccountNo'); }} placeholder="Please Type Here...." inputMode="numeric" highlight={highlightField === 'payeeAccountNo'} />
                  </div>
                </>
              )}

              {payeeType === 'mobile' && (
                <>
                  <div>
                    <FieldLabel required>Payee Bank</FieldLabel>
                    <button type="button" onClick={() => setBankModal(true)}
                      className={`flex w-full items-center justify-between rounded border px-3 py-2 text-[13px] transition-colors press ${highlightField === 'payeeBank' ? 'border-amber-400 bg-amber-50' : payeeBank ? 'border-slate-300 bg-white text-slate-900' : 'border-slate-300 bg-white text-slate-400'}`}
                    >
                      <span>{payeeBank || 'Please Select'}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                  <div>
                    <FieldLabel required>Mobile Number</FieldLabel>
                    <div className={`flex items-center overflow-hidden rounded border transition-colors ${highlightField === 'mobileNo' ? 'border-amber-400 bg-amber-50' : 'border-slate-300 bg-white focus-within:border-[#0a3d62] focus-within:ring-1 focus-within:ring-[#0a3d62]/30'}`}>
                      <div className="flex shrink-0 items-center gap-1 border-r border-slate-300 px-2 py-2">
                        <span className="text-base leading-none">🇮🇳</span>
                        <span className="text-[12px] font-semibold text-slate-700">+91</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                      <input className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[13px] outline-none" inputMode="numeric" maxLength={10} value={mobileNo} onChange={(e) => setMobileNo(e.target.value.replace(/\D/g, '').slice(0, 10))} onBlur={() => { if (!/^\d{10}$/.test(mobileNo)) markInvalidField('mobileNo'); }} placeholder="Please Type Here...." />
                    </div>
                  </div>
                </>
              )}

              <div>
                <FieldLabel required>Amount (₹)</FieldLabel>
                <div className={`flex items-center gap-1 rounded border px-3 py-2 transition-colors ${amtHl ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-400/50' : 'border-slate-300 bg-white focus-within:border-[#0a3d62] focus-within:ring-1 focus-within:ring-[#0a3d62]/30'}`}>
                  <span className="text-[13px] font-semibold text-slate-600">₹</span>
                  <input className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] outline-none" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0.00" />
                </div>
              </div>
              <div>
                <FieldLabel>Remarks (optional)</FieldLabel>
                <TInput value={remarks} onChange={(e) => setRemarks(e.target.value.slice(0, 50))} placeholder="Max 50 characters" highlight={highlightField === 'remarks'} />
              </div>
            </div>
          </>
        )}

        {/* PHASE: review */}
        {phase === 'review' && (
          <div className="mx-3 mt-3">
            {/* Amount hero */}
            <div className="mb-4 flex flex-col items-center rounded-2xl bg-[#0a3d62] py-5 text-center text-white shadow-lg">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">Transferring</p>
              <p className="mt-1 text-[38px] font-bold leading-none">₹{Number(amount || 0).toLocaleString('en-IN')}</p>
              <p className="mt-1 text-[12px] text-white/70">{transferType === 'within' ? `To: ${payeeName} · ${payeeAccountNo}` : payeeType === 'account' ? `To: ${payeeAccountNo} · IFSC ${ifsc}` : `To: +91 ${mobileNo} · ${payeeBank}`}</p>
            </div>
            {/* Details table */}
            <div className="overflow-hidden rounded-xl border border-dashed border-slate-600 bg-white">
              {[
                ['Transfer Type', transferType === 'within' ? 'Within Bank (NEFT)' : 'Other Bank (IMPS)'],
                ...(transferType === 'within'
                  ? [['Payee Name', payeeName], ['Account No.', payeeAccountNo]]
                  : payeeType === 'account'
                    ? [['IFSC', ifsc], ['Account No.', payeeAccountNo]]
                    : [['Payee Bank', payeeBank], ['Mobile', `+91 ${mobileNo}`]]),
                ['Amount', `₹ ${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
                ...(remarks ? [['Remarks', remarks]] : []),
              ].map(([k, v]) => (
                <div key={k} className="grid border-b border-dashed border-slate-400 last:border-0" style={{ gridTemplateColumns: 'minmax(0,40%) 1fr' }}>
                  <div className="bg-sky-100 px-3 py-2 text-[11px] font-bold text-slate-900">{k}</div>
                  <div className="bg-white px-3 py-2 text-[11px] text-slate-800">{v}</div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-400">Demo · No real funds transferred · Secured by NPCI</p>
          </div>
        )}

        {/* PHASE: success */}
        {phase === 'success' && (
          <div className="relative flex flex-col items-center px-4 pt-6 text-center">
            <Confetti />
            <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 14 }}
              className="relative z-10 mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-xl"
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
            <p className="relative z-10 text-[20px] font-bold text-slate-900">Transfer Successful!</p>
            <p className="relative z-10 mt-1 text-[15px] font-semibold text-emerald-700">
              ₹{Number(amount || 0).toLocaleString('en-IN')} sent
            </p>
            <div className="relative z-10 mt-4 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
              {[
                ['Reference (RRN)', rrn],
                ['Transfer Mode', transferType === 'within' ? 'Within Bank' : 'IMPS'],
                ['To', transferType === 'within' ? `${payeeName} · ${payeeAccountNo}` : payeeType === 'account' ? payeeAccountNo : `+91 ${mobileNo}`],
                ['Time', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0">
                  <span className="text-[12px] text-slate-500">{k}</span>
                  <span className="text-[12px] font-semibold text-slate-900">{v}</span>
                </div>
              ))}
            </div>
            <button type="button" onClick={handleDone}
              className="relative z-10 mt-6 w-full rounded-xl bg-[#0a3d62] py-3 text-[14px] font-bold text-white press shadow-lg"
            >
              Done
            </button>
          </div>
        )}
      </div>

      {/* ── Bottom bar: form phases ── */}
      {(phase === 'within_bank' || phase === 'other_bank') && (
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white">
          <div className="px-4 pt-2">
            <button type="button" onClick={() => setAiOpen((v) => !v)}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[12px] font-semibold transition-all press ${aiOpen ? 'bg-amber-400 text-black' : 'bg-gradient-to-r from-[#0a3d62] to-[#1565c0] text-white'}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
              {aiOpen ? 'Close AI Assistant' : '✦ Fill with AI Assistant'}
            </button>
          </div>
          <div className="flex gap-3 px-4 py-3">
            <button type="button" onClick={() => setPhase('review')} disabled={!step1Valid}
              className="flex-1 rounded-xl bg-[#0a3d62] py-2.5 text-[13px] font-bold text-white press disabled:cursor-not-allowed disabled:opacity-40"
            >Continue</button>
            <button type="button" onClick={() => { setAiOpen(false); setPhase('type_select'); }}
              className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-[13px] font-semibold text-slate-700 press"
            >Cancel</button>
          </div>
        </div>
      )}

      {/* ── Bottom bar: type_select ── */}
      {phase === 'type_select' && (
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-4 py-3">
          <button type="button" onClick={() => setAiOpen((v) => !v)}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition-all press ${aiOpen ? 'bg-amber-400 text-black' : 'bg-gradient-to-r from-[#0a3d62] to-[#1565c0] text-white'}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
            {aiOpen ? 'Close AI Assistant' : '✦ Transfer with AI Assistant'}
          </button>
        </div>
      )}

      {/* ── Bottom bar: review ── */}
      {phase === 'review' && (
        <div className="absolute bottom-0 left-0 right-0 flex gap-3 border-t border-slate-200 bg-white px-4 py-3">
          <button type="button" onClick={() => setShowMpin(true)}
            className="flex-1 rounded-xl bg-[#0a3d62] py-2.5 text-[13px] font-bold text-white press"
          >
            Confirm &amp; Transfer
          </button>
          <button type="button" onClick={() => setPhase(transferType === 'within' ? 'within_bank' : 'other_bank')}
            className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-[13px] font-semibold text-slate-700 press"
          >Cancel</button>
        </div>
      )}

      {/* ── RM Help Prompt ── */}
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

      {/* ── AI Overlay ── */}
      <LoanAguiPanel
        agentId={IMPS_AGUI_AGENT_ID}
        open={aiPanelOpen}
        onClose={() => setAiOpen(false)}
        formValues={fv}
        onFormChange={setFvFromAgent}
        onToolCall={handleAgentToolCall}
        greeting={
          aiPrimerProp
            ? `Hi! I understand you want to: "${aiPrimerProp}" — let me get started. First, is the payee's account in Indian Bank, or another bank?`
            : "Hi! Let's set up your fund transfer. First — is the payee's account in Indian Bank, or another bank?"
        }
        primer={aiPrimerProp || null}
        assistTitle="Fund Transfer Assist"
        assistHint="Say 'Indian Bank' or the other bank name to start"
        lang={lang || 'en'}
      />

      {/* ── MPIN sheet ── */}
      <MpinSheet open={showMpin} lang={lang || 'en'} onCancel={() => setShowMpin(false)} onSuccess={handleMpinSuccess} />

      {/* ── Processing overlay ── */}
      <AnimatePresence>
        {showProcessing && <ProcessingOverlay amount={amount} rrn={rrn} onDone={handleProcessingDone} />}
      </AnimatePresence>

      {/* ── Bank picker ── */}
      <BankModal open={bankModal} onClose={() => setBankModal(false)} onSelect={(b) => { setPayeeBank(b); setBankModal(false); }} />
    </motion.div>
  );
}
