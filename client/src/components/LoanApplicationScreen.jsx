import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { STRINGS, LANGUAGES } from '../i18n/strings.js';
import LoanAguiPanel from './LoanAguiPanel.jsx';
import RMHelpPrompt from './RMHelpPrompt.jsx';
import { useRageDetect } from '../hooks/useRageDetect.js';

const HEADER_BLUE = '#0a3d62';
const GOLD_BAR = '#f5c518';

function emptyForm() {
  return {
    occupation: '',
    subProduct: '',
    purposeLoan: '',
    variant: '',
    facility: '',
    proposal: '',
    interestType: 'floating',
    loanAmount: '',
    tenureMonths: '',
    branchPin: '',
  };
}

function formValidFromFv(fv) {
  return (
    fv.occupation &&
    fv.subProduct &&
    fv.purposeLoan &&
    fv.variant &&
    fv.facility &&
    fv.proposal &&
    Number(fv.loanAmount) > 0 &&
    Number(fv.tenureMonths) >= 1 &&
    Number(fv.tenureMonths) <= 360 &&
    /^\d{6}$/.test(String(fv.branchPin || '').replace(/\D/g, ''))
  );
}

function FormRow({ label, required, highlight, children }) {
  return (
    <div
      className={`grid grid-cols-[minmax(0,44%)_1fr] items-center gap-x-2 border-b border-dashed border-slate-300 py-2.5 ${
        highlight ? 'rounded-md ring-2 ring-bank-gold/90 ring-offset-1' : ''
      }`}
    >
      <label className="text-left text-[11px] font-medium leading-snug text-slate-900">
        {required && <span className="text-red-600">*</span>}
        {label}
      </label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function fieldClass(disabled) {
  return [
    'w-full rounded border border-slate-400 bg-white px-2 py-1.5 text-[11px] text-slate-900 outline-none',
    disabled ? 'cursor-not-allowed bg-slate-100 text-slate-600' : 'focus:border-[#0a3d62] focus:ring-1 focus:ring-[#0a3d62]/30',
  ].join(' ');
}

function ProgressDots({ step, total }) {
  return (
    <div className="flex items-center justify-center gap-0 px-2">
      {Array.from({ length: total }, (_, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <div
              className={`h-[2px] w-6 sm:w-8 ${i <= step ? 'bg-white' : 'bg-white/35'}`}
              aria-hidden
            />
          )}
          <div
            className={`h-2 w-2 shrink-0 rounded-full ${i <= step ? 'bg-white' : 'border border-white/70 bg-transparent'}`}
            aria-hidden
          />
        </React.Fragment>
      ))}
    </div>
  );
}

function SelectListModal({ open, options, value, onPick, onClose, title }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-loan-modal
          className="absolute inset-0 z-[80] flex items-end justify-center bg-black/45 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="max-h-[72%] w-full max-w-[360px] overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
              <span className="text-[13px] font-semibold text-slate-900">{title}</span>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 press"
                aria-label="Close"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>
            <ul className="max-h-[min(52vh,420px)] overflow-y-auto no-scrollbar">
              {options.map((opt) => {
                const sel = value === opt.id;
                return (
                  <li key={opt.id} className="border-b border-slate-100 last:border-0">
                    <button
                      type="button"
                      onClick={() => onPick(opt.id)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left text-[12px] text-slate-900 press hover:bg-slate-50"
                    >
                      <span className="leading-snug">{opt.label}</span>
                      <span
                        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                          sel ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                        }`}
                        aria-hidden
                      >
                        {sel && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GuidelinesModal({ open, onClose, title, rows, okLabel }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-loan-modal
          className="absolute inset-0 z-[80] flex items-center justify-center bg-black/45 p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="max-h-[85%] w-full max-w-[340px] overflow-hidden rounded border-2 border-slate-400 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-2 border-[#0a3d62] bg-[#0a3d62] px-2 py-2">
              <span className="flex-1 text-center text-[12px] font-bold text-white">{title}</span>
              <button
                type="button"
                onClick={onClose}
                className="press flex h-7 w-7 shrink-0 items-center justify-center text-white/90"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="max-h-[min(58vh,380px)] overflow-y-auto no-scrollbar">
              {rows.map((row, idx) => (
                <div
                  key={idx}
                  className="grid border-b border-dashed border-slate-800 last:border-b-0"
                  style={{ gridTemplateColumns: 'minmax(0,38%) 1fr' }}
                >
                  <div className="flex items-center justify-center border-r border-dashed border-slate-800 bg-sky-100 px-1.5 py-2 text-center text-[10px] font-bold leading-tight text-slate-900">
                    {row.label}
                  </div>
                  <div className="whitespace-pre-line bg-white px-2 py-2 text-[10px] leading-snug text-slate-900">{row.body}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-center border-t border-slate-200 bg-white px-3 py-3">
              <button
                type="button"
                onClick={onClose}
                className="min-w-[120px] rounded bg-[#0a3d62] px-6 py-2 text-[12px] font-bold uppercase tracking-wide text-white press"
              >
                {okLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function selectOptions(J, keys) {
  return keys.map((k, i) => ({ id: `o${i}`, label: J[k] }));
}

const MODAL_FIELD = {
  occupation: 'occupation',
  subProduct: 'subProduct',
  purposeLoan: 'purposeLoan',
  variant: 'variant',
  facility: 'facility',
  proposal: 'proposal',
};

export default function LoanApplicationScreen({ onClose, lang, aiPrimer: aiPrimerProp }) {
  const L = STRINGS[lang] || STRINGS.en;
  const J = STRINGS.en.loanLos;

  const occupationOpts = useMemo(() => selectOptions(J, ['optSalaried', 'optSelfEmployed', 'optProfessional']), [J]);
  const subProductOpts = useMemo(() => selectOptions(J, ['optCleanLoan', 'optPersonal', 'optOverdraft']), [J]);
  const purposeLoanOpts = useMemo(
    () => [
      { id: 'lp1', label: J.purposeLoanOpt1 },
      { id: 'lp2', label: J.purposeLoanOpt2 },
      { id: 'lp3', label: J.purposeLoanOpt3 },
      { id: 'lp4', label: J.purposeLoanOpt4 },
      { id: 'lp5', label: J.purposeLoanOpt5 },
    ],
    [J],
  );
  const variantOpts = useMemo(() => selectOptions(J, ['optStd', 'optFlexi', 'optLite']), [J]);
  const facilityOpts = useMemo(() => selectOptions(J, ['optTerm', 'optOdCombo', 'optTermOd']), [J]);
  const proposalOpts = useMemo(() => selectOptions(J, ['optNew', 'optTopUp', 'optTakeover']), [J]);

  const [step, setStep] = useState(0);
  const [fv, setFv] = useState(() => emptyForm());
  const fvRef = useRef(fv);
  useEffect(() => {
    fvRef.current = fv;
  }, [fv]);

  const [modalKind, setModalKind] = useState(null);
  const [productOpen, setProductOpen] = useState(false);
  const [appRef, setAppRef] = useState('');
  const [aiOpen, setAiOpen] = useState(() => !!aiPrimerProp);
  const [aiPrimer, setAiPrimer] = useState(() => aiPrimerProp || null);
  const [highlightField, setHighlightField] = useState(null);
  const [rmPromptOpen, setRmPromptOpen] = useState(false);

  const { containerProps: rageProps, markInvalidField, dismiss: dismissRage } = useRageDetect({
    onFrustrated: () => { if (!aiOpen) setRmPromptOpen(true); },
  });

  const loanRootRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const tapTimesRef = useRef([]);
  const aiOpenRef = useRef(false);
  const stepRef = useRef(0);
  const modalKindRef = useRef(null);
  const productOpenRef = useRef(false);

  useEffect(() => {
    aiOpenRef.current = aiOpen;
    if (aiOpen) lastActivityRef.current = Date.now();
  }, [aiOpen]);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  useEffect(() => {
    modalKindRef.current = modalKind;
  }, [modalKind]);
  useEffect(() => {
    productOpenRef.current = productOpen;
  }, [productOpen]);

  useEffect(() => {
    const el = loanRootRef.current;
    if (!el) return undefined;
    const bump = () => {
      lastActivityRef.current = Date.now();
    };
    for (const t of ['pointerdown', 'keydown', 'touchstart', 'scroll']) {
      el.addEventListener(t, bump, { passive: true });
    }
    return () => {
      for (const t of ['pointerdown', 'keydown', 'touchstart', 'scroll']) {
        el.removeEventListener(t, bump);
      }
    };
  }, []);

  useEffect(() => {
    const RAGE_MS = 1500;
    const IDLE_MS = 8000;
    const el = loanRootRef.current;
    if (!el) return undefined;

    const onTapCapture = (e) => {
      const raw = e.target;
      if (!(raw instanceof Element)) return;
      if (raw.closest('[data-ai-fab]')) return;
      if (raw.closest('[data-loan-modal]')) return;
      if (raw.closest('[data-loan-assistant]')) return;
      if (stepRef.current >= 2 || aiOpenRef.current) return;

      const now = Date.now();
      tapTimesRef.current = tapTimesRef.current.filter((t) => now - t < RAGE_MS);
      tapTimesRef.current.push(now);
      if (tapTimesRef.current.length >= 5) {
        tapTimesRef.current = [];
        if (!aiOpenRef.current) setRmPromptOpen(true);
      }
    };

    el.addEventListener('pointerdown', onTapCapture, true);

    const tick = () => {
      if (aiOpenRef.current || stepRef.current >= 2) return;
      if (modalKindRef.current || productOpenRef.current) return;
      if (Date.now() - lastActivityRef.current < IDLE_MS) return;
      setAiPrimer(J.aiPrimerIdle);
      setAiOpen(true);
    };
    const id = setInterval(tick, 500);

    return () => {
      el.removeEventListener('pointerdown', onTapCapture, true);
      clearInterval(id);
    };
  }, [J.aiPrimerIdle, J.aiPrimerRage]);

  useEffect(() => {
    if (!highlightField) return undefined;
    const t = setTimeout(() => setHighlightField(null), 2200);
    return () => clearTimeout(t);
  }, [highlightField]);

  const labelFor = (id, list) => list.find((x) => x.id === id)?.label || '';

  const resetAll = () => {
    setStep(0);
    setFv(emptyForm());
    setModalKind(null);
    setProductOpen(false);
    setAppRef('');
    setAiOpen(false);
    setAiPrimer(null);
    setHighlightField(null);
  };

  const handleClose = () => {
    resetAll();
    onClose?.();
  };

  const formValid = formValidFromFv(fv);

  const productRows = [
    { label: J.productRow1Label, body: J.productRow1Body },
    { label: J.productRow2Label, body: J.productRow2Body },
    { label: J.productRow3Label, body: J.productRow3Body },
  ];

  const onNext = () => {
    if (step === 0) {
      if (!formValid) return;
      setStep(1);
      return;
    }
    if (step === 1) {
      setAppRef(`LOS${Date.now().toString(36).toUpperCase().slice(-10)}`);
      setStep(2);
    }
  };

  const openModal = (kind) => setModalKind(kind);
  const closeModal = () => setModalKind(null);

  const pickModal = (id) => {
    const field = modalKind ? MODAL_FIELD[modalKind] : null;
    if (field) setFv((prev) => ({ ...prev, [field]: id }));
    setModalKind(null);
  };

  const modalOptions =
    modalKind === 'occupation'
      ? occupationOpts
      : modalKind === 'subProduct'
        ? subProductOpts
        : modalKind === 'purposeLoan'
          ? purposeLoanOpts
          : modalKind === 'variant'
            ? variantOpts
            : modalKind === 'facility'
              ? facilityOpts
              : modalKind === 'proposal'
                ? proposalOpts
                : [];

  const modalValue = modalKind ? fv[MODAL_FIELD[modalKind]] || '' : '';

  const handleAgentToolCall = useCallback((name, args) => {
    if (name === 'request_field' && args.field_id) setHighlightField(String(args.field_id));
    if (name === 'set_field' && args.field_id) setHighlightField(String(args.field_id));
    if (name === 'click_button' && args.ok === true && args.button === 'submit') {
      setHighlightField(null);
      setStep((s) => {
        if (s === 1) {
          setAppRef(`LOS${Date.now().toString(36).toUpperCase().slice(-10)}`);
          return 2;
        }
        if (s === 0 && formValidFromFv(fvRef.current)) return 1;
        return s;
      });
    }
    if (name === 'click_button' && args.button === 'cancel') setAiOpen(false);
  }, []);

  return (
    <motion.div
      ref={loanRootRef}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-[60] flex flex-col overflow-hidden bg-white"
      style={{ borderRadius: '44px' }}
    >
      <div className="shrink-0 pt-10" style={{ backgroundColor: HEADER_BLUE }}>
        <div className="flex items-center gap-2 px-2 pb-1">
          <button
            type="button"
            onClick={step > 0 && step < 2 ? () => setStep((s) => Math.max(0, s - 1)) : handleClose}
            className="press-bright flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white"
            aria-label={step === 0 ? L.cancel : J.loanBack}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <img
              src="/indian-bank-banner.png"
              alt=""
              className="mx-auto h-9 max-w-[200px] object-contain object-center pointer-events-none select-none"
            />
          </div>
          <div className="w-9 shrink-0" aria-hidden />
        </div>
        <div className="h-1 w-full" style={{ backgroundColor: GOLD_BAR }} />

        <div className="px-2 pb-2 pt-2 text-white">
          <ProgressDots step={step} total={3} />
          <div className="mt-1.5 flex flex-col items-center gap-0.5 text-center">
            <span className="text-[11px] font-semibold">{J.demoUserName}</span>
            <span className="font-mono text-[10px] text-white/85">{J.demoUserRef}</span>
          </div>
          <button
            type="button"
            className="mt-1 flex w-full items-center justify-center gap-1 border border-white/20 bg-white/10 py-1 text-[11px] font-semibold text-white"
          >
            <span>{step === 0 ? J.step1Title : step === 1 ? J.step2Title : J.step3Title}</span>
            <span className="text-white/80" aria-hidden>
              ▾
            </span>
          </button>
        </div>
      </div>

      <div
        className={`min-h-0 flex-1 overflow-y-auto bg-white px-2 pt-1 no-scrollbar ${aiOpen ? 'pb-[clamp(160px,28vh,240px)]' : 'pb-24'}`}
      >
        {step === 0 && (
          <>
            <p className="px-1 py-1 text-[9px] text-slate-500">{J.portalLabel}</p>
            <div className="rounded border border-slate-300 bg-white px-1">
              <FormRow label={J.occupationType} required highlight={highlightField === 'occupation'}>
                <button
                  type="button"
                  onClick={() => openModal('occupation')}
                  className={`flex w-full items-center justify-between rounded border px-2 py-1.5 text-left text-[11px] press ${
                    fv.occupation ? 'border-slate-400 bg-white text-slate-900' : 'border-slate-400 bg-white text-slate-500'
                  }`}
                >
                  <span className="line-clamp-2">{labelFor(fv.occupation, occupationOpts) || J.selectPlaceholder}</span>
                  <span className="text-slate-500">▾</span>
                </button>
              </FormRow>
              <FormRow label={J.subProduct} required highlight={highlightField === 'subProduct'}>
                <button
                  type="button"
                  onClick={() => openModal('subProduct')}
                  className={`flex w-full items-center justify-between rounded border px-2 py-1.5 text-left text-[11px] press ${
                    fv.subProduct ? 'border-slate-400 bg-white text-slate-900' : 'border-slate-400 bg-white text-slate-500'
                  }`}
                >
                  <span className="line-clamp-2">{labelFor(fv.subProduct, subProductOpts) || J.selectPlaceholder}</span>
                  <span className="text-slate-500">▾</span>
                </button>
              </FormRow>
              <FormRow label={J.purposeOfLoan} required highlight={highlightField === 'purposeLoan'}>
                <button
                  type="button"
                  onClick={() => openModal('purposeLoan')}
                  className={`flex w-full items-center justify-between rounded border px-2 py-1.5 text-left text-[11px] press ${
                    fv.purposeLoan ? 'border-slate-400 bg-white text-slate-900' : 'border-slate-400 bg-white text-slate-500'
                  }`}
                >
                  <span className="line-clamp-2">{labelFor(fv.purposeLoan, purposeLoanOpts) || J.selectPlaceholder}</span>
                  <span className="text-slate-500">▾</span>
                </button>
              </FormRow>
              <FormRow label={J.variant} required highlight={highlightField === 'variant'}>
                <button
                  type="button"
                  onClick={() => openModal('variant')}
                  className={`flex w-full items-center justify-between rounded border px-2 py-1.5 text-left text-[11px] press ${
                    fv.variant ? 'border-slate-400 bg-white text-slate-900' : 'border-slate-400 bg-white text-slate-500'
                  }`}
                >
                  <span className="line-clamp-2">{labelFor(fv.variant, variantOpts) || J.selectPlaceholder}</span>
                  <span className="text-slate-500">▾</span>
                </button>
              </FormRow>
              <FormRow label={J.facilityType} required highlight={highlightField === 'facility'}>
                <button
                  type="button"
                  onClick={() => openModal('facility')}
                  className={`flex w-full items-center justify-between rounded border px-2 py-1.5 text-left text-[11px] press ${
                    fv.facility ? 'border-slate-400 bg-white text-slate-900' : 'border-slate-400 bg-white text-slate-500'
                  }`}
                >
                  <span className="line-clamp-2">{labelFor(fv.facility, facilityOpts) || J.selectPlaceholder}</span>
                  <span className="text-slate-500">▾</span>
                </button>
              </FormRow>
              <FormRow label={J.proposalType} required highlight={highlightField === 'proposal'}>
                <button
                  type="button"
                  onClick={() => openModal('proposal')}
                  className={`flex w-full items-center justify-between rounded border px-2 py-1.5 text-left text-[11px] press ${
                    fv.proposal ? 'border-slate-400 bg-white text-slate-900' : 'border-slate-400 bg-white text-slate-500'
                  }`}
                >
                  <span className="line-clamp-2">{labelFor(fv.proposal, proposalOpts) || J.selectPlaceholder}</span>
                  <span className="text-slate-500">▾</span>
                </button>
              </FormRow>
              <FormRow label={J.interestType} required={false}>
                <select className={fieldClass(true)} disabled value="floating">
                  <option value="floating">{J.interestFloating}</option>
                </select>
              </FormRow>
              <FormRow label={J.requestedAmount} required highlight={highlightField === 'loanAmount'}>
                <div className="flex items-center gap-1 rounded border border-slate-400 bg-white px-2 py-1.5 focus-within:border-[#0a3d62] focus-within:ring-1 focus-within:ring-[#0a3d62]/30">
                  <span className="text-[11px] font-semibold text-slate-600">₹</span>
                  <input
                    className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[11px] outline-none"
                    inputMode="decimal"
                    value={fv.loanAmount}
                    onChange={(e) => setFv((p) => ({ ...p, loanAmount: e.target.value.replace(/[^\d.]/g, '') }))}
                    onBlur={(e) => { if (!e.target.value || Number(e.target.value) <= 0) markInvalidField('loanAmount'); }}
                    placeholder="0.00"
                  />
                </div>
              </FormRow>
              <FormRow label={J.requestedTenure} required highlight={highlightField === 'tenureMonths'}>
                <input
                  className={fieldClass()}
                  inputMode="numeric"
                  value={fv.tenureMonths}
                  onChange={(e) =>
                    setFv((p) => ({ ...p, tenureMonths: e.target.value.replace(/\D/g, '').slice(0, 3) }))
                  }
                  onBlur={(e) => { const n = Number(e.target.value); if (!n || n < 1 || n > 360) markInvalidField('tenureMonths'); }}
                  placeholder={J.phTenure}
                />
              </FormRow>
              <FormRow label={J.processingBranch} required highlight={highlightField === 'branchPin'}>
                <input
                  className={fieldClass()}
                  value={fv.branchPin}
                  onChange={(e) => setFv((p) => ({ ...p, branchPin: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                  onBlur={(e) => { if (!/^\d{6}$/.test(e.target.value)) markInvalidField('branchPin'); }}
                  placeholder={J.phPincode}
                />
              </FormRow>
            </div>
            <button
              type="button"
              onClick={() => setProductOpen(true)}
              className="mt-2 px-1 text-left text-[10px] font-semibold text-[#0a3d62] underline"
            >
              {J.viewProductDetails}
            </button>
          </>
        )}

        {step === 1 && (
          <div className="px-1 pt-2">
            <p className="mb-2 text-center text-[12px] font-bold text-slate-900">{J.reviewTitle}</p>
            <div className="rounded border border-dashed border-slate-800">
              {[
                [J.occupationType, labelFor(fv.occupation, occupationOpts)],
                [J.subProduct, labelFor(fv.subProduct, subProductOpts)],
                [J.purposeOfLoan, labelFor(fv.purposeLoan, purposeLoanOpts)],
                [J.variant, labelFor(fv.variant, variantOpts)],
                [J.facilityType, labelFor(fv.facility, facilityOpts)],
                [J.proposalType, labelFor(fv.proposal, proposalOpts)],
                [J.interestType, J.interestFloating],
                [
                  J.requestedAmount,
                  `₹${Number(fv.loanAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                ],
                [J.requestedTenure, `${fv.tenureMonths} ${J.monthsSuffix}`],
                [J.processingBranch, fv.branchPin],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="grid border-b border-dashed border-slate-600 last:border-0"
                  style={{ gridTemplateColumns: 'minmax(0,42%) 1fr' }}
                >
                  <div className="bg-sky-100 px-2 py-2 text-[10px] font-bold text-slate-900">{k}</div>
                  <div className="bg-white px-2 py-2 text-[10px] text-slate-800">{v}</div>
                </div>
              ))}
            </div>
            <p className="mt-2 px-1 text-center text-[10px] text-slate-500">{J.reviewDisclaimer}</p>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center px-3 pt-6 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">✓</div>
            <p className="text-[14px] font-bold text-slate-900">{J.successTitle}</p>
            <p className="mt-1 font-mono text-[12px] text-slate-700">{appRef}</p>
            <p className="mt-2 text-[11px] leading-snug text-slate-600">{J.successBody}</p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-6 min-w-[160px] rounded bg-[#0a3d62] py-2.5 text-[12px] font-bold text-white press"
            >
              {J.doneHome}
            </button>
          </div>
        )}
      </div>

      {step < 2 && (step === 0 || step === 1) && !aiOpen && (
        <button
          type="button"
          data-ai-fab
          onClick={() => {
            setAiPrimer(null);
            setAiOpen(true);
          }}
          className="press-bright absolute bottom-[3.85rem] right-2 z-[86] flex h-11 w-11 items-center justify-center rounded-full border-2 border-bank-gold bg-bank-purpleDeep text-[11px] font-black text-bank-gold shadow-lg"
          aria-label={J.aiFabAria}
        >
          {J.aiFab}
        </button>
      )}

      {step < 2 && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-end border-t border-slate-200 bg-white px-3 py-3">
          <button
            type="button"
            onClick={onNext}
            disabled={step === 0 && !formValid}
            className="rounded bg-[#0a3d62] px-8 py-2 text-[12px] font-bold text-white press disabled:cursor-not-allowed disabled:opacity-45"
          >
            {step === 0 ? J.next : J.submitApplication}
          </button>
        </div>
      )}

      <SelectListModal
        open={!!modalKind}
        options={modalOptions}
        value={modalValue}
        onPick={pickModal}
        onClose={closeModal}
        title={J.selectTitle}
      />

      <GuidelinesModal
        open={productOpen}
        onClose={() => setProductOpen(false)}
        title={J.productModalTitle}
        rows={productRows}
        okLabel={J.guidelinesOk}
      />

      <RMHelpPrompt
        open={rmPromptOpen}
        onHelp={() => {
          setRmPromptOpen(false);
          dismissRage();
          setAiPrimer(J.aiPrimerRage);
          setAiOpen(true);
        }}
        onDismiss={() => {
          setRmPromptOpen(false);
          dismissRage();
          lastActivityRef.current = Date.now();
        }}
      />

      <LoanAguiPanel
        open={aiOpen}
        onClose={() => {
          lastActivityRef.current = Date.now();
          setAiPrimer(null);
          setAiOpen(false);
        }}
        formValues={fv}
        onFormChange={setFv}
        onToolCall={handleAgentToolCall}
        greeting={J.aiGreeting}
        assistTitle={J.aiAssistTitle}
        assistHint={J.aiAssistHint}
        primer={aiPrimer}
        lang={LANGUAGES.find((x) => x.code === lang)?.bcp47 || 'en-IN'}
      />
    </motion.div>
  );
}
