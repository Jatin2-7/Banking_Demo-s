import React, { useMemo, useState } from 'react';
import { ACCOUNTS as FALLBACK_ACCOUNTS } from '../data/mock.js';
import LoanAguiPanel from './LoanAguiPanel.jsx';
import RMHelpPrompt from './RMHelpPrompt.jsx';
import { useRageDetect } from '../hooks/useRageDetect.js';
import { HOME_AGUI_AGENT_ID } from '../lib/aguiClient.js';
import { DcbHomeHeader } from './dcb/DcbHeader.jsx';

function formatInr(n) {
  return `₹ ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ServiceTile({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press flex min-h-[5.25rem] flex-col items-center justify-center gap-1.5 rounded-xl bg-[#EEF1F6] px-1 py-2.5 text-center transition hover:bg-[#E4E8F0]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center text-[#1A237E] [&>svg]:h-[22px] [&>svg]:w-[22px]">
        {icon}
      </div>
      <span className="line-clamp-2 w-full px-0.5 text-[10px] font-semibold leading-tight text-[#1A237E]">
        {label}
      </span>
    </button>
  );
}

export default function HomeScreen({
  lang,
  onMicTap,
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
  const [homeAiOpen, setHomeAiOpen] = useState(false);
  const [rmHomePromptOpen, setRmHomePromptOpen] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);
  // Bump when demo mode changes so the panel remounts with the right greeting/mic behaviour.
  const [panelKey, setPanelKey] = useState(0);

  const prevCloseSignalRef = React.useRef(aiPanelCloseSignal);
  React.useEffect(() => {
    if (aiPanelCloseSignal !== prevCloseSignalRef.current) {
      prevCloseSignalRef.current = aiPanelCloseSignal;
      setHomeAiOpen(false);
    }
  }, [aiPanelCloseSignal]);

  // Switching Voice-to-Command ↔ Voice Assist while the panel is open must
  // remount it — otherwise the old greeting / mic loop sticks around.
  // Skip the initial mount so we don't remount before the first bot tap.
  const modeInitRef = React.useRef(true);
  React.useEffect(() => {
    if (modeInitRef.current) {
      modeInitRef.current = false;
      return;
    }
    setPanelKey((k) => k + 1);
    if (!navMode) onStopVoiceCommandSession?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to mode flips
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

  const maskedAcct = `XXXX ${(primary.last4 || primary.number || '1234').toString().slice(-4)}`;

  const openAi = () => {
    // Arm mic FIRST while still inside the click gesture, then open the panel.
    // (Web Speech / getUserMedia require a user gesture — no await before start.)
    if (navMode) {
      onStartVoiceCommandSession?.();
    }
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
      ? "Namaste! I'm your DCB Bank AI assistant. Tell me what you'd like to do — transfer funds, open a deposit, check statements, change your card PIN, or anything else."
      : "Namaste! I'm your DCB Bank AI assistant. Tell me what you'd like to do — transfer funds, open a deposit, check statements, or anything else.";

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

  return (
    <div className="relative flex min-h-full flex-col bg-[#F5F7FA] pb-6" {...homeRageProps}>
      <DcbHomeHeader />

      {/* Promo banner */}
      <section className="shrink-0 px-3 pt-3">
        <div className="relative overflow-hidden rounded-xl bg-[#FFD600] px-8 py-4 text-center shadow-sm">
          <button
            type="button"
            className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[#1A237E]/70 press"
            aria-label="Previous promo"
          >
            ‹
          </button>
          <button
            type="button"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#1A237E]/70 press"
            aria-label="Next promo"
          >
            ›
          </button>
          <p className="text-[9px] font-bold tracking-wide text-[#1A237E]/80">DCB BANK</p>
          <p className="mt-0.5 text-[15px] font-bold text-[#1A237E]">DCB Fixed Deposit</p>
          <p className="mt-0.5 text-[13px] font-semibold text-[#1A237E]">
            Earn upto <span className="text-[18px] font-black">7.90%</span> p.a.
          </p>
        </div>
      </section>

      {/* Account summary card */}
      <section className="shrink-0 px-3 pt-3">
        <div className="rounded-xl bg-white px-3.5 py-3.5 shadow-[0_2px_12px_rgba(26,35,126,0.08)]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Last Login</p>
              <p className="mt-0.5 text-[12px] font-medium leading-snug text-[#1A237E]">
                21 Apr, 2026, 10:25 AM
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold text-slate-500">Savings Account</p>
              <p className="mt-0.5 text-[12px] font-bold text-[#1A237E]">{maskedAcct}</p>
              <button
                type="button"
                onClick={() => setBalanceVisible((v) => !v)}
                className="mt-1 text-[12px] font-semibold text-[#1565C0] underline press"
              >
                {balanceVisible ? formatInr(primary.balance) : 'Check Balance'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Service grid 3×3 */}
      <section className="shrink-0 px-3 pt-3">
        <div className="grid grid-cols-3 gap-2.5 rounded-2xl bg-[#F0F2F7] p-2.5">
          <ServiceTile
            label="My Accounts"
            onClick={() => (onOpenTxnHistory ? onOpenTxnHistory() : onQuickAction('check_balance'))}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M3 10l9-7 9 7v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" />
                <path d="M10 21V12h4v9" />
                <path d="M9 8h.01M12 8h.01M15 8h.01" strokeLinecap="round" />
              </svg>
            }
          />
          <ServiceTile
            label="Transfer"
            onClick={() => (onFundTransferImps ? onFundTransferImps() : onQuickAction('internal_transfer'))}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M7 10h13l-3-3M17 14H4l3 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <ServiceTile
            label="Term Deposit"
            onClick={() => (onOpenDeposit ? onOpenDeposit() : onQuickAction('check_balance'))}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="4" y="5" width="16" height="15" rx="2" />
                <path d="M8 3v4M16 3v4M4 11h16" strokeLinecap="round" />
              </svg>
            }
          />
          <ServiceTile
            label="Credit Card"
            onClick={() => onNavigate?.('credit_card')}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20M6 15h4" strokeLinecap="round" />
              </svg>
            }
          />
          <ServiceTile
            label="Debit Card"
            onClick={() => onNavigate?.('debit_card')}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
                <circle cx="17" cy="15" r="1.5" fill="currentColor" />
              </svg>
            }
          />
          <ServiceTile
            label="Apply IPO"
            onClick={() => onQuickAction('check_balance')}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M4 18l5-6 4 3 6-8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 7h4v4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <ServiceTile
            label="Gold Loan"
            onClick={() => (onApplyNewLoan ? onApplyNewLoan() : onQuickAction('check_balance'))}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M12 3l8 4v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7l8-4z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            }
          />
          <ServiceTile
            label="Bharat Connect"
            onClick={() => onQuickAction('pay_bill')}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
              </svg>
            }
          />
          <ServiceTile
            label="Services"
            onClick={() => onQuickAction('check_balance')}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 16v-1.5a2.5 2.5 0 011.5-2.3A2.5 2.5 0 0012 7.5" strokeLinecap="round" />
                <circle cx="12" cy="18.5" r="0.8" fill="currentColor" />
              </svg>
            }
          />
        </div>
      </section>

      {/* Spacer */}
      <div className="flex-1" />

      {!homeAiOpen && (
        <button
          type="button"
          onClick={openAi}
          data-ai-fab
          className="press-bright absolute bottom-5 right-3 z-30 flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-200/80 bg-white text-xl shadow-lg"
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
        agentId={HOME_AGUI_AGENT_ID}
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
      />
    </div>
  );
}
