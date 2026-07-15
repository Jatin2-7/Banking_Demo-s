import React, { useMemo, useState } from 'react';
import { ACCOUNTS as FALLBACK_ACCOUNTS } from '../../data/mock.js';
import LoanAguiPanel from '../../components/LoanAguiPanel.jsx';
import RMHelpPrompt from '../../components/RMHelpPrompt.jsx';
import { useRageDetect } from '../../hooks/useRageDetect.js';
import { useCompanyAgents } from '../../shared/lib/companyAgents.js';
import { AbcdHomeHeader } from './AbcdHeader.jsx';
import AbcdBottomNav from './AbcdBottomNav.jsx';
import AbcdHomeTab from './AbcdHomeTab.jsx';
import AbcdMyTrackTab from './AbcdMyTrackTab.jsx';
import {
  AbcdInsureTab,
  AbcdInvestTab,
  AbcdLoansTab,
} from './AbcdLoansInsureInvest.jsx';
import { ABCD } from './theme.js';

function formatInr(n) {
  return `₹ ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AbcdHomeScreen({
  lang,
  onQuickAction,
  onFundTransferImps,
  onApplyNewLoan,
  onOpenDeposit,
  onOpenTxnHistory,
  onNavigate,
  navMode = false,
  voiceAssistMode = false,
  onVoiceCommand,
  voiceCommandSessionActive = false,
  voiceCommandListening = false,
  voiceCommandTranscript = '',
  voiceCommandLiveTranscript = '',
  onStartVoiceCommandSession,
  onStopVoiceCommandSession,
  aiPanelCloseSignal = 0,
  accounts,
}) {
  const agents = useCompanyAgents();
  const [homeAiOpen, setHomeAiOpen] = useState(false);
  const [rmHomePromptOpen, setRmHomePromptOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [panelKey, setPanelKey] = useState(0);

  const prevCloseSignalRef = React.useRef(aiPanelCloseSignal);
  React.useEffect(() => {
    if (aiPanelCloseSignal !== prevCloseSignalRef.current) {
      prevCloseSignalRef.current = aiPanelCloseSignal;
      setHomeAiOpen(false);
    }
  }, [aiPanelCloseSignal]);

  const modeInitRef = React.useRef(true);
  React.useEffect(() => {
    if (modeInitRef.current) {
      modeInitRef.current = false;
      return;
    }
    setPanelKey((k) => k + 1);
    if (!navMode) onStopVoiceCommandSession?.();
  }, [navMode, voiceAssistMode]);

  const { containerProps: homeRageProps, dismiss: dismissHomeRage } = useRageDetect({
    onFrustrated: () => {
      if (!homeAiOpen) setRmHomePromptOpen(true);
    },
  });

  const liveAccounts = accounts && accounts.length ? accounts : FALLBACK_ACCOUNTS;
  const primary = useMemo(() => {
    return (
      liveAccounts.find((a) => a.type === 'savings') ||
      liveAccounts[0] || { balance: 352089.79, number: '1234' }
    );
  }, [liveAccounts]);
  const balanceLabel = formatInr(primary.balance);

  const openAi = () => {
    if (navMode) onStartVoiceCommandSession?.();
    setHomeAiOpen(true);
  };

  const assistTitle = navMode
    ? 'Voice Navigation'
    : voiceAssistMode
      ? 'AI Assistant · Voice Assist'
      : 'AI Assistant';

  const assistHint = navMode
    ? voiceCommandSessionActive
      ? 'Listening — speak a command. Mic re-opens after each action.'
      : 'Speak a screen name — I will open it for you.'
    : voiceAssistMode
      ? 'I will speak and listen — answer hands-free after I finish.'
      : 'Voice or text — your choice.';

  const greeting = navMode
    ? 'Sure. Tell me the screen you want to open, and I will take you there.'
    : voiceAssistMode
      ? 'नमस्ते! मैं आपकी Aditya Birla Capital assistant हूँ। बताइए आप क्या करना चाहेंगे—invest, loan के लिए apply, अपना track check, या कुछ और?'
      : "Namaste! I'm your Aditya Birla Capital AI assistant. Tell me what you'd like to do — transfer funds, open a deposit, check statements, or anything else.";

  const handleUserMessage = (text) => {
    const t = String(text || '').toLowerCase();
    if (
      /\b(change|reset|update|forgot)\b.{0,24}\b(credit\s*)?(card\s*)?pin\b/.test(t) ||
      /\b(credit\s*)?card\s*pin\b.{0,16}\b(change|reset|update)\b/.test(t) ||
      /\bchange\s+my\s+(credit\s+)?(card\s+)?pin\b/.test(t)
    ) {
      setHomeAiOpen(false);
      onNavigate?.('credit_card', 'change_pin', 'Opening credit card PIN change.');
      return 'Opening Change Credit Card PIN…';
    }
    return false;
  };

  const handleTabChange = (id) => {
    setActiveTab(id);
    setHomeAiOpen(false);
  };

  const handlePillClick = () => {
    if (activeTab === 'home') onFundTransferImps?.();
    else if (activeTab === 'loans') onApplyNewLoan?.();
    else if (activeTab === 'invest') onOpenDeposit?.();
    else if (activeTab === 'myTrack') onOpenTxnHistory?.();
    else onQuickAction?.('check_balance');
  };

  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden"
      style={{ backgroundColor: ABCD.red }}
      {...homeRageProps}
    >
      <AbcdHomeHeader tab={activeTab} onPillClick={handlePillClick} />

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[28px] bg-white">
        <div className="flex shrink-0 justify-center pb-1 pt-2.5">
          <span className="h-1 w-10 rounded-full bg-[#D1D5DB]" aria-hidden />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
          {activeTab === 'home' && (
            <AbcdHomeTab
              onOpenDeposit={onOpenDeposit}
              onApplyNewLoan={onApplyNewLoan}
              onNavigate={onNavigate}
              onOpenTxnHistory={onOpenTxnHistory}
              onGoTab={handleTabChange}
            />
          )}
          {activeTab === 'myTrack' && (
            <AbcdMyTrackTab
              balanceLabel={balanceLabel}
              onOpenTxnHistory={onOpenTxnHistory}
              onNavigate={onNavigate}
              onQuickAction={onQuickAction}
            />
          )}
          {activeTab === 'loans' && (
            <AbcdLoansTab onApplyNewLoan={onApplyNewLoan} onNavigate={onNavigate} />
          )}
          {activeTab === 'insure' && <AbcdInsureTab onQuickAction={onQuickAction} />}
          {activeTab === 'invest' && <AbcdInvestTab onOpenDeposit={onOpenDeposit} />}
        </div>
      </div>

      <AbcdBottomNav active={activeTab} onChange={handleTabChange} />

      {!homeAiOpen && (
        <button
          type="button"
          onClick={openAi}
          data-ai-fab
          className="press-bright absolute bottom-[5.5rem] right-3 z-40 flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#F5C518]/80 bg-white text-xl shadow-lg"
          aria-label="Open AI Assistant"
          title="AI Assistant"
        >
          <span className="translate-y-px">🧑‍💼</span>
        </button>
      )}

      <RMHelpPrompt
        open={rmHomePromptOpen}
        onHelp={() => {
          setRmHomePromptOpen(false);
          dismissHomeRage();
          openAi();
        }}
        onDismiss={() => {
          setRmHomePromptOpen(false);
          dismissHomeRage();
        }}
      />

      <LoanAguiPanel
        key={`home-ai-${panelKey}-${navMode ? 'nav' : voiceAssistMode ? 'assist' : 'chat'}`}
        agentId={agents.home}
        open={homeAiOpen}
        onClose={() => {
          setHomeAiOpen(false);
          if (navMode) onStopVoiceCommandSession?.();
        }}
        onAutoHide={() => setHomeAiOpen(false)}
        formValues={{}}
        onFormChange={() => {}}
        navOnly={navMode}
        voiceAssist={voiceAssistMode && !navMode}
        onVoiceCommand={onVoiceCommand}
        continuousVoiceActive={navMode && voiceCommandSessionActive}
        continuousListening={voiceCommandListening}
        continuousTranscript={voiceCommandTranscript}
        continuousLiveTranscript={voiceCommandLiveTranscript}
        onStopContinuousVoice={onStopVoiceCommandSession}
        onStartContinuousVoice={onStartVoiceCommandSession}
        suppressGreeting={navMode}
        onToolCall={(name, args) => {
          if (name === 'navigate_to' && args?.destination) {
            setHomeAiOpen(false);
            if (navMode) onStopVoiceCommandSession?.();
            onNavigate?.(args.destination, args.context || '', args.routingStatus || '');
          }
        }}
        onUserMessage={handleUserMessage}
        greeting={greeting}
        assistHint={assistHint}
        assistTitle={assistTitle}
        showReasoning
        lang={lang}
        dockClassName="bottom-[5.25rem]"
      />
    </div>
  );
}
