import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LoanAguiPanel from '../../../components/LoanAguiPanel.jsx';
import MpinSheet from '../../../components/MpinSheet.jsx';
import RMHelpPrompt from '../../../components/RMHelpPrompt.jsx';
import { useRageDetect } from '../../../hooks/useRageDetect.js';
import { useCompanyAgent } from '../../../shared/lib/companyAgents.js';
import { CompanyAppHeader } from '../../../shared/ui/CompanyAppHeader.jsx';

const BALANCE = 352089.79;
const GOLD_RATE_PER_GRAM = 4500;

const PURPOSE_OPTIONS = [
  { id: 'personal', label: 'Personal expenses' },
  { id: 'business', label: 'Business needs' },
  { id: 'education', label: 'Education' },
  { id: 'medical', label: 'Medical emergency' },
];

const EMPLOYMENT_OPTIONS = [
  { id: 'salaried', label: 'Salaried' },
  { id: 'self', label: 'Self employed' },
  { id: 'professional', label: 'Professional' },
];

function formatInr(n) {
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatInrFull(n) {
  return `₹ ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function labelFor(id, list) {
  return list.find((x) => x.id === id)?.label || '';
}

function MpinInline({ onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const DEMO = '1234';

  useEffect(() => {
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
    <div>
      <h2 className="text-center text-[20px] font-bold text-[#1A237E]">Confirm with MPIN</h2>
      <p className="mt-2 text-center text-[12px] text-slate-500">
        Enter the 4-digit MPIN you set during registration.
      </p>
      <div className="mt-5 flex justify-center gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#ECEFF5] text-2xl font-bold text-[#1A237E]"
          >
            {pin[i] ? '•' : ''}
          </div>
        ))}
      </div>
      <input
        type="password"
        inputMode="numeric"
        maxLength={4}
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
        className="sr-only"
        aria-label="MPIN"
        autoFocus
      />
      {error && <p className="mt-3 text-center text-[12px] font-semibold text-red-600">{error}</p>}
    </div>
  );
}

/**
 * DCB Gold Loan — matches Term Deposit / Open New Deposit DCB visual language.
 * Phases: intro → form → mpin → success
 */
export default function DcbGoldLoanScreen({
  onClose,
  lang = 'en',
  aiPrimer: aiPrimerProp,
  voiceAssist = false,
}) {
  const loanAgentId = useCompanyAgent('loanLos');
  const [phase, setPhase] = useState(() => (aiPrimerProp || voiceAssist ? 'form' : 'intro'));
  const [mpinOpen, setMpinOpen] = useState(false);
  const [loanAmount, setLoanAmount] = useState(100000);
  const [tenureMonths, setTenureMonths] = useState(12);
  const [goldWeightGrams, setGoldWeightGrams] = useState(25);
  const [purpose, setPurpose] = useState('');
  const [employment, setEmployment] = useState('');
  const [aiOpen, setAiOpen] = useState(() => !!aiPrimerProp || voiceAssist);
  const [aiPrimer, setAiPrimer] = useState(() => aiPrimerProp || null);
  const [rmPromptOpen, setRmPromptOpen] = useState(false);

  const formStateRef = useRef({
    loanAmount,
    tenureMonths,
    goldWeightGrams,
    purpose,
    employment,
  });

  useEffect(() => {
    formStateRef.current = { loanAmount, tenureMonths, goldWeightGrams, purpose, employment };
  }, [loanAmount, tenureMonths, goldWeightGrams, purpose, employment]);

  const { containerProps: rageProps, dismiss: dismissRage } = useRageDetect({
    onFrustrated: () => {
      if (!aiOpen) setRmPromptOpen(true);
    },
  });

  const maxEligible = useMemo(
    () => Math.round(goldWeightGrams * GOLD_RATE_PER_GRAM * 0.75),
    [goldWeightGrams],
  );

  const formValid =
    loanAmount >= 10000 &&
    loanAmount <= maxEligible &&
    tenureMonths >= 3 &&
    tenureMonths <= 36 &&
    goldWeightGrams >= 1 &&
    purpose &&
    employment;

  const pinkField =
    'w-full rounded-xl bg-[#F8E8E0] px-3 py-2.5 text-[15px] font-semibold text-[#1A237E] outline-none border-0';

  const setFvFromAgent = useCallback((field, value) => {
    if (field === 'loanAmount') {
      const n = Math.max(10000, parseFloat(String(value)) || 10000);
      setLoanAmount(n);
      setPhase('form');
      setAiOpen(true);
    } else if (field === 'tenureMonths') {
      const n = Math.min(36, Math.max(3, parseInt(value, 10) || 12));
      setTenureMonths(n);
    } else if (field === 'goldWeightGrams') {
      const n = Math.max(1, parseFloat(String(value)) || 1);
      setGoldWeightGrams(n);
      setPhase('form');
      setAiOpen(true);
    } else if (field === 'purpose' && PURPOSE_OPTIONS.some((o) => o.id === value)) {
      setPurpose(String(value));
    } else if (field === 'employment' && EMPLOYMENT_OPTIONS.some((o) => o.id === value)) {
      setEmployment(String(value));
    }
  }, []);

  const handleToolCall = useCallback(
    (toolName, args) => {
      if (toolName === 'set_field') {
        setFvFromAgent(args.field, args.value);
      } else if (toolName === 'submit_loan') {
        setMpinOpen(true);
      }
    },
    [setFvFromAgent],
  );

  const handleBack = () => {
    if (phase === 'success' || phase === 'intro') onClose();
    else if (phase === 'form') setPhase('intro');
    else onClose();
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="absolute inset-0 z-40 flex flex-col bg-[#F5F7FA]"
      {...rageProps}
    >
      {phase === 'intro' ? (
        <CompanyAppHeader title="Gold Loan" onBack={onClose} onHome={onClose} />
      ) : phase === 'success' ? null : mpinOpen ? (
        <CompanyAppHeader title="Confirm with MPIN" onBack={() => setMpinOpen(false)} onHome={onClose} />
      ) : (
        <CompanyAppHeader title="Apply Gold Loan" onBack={handleBack} onHome={onClose} />
      )}

      <div className="relative flex-1 overflow-y-auto no-scrollbar pb-24">
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 pb-4 pt-4"
            >
              <div className="rounded-2xl border border-[#C5CAE9] bg-white p-4 shadow-[0_2px_12px_rgba(26,35,126,0.06)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[15px] font-bold text-[#1A237E]">DCB Gold Loan</h2>
                    <ul className="mt-3 space-y-1.5">
                      {[
                        'Instant loan against gold ornaments',
                        'Competitive interest rates',
                        'Flexible tenure 3–36 months',
                        'Minimal documentation',
                      ].map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[12px] text-[#1A237E]">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-[#FFD600]" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-2xl shadow-md">
                    🥇
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPhase('form');
                    setAiOpen(true);
                  }}
                  className="mt-4 rounded-xl bg-[#1A237E] px-5 py-2.5 text-[13px] font-bold text-white shadow press"
                >
                  Apply Now
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'form' && !mpinOpen && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="px-4 pb-4 pt-2"
            >
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-[#E8EDF5] px-3 py-2.5">
                <span className="h-5 w-0.5 bg-[#1A237E]" />
                <p className="text-[18px] font-bold text-[#1A237E]">{formatInrFull(BALANCE)}</p>
              </div>

              <label className="mb-1 block text-[11px] font-semibold text-[#1A237E]">Gold weight (grams)*</label>
              <input
                type="number"
                min={1}
                value={goldWeightGrams}
                onChange={(e) => setGoldWeightGrams(Math.max(1, parseFloat(e.target.value) || 1))}
                className={`${pinkField} mb-3`}
              />

              <label className="mb-1 block text-[11px] font-semibold text-[#1A237E]">Loan amount (₹)*</label>
              <input
                type="number"
                min={10000}
                value={loanAmount}
                onChange={(e) => setLoanAmount(Math.max(10000, parseFloat(e.target.value) || 10000))}
                className={`${pinkField} mb-1`}
              />
              <p className="mb-3 text-[10px] text-slate-500">
                Max eligible up to {formatInr(maxEligible)} (75% of gold value)
              </p>

              <label className="mb-1 block text-[11px] font-semibold text-[#1A237E]">Tenure (months)*</label>
              <input
                type="number"
                min={3}
                max={36}
                value={tenureMonths}
                onChange={(e) => setTenureMonths(Math.min(36, Math.max(3, parseInt(e.target.value, 10) || 12)))}
                className={`${pinkField} mb-3`}
              />

              <label className="mb-1 block text-[11px] font-semibold text-[#1A237E]">Purpose of loan*</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className={`${pinkField} mb-3`}
              >
                <option value="">Select purpose</option>
                {PURPOSE_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>

              <label className="mb-1 block text-[11px] font-semibold text-[#1A237E]">Employment type*</label>
              <select
                value={employment}
                onChange={(e) => setEmployment(e.target.value)}
                className={`${pinkField} mb-3`}
              >
                <option value="">Select employment</option>
                {EMPLOYMENT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>

              <div className="mb-3 rounded-xl bg-[#ECEFF5] px-3.5 py-3">
                <p className="text-[11px] font-bold tracking-wide text-[#5E35B1]">LOAN SUMMARY</p>
                <div className="mt-2 space-y-1.5 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Gold pledged</span>
                    <span className="font-bold text-[#1A237E]">{goldWeightGrams} g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Loan amount</span>
                    <span className="font-bold text-[#1A237E]">{formatInr(loanAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tenure</span>
                    <span className="font-bold text-[#1A237E]">{tenureMonths} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Purpose</span>
                    <span className="font-bold text-[#1A237E]">{labelFor(purpose, PURPOSE_OPTIONS) || '—'}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={!formValid}
                onClick={() => setMpinOpen(true)}
                className="w-full rounded-xl bg-[#1A237E] py-3 text-[14px] font-bold text-white shadow disabled:opacity-40 press"
              >
                Continue
              </button>
            </motion.div>
          )}

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
                Your gold loan request has been submitted successfully. You will receive a confirmation shortly. Thank
                you for banking with DCB Bank.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-8 w-full rounded-full bg-[#1A237E] py-3.5 text-[15px] font-bold text-white shadow press"
              >
                Back to Home
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {mpinOpen && (
          <motion.div
            key="mpin-dcb-loan"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col bg-[#B3D4FC]/40 backdrop-blur-[1px]"
          >
            <CompanyAppHeader
              title="Confirm with MPIN"
              onBack={() => setMpinOpen(false)}
              onHome={onClose}
              brandPill
            />
            <div className="flex flex-1 flex-col px-4 pt-4">
              <div className="rounded-2xl bg-white px-4 py-5 shadow-lg">
                <MpinInline
                  onSuccess={() => {
                    setMpinOpen(false);
                    setPhase('success');
                  }}
                />
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-[11px] font-bold tracking-wide text-slate-500">LOAN SUMMARY</p>
                  <div className="mt-2 divide-y divide-slate-100">
                    {[
                      ['Loan Amount', formatInr(loanAmount)],
                      ['Gold Pledged', `${goldWeightGrams} g`],
                      ['Tenure', `${tenureMonths} months`],
                      ['Purpose', labelFor(purpose, PURPOSE_OPTIONS) || '—'],
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

      {!aiOpen && phase !== 'success' && !mpinOpen && (
        <button
          type="button"
          onClick={() => setAiOpen(true)}
          className="absolute bottom-6 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#B3D4FC] bg-white text-xl shadow-lg"
          aria-label="Open AI Assistant"
        >
          🧑‍💼
        </button>
      )}

      {phase !== 'success' && !mpinOpen && (
        <LoanAguiPanel
          agentId={loanAgentId}
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          greeting={
            phase === 'intro'
              ? 'Welcome to DCB Gold Loan. Tap Apply Now or tell me how many grams of gold you want to pledge.'
              : 'I will help you complete your gold loan application. How many grams of gold would you like to pledge?'
          }
          assistTitle={voiceAssist ? 'AI Assistant · Voice Assist' : 'AI Assistant'}
          assistHint={voiceAssist ? 'Hands-free — speak after I finish.' : 'Voice or text — your choice'}
          primer={aiPrimer}
          formValues={formStateRef.current}
          onToolCall={handleToolCall}
          lang={lang}
          voiceAssist={voiceAssist}
        />
      )}
    </motion.div>
  );
}
