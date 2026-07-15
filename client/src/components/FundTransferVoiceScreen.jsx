import React, { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LoanAguiPanel from './LoanAguiPanel.jsx';
import MpinSheet from './MpinSheet.jsx';
import { IMPS_AGUI_AGENT_ID } from '../lib/aguiClient.js';

function AaravAvatar({ size = 32, pulse = false }) {
  return (
    <div
      className={`flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-bank-gold to-amber-500 font-bold shadow-md ring-2 ring-bank-gold/50 ${pulse ? 'animate-pulse ring-4 ring-bank-gold/40' : ''}`}
      style={{ width: size, height: size }}
    >
      <span className="text-bank-purpleDeep" style={{ fontSize: Math.round(size * 0.38) }}>
        A
      </span>
    </div>
  );
}

function TransferIcon({ size = 20 }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-[#003D7C]/90 text-white shadow-sm"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      >
        <path d="M7 7h11M7 7l3-3M7 7l3 3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 17H6M17 17l-3 3M17 17l-3-3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function TransferSummaryCard({ fv, phase }) {
  const transferLabel =
    fv.transferType === 'other'
      ? 'Other bank (IMPS)'
      : fv.transferType === 'within'
        ? 'Within Indian Bank'
        : null;

  const payeeLine =
    fv.transferType === 'within'
      ? fv.payeeName && fv.payeeAccountNo
        ? `${fv.payeeName} · ${fv.payeeAccountNo}`
        : fv.payeeAccountNo || fv.payeeName || null
      : fv.payeeType === 'mobile'
        ? fv.mobileNo && fv.payeeBank
          ? `${fv.payeeBank} · +91 ${fv.mobileNo}`
          : fv.mobileNo || fv.payeeBank || null
        : fv.ifsc && fv.payeeAccountNo
          ? `${fv.payeeAccountNo} · ${fv.ifsc}`
          : fv.payeeAccountNo || fv.ifsc || null;

  if (phase === 'review' && fv.amount) {
    return (
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mx-4 my-2 rounded-2xl bg-white overflow-hidden shadow-lg"
      >
        <div className="bg-gradient-to-r from-[#003D7C]/10 to-[#5B3D8A]/10 px-4 py-2">
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#003D7C]">
            Confirm transfer
          </p>
        </div>
        <div className="text-center py-3">
          <p className="text-3xl font-black text-slate-800 tracking-tight">
            ₹{Number(fv.amount).toLocaleString('en-IN')}
          </p>
        </div>
        {payeeLine && (
          <p className="px-4 pb-3 text-center text-xs text-slate-600 truncate">{payeeLine}</p>
        )}
      </motion.div>
    );
  }

  return (
    <div className="mx-4 my-2 flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/15 px-4 py-3">
      <div className="relative w-10 h-10 shrink-0">
        <div className="absolute inset-0 rounded-full bg-bank-gold/30 animate-ping" />
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-bank-gold/20">
          <TransferIcon size={20} />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white">Fund Transfer</p>
        <p className="text-[11px] text-white/60 mt-0.5 truncate">
          {transferLabel
            ? payeeLine
              ? `${transferLabel} · ${payeeLine}`
              : transferLabel
            : 'Tell me if the payee is within Indian Bank or another bank'}
        </p>
        {fv.amount && (
          <p className="mt-0.5 text-[11px] font-semibold text-bank-gold">
            ₹{Number(fv.amount).toLocaleString('en-IN')}
          </p>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ fv, onConfirm, onEdit }) {
  const rows =
    fv.transferType === 'within'
      ? [
          ['Transfer type', 'Within Bank (NEFT)'],
          ['Payee name', fv.payeeName],
          ['Account no.', fv.payeeAccountNo],
        ]
      : fv.payeeType === 'account'
        ? [
            ['Transfer type', 'Other Bank (IMPS)'],
            ['IFSC', fv.ifsc],
            ['Account no.', fv.payeeAccountNo],
          ]
        : [
            ['Transfer type', 'Other Bank (IMPS)'],
            ['Payee bank', fv.payeeBank],
            ['Mobile', `+91 ${fv.mobileNo}`],
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
            className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0 text-xs"
          >
            <span className="text-slate-500">{k}</span>
            <span className="font-semibold text-slate-800 truncate max-w-[58%] text-right">
              {v}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between py-2.5 text-xs">
          <span className="text-slate-500">Amount</span>
          <span className="font-bold text-slate-900">
            ₹ {Number(fv.amount || 0).toLocaleString('en-IN')}
          </span>
        </div>
        {fv.remarks ? (
          <div className="flex items-center justify-between border-t border-slate-100 py-2.5 text-xs">
            <span className="text-slate-500">Remarks</span>
            <span className="font-medium text-slate-800 truncate max-w-[58%] text-right">
              {fv.remarks}
            </span>
          </div>
        ) : null}
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
          Confirm &amp; Transfer
        </button>
      </div>
    </motion.div>
  );
}

const PROCESSING_STEPS = [
  { label: 'Initiating IMPS transfer…', ms: 800 },
  { label: 'Connecting to NPCI…', ms: 1100 },
  { label: 'Verifying beneficiary account…', ms: 1400 },
  { label: 'Debiting your account…', ms: 1000 },
  { label: 'Transfer successful!', ms: 0 },
];

function ProcessingOverlay({ amount, rrn, onDone }) {
  const [stepIdx, setStepIdx] = React.useState(0);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    let i = 0;
    let cancelled = false;
    function advance() {
      if (cancelled) return;
      if (i >= PROCESSING_STEPS.length - 1) {
        setDone(true);
        return;
      }
      const ms = PROCESSING_STEPS[i].ms;
      i += 1;
      setStepIdx(i);
      setTimeout(advance, ms);
    }
    const t = setTimeout(advance, PROCESSING_STEPS[0].ms);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[90] flex flex-col items-center justify-center bg-[#0a1f3d]"
    >
      <p className="text-[13px] font-semibold uppercase tracking-widest text-white/60">
        Transferring
      </p>
      <p className="mt-1 text-[42px] font-bold leading-none text-white">
        ₹{Number(amount || 0).toLocaleString('en-IN')}
      </p>
      <div className="mt-8 flex flex-col items-center gap-1 px-8">
        {PROCESSING_STEPS.slice(0, stepIdx + 1).map((s, idx) => (
          <p
            key={s.label}
            className={`text-center text-[13px] font-medium ${idx === stepIdx ? (done && idx === PROCESSING_STEPS.length - 1 ? 'text-emerald-400' : 'text-[#f5a623]') : 'text-white/40'}`}
          >
            {idx < stepIdx ? '✓ ' : ''}
            {s.label}
          </p>
        ))}
      </div>
      {done && (
        <div className="mt-8 flex flex-col items-center gap-3 px-8">
          {rrn && <p className="font-mono text-[11px] text-white/50">Ref: {rrn}</p>}
          <button
            type="button"
            onClick={onDone}
            className="w-full max-w-[200px] rounded-xl bg-[#f5a623] py-3 text-[14px] font-bold text-[#0a1f3d] press"
          >
            Done
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function FundTransferVoiceScreen({ onClose, lang, aiPrimer }) {
  const [transferType, setTransferType] = useState('within');
  const [payeeType, setPayeeType] = useState('account');
  const [payeeName, setPayeeName] = useState('');
  const [payeeAccountNo, setPayeeAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [payeeBank, setPayeeBank] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [phase, setPhase] = useState('chat');
  const [showMpin, setShowMpin] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [rrn, setRrn] = useState('');

  const fv = useMemo(
    () => ({
      transferType,
      payeeType,
      payeeName,
      payeeAccountNo,
      ifsc,
      payeeBank,
      mobileNo,
      amount,
      remarks,
    }),
    [
      transferType,
      payeeType,
      payeeName,
      payeeAccountNo,
      ifsc,
      payeeBank,
      mobileNo,
      amount,
      remarks,
    ],
  );

  const setFvFromAgent = useCallback((next) => {
    if (next.transferType !== undefined) setTransferType(String(next.transferType));
    if (next.payeeType !== undefined) setPayeeType(String(next.payeeType));
    if (next.payeeName !== undefined) setPayeeName(String(next.payeeName));
    if (next.payeeAccountNo !== undefined) {
      setPayeeAccountNo(String(next.payeeAccountNo).replace(/\D/g, '').slice(0, 18));
    }
    if (next.ifsc !== undefined) {
      setIfsc(
        String(next.ifsc)
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 11),
      );
    }
    if (next.payeeBank !== undefined) setPayeeBank(String(next.payeeBank));
    if (next.mobileNo !== undefined)
      setMobileNo(String(next.mobileNo).replace(/\D/g, '').slice(0, 10));
    if (next.amount !== undefined) setAmount(String(next.amount).replace(/[^\d.]/g, ''));
    if (next.remarks !== undefined) setRemarks(String(next.remarks).slice(0, 50));
  }, []);

  const handleAgentToolCall = useCallback((name, args) => {
    if (name === 'submit_transfer' && args.ok === true) {
      setPhase('review');
    }
  }, []);

  const handleMpinSuccess = () => {
    setShowMpin(false);
    setRrn(`IMPS${Date.now().toString(36).toUpperCase().slice(-10)}`);
    setShowProcessing(true);
  };

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
            <p className="text-sm font-bold text-white">Fund Transfer</p>
            <p className="text-[10px] text-white/55">Voice-guided · within or other bank</p>
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

      <TransferSummaryCard fv={fv} phase={phase} />

      <div className="relative min-h-0 flex-1">
        <LoanAguiPanel
          chatFullscreen
          open={phase === 'chat'}
          onClose={onClose}
          formValues={fv}
          onFormChange={setFvFromAgent}
          onToolCall={handleAgentToolCall}
          agentId={IMPS_AGUI_AGENT_ID}
          greeting="Hi! Let's set up your fund transfer. First, is the payee's account in Indian Bank, or another bank?"
          primer={aiPrimer || 'Customer opened fund transfer via voice navigation.'}
          assistHint="Say Indian Bank for within-bank, or name the other bank · account or mobile for payee"
          lang={lang || 'en'}
          handsFree
        />

        {phase === 'review' && (
          <div className="absolute inset-0 flex flex-col justify-end pb-2">
            <ReviewCard
              fv={fv}
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
        onSuccess={handleMpinSuccess}
      />

      <AnimatePresence>
        {showProcessing && <ProcessingOverlay amount={amount} rrn={rrn} onDone={onClose} />}
      </AnimatePresence>
    </motion.div>
  );
}
