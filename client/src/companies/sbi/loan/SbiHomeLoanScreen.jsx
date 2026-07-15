import React, { useCallback, useEffect, useState } from 'react';
import LoanAguiPanel from '../../../components/LoanAguiPanel.jsx';
import RMHelpPrompt from '../../../components/RMHelpPrompt.jsx';
import { useRageDetect } from '../../../hooks/useRageDetect.js';
import { useCompanyAgent } from '../../../shared/lib/companyAgents.js';
import { SBI } from '../theme.js';
import { parseSbiHomeLoanInput, getSbiHomeLoanGreetingHint } from './sbiHomeLoanInputParser.js';

const LOAN_PURPOSE_CATEGORIES = [
  'Realty Loan for purchase of Plot',
  'New/Old Independent House/Villa/Bungalow/Row House',
  'New/Old Flat',
];

const PURPOSE_OPTIONS = [
  'Purchase Of A Plot For Construction Of A House',
  'Purchase Of New House / Flat',
  'Purchase Of Old House / Flat',
  'Construction Of New House / Flat',
  'Extension Of Existing Old House / Flat',
];

const PROPERTY_TYPES = [
  'Builder Tie-Up',
  'No Builder Tie-Up',
  'Preferred Builder',
  'Self-Constructed/ Independent House',
  'Small Project Not Covered Under Rera',
  'Property Not Identified',
];

const PROPERTY_STATUS = ['Construction not started', 'Ready for possession', 'Under Construction'];
const REPAYMENT_MODES = ['Standing Instruction SI', 'NACH'];

const CONSENT_PARAS = [
  'I/we certify that the information and particulars provided by me/us in this application form (and all documents referred or provided herewith) are true, correct, complete and up to date in all respects and I have not withheld any information. I/we authorize State Bank of India to make inquiries related to or verify said information directly or through any third party.',
  'I/we understand that the Bank will use the information furnished by me/us in accordance with the applicable laws of India and any other foreign laws to which I/we/the Bank may be subject to.',
  'I/we agree and undertake to provide any further information that Bank may require. I/we agree and understand that Bank reserve the right to retain the application form, and the documents provided therewith and will not return the same to me/us.',
  'I/we further agree that any facility that may be provided to me/us shall be governed by the rules of the Bank that may be in force from time to time.',
  'I/we undertake and declare that I/we will comply with the Foreign Exchange Management Act, 1999 (\'FEMA\') and the applicable rules, regulations, notifications, directions or orders made there under.',
  'I/we acknowledge that the Bank remains entitled to assign any activities to any third-party agency at its sole discretion.',
  'I/we hereby agree and give consent for the disclosure or obtention by the Bank of all or any such information and data relating to me/us to Credit Information Companies.',
  'I/we agree to receive SMS alerts/Phone calls related to my/our application status and account activity.',
  'I/we further acknowledge that I/we have read, understood and agree with the Most Important Terms and Conditions governing the home loan product chosen by me/us.',
  'I/we authorize the Bank to share, disclose, exchange, receive or use in any manner whatsoever the information/ data provided by/ related to me/us to/from the Group Companies of State Bank of India.',
];

function SbiLoanHeader({ title, onBack, showBackBtn }) {
  return (
    <header className="flex items-center gap-2 bg-white px-3 py-3 shadow-sm">
      {onBack && (
        <button type="button" onClick={onBack} className="press" aria-label="Back">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={SBI.purple} strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <h1 className="flex-1 text-[15px] font-bold" style={{ color: SBI.ink }}>{title}</h1>
      {showBackBtn && (
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border px-3 py-1 text-[11px] font-semibold"
          style={{ borderColor: SBI.purple, color: SBI.purple }}
        >
          Back
        </button>
      )}
      {!showBackBtn && (
        <button type="button" className="press" style={{ color: SBI.purple }} aria-label="Support">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 11a9 9 0 1018 0" />
            <path d="M12 16v2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </header>
  );
}

function ProgressBar({ step, total = 8 }) {
  return (
    <div className="flex gap-1 px-4 py-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full"
          style={{ backgroundColor: i < step ? SBI.purple : '#E0E0E0' }}
        />
      ))}
    </div>
  );
}

function FormField({ label, required, error, children }) {
  return (
    <div className="border-b py-3" style={{ borderColor: SBI.border }}>
      <label className="text-[10px] font-medium text-slate-500">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-[10px] text-red-600">{error}</p>}
    </div>
  );
}

function SelectField({ value, onChange, options, placeholder = 'Select' }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none bg-transparent text-[13px] font-medium outline-none"
      style={{ color: value ? SBI.ink : SBI.muted }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function EmiCalc({ onContinue }) {
  const [amount, setAmount] = useState(5000000);
  const [tenure, setTenure] = useState(84);
  const [rate, setRate] = useState(8);

  const emi = Math.round(
    (amount * (rate / 1200) * Math.pow(1 + rate / 1200, tenure)) /
    (Math.pow(1 + rate / 1200, tenure) - 1),
  );

  return (
    <>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pt-2">
        {[
          { label: 'Select loan amount', val: amount, min: 100000, max: 5000000, fmt: (v) => `₹ ${v.toLocaleString('en-IN')}`, set: setAmount },
          { label: 'Select loan tenure', val: tenure, min: 6, max: 84, fmt: (v) => `${v} months`, set: setTenure },
          { label: 'Select rate of interest', val: rate, min: 8, max: 17, fmt: (v) => `${v.toFixed(1)} %`, set: setRate },
        ].map((s) => (
          <div key={s.label} className="mb-4 rounded-xl bg-slate-100 px-4 py-4">
            <p className="text-[12px] font-semibold text-slate-700">{s.label}</p>
            <p className="mt-1 text-[18px] font-bold" style={{ color: SBI.purple }}>{s.fmt(s.val)}</p>
            <input
              type="range"
              min={s.min}
              max={s.max}
              value={s.val}
              onChange={(e) => s.set(Number(e.target.value))}
              className="mt-3 w-full accent-purple-700"
            />
            <div className="mt-1 flex justify-between text-[9px] text-slate-500">
              <span>{s.min >= 100000 ? `₹ ${s.min}` : s.min}</span>
              <span>{s.max >= 100000 ? `₹ ${s.max.toLocaleString('en-IN')}` : `${String(s.max).padStart(2, '0')} months`}</span>
            </div>
          </div>
        ))}
        <div className="rounded-xl bg-slate-100 px-4 py-4">
          <p className="text-[12px] text-slate-600">Estimated EMI (per month)</p>
          <p className="text-[20px] font-bold" style={{ color: SBI.ink }}>
            ₹ {emi.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
      <div className="shrink-0 border-t bg-white px-3 py-3">
        <button
          type="button"
          onClick={onContinue}
          className="press w-full rounded-full py-3.5 text-[13px] font-bold text-white shadow-lg"
          style={{ backgroundColor: SBI.purple }}
        >
          Resume or Start New Application →
        </button>
      </div>
    </>
  );
}

export default function SbiHomeLoanScreen({
  onClose,
  lang = 'en',
  aiPrimer: aiPrimerProp,
  voiceAssist = false,
}) {
  const loanAgentId = useCompanyAgent('loanLos');
  const skipIntro = !!(aiPrimerProp || voiceAssist);
  const [phase, setPhase] = useState(() => (skipIntro ? 'loan-details' : 'intro'));
  const [consentAccepted, setConsentAccepted] = useState(skipIntro);
  const [aiOpen, setAiOpen] = useState(() => skipIntro || voiceAssist);
  const [aiPrimer, setAiPrimer] = useState(() => aiPrimerProp || null);
  const [rmPromptOpen, setRmPromptOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (aiPrimerProp) {
      setAiPrimer(aiPrimerProp);
      setAiOpen(true);
      setPhase('loan-details');
      setConsentAccepted(true);
    }
  }, [aiPrimerProp]);

  const [form, setForm] = useState({
    loanPurposeCategory: '',
    purposeOfLoan: '',
    propertyValue: '',
    loanAmount: '',
    propertyType: '',
    propertyStatus: '',
    repaymentMode: '',
    capitaliseInterest: 'No',
    email: 'jatinbhatnagar2712@gmail.com',
    gender: 'Male',
    pan: 'GBLPB4453A',
    maritalStatus: 'Single',
    employmentType: '',
    grossIncome: '0',
    netIncome: '0',
    employerName: 'Silver Suits',
  });
  const [errors, setErrors] = useState({});

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const applyFormPatch = useCallback((patch) => {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return;
    setForm((f) => ({ ...f, ...patch }));
  }, []);

  const advancePhase = useCallback(() => {
    setPhase((current) => {
      const next = {
        'loan-details': 'personal',
        personal: 'residence',
        residence: 'employment',
        employment: null,
      };
      if (current === 'personal') setShowSuccess(true);
      if (next[current]) return next[current];
      onClose?.();
      return current;
    });
  }, [onClose]);

  const { containerProps: rageProps, dismiss: dismissRage } = useRageDetect({
    onFrustrated: () => { if (!aiOpen) setRmPromptOpen(true); },
  });

  const validateLoanDetails = useCallback(() => {
    const e = {};
    if (!form.loanPurposeCategory) e.loanPurposeCategory = 'Loan Purpose Category is a required field';
    if (!form.purposeOfLoan) e.purposeOfLoan = 'Purpose of Loan is a required field';
    if (!form.propertyType) e.propertyType = 'Property Type is a required field';
    if (!form.propertyStatus) e.propertyStatus = 'Property Status is a required field';
    if (!form.repaymentMode) e.repaymentMode = 'Repayment Mode is a required field';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  const handleUserMessage = useCallback(
    (text) => {
      const parsed = parseSbiHomeLoanInput(text, form);
      if (!parsed) return false;
      applyFormPatch(parsed.fields);
      return parsed.reply;
    },
    [form, applyFormPatch],
  );

  const handleToolCall = useCallback(
    (toolName, args) => {
      if (toolName === 'set_field') {
        const field = args.field_id || args.field;
        const value = args.value;
        if (field) {
          set(field, value);
          setAiOpen(true);
          setPhase((p) => (p === 'intro' || p === 'consent' || p === 'steps' || p === 'emi' ? 'loan-details' : p));
        }
      } else if (toolName === 'save_and_next') {
        if (phase === 'loan-details' && !validateLoanDetails()) return;
        advancePhase();
      }
    },
    [phase, advancePhase, validateLoanDetails],
  );

  const handleBack = useCallback(() => {
    const order = ['intro', 'consent', 'emi', 'steps', 'loan-details', 'personal', 'residence', 'employment'];
    const idx = order.indexOf(phase);
    if (idx <= 0) onClose?.();
    else setPhase(order[idx - 1]);
  }, [phase, onClose]);

  if (phase === 'intro') {
    return (
      <div className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-white" {...rageProps}>
        <SbiLoanHeader title="Home Loan" onBack={onClose} />
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-2">
          <div className="flex justify-center py-4">
            <div className="relative">
              <div className="text-6xl">📋</div>
              <div className="absolute -right-4 -top-2 text-3xl">🏠</div>
            </div>
          </div>
          <h2 className="text-[14px] font-bold" style={{ color: SBI.purple }}>Features</h2>
          {[
            { icon: '📄', text: 'Minimal Documentation' },
            { icon: '🏷️', text: 'Low Processing Fees' },
            { icon: '🏛️', text: 'Attractive interest rates' },
            { icon: '💵', text: 'Zero Hidden Cost' },
          ].map((f) => (
            <div key={f.text} className="mt-3 flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed text-sm"
                style={{ borderColor: `${SBI.purple}55` }}
              >
                {f.icon}
              </div>
              <span className="text-[12px] font-medium text-slate-700">{f.text}</span>
            </div>
          ))}
        </div>
        <div className="shrink-0 border-t bg-slate-50 px-3 py-3">
          <button
            type="button"
            onClick={() => setPhase('consent')}
            className="press w-full rounded-full py-3.5 text-[13px] font-bold text-white"
            style={{ backgroundColor: SBI.purple }}
          >
            Start New Application →
          </button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" className="press rounded-lg border bg-white py-3 text-[10px] font-semibold" style={{ borderColor: SBI.border, color: SBI.purple }}>
              ❓ Know more
            </button>
            <button type="button" onClick={() => setPhase('emi')} className="press rounded-lg border bg-white py-3 text-[10px] font-semibold" style={{ borderColor: SBI.border, color: SBI.purple }}>
              ₹ Calculator
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'consent') {
    return (
      <div className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-white">
        <div className="flex items-center justify-between px-3 py-2">
          <button type="button" className="rounded border px-2 py-1 text-[10px] font-semibold" style={{ borderColor: SBI.border }}>
            ENG ▾
          </button>
          <button type="button" onClick={onClose} className="press text-slate-500">✕</button>
        </div>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-3">
          <h2 className="text-[16px] font-bold" style={{ color: SBI.purple }}>Consent-cum-Declaration</h2>
          <p className="text-[11px] text-slate-500">(For all applicants)</p>
          <div className="mt-4 space-y-4 text-[11px] leading-relaxed text-slate-700">
            {CONSENT_PARAS.map((p, i) => (
              <p key={i}><span className="font-semibold">{i + 1}.</span> {p}</p>
            ))}
          </div>
        </div>
        <div className="shrink-0 border-t bg-white px-3 py-3">
          <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2.5">
            <span className="text-[12px] font-medium">Consent</span>
            <span style={{ color: SBI.purple }}>⬇</span>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={consentAccepted}
                onChange={(e) => setConsentAccepted(e.target.checked)}
                className="h-4 w-4 accent-purple-700"
              />
              <span className="text-[10px] text-slate-600">I have read, understood and accept</span>
            </label>
            <button
              type="button"
              disabled={!consentAccepted}
              onClick={() => setPhase('steps')}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white disabled:bg-slate-300"
              style={{ backgroundColor: consentAccepted ? SBI.purple : undefined }}
            >
              →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'emi') {
    return (
      <div className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-white">
        <div className="shrink-0 px-3 py-2">
          <button type="button" onClick={handleBack} className="text-[11px] font-semibold" style={{ color: SBI.purple }}>
            ‹ Go Back
          </button>
          <h1 className="text-[18px] font-bold" style={{ color: SBI.ink }}>EMI Calculator</h1>
        </div>
        <EmiCalc onContinue={() => setPhase('steps')} />
      </div>
    );
  }

  if (phase === 'steps') {
    const steps = [
      { title: 'Loan application', desc: 'Generate instant in-principle approval.', active: true, status: 'Application In-Progress' },
      { title: 'Branch verification', desc: 'Application and documents will be verified by the bank.' },
      { title: 'Sanction generation', desc: 'Sanction generated by branch post verification.' },
      { title: 'Document execution', desc: 'Complete your digital document execution to initiate disbursement.' },
      { title: 'Disbursement', desc: 'Disbursement to Builder/ Seller / Applicant.' },
    ];
    return (
      <div className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-white">
        <SbiLoanHeader title="Home Loan" onBack={handleBack} />
        <ProgressBar step={1} total={5} />
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-2">
          <h2 className="text-[16px] font-bold" style={{ color: SBI.purple }}>
            Avail Home Loan in few easy steps!
          </h2>
          <div className="mt-4 space-y-0">
            {steps.map((s, i) => (
              <div key={s.title} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] ${s.active ? 'text-white' : 'border border-dashed text-slate-400'}`}
                    style={{ backgroundColor: s.active ? SBI.purple : 'transparent', borderColor: SBI.purple }}
                  >
                    {s.active ? '₹' : '○'}
                  </div>
                  {i < steps.length - 1 && <div className="w-px flex-1 bg-slate-200" style={{ minHeight: 40 }} />}
                </div>
                <div className="pb-5">
                  <p className="text-[12px] font-bold" style={{ color: s.active ? SBI.purple : SBI.muted }}>{s.title}</p>
                  <p className="text-[10px] text-slate-500">{s.desc}</p>
                  {s.status && (
                    <span className="mt-1 inline-block rounded bg-orange-100 px-2 py-0.5 text-[9px] font-semibold text-orange-700">
                      ⏱ {s.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="shrink-0 px-3 py-3">
          <button
            type="button"
            onClick={() => setPhase('loan-details')}
            className="press w-full rounded-full py-3.5 text-[13px] font-bold text-white"
            style={{ backgroundColor: SBI.purple }}
          >
            Continue Application
          </button>
        </div>
      </div>
    );
  }

  const formPhases = ['loan-details', 'personal', 'residence', 'employment'];
  if (formPhases.includes(phase)) {
    const stepMap = { 'loan-details': 1, personal: 2, residence: 3, employment: 4 };
    return (
      <div className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-white" {...rageProps}>
        <div className="shrink-0">
          <SbiLoanHeader title="Home Loan" onBack={handleBack} showBackBtn />
          <ProgressBar step={stepMap[phase]} />
          {showSuccess && (
            <div className="mx-3 mb-2 flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: SBI.successBg }}>
              <span className="text-[11px] font-semibold" style={{ color: SBI.success }}>✓ Success! Personal Details Saved Successfully!</span>
              <button type="button" onClick={() => setShowSuccess(false)} className="text-slate-400">✕</button>
            </div>
          )}
        </div>
        <div className={`no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 ${aiOpen ? 'pb-4' : 'pb-3'}`}>
          {phase === 'loan-details' && (
            <>
              <h2 className="py-2 text-[15px] font-bold" style={{ color: SBI.ink }}>Loan Details</h2>
              <FormField label="Loan Purpose Category" required error={errors.loanPurposeCategory}>
                <SelectField value={form.loanPurposeCategory} onChange={(v) => set('loanPurposeCategory', v)} options={LOAN_PURPOSE_CATEGORIES} />
              </FormField>
              <FormField label="Purpose of Loan" required error={errors.purposeOfLoan}>
                <SelectField value={form.purposeOfLoan} onChange={(v) => set('purposeOfLoan', v)} options={PURPOSE_OPTIONS} />
              </FormField>
              <FormField label="Estimated Property Value (in INR)" required>
                <input type="text" value={form.propertyValue} onChange={(e) => set('propertyValue', e.target.value)} className="w-full bg-transparent text-[13px] outline-none" placeholder="" />
              </FormField>
              <FormField label="Requested Loan Amount (in INR)" required>
                <input type="text" value={form.loanAmount} onChange={(e) => set('loanAmount', e.target.value)} className="w-full bg-transparent text-[13px] outline-none" />
              </FormField>
              <label className="flex items-center gap-2 py-2 text-[11px]" style={{ color: SBI.purple }}>
                <input type="checkbox" className="accent-purple-700" /> RERA No./Project Name Available
              </label>
              <FormField label="Property Type" required error={errors.propertyType}>
                <SelectField value={form.propertyType} onChange={(v) => set('propertyType', v)} options={PROPERTY_TYPES} />
              </FormField>
              <FormField label="Property Status" required error={errors.propertyStatus}>
                <SelectField value={form.propertyStatus} onChange={(v) => set('propertyStatus', v)} options={PROPERTY_STATUS} />
              </FormField>
              <FormField label="Repayment Mode" required error={errors.repaymentMode}>
                <SelectField value={form.repaymentMode} onChange={(v) => set('repaymentMode', v)} options={REPAYMENT_MODES} />
              </FormField>
              <p className="py-2 text-[12px] font-semibold text-slate-700">Interest to be Capitalised during Moratorium*</p>
              <div className="flex gap-6 pb-4">
                {['Yes', 'No'].map((o) => (
                  <label key={o} className="flex items-center gap-2 text-[12px]">
                    <input type="radio" checked={form.capitaliseInterest === o} onChange={() => set('capitaliseInterest', o)} className="accent-purple-700" />
                    {o}
                  </label>
                ))}
              </div>
            </>
          )}
          {phase === 'personal' && (
            <>
              <h2 className="py-2 text-[15px] font-bold" style={{ color: SBI.ink }}>Personal Details</h2>
              <FormField label="E-mail ID" required>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="w-full bg-transparent text-[13px] outline-none" />
              </FormField>
              <FormField label="Gender" required>
                <SelectField value={form.gender} onChange={(v) => set('gender', v)} options={['Male', 'Female', 'Other']} />
              </FormField>
              <FormField label="PAN / Other Identification Proof" required>
                <SelectField value="PAN" onChange={() => {}} options={['PAN']} />
              </FormField>
              <FormField label="Identification Number" required>
                <input type="text" value={form.pan} onChange={(e) => set('pan', e.target.value)} className="w-full bg-transparent text-[13px] outline-none" />
              </FormField>
              <FormField label="Marital Status" required>
                <SelectField value={form.maritalStatus} onChange={(v) => set('maritalStatus', v)} options={['Single', 'Married']} />
              </FormField>
            </>
          )}
          {phase === 'residence' && (
            <>
              <h2 className="py-2 text-[15px] font-bold" style={{ color: SBI.ink }}>Residence Details</h2>
              <FormField label="Pincode" required>
                <input type="text" defaultValue="313001" className="w-full bg-transparent text-[13px] outline-none" />
              </FormField>
              <FormField label="Address Line 1" required>
                <input type="text" defaultValue="S/O Lokpal Singh Bhatnagar, 55,gogawat" className="w-full bg-transparent text-[13px] outline-none" />
              </FormField>
              <FormField label="Address Line 2" required>
                <input type="text" defaultValue="adi, chandpole gait, inside chandpole" className="w-full bg-transparent text-[13px] outline-none" />
              </FormField>
              <FormField label="State" required>
                <SelectField value="RAJASTHAN" onChange={() => {}} options={['RAJASTHAN']} />
              </FormField>
              <FormField label="City" required>
                <SelectField value="BADGAON" onChange={() => {}} options={['BADGAON']} />
              </FormField>
            </>
          )}
          {phase === 'employment' && (
            <>
              <FormField label="Employment Type" required>
                <SelectField value={form.employmentType} onChange={(v) => set('employmentType', v)} options={['Salaried', 'Self Employed', 'Others']} />
              </FormField>
              <FormField label="Employer Name" required>
                <input type="text" value={form.employerName} onChange={(e) => set('employerName', e.target.value)} className="w-full bg-transparent text-[13px] outline-none" />
              </FormField>
              <FormField label="Gross Monthly Income (In INR)" required>
                <input type="text" value={form.grossIncome} onChange={(e) => set('grossIncome', e.target.value)} className="w-full bg-transparent text-[13px] outline-none" />
              </FormField>
              <FormField label="Net Monthly Income (In INR)" required>
                <input type="text" value={form.netIncome} onChange={(e) => set('netIncome', e.target.value)} className="w-full bg-transparent text-[13px] outline-none" />
              </FormField>
              <p className="py-2 text-[12px] font-medium text-slate-600">I have an existing EMI*</p>
              <div className="flex gap-6 pb-4">
                {['Yes', 'No'].map((o) => (
                  <label key={o} className="flex items-center gap-2 text-[12px]">
                    <input type="radio" name="emi" defaultChecked={o === 'No'} className="accent-purple-700" /> {o}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="shrink-0 border-t bg-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between">
            <button type="button" onClick={handleBack} className="press flex items-center gap-1 text-[12px] font-semibold" style={{ color: SBI.purple }}>
              ← Previous
            </button>
            <button
              type="button"
              onClick={() => {
                if (phase === 'loan-details' && !validateLoanDetails()) return;
                const next = { 'loan-details': 'personal', personal: 'residence', residence: 'employment', employment: null };
                if (phase === 'personal') setShowSuccess(true);
                if (next[phase]) setPhase(next[phase]);
                else onClose?.();
              }}
              className="press rounded-full px-5 py-2.5 text-[12px] font-bold text-white"
              style={{ backgroundColor: SBI.purple }}
            >
              Save & Next →
            </button>
          </div>
        </div>
        <LoanAguiPanel
          agentId={loanAgentId}
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          formValues={form}
          onFormChange={applyFormPatch}
          onToolCall={handleToolCall}
          onUserMessage={handleUserMessage}
          directHandledReply
          primer={aiPrimer}
          voiceAssist={voiceAssist}
          greeting={`Namaste! I'm your SBI home loan assistant. ${getSbiHomeLoanGreetingHint(form)}`}
          assistTitle={voiceAssist ? 'SBI Home Loan · Voice' : 'SBI Home Loan Assistant'}
          assistHint={voiceAssist ? 'Hands-free — speak after I finish.' : 'Say values like "flat", "50 lakh loan" — I fill the form instantly.'}
          lang={lang}
          dockClassName="bottom-[4.5rem]"
        />
        {!aiOpen && (
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            className="absolute bottom-[4.75rem] right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white text-xl shadow-lg"
            style={{ borderColor: SBI.purple, color: SBI.purple }}
            aria-label="Open loan assistant"
          >
            🧑‍💼
          </button>
        )}
        <RMHelpPrompt
          open={rmPromptOpen}
          onHelp={() => { setRmPromptOpen(false); dismissRage(); setAiOpen(true); }}
          onDismiss={() => { setRmPromptOpen(false); dismissRage(); }}
        />
      </div>
    );
  }

  return null;
}
