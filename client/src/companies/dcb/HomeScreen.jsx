import React, { useMemo, useState } from 'react';
import { ACCOUNTS as FALLBACK_ACCOUNTS } from '../../data/mock.js';
import LoanAguiPanel from '../../components/LoanAguiPanel.jsx';
import RMHelpPrompt from '../../components/RMHelpPrompt.jsx';
import { useRageDetect } from '../../hooks/useRageDetect.js';
import { useCompanyAgents } from '../../shared/lib/companyAgents.js';
import { DcbHomeHeader } from './DcbHeader.jsx';
import { DCB } from './theme.js';

function formatInr(n) {
  return `\u20B9 ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ServiceTile({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press flex min-h-[5.25rem] flex-col items-center justify-center gap-1.5 rounded-xl px-1 py-2.5 text-center transition"
      style={{ backgroundColor: DCB.tileBg, color: DCB.navy }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = DCB.tileHover; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = DCB.tileBg; }}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center [&>svg]:h-[22px] [&>svg]:w-[22px]">
        {icon}
      </div>
      <span className="line-clamp-2 w-full px-0.5 text-[10px] font-semibold leading-tight">{label}</span>
    </button>
  );
}

export default function DcbHomeScreen({
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
  const [balanceVisible, setBalanceVisible] = useState(false);
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

  const maskedAcct = `XXXX ${(primary.last4 || primary.number || '1234').toString().slice(-4)}`;

  const openAi = () => {
    if (navMode) onStartVoiceCommandSession?.();
    setHomeAiOpen(true);
  };

  const assistTitle = navMode
    ? 'Voice Navigation'
    : voiceAssistMode
      ? 'AI Assistant \u00B7 Voice Assist'
      : 'AI Assistant';

  const assistHint = navMode
    ? voiceCommandSessionActive
      ? 'Listening \u2014 speak a command. Mic re-opens after each action.'
      : 'Speak a screen name \u2014 I will open it for you.'
    : voiceAssistMode
      ? 'I will speak and listen \u2014 answer hands-free after I finish.'
      : 'Voice or text \u2014 your choice.';

  const greeting = navMode
    ? 'Sure. Tell me the screen you want to open, and I will take you there.'
    : voiceAssistMode
      ? "Namaste! I'm your DCB Bank AI assistant. Tell me what you'd like to do \u2014 transfer funds, open a deposit, check statements, change your card PIN, or anything else."
      : "Namaste! I'm your DCB Bank AI assistant. Tell me what you'd like to do \u2014 transfer funds, open a deposit, check statements, or anything else.";

  const handleUserMessage = (text) => {
    const t = String(text || '').toLowerCase();
    if (
      /\b(change|reset|update|forgot)\b.{0,24}\b(credit\s*)?(card\s*)?pin\b/.test(t) ||
      /\b(credit\s*)?card\s*pin\b.{0,16}\b(change|reset|update)\b/.test(t) ||
      /\bchange\s+my\s+(credit\s+)?(card\s+)?pin\b/.test(t)
    ) {
      setHomeAiOpen(false);
      onNavigate?.('credit_card', 'change_pin', 'Opening credit card PIN change.');
      return 'Opening Change Credit Card PIN\u2026';
    }
    return false;
  };

  return (
    <div className="relative flex min-h-full flex-col pb-6" style={{ backgroundColor: DCB.bg }} {...homeRageProps}>
      <DcbHomeHeader />

      <section className="shrink-0 px-3 pt-3">
        <div className="relative overflow-hidden rounded-xl px-8 py-4 text-center shadow-sm" style={{ backgroundColor: DCB.promo }}>
          <button type="button" className="absolute left-1.5 top-1/2 -translate-y-1/2 press" style={{ color: `${DCB.navy}B3` }} aria-label="Previous promo">
            &#8249;
          </button>
          <button type="button" className="absolute right-1.5 top-1/2 -translate-y-1/2 press" style={{ color: `${DCB.navy}B3` }} aria-label="Next promo">
            &#8250;
          </button>
          <p className="text-[9px] font-bold tracking-wide" style={{ color: `${DCB.navy}CC` }}>DCB BANK</p>
          <p className="mt-0.5 text-[15px] font-bold" style={{ color: DCB.navy }}>DCB Fixed Deposit</p>
          <p className="mt-0.5 text-[13px] font-semibold" style={{ color: DCB.navy }}>
            Earn upto <span className="text-[18px] font-black">7.90%</span> p.a.
          </p>
        </div>
      </section>

      <section className="shrink-0 px-3 pt-3">
        <div className="rounded-xl bg-white px-3.5 py-3.5 shadow-[0_2px_12px_rgba(26,35,126,0.08)]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Last Login</p>
              <p className="mt-0.5 text-[12px] font-medium leading-snug" style={{ color: DCB.navy }}>
                21 Apr, 2026, 10:25 AM
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold text-slate-500">Savings Account</p>
              <p className="mt-0.5 text-[12px] font-bold" style={{ color: DCB.navy }}>{maskedAcct}</p>
              <button
                type="button"
                onClick={() => setBalanceVisible((v) => !v)}
                className="mt-1 text-[12px] font-semibold underline press"
                style={{ color: DCB.link }}
              >
                {balanceVisible ? formatInr(primary.balance) : 'Check Balance'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="shrink-0 px-3 pt-3">
        <div className="grid grid-cols-3 gap-2.5 rounded-2xl p-2.5" style={{ backgroundColor: DCB.gridBg }}>
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
          <ServiceTile label="Credit Card" onClick={() => onNavigate?.('credit_card')} icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20M6 15h4" strokeLinecap="round" />
            </svg>
          } />
          <ServiceTile label="Debit Card" onClick={() => onNavigate?.('debit_card')} icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
              <circle cx="17" cy="15" r="1.5" fill="currentColor" />
            </svg>
          } />
          <ServiceTile label="Apply IPO" onClick={() => onQuickAction('check_balance')} icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M4 18l5-6 4 3 6-8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 7h4v4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          } />
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
          <ServiceTile label="Bharat Connect" onClick={() => onQuickAction('pay_bill')} icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
            </svg>
          } />
          <ServiceTile label="Services" onClick={() => onQuickAction('check_balance')} icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 16v-1.5a2.5 2.5 0 011.5-2.3A2.5 2.5 0 0012 7.5" strokeLinecap="round" />
              <circle cx="12" cy="18.5" r="0.8" fill="currentColor" />
            </svg>
          } />
        </div>
      </section>

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
          <span className="translate-y-px">{'\uD83E\uDDD1\u200D\uD83D\uDCBC'}</span>
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
      />
    </div>
  );
}
