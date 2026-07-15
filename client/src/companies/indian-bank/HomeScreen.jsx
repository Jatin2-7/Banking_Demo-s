import React, { useMemo, useState } from 'react';
import { ACCOUNTS as FALLBACK_ACCOUNTS } from '../../data/mock.js';
import { STRINGS } from '../../i18n/strings.js';
import LoanAguiPanel from '../../components/LoanAguiPanel.jsx';
import RMHelpPrompt from '../../components/RMHelpPrompt.jsx';
import { useRageDetect } from '../../hooks/useRageDetect.js';
import { useCompanyAgents } from '../../shared/lib/companyAgents.js';
import { INDIAN_BANK } from './theme.js';

function formatInr(n) {
  return `\u20B9${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const HEADER_SIDE = '2.75rem';

function HeaderIconButton({ children, label }) {
  return (
    <button
      type="button"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10 text-white press hover:bg-white/20"
      aria-label={label}
    >
      {children}
    </button>
  );
}

function TriColorUpiMark({ size = 22 }) {
  return (
    <div
      className="mx-auto flex shrink-0 overflow-hidden rounded shadow-sm"
      style={{ width: size, height: size * 0.7 }}
      aria-hidden
    >
      <div className="h-full flex-1 bg-[#097939]" />
      <div className="h-full flex-1 border-y border-slate-200/80 bg-white" />
      <div className="h-full flex-1 bg-[#E97529]" />
    </div>
  );
}

function GoldQuickTile({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press flex h-full min-h-[5.75rem] flex-col items-center justify-between gap-1 rounded-xl border border-white/10 bg-white/[0.06] px-1 py-2 text-center transition hover:bg-white/10"
    >
      <div className="flex shrink-0 items-center justify-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bank-gold text-bank-purpleDeep shadow-md [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </div>
      </div>
      <span className="line-clamp-2 w-full flex-1 px-0.5 text-[9px] font-semibold leading-[1.15] text-white/95">
        {label}
      </span>
    </button>
  );
}

function ServiceTile({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press flex h-full min-h-[4.75rem] flex-col items-center justify-between gap-1 rounded-xl border border-slate-200/90 bg-slate-50 p-1.5 text-center transition hover:bg-slate-100/95"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-sm">
        {icon}
      </div>
      <span className="line-clamp-2 w-full flex-1 text-[8px] font-semibold leading-[1.2] text-slate-600">
        {label}
      </span>
    </button>
  );
}

function SummaryCell({ icon, title, count, amount, visible, maskText }) {
  return (
    <div className="flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-lg border border-bank-gold/35 bg-black/30 px-1 py-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center text-bank-gold/95 [&>svg]:h-7 [&>svg]:w-7">
        {icon}
      </div>
      <span className="text-center text-[8px] font-bold leading-none text-bank-gold">
        {title}({count})
      </span>
      <span className="text-center text-[10px] font-semibold tracking-tight text-white">
        {visible ? formatInr(amount) : maskText}
      </span>
    </div>
  );
}

function BottomNavItem({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press flex w-full max-w-[4.5rem] flex-col items-center justify-end gap-1 justify-self-center"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bank-gold text-base text-bank-nav shadow-md">
        {icon}
      </div>
      <span className="max-w-[4.5rem] text-center text-[8px] font-semibold leading-tight text-white/90">
        {label}
      </span>
    </button>
  );
}

export default function IndianBankHomeScreen({
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
  const agents = useCompanyAgents();
  const L = STRINGS[lang] || STRINGS.en;
  const [balancesVisible, setBalancesVisible] = useState(false);
  const [homeAiOpen, setHomeAiOpen] = useState(false);
  const [rmHomePromptOpen, setRmHomePromptOpen] = useState(false);
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
  const summary = useMemo(() => {
    const savings = liveAccounts.filter((a) => a.type === 'savings' || a.type === 'wallet');
    const od = liveAccounts.filter((a) => a.type === 'current');
    return {
      savingsCount: savings.length,
      savingsBal: savings.reduce((s, a) => s + a.balance, 0),
      odCount: od.length,
      odBal: od.reduce((s, a) => s + a.balance, 0),
      depositsCount: 0,
      depositsBal: 0,
      loansCount: 0,
      loansBal: 0,
    };
  }, [liveAccounts]);

  const maskText = L.maskPlaceholder || '\u20B9 XXXX.XX';

  const openAi = () => {
    if (navMode) onStartVoiceCommandSession?.();
    setHomeAiOpen(true);
  };

  const piggy = (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <ellipse cx="12" cy="14" rx="8" ry="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="12" r="1" fill="currentColor" />
      <circle cx="16" cy="12" r="1" fill="currentColor" />
      <path d="M10 16h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="18" cy="10" r="1.5" fill="currentColor" />
    </svg>
  );

  const greeting = navMode
    ? voiceCommandSessionActive
      ? 'Voice session active \u2014 speak your command. I will keep listening after each action.'
      : 'Sure. Tell me the screen you want to open, and I will take you there.'
    : voiceAssistMode
      ? "Namaste! I'm your Indian Bank AI assistant. Tell me what you'd like to do \u2014 pay someone, transfer funds, apply for a loan, change your card PIN, or anything else."
      : "Namaste! I'm your Indian Bank AI assistant. Tell me what you'd like to do \u2014 pay someone, transfer funds, apply for a loan, or anything else.";

  const handleUserMessage = (text) => {
    const t = String(text || '').toLowerCase();
    if (
      /\b(change|reset|update|forgot)\b.{0,24}\b(credit\s*)?(card\s*)?pin\b/.test(t) ||
      /\b(credit\s*)?card\s*pin\b.{0,16}\b(change|reset|update)\b/.test(t)
    ) {
      setHomeAiOpen(false);
      onNavigate?.('credit_card', 'change_pin', 'Opening credit card PIN change.');
      return 'Opening Change Credit Card PIN\u2026';
    }
    return false;
  };

  return (
    <div className="relative flex min-h-full flex-col pb-2" {...homeRageProps}>
      <header className="shrink-0 px-3 pb-2 pt-1.5">
        <div
          className="grid items-center gap-2"
          style={{ gridTemplateColumns: `${HEADER_SIDE} minmax(0, 1fr) auto` }}
        >
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bank-gold text-bank-purpleDeep press justify-self-start"
            aria-label="Menu"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex min-w-0 justify-center">
            <img
              src="/indian-bank-banner.png"
              alt={L.appName}
              className="pointer-events-none h-[46px] w-full max-w-[220px] select-none object-contain object-center"
              draggable={false}
            />
          </div>
          <div
            className="flex shrink-0 flex-wrap justify-end gap-0.5 justify-self-end"
            style={{ maxWidth: '9.5rem' }}
          >
            <HeaderIconButton label="Font size">
              <span className="text-[9px] font-bold leading-none">
                A<sup className="text-[6px]">^</sup>
              </span>
            </HeaderIconButton>
            <HeaderIconButton label="Search">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="10" cy="10" r="6" />
                <path d="M15 15l5 5" strokeLinecap="round" />
              </svg>
            </HeaderIconButton>
            <HeaderIconButton label="Notifications">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22a2 2 0 002-2H10a2 2 0 002 2z" />
                <path d="M6 9a6 6 0 1112 0c0 7 3 7 3 7H3s3 0 3-7" strokeLinejoin="round" />
              </svg>
            </HeaderIconButton>
            <HeaderIconButton label="Cards">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="6" width="18" height="12" rx="2" />
                <path d="M3 10h18" />
              </svg>
            </HeaderIconButton>
            <HeaderIconButton label="Log out">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M10 17H6a2 2 0 01-2-2V9a2 2 0 012-2h4M14 21l6-6-6-6M20 15H9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </HeaderIconButton>
          </div>
        </div>

        <div className="mt-2.5 grid grid-cols-3 items-center gap-2 px-0.5">
          <div className="flex justify-start">
            <span
              className="select-none text-lg font-black leading-none tracking-tight"
              style={{
                background: 'linear-gradient(90deg,#f5c518,#3b82f6,#a855f7,#f5c518)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
              aria-hidden
            >
              VBX
            </span>
          </div>
          <div className="flex min-w-0 items-center justify-center gap-2">
            <span className="whitespace-nowrap rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-center text-[11px] font-semibold text-white shadow-inner">
              {L.sparkBadge}
            </span>
            <button
              type="button"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/12 text-xs font-bold text-white press"
              aria-label={L.heroInfoAria}
            >
              !
            </button>
          </div>
          <div className="flex justify-end" aria-hidden>
            <div className="flex flex-col items-center gap-1 rounded-full border border-white/15 bg-white/10 px-1.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            </div>
          </div>
        </div>
      </header>

      <section className="shrink-0 px-3 pb-2">
        <div
          className="relative overflow-hidden rounded-xl border-2 border-bank-gold/85 p-3 shadow-bankCard"
          style={{ background: INDIAN_BANK.summaryBg }}
        >
          <div className="relative mb-3 flex min-h-[1.875rem] items-center justify-center px-1">
            <span className="rounded-full bg-bank-gold px-3.5 py-1 text-center text-[10px] font-bold uppercase tracking-wider text-bank-purpleDeep shadow-sm">
              {L.accountSummary}
            </span>
            <button
              type="button"
              onClick={() => setBalancesVisible((v) => !v)}
              className="press-bright absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md py-1 pl-1 pr-0 text-[10px] font-semibold text-bank-gold hover:bg-white/5"
            >
              <svg
                className="shrink-0 opacity-95"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span className="whitespace-nowrap pr-0.5">
                {balancesVisible ? L.hideBalances : L.showBalances}
              </span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SummaryCell
              icon={piggy}
              title={L.savingsShort}
              count={summary.savingsCount}
              amount={summary.savingsBal}
              visible={balancesVisible}
              maskText={maskText}
            />
            <SummaryCell
              icon={
                <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="13" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="M12 9v4l2.5 1.5"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
              }
              title={L.odShort}
              count={summary.odCount}
              amount={summary.odBal}
              visible={balancesVisible}
              maskText={maskText}
            />
            <SummaryCell
              icon={
                <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect
                    x="5"
                    y="7"
                    width="14"
                    height="12"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M9 11h6M9 14h4"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
              }
              title={L.depositsShort}
              count={summary.depositsCount}
              amount={summary.depositsBal}
              visible={balancesVisible}
              maskText={maskText}
            />
            <SummaryCell
              icon={
                <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M8 18V8l4-2 4 2v10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 11v5M10 13h4"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
              }
              title={L.loansShort}
              count={summary.loansCount}
              amount={summary.loansBal}
              visible={balancesVisible}
              maskText={maskText}
            />
          </div>
          <div className="mt-2.5 flex justify-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white shadow-sm" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
          </div>
        </div>
      </section>

      <section className="shrink-0 px-3 pb-2">
        <div className="grid auto-rows-fr grid-cols-4 gap-2">
          <GoldQuickTile
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="5" y="4" width="14" height="16" rx="2" />
                <path d="M9 8h6M9 12h6" strokeLinecap="round" />
              </svg>
            }
            label={L.tileAccountDetails}
            onClick={() => onQuickAction('check_balance')}
          />
          <GoldQuickTile
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M7 4h10v16H7z" />
                <path d="M9 8h6M9 11h4" strokeLinecap="round" />
              </svg>
            }
            label={L.tileAccountStatement}
            onClick={() => (onOpenTxnHistory ? onOpenTxnHistory() : onQuickAction('check_balance'))}
          />
          <GoldQuickTile
            icon={<span className="text-sm font-bold">m</span>}
            label={L.tileMPassbookQuick}
            onClick={() => onQuickAction('check_balance')}
          />
          <GoldQuickTile
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M8 12h8M12 8v8" strokeLinecap="round" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            }
            label={L.tileFundTransfers}
            onClick={() =>
              onFundTransferImps ? onFundTransferImps() : onQuickAction('internal_transfer')
            }
          />
          <GoldQuickTile
            icon={<span className="text-[10px] font-black tracking-tighter">VBX</span>}
            label={L.tileVbxBenefits}
            onClick={() => onQuickAction('check_balance')}
          />
          <GoldQuickTile
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5 4h14v12H5z" />
                <path d="M9 20h6" strokeLinecap="round" />
              </svg>
            }
            label={L.tileCallback}
            onClick={() => onQuickAction('check_balance')}
          />
          <GoldQuickTile
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="8" r="3" />
                <path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
              </svg>
            }
            label={L.tileVirtualRM}
            onClick={() => onQuickAction('check_balance')}
          />
          <GoldQuickTile
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="4" y="6" width="16" height="12" rx="2" />
                <path d="M8 10h8" strokeLinecap="round" />
              </svg>
            }
            label={L.tilePriorityServiceCard}
            onClick={() => onQuickAction('check_balance')}
          />
        </div>
      </section>

      <section className="mt-auto flex min-h-0 flex-1 flex-col rounded-t-[22px] border-t border-white/20 bg-white px-3 pb-3 pt-3 text-ink shadow-[0_-10px_36px_rgba(0,0,0,0.38)]">
        <div className="mx-auto mb-3 h-1 w-9 shrink-0 rounded-full bg-slate-300/90" />
        <div className="grid auto-rows-fr grid-cols-4 gap-2">
          <ServiceTile
            icon={<TriColorUpiMark />}
            label={L.svcUPI}
            onClick={() => onQuickAction('send_money')}
          />
          <ServiceTile
            icon={
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-lg">
                {'\uD83C\uDFC5'}
              </div>
            }
            label={L.svcRewards}
            onClick={() => onQuickAction('check_balance')}
          />
          <ServiceTile
            icon={
              <div className="flex h-full w-full items-center justify-center bg-blue-700 text-white">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path d="M8 4h12v16H8z" />
                  <path d="M6 8H4v12h12v-2" />
                </svg>
              </div>
            }
            label={L.svcOpenOd}
            onClick={() => onQuickAction('internal_transfer')}
          />
          <ServiceTile
            icon={
              <div className="flex h-full w-full items-center justify-center bg-sky-700 text-lg text-white">
                {'\uD83D\uDCB3'}
              </div>
            }
            label={L.svcDebitApply}
            onClick={() => onQuickAction('check_balance')}
          />
          <ServiceTile
            icon={
              <div className="flex h-full w-full items-center justify-center rounded-xl bg-blue-900 text-sm font-black text-white">
                B
              </div>
            }
            label={L.svcBillPay}
            onClick={() => onQuickAction('pay_bill')}
          />
          <ServiceTile
            icon={
              <div className="flex h-full w-full items-center justify-center bg-orange-500 text-xl">
                {'\uD83D\uDE97'}
              </div>
            }
            label={L.svcFastag}
            onClick={() => onQuickAction('pay_bill')}
          />
          <ServiceTile
            icon={
              <div className="flex h-full w-full items-center justify-center bg-orange-600 text-sm font-bold text-white">
                %
              </div>
            }
            label={L.svcNewLoan}
            onClick={() => (onApplyNewLoan ? onApplyNewLoan() : onQuickAction('check_balance'))}
          />
          <ServiceTile
            icon={
              <div className="flex h-full w-full items-center justify-center bg-emerald-600 text-xl">
                {'\uD83C\uDFE6'}
              </div>
            }
            label="Create Deposit"
            onClick={() => (onOpenDeposit ? onOpenDeposit() : onQuickAction('check_balance'))}
          />
          <ServiceTile
            icon={
              <div className="flex h-full w-full items-center justify-center bg-indigo-600 px-1 text-center text-[10px] font-bold leading-tight text-white">
                NCMC
              </div>
            }
            label={L.svcRupayWallet}
            onClick={() => onQuickAction('check_balance')}
          />
          <ServiceTile
            icon={
              <div className="flex h-full w-full items-center justify-center bg-sky-800 text-lg">
                {'\uD83D\uDCB3'}
              </div>
            }
            label={L.svcDebitCard}
            onClick={() => onNavigate?.('debit_card')}
          />
          <ServiceTile
            icon={
              <div className="flex h-full w-full items-center justify-center bg-blue-950 text-lg">
                {'\uD83D\uDCB3'}
              </div>
            }
            label={L.svcCreditCard}
            onClick={() => onNavigate?.('credit_card')}
          />
          <ServiceTile
            icon={
              <div className="flex h-full w-full items-center justify-center bg-violet-800 text-white">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path d="M8 4h12v16H8z" />
                  <path d="M6 8H4v12h12v-2" />
                </svg>
              </div>
            }
            label={L.svcLoanAccounts}
            onClick={() => onQuickAction('check_balance')}
          />
          <ServiceTile
            icon={
              <div className="flex h-full w-full items-center justify-center bg-cyan-700 text-xl">
                {'\u2708'}
              </div>
            }
            label={L.svcTravelLeisure}
            onClick={() => onQuickAction('book_flight')}
          />
        </div>
      </section>

      <nav className="relative z-10 mt-0 shrink-0 border-t border-white/10 bg-bank-nav pb-4 pt-3">
        <div className="relative mx-auto grid w-full max-w-[360px] grid-cols-5 items-end gap-0 px-1 pt-8">
          <div className="flex justify-center">
            <BottomNavItem icon={'\u266B'} label={L.navEasyPay} onClick={onMicTap} />
          </div>
          <div className="flex justify-center">
            <BottomNavItem
              icon={'\uD83D\uDD0B'}
              label={L.navRecharge}
              onClick={() => onQuickAction('pay_bill')}
            />
          </div>
          <div className="relative flex h-6 justify-center">
            <button
              type="button"
              onClick={() => onQuickAction('send_money')}
              className="press-bright absolute -top-[2.35rem] left-1/2 z-20 flex h-[3.75rem] w-[3.75rem] -translate-x-1/2 flex-col items-center justify-center rounded-full border-[3px] border-slate-100 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.42)]"
              aria-label={L.navScanQrAria}
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                className="text-slate-800"
                fill="currentColor"
                aria-hidden
              >
                <path d="M3 3h5v5H3V3zm7 0h2v2H10V3zm4 0h5v5h-5V3zM3 10h2v2H3v-2zm4 0h5v5H7v-5zm7 0h2v2h-2v-2zm4 0h5v5h-5v-5zM3 16h5v5H3v-5zm7 0h2v2h-2v-2zm4 0h2v2h-2v-2zm4 0h5v5h-5v-5zM14 10h2v2h-2v-2z" />
              </svg>
              <span className="mt-0.5 text-[6.5px] font-bold uppercase tracking-wide text-slate-500">
                QR
              </span>
            </button>
          </div>
          <div className="flex justify-center">
            <BottomNavItem
              icon={'\u2699'}
              label={L.navLimits}
              onClick={() => onQuickAction('check_balance')}
            />
          </div>
          <div className="flex justify-center">
            <BottomNavItem
              icon={'\uD83D\uDC65'}
              label={L.navPayee}
              onClick={() => onQuickAction('internal_transfer')}
            />
          </div>
        </div>
      </nav>

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

      {!homeAiOpen && (
        <button
          type="button"
          onClick={openAi}
          data-ai-fab
          className="press-bright absolute bottom-[5.75rem] right-3 z-30 flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-200/80 bg-white text-xl shadow-lg"
          aria-label="Open AI Assistant"
          title="AI Assistant"
        >
          <span className="translate-y-px">{'\uD83E\uDDD1\u200D\uD83D\uDCBC'}</span>
        </button>
      )}

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
        assistHint={
          navMode
            ? voiceCommandSessionActive
              ? 'Mic stays on after each command \u2014 just speak again in 2\u20133 seconds.'
              : 'Try: account statement, fund transfer, loan, deposit, UPI, hotel, flight, debit card, or credit card statement.'
            : undefined
        }
        assistTitle={navMode ? 'AI RM \u00B7 Voice Navigation' : 'AI Banking Assistant'}
        showReasoning
        lang={lang}
        dockClassName="bottom-[5.25rem]"
      />
    </div>
  );
}
