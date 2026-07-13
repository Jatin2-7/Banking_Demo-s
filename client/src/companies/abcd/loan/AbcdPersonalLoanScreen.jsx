import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import LoanAguiPanel from '../../../components/LoanAguiPanel.jsx';
import RMHelpPrompt from '../../../components/RMHelpPrompt.jsx';
import { useRageDetect } from '../../../hooks/useRageDetect.js';
import { useCompanyAgents } from '../../../shared/lib/companyAgents.js';
import AbcdPersonalLoanLanding from './AbcdPersonalLoanLanding.jsx';
import AbcdCalculatorPickerSheet from './AbcdCalculatorPickerSheet.jsx';
import AbcdEmiCalculatorScreen from './AbcdEmiCalculatorScreen.jsx';
import AbcdLoanAmountCalculatorScreen from './AbcdLoanAmountCalculatorScreen.jsx';
import {
  AbcdLoanBasicDetails,
  AbcdLoanJourneyIntro,
  AbcdLoanMpinStep,
  AbcdLoanOffers,
  AbcdLoanRedirectSheet,
  AbcdLoanSuccess,
} from './AbcdPersonalLoanSteps.jsx';
import { isValidPan } from './loanCalc.js';

const INITIAL_FORM = {
  pan: '',
  gender: 'Male',
  dob: '',
  employment: 'Salaried',
  monthlyIncome: '',
  pincode: '',
  email: '',
};

function canVerifyBasic(form) {
  const incomeNum = Number(String(form.monthlyIncome).replace(/\D/g, ''));
  return (
    form.gender &&
    form.dob.length >= 8 &&
    form.employment &&
    incomeNum >= 10000 &&
    /^\d{6}$/.test(form.pincode) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  );
}

function viewFromEntryContext(context) {
  if (context === 'open_emi_calculator') return 'emi';
  if (context === 'open_loan_amount_calculator') return 'amount';
  return 'landing';
}

/**
 * Journey: landing → intro → basic → offers → (redirect) → mpin → success
 * Calculators branch: emi | amount (return to landing)
 */
export default function AbcdPersonalLoanScreen({
  onClose,
  lang = 'en',
  aiPrimer: aiPrimerProp,
  voiceAssist = false,
}) {
  const agents = useCompanyAgents();
  const entryContext = String(aiPrimerProp || '').trim().toLowerCase();
  const isCalculatorEntry =
    entryContext === 'open_emi_calculator' || entryContext === 'open_loan_amount_calculator';
  const initialView = viewFromEntryContext(entryContext);
  const [view, setView] = useState(initialView);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [redirectOpen, setRedirectOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrimer, setAiPrimer] = useState(null);
  const [rmPromptOpen, setRmPromptOpen] = useState(false);

  const viewRef = useRef(view);
  const formRef = useRef(form);
  viewRef.current = view;
  formRef.current = form;

  const panValid = useMemo(() => isValidPan(form.pan), [form.pan]);
  const basicValid = useMemo(() => canVerifyBasic(form), [form]);

  const agentState = useMemo(() => ({ ...form, journeyStep: view }), [form, view]);

  const { containerProps: rageProps, dismiss: dismissRage } = useRageDetect({
    onFrustrated: () => {
      if (!aiOpen) setRmPromptOpen(true);
    },
  });

  useEffect(() => {
    if (isCalculatorEntry) {
      setAiOpen(false);
      return;
    }
    if (aiPrimerProp || voiceAssist) {
      setAiPrimer(aiPrimerProp || null);
      setAiOpen(true);
    }
  }, [aiPrimerProp, isCalculatorEntry, voiceAssist]);

  const goLanding = () => setView('landing');

  const handleContinue = () => {
    if (!panValid) return;
    setAiOpen(false);
    setView('intro');
  };

  const handleBack = useCallback(() => {
    const v = viewRef.current;
    if (v === 'intro' || v === 'basic') setView('landing');
    else if (v === 'offers') setView('basic');
    else if (v === 'mpin') setView('offers');
    else if (v === 'emi' || v === 'amount') setView('landing');
    else onClose();
  }, [onClose]);

  const patchForm = useCallback((next) => {
    setForm((prev) => {
      const merged = { ...prev };
      for (const [key, value] of Object.entries(next)) {
        if (key === 'journeyStep' || key === '__action') continue;
        if (value !== undefined) merged[key] = value;
      }
      return merged;
    });
  }, []);

  const handleAgentFormChange = useCallback(
    (next) => {
      patchForm(next);
    },
    [patchForm],
  );

  const handleAgentToolCall = useCallback(
    (name, args) => {
      if (name === 'click_button' && args?.ok) {
        const action = args.action;
        const v = viewRef.current;
        const f = formRef.current;

        if (action === 'continue' && v === 'landing' && isValidPan(f.pan)) {
          setView('intro');
        } else if (action === 'got_it' && v === 'intro') {
          setView('basic');
        } else if (action === 'verify_details' && v === 'basic' && canVerifyBasic(f)) {
          setView('offers');
        } else if (action === 'apply_now' && v === 'offers') {
          setRedirectOpen(true);
        } else if (action === 'back') {
          handleBack();
        }
      }
    },
    [handleBack],
  );

  const showFab = view === 'landing' && !aiOpen && !pickerOpen;

  const stepGreeting = useMemo(() => {
    switch (view) {
      case 'landing':
        return 'नमस्ते! मैं आपके ABCD personal loan में help करूँगा। आपका PAN number क्या है? आप बताएँगे तो मैं screen पर fill कर दूँगा।';
      case 'intro':
        return 'यह quick 5-step journey overview है। Personal details enter करने के लिए ready हों तो “got it” कहिए।';
      case 'basic':
        return 'चलिए आपकी details verify करते हैं। मैं एक बार में एक question पूछकर हर field screen पर fill करूँगा।';
      case 'offers':
        return 'यह आपका loan offer है। आगे proceed करने के लिए “apply now” कहिए।';
      default:
        return 'मैं आपके personal loan में कैसे help कर सकता हूँ?';
    }
  }, [view]);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-white"
      {...rageProps}
    >
      {view === 'landing' && (
        <>
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <button
              type="button"
              onClick={onClose}
              className="absolute left-3 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/20 text-white press"
              aria-label="Back"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
              <AbcdPersonalLoanLanding
                pan={form.pan}
                onPanChange={(pan) => patchForm({ pan })}
                onOpenCalculators={() => setPickerOpen(true)}
              />
            </div>
          </div>
          <div className="shrink-0 border-t border-[#EEEEEE] bg-white px-4 py-3">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!panValid}
              className="w-full rounded-full py-3.5 text-[15px] font-bold text-white press disabled:cursor-not-allowed disabled:bg-[#BDBDBD] enabled:bg-[#C41E24]"
            >
              Continue
            </button>
            <p className="mt-2 flex items-center justify-center gap-1 text-[9px] font-semibold text-[#6B7280]">
              <span className="text-[#4CAF50]">🛡️</span> YOUR DATA IS SECURE WITH US
            </p>
            <p className="mt-1 text-center text-[9px] text-[#9CA3AF]">
              Powered by Aditya Birla Capital Digital Ltd
            </p>
          </div>
        </>
      )}

      {view === 'intro' && (
        <AbcdLoanJourneyIntro onGotIt={() => setView('basic')} onClose={() => setView('landing')} />
      )}

      {view === 'basic' && (
        <AbcdLoanBasicDetails
          pan={form.pan.toUpperCase()}
          gender={form.gender}
          onGenderChange={(gender) => patchForm({ gender })}
          dob={form.dob}
          onDobChange={(dob) => patchForm({ dob })}
          employment={form.employment}
          onEmploymentChange={(employment) => patchForm({ employment })}
          monthlyIncome={form.monthlyIncome}
          onMonthlyIncomeChange={(monthlyIncome) => patchForm({ monthlyIncome })}
          pincode={form.pincode}
          onPincodeChange={(pincode) => patchForm({ pincode })}
          email={form.email}
          onEmailChange={(email) => patchForm({ email })}
          onBack={handleBack}
          onVerify={() => {
            if (!basicValid) return;
            setAiOpen(false);
            setView('offers');
          }}
        />
      )}

      {view === 'offers' && (
        <AbcdLoanOffers onBack={handleBack} onApply={() => setRedirectOpen(true)} />
      )}

      {view === 'mpin' && (
        <AbcdLoanMpinStep onBack={handleBack} onSuccess={() => setView('success')} />
      )}

      {view === 'success' && <AbcdLoanSuccess onDone={onClose} />}

      {view === 'emi' && <AbcdEmiCalculatorScreen onBack={goLanding} />}
      {view === 'amount' && <AbcdLoanAmountCalculatorScreen onBack={goLanding} />}

      <AbcdCalculatorPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPickEmi={() => {
          setPickerOpen(false);
          setView('emi');
        }}
        onPickAmount={() => {
          setPickerOpen(false);
          setView('amount');
        }}
      />

      <AbcdLoanRedirectSheet
        open={redirectOpen}
        onDone={() => {
          setRedirectOpen(false);
          setView('mpin');
        }}
      />

      {showFab && (
        <button
          type="button"
          data-ai-fab
          onClick={() => {
            setAiPrimer(null);
            setAiOpen(true);
          }}
          className="press-bright absolute bottom-[7.5rem] right-3 z-[50] flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#F5C518] bg-white text-xl shadow-lg"
          aria-label="Open AI Assistant"
        >
          🧑‍💼
        </button>
      )}

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

      <LoanAguiPanel
        agentId={agents.loan}
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        formValues={agentState}
        onFormChange={handleAgentFormChange}
        onToolCall={handleAgentToolCall}
        voiceAssist={voiceAssist}
        primer={aiPrimer}
        greeting={stepGreeting}
        assistTitle="Personal Loan Assist"
        assistHint="I fill fields on your screen — one question at a time."
        lang={lang}
        dockClassName="bottom-[5.5rem]"
      />
    </motion.div>
  );
}
