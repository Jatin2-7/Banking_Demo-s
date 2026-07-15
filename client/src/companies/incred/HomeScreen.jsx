import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import IncredBottomNav from './components/IncredBottomNav.jsx';
import IncredAiFab from './components/IncredAiFab.jsx';
import { IncredHomeHeader } from './components/IncredHeader.jsx';
import IncredPersonalLoanScreen, { IncredWelcomeScreen, INITIAL_FORM } from './loan/IncredPersonalLoanScreen.jsx';
import LoanAguiPanel from '../../components/LoanAguiPanel.jsx';
import DemoPanel from '../../components/DemoPanel.jsx';
import { useCompanyAgents } from '../../shared/lib/companyAgents.js';
import { DEFAULT_LANG } from '../../i18n/strings.js';
import { resolveIncredNavigation, inferIncredDestination } from './lib/navigation.js';
import { parseIncredVoiceInput, getNextIncredField } from './lib/incredInputParser.js';
import { formToAgentState, agentStateToFormPatch } from './loan/incredJourney.js';

function PlaceholderTab({ title }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <p className="text-[15px] font-semibold text-incred-ink">{title}</p>
      <p className="mt-2 text-[13px] text-incred-muted">This section is coming soon in the demo.</p>
    </div>
  );
}

/** InCred Finance demo — home + personal loan journey with voice bot. */
export default function IncredHomeScreen() {
  const agents = useCompanyAgents();
  const [lang, setLang] = useState(DEFAULT_LANG);
  const [voiceAssistMode, setVoiceAssistMode] = useState(true);
  const [view, setView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('home');
  const [form, setForm] = useState(INITIAL_FORM);
  const [aiOpen, setAiOpen] = useState(false);
  const [gestureListen, setGestureListen] = useState(false);
  const [aiPrimer, setAiPrimer] = useState(null);
  const [panelKey, setPanelKey] = useState(0);

  const formRef = useRef(form);
  formRef.current = form;

  useEffect(() => {
    setPanelKey((k) => k + 1);
  }, [voiceAssistMode, view]);

  const openAssistant = useCallback((opts = {}) => {
    setAiOpen(true);
    if (opts.gestureListen) setGestureListen(true);
    // Only pass primer when explicitly needed (e.g. mid-loan context) — never on home mic tap,
    // otherwise the agent skips greeting and auto-navigates to personal loan.
    setAiPrimer(opts.primer ?? null);
  }, []);

  const goHome = useCallback(() => {
    setView('dashboard');
    setActiveTab('home');
    setAiOpen(false);
    setAiPrimer(null);
  }, []);

  const openLoan = useCallback(
    (opts = {}) => {
      setForm({ ...INITIAL_FORM });
      setView('loan');
      if (voiceAssistMode || opts.openVoice) {
        setTimeout(
          () =>
            openAssistant({
              gestureListen: true,
            }),
          400,
        );
      }
    },
    [voiceAssistMode, openAssistant],
  );

  const handleNavigate = useCallback(
    (destination) => {
      const nav = resolveIncredNavigation(destination);
      if (nav.view === 'loan') {
        openLoan({ openVoice: true });
        return;
      }
      if (nav.tab) setActiveTab(nav.tab);
      setView('dashboard');
    },
    [openLoan],
  );

  const applyVoicePatch = useCallback((patch) => {
    if (!patch || !Object.keys(patch).length) return;
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleAgentFormChange = useCallback(
    (next) => {
      const nav = next?.navigate_to;
      if (nav?.destination) {
        handleNavigate(nav.destination);
        return;
      }
      if (next?.__action?.button && view === 'loan') {
        loanToolHandlerRef.current?.('click_button', { button: next.__action.button });
        return;
      }
      const patch = agentStateToFormPatch(next);
      setForm((prev) => ({ ...prev, ...patch }));
    },
    [handleNavigate, view],
  );

  const loanToolHandlerRef = useRef(null);
  const loanApiRef = useRef(null);

  const handleAgentToolCall = useCallback(
    (name, args) => {
      if (name === 'navigate_to' && args?.destination) {
        if (args.destination !== 'personal_loan') setAiOpen(false);
        handleNavigate(args.destination);
        return;
      }
      if (view === 'loan' && loanToolHandlerRef.current) {
        loanToolHandlerRef.current(name, args);
      }
    },
    [handleNavigate, view],
  );

  const processLoanVoice = useCallback(
    (text) => {
      const form = formRef.current;
      const n = String(text || '').trim().toLowerCase();
      if (/^(yes|yeah|yep|haan|ha|ok|okay|sure|proceed|continue|confirm|theek|bilkul)/.test(n)) {
        if (form.confirmModal === 'basic') {
          loanToolHandlerRef.current?.('click_button', { button: 'confirm_yes' });
          return 'Thank you. Now let me take your employment details.';
        }
        if (form.confirmModal === 'employment') {
          loanToolHandlerRef.current?.('click_button', { button: 'confirm_yes' });
          return 'Thank you. A few more details to check your eligibility.';
        }
        if (!getNextIncredField(form, form.phase)) {
          loanToolHandlerRef.current?.('click_button', { button: 'proceed' });
          if (form.phase === 'eligibility') return 'Thank you. Submitting your application now.';
          return 'Certainly. Moving to the next step.';
        }
      }

      const parsed = parseIncredVoiceInput(form.phase, text, form);
      if (parsed.handled && parsed.patch) {
        applyVoicePatch(parsed.patch);
        return parsed.reply || 'Thank you.';
      }
      return false;
    },
    [applyVoicePatch],
  );

  const handleVoiceUserMessage = useCallback(
    (text) => {
      const t = String(text || '').trim();
      if (view === 'loan') return processLoanVoice(t);

      const dest = inferIncredDestination(t);
      if (dest) {
        const replies = {
          personal_loan: 'Certainly. Let me open your personal loan application.',
          my_loans: 'Of course. Opening your loans section.',
          profile: 'Sure. Opening your profile.',
          home: 'Taking you to the home screen.',
        };
        return {
          deferNavigate: { destination: dest },
          reply: replies[dest] || 'One moment please.',
        };
      }
      return false;
    },
    [view, processLoanVoice],
  );

  const handleAfterAssistantReply = useCallback(() => {
    // Navigation only via agent navigate_to tool — no client-side redirects after reply.
  }, []);

  const agentId = view === 'loan' ? agents.loan : agents.home;
  const agentState = useMemo(
    () => (view === 'loan' ? formToAgentState(form) : { activeTab }),
    [view, form, activeTab],
  );

  const homeGreeting =
    'Namaste! Welcome to InCred Finance. How may I help you today?';
  const loanGreeting =
    'Namaste! I\'m your InCred relationship manager. May I have your PAN number to begin your personal loan application?';

  const showFab = !aiOpen;

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-white">
      <AnimatePresence mode="wait">
        {view === 'dashboard' && (
          <motion.div key="dash" className="flex min-h-0 flex-1 flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <IncredHomeHeader />
            {activeTab === 'home' && <IncredWelcomeScreen onApply={() => openLoan({ openVoice: true })} />}
            {activeTab === 'loans' && <PlaceholderTab title="My Loans" />}
            {activeTab === 'profile' && <PlaceholderTab title="Profile" />}
            <IncredBottomNav
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab);
                setView('dashboard');
              }}
              onMicTap={() =>
                openAssistant({
                  gestureListen: true,
                })
              }
            />
          </motion.div>
        )}

        {view === 'loan' && (
          <IncredPersonalLoanScreen
            form={form}
            onFormChange={setForm}
            onClose={goHome}
            voicePanelOpen={aiOpen && voiceAssistMode}
            onRegisterToolHandler={(fn) => {
              loanToolHandlerRef.current = fn;
            }}
            onRegisterApi={(api) => {
              loanApiRef.current = api;
            }}
          />
        )}
      </AnimatePresence>

      {showFab && view === 'loan' && form.phase !== 'success' && (
        <IncredAiFab
          onClick={() =>
            openAssistant({
              gestureListen: true,
            })
          }
          className="absolute bottom-[5.5rem] right-4"
        />
      )}

      <LoanAguiPanel
        key={`incred-ai-${panelKey}-${view}-${voiceAssistMode ? 'assist' : 'chat'}`}
        agentId={agentId}
        open={aiOpen}
        onClose={() => {
          setAiOpen(false);
          setAiPrimer(null);
        }}
        onAutoHide={() => setAiOpen(false)}
        formValues={agentState}
        onFormChange={handleAgentFormChange}
        onToolCall={handleAgentToolCall}
        onUserMessage={handleVoiceUserMessage}
        onAfterAssistantReply={handleAfterAssistantReply}
        directHandledReply={view === 'loan'}
        voiceAssist={voiceAssistMode}
        handsFree={voiceAssistMode}
        overlayPeek={view === 'loan'}
        gestureListen={gestureListen}
        onGestureListenHandled={() => setGestureListen(false)}
        primer={aiPrimer}
        greeting={view === 'loan' ? loanGreeting : homeGreeting}
        assistTitle={view === 'loan' ? 'InCred Assistant' : 'InCred Assistant'}
        assistHint={voiceAssistMode ? 'Speak after I finish — one question at a time.' : 'Type or speak your answer'}
        showReasoning={view === 'dashboard'}
        dockClassName={view === 'loan' ? 'bottom-0 left-0 right-0' : 'bottom-[5.5rem] left-3 right-3'}
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
