import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import KbDashboard from './components/KbDashboard.jsx';
import KbBottomNav from './components/KbBottomNav.jsx';
import ArmJourneyScreen from './arm/ArmJourneyScreen.jsx';
import LoanAguiPanel from '../../components/LoanAguiPanel.jsx';
import DemoPanel from '../../components/DemoPanel.jsx';
import { useCompanyAgents } from '../../shared/lib/companyAgents.js';
import { DEFAULT_LANG } from '../../i18n/strings.js';
import { resolveKreditbeeNavigation, inferKreditbeeDestination } from './lib/navigation.js';
import { INITIAL_FORM, STEP_ORDER } from './arm/armJourney.js';

function PlaceholderTab({ title, onBack }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-kb-page">
      <div className="flex items-center gap-3 bg-white px-4 py-3">
        <button type="button" onClick={onBack} className="press text-kb-muted" aria-label="Back">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-[16px] font-bold text-kb-ink">{title}</h1>
      </div>
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-[14px] text-kb-muted">This section is coming soon in the demo.</p>
      </div>
    </div>
  );
}

function computeProgress(form) {
  const filled = STEP_ORDER.filter((step) => {
    if (step === 'success') return false;
    const key = {
      terms: 'termsAccepted',
      aadhaar_consent: 'aadhaarConsent',
      aadhaar_mobile_link: 'aadhaarMobileLinked',
      aadhaar_number: 'aadhaarNumber',
      aadhaar_otp: 'aadhaarOtp',
      email: 'email',
      email_otp: 'emailOtp',
      marital_status: 'maritalStatus',
      education: 'education',
      differently_abled: 'differentlyAbled',
      address_same: 'addressSame',
      residence_type: 'residenceType',
      income_verify: 'incomeVerify',
      family_reference: 'familyReference',
      family_mobile: 'familyMobile',
      friend_details: 'friendName',
    }[step];
    return key && form[key];
  }).length;
  return Math.min(100, Math.round(25 + (filled / (STEP_ORDER.length - 1)) * 75));
}

/** KreditBee demo — home dashboard + AI Relationship Manager journey. */
export default function KreditbeeHomeScreen() {
  const agents = useCompanyAgents();
  const [lang, setLang] = useState(DEFAULT_LANG);
  const [voiceAssistMode, setVoiceAssistMode] = useState(true);
  const [view, setView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('home');
  const [loanProduct, setLoanProduct] = useState('two_wheeler');
  const [form, setForm] = useState(INITIAL_FORM);
  const [homeAiOpen, setHomeAiOpen] = useState(false);
  const [panelKey, setPanelKey] = useState(0);
  const [armLiveFeed, setArmLiveFeed] = useState(null);

  const formRef = useRef(form);
  formRef.current = form;

  const progress = useMemo(() => computeProgress(form), [form]);

  useEffect(() => {
    setPanelKey((k) => k + 1);
  }, [voiceAssistMode, view]);

  useEffect(() => {
    if (form.journeyStep !== 'aadhaar_number') {
      setArmLiveFeed(null);
    }
  }, [form.journeyStep]);

  const openArm = useCallback(
    (product = 'two_wheeler') => {
      setLoanProduct(product);
      setView('arm');
      if (voiceAssistMode) {
        setTimeout(() => setHomeAiOpen(true), 400);
      }
    },
    [voiceAssistMode],
  );

  const goHome = useCallback(() => {
    setView('dashboard');
    setActiveTab('home');
    setHomeAiOpen(false);
  }, []);

  const handleNavigate = useCallback(
    (destination, context = '') => {
      const nav = resolveKreditbeeNavigation(destination, context);
      if (nav.view === 'arm') {
        openArm(nav.product || 'two_wheeler');
        return;
      }
      if (nav.tab && nav.tab !== 'home') {
        setActiveTab(nav.tab);
        setView('dashboard');
      } else {
        goHome();
      }
    },
    [openArm, goHome],
  );

  const handleLoanAction = (productId) => {
    openArm(productId);
  };

  const openVoice = () => {
    if (view === 'arm') {
      setHomeAiOpen(true);
    } else {
      setHomeAiOpen(true);
    }
  };

  const agentId = view === 'arm' ? agents.loan : agents.home;
  const agentState = useMemo(
    () =>
      view === 'arm'
        ? { ...form, journeyStep: form.journeyStep || 'terms' }
        : { progress, activeTab, loanProduct: 'two_wheeler' },
    [view, form, progress, activeTab],
  );

  const handleAgentFormChange = useCallback(
    (next) => {
      const nav = next?.navigate_to;
      if (nav?.destination) {
        handleNavigate(nav.destination, nav.context || '');
        return;
      }
      setForm((prev) => ({ ...prev, ...next }));
    },
    [handleNavigate],
  );

  const armToolHandlerRef = useRef(null);
  const armApiRef = useRef(null);

  const handleVoiceUserMessage = useCallback(
    (text) => {
      const t = String(text || '').trim();
      if (view === 'arm') {
        const result = armApiRef.current?.handleUserInput?.(t);
        if (result?.handled) {
          return result.reply || 'Got it.';
        }
        return false;
      }
      const dest = inferKreditbeeDestination(t);
      if (dest) {
        handleNavigate(dest);
        const labels = {
          personal_loan: 'Opening Personal Loan application now.',
          business_loan: 'Opening Business Loan application now.',
          two_wheeler_loan: 'Opening Two Wheeler Loan application now.',
          lap: 'Opening Loan Against Property application now.',
          arm_onboarding: 'Continuing your KYC application now.',
          documents: 'Opening Documents.',
          explore: 'Opening Explore.',
          kreditbee_upi: 'Opening KreditBee UPI.',
          home: 'Taking you back to home.',
        };
        return labels[dest] || 'Redirecting you now.';
      }
      return false;
    },
    [view, handleNavigate],
  );

  const handleAfterAssistantReply = useCallback(
    (userText, assistantText) => {
      if (view === 'arm') {
        armApiRef.current?.syncUserInput?.(userText);
        return;
      }
      if (view !== 'dashboard') return;
      const dest = inferKreditbeeDestination(userText, assistantText);
      if (dest) handleNavigate(dest);
    },
    [view, handleNavigate],
  );

  const handleAgentToolCall = useCallback(
    (name, args) => {
      if (name === 'navigate_to' && args?.destination) {
        const nav = resolveKreditbeeNavigation(args.destination, args.context || '');
        if (nav.view !== 'arm') {
          setHomeAiOpen(false);
        }
        handleNavigate(args.destination, args.context || '');
        return;
      }
      if (view === 'arm' && armToolHandlerRef.current) {
        armToolHandlerRef.current(name, args);
      }
    },
    [handleNavigate, view],
  );

  const homeGreeting =
    'Hi! I\'m your KreditBee AI assistant. Say "continue my application" for KYC, or tell me which loan you\'d like — personal, business, two wheeler, or loan against property.';

  const armGreeting =
    "Hi! I'm your AI Relationship Manager. Tell me your answers naturally — I'll fill the form and guide you through KYC.";

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-kb-page">
      <AnimatePresence mode="wait">
        {view === 'dashboard' && activeTab === 'home' && (
          <motion.div
            key="dashboard"
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <KbDashboard
              progress={progress}
              onOpenProduct={handleLoanAction}
              onOpenUpi={() => handleNavigate('kreditbee_upi')}
            />
            <KbBottomNav activeTab={activeTab} onTabChange={setActiveTab} onMicTap={openVoice} />
          </motion.div>
        )}

        {view === 'dashboard' && activeTab !== 'home' && (
          <motion.div
            key={`tab-${activeTab}`}
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <PlaceholderTab
              title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              onBack={() => setActiveTab('home')}
            />
            <KbBottomNav activeTab={activeTab} onTabChange={setActiveTab} onMicTap={openVoice} />
          </motion.div>
        )}

        {view === 'arm' && (
          <motion.div
            key="arm"
            className="absolute inset-0 z-20 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          >
            <ArmJourneyScreen
              form={form}
              onFormChange={setForm}
              voiceAssist={voiceAssistMode}
              voicePanelOpen={homeAiOpen && voiceAssistMode}
              lang={lang}
              onClose={goHome}
              onRegisterToolHandler={(fn) => {
                armToolHandlerRef.current = fn;
              }}
              onRegisterArmApi={(api) => {
                armApiRef.current = api;
              }}
              onLiveFeedChange={setArmLiveFeed}
              loanProduct={loanProduct}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <LoanAguiPanel
        key={`kb-ai-${panelKey}-${view}-${voiceAssistMode ? 'assist' : 'chat'}`}
        agentId={agentId}
        open={homeAiOpen}
        onClose={() => setHomeAiOpen(false)}
        onAutoHide={() => setHomeAiOpen(false)}
        formValues={agentState}
        onFormChange={handleAgentFormChange}
        onToolCall={handleAgentToolCall}
        onUserMessage={handleVoiceUserMessage}
        onAfterAssistantReply={handleAfterAssistantReply}
        directHandledReply={view === 'arm'}
        voiceAssist={voiceAssistMode}
        handsFree={voiceAssistMode}
        overlayPeek={view === 'arm'}
        greeting={view === 'arm' ? armGreeting : homeGreeting}
        assistTitle={view === 'arm' ? 'AI Relationship Manager' : 'KreditBee Assistant'}
        assistHint={
          voiceAssistMode
            ? 'Voice or text — live Aadhaar feed appears while entering your number'
            : 'Voice or text — your choice'
        }
        showReasoning={view === 'dashboard'}
        liveFeed={view === 'arm' ? armLiveFeed : null}
        dockClassName={
          view === 'arm' ? 'bottom-0 left-0 right-0' : 'bottom-[5.5rem] left-3 right-3'
        }
        lang={lang}
      />

      <DemoPanel
        onChangeLang={setLang}
        voiceAssistMode={voiceAssistMode}
        onVoiceAssistModeChange={setVoiceAssistMode}
        onVoiceCommandModeChange={() => {}}
      />
    </div>
  );
}
