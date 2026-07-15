import React, { useCallback, useEffect, useRef, useState } from 'react';
import LoanAguiPanel from '../../components/LoanAguiPanel.jsx';
import RMHelpPrompt from '../../components/RMHelpPrompt.jsx';
import { useRageDetect } from '../../hooks/useRageDetect.js';
import { routeVoiceCommand, normalizeVoiceCommandText } from '../../lib/voiceCommandRouter.js';
import { useCompanyAgents } from '../../shared/lib/companyAgents.js';
import { handleSbiHomeUserMessage, inferSbiHomeDestination, matchesApplyHomeLoanIntent, matchesPinChangeIntent } from './lib/homeIntent.js';
import { applySbiNativeNavigation, resolveSbiNativeDestination } from './lib/navigation.js';
import { registerSbiNavHandler, unregisterSbiNavHandler } from '../../shared/lib/companyNavBridge.js';
import { SbiHeader } from './components/SbiHeader.jsx';
import { SbiStoryRow } from './components/SbiStoryRow.jsx';
import { SbiBottomNav } from './components/SbiBottomNav.jsx';
import { SbiAccountCards } from './components/SbiAccountCards.jsx';
import { SbiPaymentTabs } from './components/SbiPaymentTabs.jsx';
import { SbiMainTabs, SbiGradientBanner } from './components/SbiBanner.jsx';
import { SbiSectionGrid } from './components/SbiSectionGrid.jsx';
import { SbiIcon } from './components/SbiIcons.jsx';
import { SbiAiFab } from './components/SbiAiFab.jsx';
import SbiLoansScreen from './screens/SbiLoansScreen.jsx';
import SbiCreditCardPinScreen from './screens/SbiCreditCardPinScreen.jsx';

const UPI_ITEMS = [
  { id: 'pay-mobile', label: 'Pay to mobile or contact', icon: <SbiIcon name="mobile" /> },
  { id: 'pay-upi', label: 'Pay UPI ID or Number', icon: <SbiIcon name="upi" /> },
  { id: 'pay-bank', label: 'Pay to Bank A/C', icon: <SbiIcon name="bank" /> },
  { id: 'view-txn', label: 'View Transaction', icon: <SbiIcon name="txn" /> },
];

const INVEST_ITEMS = [
  { id: 'mf', label: 'Mutual Fund', icon: <SbiIcon name="mf" /> },
  { id: 'demat', label: 'Demat & Securities', icon: <SbiIcon name="demat" /> },
  { id: 'nps', label: 'NPS', icon: <SbiIcon name="nps" /> },
  { id: 'ppf', label: 'PPF', icon: <SbiIcon name="ppf" /> },
];

const LOAN_ITEMS = [
  { id: 'home', label: 'Home Loan', icon: <SbiIcon name="home" /> },
  { id: 'personal', label: 'Personal Loan', icon: <SbiIcon name="personal" /> },
  { id: 'car', label: 'Car Loan', icon: <SbiIcon name="car" /> },
  { id: 'gold', label: 'Gold Loan', icon: <SbiIcon name="gold" /> },
];

const DEPOSIT_ITEMS = [
  { id: 'fd', label: 'Fixed Deposit', icon: <SbiIcon name="fd" /> },
  { id: 'rd', label: 'Recurring Deposit', icon: <SbiIcon name="rd" /> },
  { id: 'annuity', label: 'Annuity Deposit', icon: <SbiIcon name="fd" /> },
  { id: 'sweep', label: 'Auto Sweep', icon: <SbiIcon name="rd" /> },
];

const INSURANCE_ITEMS = [
  { id: 'life', label: 'Life', icon: <SbiIcon name="life" /> },
  { id: 'health', label: 'Health', icon: <SbiIcon name="health" /> },
  { id: 'accident', label: 'Accident', icon: <SbiIcon name="life" /> },
  { id: 'motor', label: 'Motor', icon: <SbiIcon name="car" /> },
];

const CARD_ITEMS = [
  { id: 'credit', label: 'Credit Cards', icon: <SbiIcon name="credit" /> },
  { id: 'debit', label: 'Debit Cards', icon: <SbiIcon name="debit" /> },
  { id: 'forex', label: 'Forex Cards', icon: <SbiIcon name="credit" /> },
  { id: 'ncmc', label: 'NCMC', icon: <SbiIcon name="debit" /> },
];

const SERVICE_ITEMS = [
  { id: 'account', label: 'Account Related', icon: <SbiIcon name="building" /> },
  { id: 'tax', label: 'Tax Related', icon: <SbiIcon name="tax" /> },
  { id: 'cheque', label: 'Cheque Services', icon: <SbiIcon name="cheque" /> },
  { id: 'lock', label: 'e-Secure Lock', icon: <SbiIcon name="lock" /> },
];

function matchesHomeLoanIntent(t, raw = '') {
  return matchesApplyHomeLoanIntent(t, raw);
}

export default function SbiHomeScreen({
  lang,
  onApplyNewLoan,
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
}) {
  const agents = useCompanyAgents();
  const [homeAiOpen, setHomeAiOpen] = useState(() => !navMode);
  const [rmHomePromptOpen, setRmHomePromptOpen] = useState(false);
  const [panelKey, setPanelKey] = useState(0);
  const [bottomTab, setBottomTab] = useState('home');
  const [mainTab, setMainTab] = useState('banking');
  const [paymentTab, setPaymentTab] = useState('upi');
  const [overlay, setOverlay] = useState(null);

  const prevCloseSignalRef = useRef(aiPanelCloseSignal);
  useEffect(() => {
    if (aiPanelCloseSignal !== prevCloseSignalRef.current) {
      prevCloseSignalRef.current = aiPanelCloseSignal;
      setHomeAiOpen(false);
    }
  }, [aiPanelCloseSignal]);

  const modeInitRef = useRef(true);
  useEffect(() => {
    if (modeInitRef.current) {
      modeInitRef.current = false;
      return;
    }
    setPanelKey((k) => k + 1);
    if (!navMode) onStopVoiceCommandSession?.();
  }, [navMode, voiceAssistMode]);

  const { containerProps: homeRageProps, dismiss: dismissHomeRage } = useRageDetect({
    onFrustrated: () => { if (!homeAiOpen) setRmHomePromptOpen(true); },
  });

  const openAi = () => {
    if (navMode) onStartVoiceCommandSession?.();
    setHomeAiOpen(true);
  };

  const closeAi = useCallback(() => {
    setHomeAiOpen(false);
    if (navMode) onStopVoiceCommandSession?.();
  }, [navMode, onStopVoiceCommandSession]);

  const sbiNavActions = useCallback(() => ({
    setOverlay,
    setBottomTab,
    closeAi,
  }), [closeAi]);

  const openSbiCreditCardPin = useCallback(() => {
    closeAi();
    setBottomTab('home');
    setOverlay('credit_card_pin');
  }, [closeAi]);

  useEffect(() => {
    registerSbiNavHandler({ openCreditCardPin: openSbiCreditCardPin });
    return () => unregisterSbiNavHandler();
  }, [openSbiCreditCardPin]);

  const handleSbiNavigate = useCallback((destination, context, routingStatus) => {
    closeAi();
    if (destination === 'loan_application') {
      onNavigate?.(
        destination,
        context || 'Customer wants to apply for an SBI YONO home loan. Guide them through the application form step by step and use set_field to fill each answer on screen.',
        routingStatus || 'Opening your SBI home loan application.',
        { silent: true },
      );
      return;
    }
    const native = resolveSbiNativeDestination(destination);
    if (applySbiNativeNavigation(native, sbiNavActions())) return;
    onNavigate?.(destination, context, routingStatus, { silent: true });
  }, [closeAi, onNavigate, sbiNavActions]);

  const openHomeLoanApplication = useCallback((context = '') => {
    closeAi();
    onNavigate?.(
      'loan_application',
      context || 'Customer wants to apply for an SBI YONO home loan. Guide them through the application form step by step and use set_field to fill each answer on screen.',
      'Opening your SBI home loan application.',
      { silent: true },
    );
  }, [closeAi, onNavigate]);

  const handleSbiVoiceCommand = useCallback(async (text) => {
    const match = routeVoiceCommand(text);
    const t = normalizeVoiceCommandText(text);

    if (matchesPinChangeIntent(t) || (match?.destination === 'credit_card' && match?.subFlow === 'change_pin')) {
      closeAi();
      openSbiCreditCardPin();
      return { text, match: match || { destination: 'credit_card', routingStatus: 'Opening SBI credit card PIN change.' } };
    }
    if (match?.destination === 'loan_application' || matchesHomeLoanIntent(t, text)) {
      openHomeLoanApplication(text);
      return { text, match: match || { destination: 'loan_application', routingStatus: 'Opening SBI home loan application.' } };
    }
    return onVoiceCommand?.(text);
  }, [closeAi, openSbiCreditCardPin, openHomeLoanApplication, onVoiceCommand]);

  const handleLoanSelect = (loanId) => {
    if (loanId === 'home') {
      onApplyNewLoan?.();
    }
  };

  const handleGridItem = (item, section) => {
    if (item.id === 'home') {
      onApplyNewLoan?.();
      return;
    }
    if (item.id === 'credit') {
      openSbiCreditCardPin();
      return;
    }
    if (section === 'loans') {
      handleLoanSelect(item.id);
    }
  };

  const handleBottomNav = (tab) => {
    if (tab === 'loans') {
      setBottomTab('loans');
      setOverlay(null);
    } else if (tab === 'home') {
      setBottomTab('home');
      setOverlay(null);
    }
  };

  const assistTitle = navMode ? 'Voice Navigation' : voiceAssistMode ? 'YONO Assistant · Voice' : 'YONO Assistant';
  const assistHint = navMode
    ? voiceCommandSessionActive ? 'Listening — speak a command.' : 'Say "apply for home loan" or "change credit card PIN".'
    : voiceAssistMode ? 'Hands-free — I will speak and listen.' : 'Voice or text — your choice.';
  const greeting = navMode
    ? 'Tell me what you need — home loan or credit card PIN change.'
    : "Namaste! I'm your SBI YONO assistant powered by Silversuits.ai. I can help you apply for a home loan or change your credit card PIN. How may I help you?";

  const handleUserMessage = (text) => handleSbiHomeUserMessage(text);

  const aguiPanel = (
    <LoanAguiPanel
      key={`sbi-home-ai-${panelKey}-${navMode ? 'nav' : voiceAssistMode ? 'assist' : 'chat'}`}
      agentId={agents.home}
      open={homeAiOpen}
      onClose={() => { setHomeAiOpen(false); if (navMode) onStopVoiceCommandSession?.(); }}
      onAutoHide={() => setHomeAiOpen(false)}
      formValues={{}}
      onFormChange={() => {}}
      navOnly={navMode}
      voiceAssist={voiceAssistMode && !navMode}
      onVoiceCommand={handleSbiVoiceCommand}
      continuousVoiceActive={navMode && voiceCommandSessionActive}
      continuousListening={voiceCommandListening}
      continuousTranscript={voiceCommandTranscript}
      continuousLiveTranscript={voiceCommandLiveTranscript}
      onStopContinuousVoice={onStopVoiceCommandSession}
      onStartContinuousVoice={onStartVoiceCommandSession}
      suppressGreeting={navMode}
      onToolCall={(name, args) => {
        if (name !== 'navigate_to') return;
        const dest =
          args?.destination ||
          inferSbiHomeDestination(args?.context || '', args?.routingStatus || '')?.destination;
        if (!dest) return;
        handleSbiNavigate(dest, args?.context || '', args?.routingStatus || '');
      }}
      onUserMessage={handleUserMessage}
      directHandledReply
      greeting={greeting}
      assistHint={assistHint}
      assistTitle={assistTitle}
      showReasoning
      lang={lang}
      dockClassName="bottom-[5.75rem]"
    />
  );

  const aiFab = !homeAiOpen ? (
    <SbiAiFab
      onClick={openAi}
      className="absolute bottom-[6.5rem] right-4"
    />
  ) : null;

  if (overlay === 'credit_card_pin') {
    return (
      <div className="relative flex min-h-full flex-col" {...homeRageProps}>
        <SbiCreditCardPinScreen onBack={() => setOverlay(null)} />
        <SbiBottomNav active="home" onChange={handleBottomNav} />
        {aiFab}
        {aguiPanel}
      </div>
    );
  }

  if (bottomTab === 'loans') {
    return (
      <div className="relative flex min-h-full flex-col" {...homeRageProps}>
        <SbiLoansScreen onSelectLoan={handleLoanSelect} />
        <SbiBottomNav active="loans" onChange={handleBottomNav} />
        {aiFab}
        {aguiPanel}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-full flex-col bg-white" {...homeRageProps}>
      <SbiHeader />
      <SbiStoryRow />
      <SbiMainTabs active={mainTab} onChange={setMainTab} />

      <div className={`no-scrollbar flex-1 overflow-y-auto ${homeAiOpen ? 'pb-44' : 'pb-24'}`}>
        {mainTab === 'banking' && (
          <>
            <div className="bg-white pt-3">
              <SbiAccountCards />
            </div>
            <SbiPaymentTabs active={paymentTab} onChange={setPaymentTab} />
            <SbiSectionGrid
              title="UPI Payments"
              items={UPI_ITEMS}
              onViewAll={() => {}}
              onItemClick={(item) => handleGridItem(item, 'upi')}
            />
            <SbiSectionGrid
              title="Investments"
              items={INVEST_ITEMS}
              onViewAll={() => {}}
            />
            <SbiGradientBanner
              title="Personal Finance Manager"
              variant="pfm"
              onClick={() => {}}
            />
            <SbiSectionGrid
              title="Loans"
              items={LOAN_ITEMS}
              onViewAll={() => setBottomTab('loans')}
              onItemClick={(item) => handleGridItem(item, 'loans')}
            />
            <SbiGradientBanner
              title="What is your Credit Score"
              variant="credit"
              onClick={() => {}}
            />
            <SbiSectionGrid
              title="Deposits"
              items={DEPOSIT_ITEMS}
              onViewAll={() => {}}
              onItemClick={(item) => handleGridItem(item, 'deposits')}
            />
            <SbiGradientBanner
              title="Banking without the boring!"
              subtitle="Paperless savings account opening."
              cta="See How"
              variant="savings"
              onClick={() => {}}
            />
            <SbiSectionGrid
              title="Insurance"
              items={INSURANCE_ITEMS}
              onViewAll={() => {}}
            />
            <SbiGradientBanner
              title="Your Exclusive Gateway to Upcoming IPOs"
              subtitle="Be ready for tomorrow's big opportunities"
              cta="Open Demat A/c at Zero Cost"
              variant="ipo"
              onClick={() => {}}
            />
            <SbiSectionGrid
              title="Cards"
              items={CARD_ITEMS}
              onViewAll={() => {}}
              onItemClick={(item) => handleGridItem(item, 'cards')}
            />
            <SbiSectionGrid
              title="Services"
              items={SERVICE_ITEMS}
              onViewAll={() => {}}
              onItemClick={(item) => handleGridItem(item, 'services')}
            />
            <div className="h-2" />
          </>
        )}
        {mainTab === 'lifestyle' && (
          <div className="px-4 py-8 text-center">
            <p className="text-[14px] font-semibold text-slate-600">Lifestyle</p>
            <p className="mt-2 text-[12px] text-slate-500">Shopping, travel &amp; more on YONO.</p>
          </div>
        )}
        {mainTab === 'rewards' && (
          <div className="px-4 py-8 text-center">
            <p className="text-[14px] font-semibold text-slate-600">Rewards</p>
            <p className="mt-2 text-[12px] text-slate-500">Earn points on every transaction.</p>
          </div>
        )}
      </div>

      <SbiBottomNav active="home" onChange={handleBottomNav} />

      {aiFab}

      <RMHelpPrompt
        open={rmHomePromptOpen}
        onHelp={() => { setRmHomePromptOpen(false); dismissHomeRage(); openAi(); }}
        onDismiss={() => { setRmHomePromptOpen(false); dismissHomeRage(); }}
      />

      {aguiPanel}
    </div>
  );
}
