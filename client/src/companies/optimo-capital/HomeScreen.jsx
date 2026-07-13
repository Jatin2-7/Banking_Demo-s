import React, { useCallback, useRef, useState } from 'react';
import { OPTIMO, FONTS } from './theme.js';
import DashboardScreen from './screens/DashboardScreen.jsx';
import LapApplicationScreen, {
  agentStateToFormPatch,
  createEmptyForm,
  formToAgentState,
} from './screens/LapApplicationScreen.jsx';
import SuccessScreen from './components/SuccessScreen.jsx';
import LoanAguiPanel from '../../components/LoanAguiPanel.jsx';
import DemoPanel from '../../components/DemoPanel.jsx';
import DraggableVoiceFab from '../../shared/ui/DraggableVoiceFab.jsx';
import { useCompanyAgents } from '../../shared/lib/companyAgents.js';
import { DEFAULT_LANG } from '../../i18n/strings.js';
import {
  agentStateToEmiPatch,
  emiToAgentState,
  resolveOptimoNavigation,
} from './lib/navigation.js';

const VOICE_PANEL_DOCK = 'bottom-28 left-4 right-4 sm:left-auto sm:right-8 sm:max-w-[400px]';

export default function OptimoHomeScreen() {
  const agents = useCompanyAgents();
  const [lang, setLang] = useState(DEFAULT_LANG);
  const [view, setView] = useState('dashboard');
  const [lapProduct, setLapProduct] = useState('lap');
  const [form, setForm] = useState(createEmptyForm);
  const [consent, setConsent] = useState(true);
  const [emiValues, setEmiValues] = useState({ loanAmount: '', interestRate: '', tenureYears: '' });
  const [aiOpen, setAiOpen] = useState(false);
  const [voiceAssistMode, setVoiceAssistMode] = useState(false);
  const applyRef = useRef(null);

  const goToDashboard = useCallback(() => {
    setView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goToLap = useCallback((product = 'lap', prefill = {}) => {
    setLapProduct(product);
    if (prefill && Object.keys(prefill).length > 0) {
      setForm((prev) => ({ ...prev, ...prefill }));
    }
    setView('lap');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigate = useCallback(
    (destination, context = '') => {
      const nav = resolveOptimoNavigation(destination, context);
      if (nav.view === 'dashboard') {
        setView('dashboard');
        if (nav.scrollTo === 'emi') {
          setTimeout(() => {
            document.getElementById('emi-calculator')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }
      goToLap(nav.product || 'lap');
    },
    [goToLap],
  );

  const handleAgentFormChange = useCallback(
    (next) => {
      if (view === 'dashboard') {
        const emiPatch = agentStateToEmiPatch(next);
        if (Object.keys(emiPatch).length > 0) {
          setEmiValues((prev) => ({ ...prev, ...emiPatch }));
        }
        return;
      }
      const patch = agentStateToFormPatch(next);
      if (Object.keys(patch).length > 0) {
        setForm((prev) => ({ ...prev, ...patch }));
      }
    },
    [view],
  );

  const handleAgentToolCall = useCallback(
    (name, args) => {
      if (name === 'navigate_to' && args?.destination) {
        handleNavigate(args.destination, args.context || '');
        return;
      }

      if (name === 'set_field' && args?.field_id) {
        if (view === 'dashboard') {
          const emiPatch = agentStateToEmiPatch({ [args.field_id]: args.value });
          if (Object.keys(emiPatch).length > 0) {
            setEmiValues((prev) => ({ ...prev, ...emiPatch }));
          }
          return;
        }
        const patch = agentStateToFormPatch({ [args.field_id]: args.value });
        if (Object.keys(patch).length > 0) {
          setForm((prev) => ({ ...prev, ...patch }));
        }
        return;
      }

      if (view !== 'lap') return;

      if (name === 'click_button') {
        const action = args?.action || args?.button;
        if (action === 'apply_now' || action === 'submit') {
          applyRef.current?.();
        }
      }
    },
    [view, handleNavigate],
  );

  const agentFormState =
    view === 'dashboard'
      ? emiToAgentState(emiValues)
      : { screen: 'lap_application', product: lapProduct, ...formToAgentState(form) };

  const activeAgent = view === 'lap' ? agents.lap || agents.home : agents.home;

  const greeting =
    view === 'success'
      ? 'Your Loan Against Property application has been submitted! I can help with any follow-up questions.'
      : view === 'lap'
        ? "Hello! I'm your Optimo Capital assistant. I can help fill your Loan Against Property application — tell me your mobile number, business details, or loan amount."
        : "Hello! I'm your Optimo Capital assistant. I can help you apply for a Loan Against Property, check eligibility, or use the EMI calculator. What would you like to do?";

  const voiceFab = !aiOpen ? (
    <DraggableVoiceFab storageKey="optimo-capital-voice-fab" onClick={() => setAiOpen(true)} />
  ) : null;

  const aiPanel = (
    <LoanAguiPanel
      agentId={activeAgent}
      open={aiOpen}
      onClose={() => setAiOpen(false)}
      formValues={agentFormState}
      onFormChange={handleAgentFormChange}
      onToolCall={handleAgentToolCall}
      voiceAssist={voiceAssistMode}
      showReasoning={view === 'dashboard'}
      navOnly={view === 'dashboard'}
      greeting={greeting}
      assistTitle="Optimo AI Assistant"
      assistHint={view === 'lap' ? "Voice or text — I'll help complete your application." : 'Ask me to apply for a loan or calculate EMI.'}
      lang={lang}
      dockClassName={VOICE_PANEL_DOCK}
    />
  );

  if (view === 'success') {
    return (
      <div className="optimo-app min-h-screen" style={{ backgroundColor: OPTIMO.bg, fontFamily: FONTS.body }}>
        <SuccessScreen />
        {voiceFab}
        {aiPanel}
      </div>
    );
  }

  return (
    <div className="optimo-app min-h-screen" style={{ backgroundColor: OPTIMO.bg, fontFamily: FONTS.body }}>
      {view === 'dashboard' ? (
        <DashboardScreen
          emiValues={emiValues}
          onEmiChange={setEmiValues}
          onNavigateLap={goToLap}
          onCheckEligibility={() => document.getElementById('emi-calculator')?.scrollIntoView({ behavior: 'smooth' })}
        />
      ) : (
        <LapApplicationScreen
          form={form}
          onFormChange={setForm}
          consent={consent}
          onConsentChange={setConsent}
          product={lapProduct}
          onBack={goToDashboard}
          onRegisterApply={(fn) => { applyRef.current = fn; }}
          onApply={() => {
            setView('success');
            setAiOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {voiceFab}
      {aiPanel}

      <DemoPanel
        onChangeLang={setLang}
        voiceAssistMode={voiceAssistMode}
        onVoiceAssistModeChange={setVoiceAssistMode}
        onVoiceCommandModeChange={() => {}}
      />
    </div>
  );
}
