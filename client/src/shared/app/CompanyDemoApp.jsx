import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import CompanyShell from '../../shells/CompanyShell.jsx';
import { useCompany } from '../../context/CompanyContext.jsx';
import { resolveHomeScreen } from '../home/resolveHomeScreen.js';
import { resolveLoanScreen } from '../journeys/resolveLoanScreen.js';
import ImpsFundTransferScreen from '../../components/ImpsFundTransferScreen';
import FundTransferVoiceScreen from '../../components/FundTransferVoiceScreen';
import CreateDepositVoiceScreen from '../../components/CreateDepositVoiceScreen';
import TransactionHistoryScreen from '../../components/TransactionHistoryScreen';
import CreateDepositScreen from '../../components/CreateDepositScreen';
import HotelBookingScreen from '../../components/HotelBookingScreen';
import FlightBookingScreen from '../../components/FlightBookingScreen';
import DebitCardDashboardScreen from '../../components/DebitCardDashboardScreen';
import CreditCardDashboardScreen from '../../components/CreditCardDashboardScreen';
import VoiceModal from '../../components/VoiceModal';
import ConfirmCard from '../../components/ConfirmCard';
import ResultCard from '../../components/ResultCard';
import DemoPanel from '../../components/DemoPanel';
import MpinSheet from '../../components/MpinSheet';
import RMHelpPrompt from '../../components/RMHelpPrompt.jsx';
import { useRageDetect } from '../../hooks/useRageDetect.js';
import { useContinuousVoiceCommand } from '../../hooks/useContinuousVoiceCommand.js';
import { useLiveTranscript } from '../../hooks/useLiveTranscript.js';
import { useSpeech } from '../../hooks/useSpeech';
import { useElevenSpeech } from '../../hooks/useElevenSpeech';
import { ELEVENLABS_STT_ENABLED } from '../../config/voiceBackend.js';
import {
  isTtsPlaying,
  onTtsPlayingChange,
  speakViaCartesia,
  stopGlobalCartesiaTts,
  waitUntilTtsIdle,
  setTtsEnabled,
} from '../../lib/cartesiaTts.js';

/* ─── Voice-to-Command listening bar ──────────────────────────────────────── */
function VoiceCommandBar({ listening, liveTranscript, lastTranscript, onSend }) {
  const displayText = liveTranscript || (listening ? '' : lastTranscript) || '';
  return (
    <div className="absolute bottom-4 left-3 right-3 z-[90] pointer-events-auto">
      <div
        className="overflow-hidden rounded-2xl shadow-2xl ring-1"
        style={{
          background: 'linear-gradient(135deg, rgba(0,30,70,0.97) 0%, rgba(10,10,46,0.97) 100%)',
          ringColor: listening ? 'rgba(245,197,24,0.4)' : 'rgba(255,255,255,0.12)',
          border: listening ? '1px solid rgba(245,197,24,0.35)' : '1px solid rgba(255,255,255,0.12)',
        }}
      >
        {/* status bar */}
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm ${
              listening
                ? 'bg-bank-gold/20 text-bank-gold animate-pulse'
                : 'bg-emerald-600/20 text-emerald-400'
            }`}
          >
            {listening ? '🎙' : '✓'}
          </span>
          <span className="flex-1 min-w-0 text-[11px] font-semibold text-white/90">
            {listening ? 'Listening — speak your command' : 'Voice session active'}
          </span>
          {/* wave bars */}
          {listening && (
            <div className="flex shrink-0 items-end gap-[2px]" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="wave-bar"
                  style={{ animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* live transcript area */}
        <div className="min-h-[36px] px-3 py-1">
          {displayText ? (
            <p className="text-sm font-medium leading-snug text-white">
              {displayText}
            </p>
          ) : listening ? (
            <p className="text-[12px] italic text-white/35">Say something…</p>
          ) : (
            <p className="text-[12px] italic text-white/35">Waiting for next command…</p>
          )}
        </div>

        {/* action row */}
        <div className="flex items-center gap-2 px-3 pb-3 pt-1">
          <p className="flex-1 text-[10px] text-white/40">
            {listening ? 'AI will auto-send after silence · or tap Send' : 'Speak anytime to issue a command'}
          </p>
          {listening && (
            <button
              type="button"
              onClick={onSend}
              className="flex items-center gap-1.5 rounded-xl bg-bank-gold px-4 py-1.5 text-[12px] font-bold text-bank-purpleDeep shadow-md press"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M4 12L20 4l-3 16-5-7-8-1z" />
              </svg>
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function defaultRoutingStatus(destination) {
  if (destination === 'upi_payment') return 'Within UPI limit. Redirecting to UPI payment.';
  if (destination === 'fund_transfer') return 'Above UPI limit. Redirecting to fund transfer.';
  if (destination === 'loan_application') return 'Redirecting to loan application.';
  if (destination === 'create_deposit') return 'Redirecting to Create a Deposit.';
  if (destination === 'transaction_history') return 'Opening your account statement.';
  if (destination === 'hotel_booking') return 'Opening hotel booking.';
  if (destination === 'flight_booking') return 'Opening flight booking.';
  if (destination === 'debit_card') return 'Opening debit card dashboard.';
  if (destination === 'credit_card') return 'Opening credit card dashboard.';
  return '';
}

// Pick the STT backend at module load (env vars are baked in at build time
// so this is stable across renders — safe to use as the hook reference).
const useVoiceHook = ELEVENLABS_STT_ENABLED ? useElevenSpeech : useSpeech;
import {
  cancelSession,
  createSession,
  handleConfirmTap,
  handleSelection,
  handleUtterance,
  reset,
  setForceFail,
  setLang,
  startAction,
} from '../../engine/simEngine.js';
import { LANGUAGES, DEFAULT_LANG } from '../../i18n/strings.js';
import { getAccounts, resetServerState } from '../../services/engineClient.js';
import { routeVoiceCommand } from '../../lib/voiceCommandRouter.js';
import {
  formatPeriodLabel,
  parseDateRangeFromUtterance,
} from '../../lib/transactionDateFilter.js';

// Per-language "cancel/no" matcher — only these explicit negations bypass MPIN
// during CONFIRM.  Everything else (ambiguous, affirmative, or unrecognised)
// is treated as a tentative "yes" and routed through MPIN for safety.
const NO_PATTERNS = {
  en: /\b(no|nope|cancel|stop|abort|back|exit|quit|don'?t|not now)\b/i,
  hi: /(नहीं|नही|रुको|बंद|रद्द|वापस|नहीं करो)/i,
  te: /(వద్దు|ఆపు|రద్దు|వెనక్కు|వద్దు)/i,
  ta: /(வேண்டாம்|நிறுத்து|ரத்து|பின்னால்|வேண்டாம்)/i,
};
function looksLikeCancel(text, lang) {
  const re = NO_PATTERNS[lang] || NO_PATTERNS.en;
  return re.test(String(text).trim());
}

// States in which the user is expected to speak/respond. Auto-mic re-arms
// after each bot reply when the session is in one of these states.
const VOICE_INPUT_STATES = new Set(['FILL', 'DISAMBIGUATE', 'CHOOSE', 'CONFIRM']);

export default function CompanyDemoApp() {
  const company = useCompany();
  const HomeScreen = resolveHomeScreen(company);
  const LoanScreen = resolveLoanScreen(company);

  const [lang, setLangState] = useState(DEFAULT_LANG);
  const [session, setSession] = useState(() => createSession({ lang: DEFAULT_LANG }));
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);
  const [forceFail, setFF] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [mpinOpen, setMpinOpen] = useState(false);
  const [impsOpen, setImpsOpen] = useState(false);
  const [fundTransferVoiceOpen, setFundTransferVoiceOpen] = useState(false);
  const [fundTransferVoicePrimer, setFundTransferVoicePrimer] = useState('');
  const [depositVoiceOpen, setDepositVoiceOpen] = useState(false);
  const [depositVoicePrimer, setDepositVoicePrimer] = useState('');
  const [loanLosOpen, setLoanLosOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [txnHistOpen, setTxnHistOpen] = useState(false);
  const [hotelBookingOpen, setHotelBookingOpen] = useState(false);
  const [flightBookingOpen, setFlightBookingOpen] = useState(false);
  const [debitCardOpen, setDebitCardOpen] = useState(false);
  const [debitCardSubFlow, setDebitCardSubFlow] = useState(null);
  const [creditCardOpen, setCreditCardOpen] = useState(false);
  const [creditCardSubFlow, setCreditCardSubFlow] = useState(null);
  const [rmUpiPromptOpen, setRmUpiPromptOpen] = useState(false);
  const [impsPrimer, setImpsPrimer] = useState('');
  const [loanPrimer, setLoanPrimer] = useState('');
  const [depositPrimer, setDepositPrimer] = useState('');
  const [txnHistPrimer, setTxnHistPrimer] = useState('');
  const [txnHistDateFrom, setTxnHistDateFrom] = useState(null);
  const [txnHistDateTo, setTxnHistDateTo] = useState(null);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  // When true, the AI RM is scoped to pure screen navigation (no conversation).
  // Toggled from the demo panel's Voice-to-Command mode. Kept fully separate
  // from the normal-mode conversational flows.
  // Default on to match DemoPanel's Voice-to-Command tab — otherwise the first
  // bot tap can race the panel's mount effect and fail to arm the mic.
  const [voiceCommandMode, setVoiceCommandMode] = useState(true);
  const [voiceAssistMode, setVoiceAssistMode] = useState(false);
  const [voiceCmdFeedback, setVoiceCmdFeedback] = useState(null);
  const [upiLimitBanner, setUpiLimitBanner] = useState(null); // { amount, redirecting }
  const upiLimitTimerRef = useRef(null);

  // Voice-to-Command mode is navigation-only — no spoken audio anywhere,
  // on any screen it opens. TTS remains on for normal chat + Voice Assist mode.
  useEffect(() => {
    setTtsEnabled(!voiceCommandMode);
  }, [voiceCommandMode]);

  const bcp47 = LANGUAGES.find((l) => l.code === lang)?.bcp47 || 'en-IN';
  const speech = useVoiceHook({ lang: bcp47 });
  // Dedicated, independent voice channel for the "Voice-to-Command" demo mode.
  // Kept separate from `speech` so navigation commands never interfere with the
  // conversational flow's hands-free mic.
  const cmdSpeech = useVoiceHook({ lang: bcp47 });

  // Live transcript overlay — ONLY when ElevenLabs owns STT. Starting a second
  // Web Speech recogniser alongside `useSpeech` aborts the command mic in Chrome
  // (one SpeechRecognition at a time), which looked like "tap mic twice".
  const cmdLiveTranscriptEleven = useLiveTranscript({
    enabled: ELEVENLABS_STT_ENABLED && Boolean(cmdSpeech.listening),
    lang: bcp47,
  });
  const cmdLiveTranscript = ELEVENLABS_STT_ENABLED
    ? cmdLiveTranscriptEleven
    : (cmdSpeech.transcript || '');
  // Same for the UPI saga speech so VoiceModal can show interim text.
  const sagaLiveTranscriptEleven = useLiveTranscript({
    enabled: ELEVENLABS_STT_ENABLED && Boolean(speech.listening),
    lang: bcp47,
  });
  const sagaLiveTranscript = ELEVENLABS_STT_ENABLED
    ? sagaLiveTranscriptEleven
    : (speech.transcript || '');

  // Rage detection for UPI voice flow — fires only when the voice modal is already open
  // (HomeScreen has its own rage detection for the home AI assistant)
  const { containerProps: upiRageProps, dismiss: dismissUpiRage } = useRageDetect({
    onFrustrated: () => {
      if (open && !impsOpen && !loanLosOpen) setRmUpiPromptOpen(true);
    },
  });

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => onTtsPlayingChange(setTtsPlaying), []);

  // Never listen while the assistant is speaking — user must hear the full prompt first
  useEffect(() => {
    if (ttsPlaying && speech.listening) {
      try {
        speech.stop();
      } catch {
        /* ignore */
      }
    }
  }, [ttsPlaying, speech.listening, speech.stop]);

  // Pull live balances from the server. Called on mount and after any turn
  // that ends in DONE (a successful payment / transfer / bill / booking).
  const refreshAccounts = useCallback(async () => {
    try {
      const list = await getAccounts();
      setAccounts(list);
    } catch {
      // server not up yet — fall back to static mock in HomeScreen
    }
  }, []);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  // After mount, the server's INIT turn resolves — refresh once so greet appears.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await session._initPromise;
      } catch {}
      if (!cancelled) refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [session, refresh]);

  const ensureFresh = useCallback(async () => {
    if (['DONE', 'CANCELLED', 'FAILED'].includes(session.state)) {
      await reset(session);
    }
  }, [session]);

  // `continuousVoice` (created below) needs `handleVoiceCommandCore` as its
  // onCommand, but several handlers above it need to stop the hands-free loop
  // when navigating into a screen that owns its own mic — hence the ref-forward
  // to break the init cycle. Must be declared before any handler that calls it.
  const continuousVoiceStopRef = useRef(() => {});

  const stopHandsFreeForSoloVoiceScreen = useCallback(() => {
    continuousVoiceStopRef.current?.();
  }, []);

  const handleOpenWithAction = useCallback(
    async (actionName) => {
      stopHandsFreeForSoloVoiceScreen();
      setHomeAiCloseSignal((n) => n + 1);
      setOpen(true);
      setForceFail(session, forceFail);
      if (actionName) {
        await startAction(session, actionName);
      } else {
        await reset(session);
      }
      refresh();
    },
    [session, forceFail, refresh, stopHandsFreeForSoloVoiceScreen],
  );

  const runUtterance = useCallback(
    async (text) => {
      if (!text) return;
      // During CONFIRM, MPIN is required before the payment executes.
      // Only an explicit cancel/no passes directly to the engine (so the user
      // can abort by speaking). Any other input — including affirmatives,
      // ambiguous voice fragments, or unrecognised words — opens MPIN first.
      // This prevents the server from processing a bare "yes" (or any voice
      // mis-transcription) as a confirmation without the user ever seeing the
      // PIN sheet.
      if (session.state === 'CONFIRM') {
        if (looksLikeCancel(text, lang)) {
          // User explicitly said "no / cancel" — let the engine decline.
          speech.abort();
          await ensureFresh();
          const p = handleConfirmTap(session, false);
          refresh();
          await p;
          refresh();
          return;
        }
        // Everything else (yes, go ahead, proceed, ambiguous, silence-broken noise…)
        // must go through MPIN.
        speech.abort();
        setMpinOpen(true);
        return;
      }
      await ensureFresh();
      setForceFail(session, forceFail);
      const p = handleUtterance(session, text, { onThinking: () => refresh() });
      refresh();
      await p;
      refresh();
      if (session.state === 'DONE') refreshAccounts();
    },
    [ensureFresh, session, forceFail, refresh, refreshAccounts, lang, speech],
  );

  // Keep the latest runUtterance accessible from the auto-mic effect without
  // forcing the effect to re-subscribe on every session change (which would
  // restart the recogniser mid-listen).
  const runUtteranceRef = useRef(runUtterance);
  useEffect(() => {
    runUtteranceRef.current = runUtterance;
  }, [runUtterance]);

  // Hands-free: arm mic after bot finishes AND assistant TTS has finished speaking.
  useEffect(() => {
    if (!open) return;
    if (mpinOpen) return;
    if (!speech.supported) return;
    if (session?.thinking || session?.executing) return;
    if (!VOICE_INPUT_STATES.has(session?.state)) return;
    if (ttsPlaying || isTtsPlaying()) return;

    let cancelled = false;

    (async () => {
      await waitUntilTtsIdle();
      if (cancelled) return;
      // Brief pause so the user can process the last word before we open the mic
      await new Promise((r) => setTimeout(r, 500));
      if (cancelled || !open || mpinOpen || isTtsPlaying()) return;
      if (session?.thinking || session?.executing) return;

      try {
        speech.start((finalText) => {
          if (!finalText) return;
          runUtteranceRef.current?.(finalText);
        });
      } catch {
        /* recogniser torn down — ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    mpinOpen,
    ttsPlaying,
    session?.state,
    session?.history?.length,
    session?.thinking,
    session?.executing,
    speech.supported,
    speech.start,
    speech.stop,
  ]);

  const handleMicTap = useCallback(() => {
    stopHandsFreeForSoloVoiceScreen();
    setHomeAiCloseSignal((n) => n + 1);
    setOpen(true);
    if (speech.supported) {
      speech.start((finalText) => {
        if (!finalText) return;
        runUtterance(finalText);
      });
    }
    refresh();
  }, [speech, refresh, runUtterance, stopHandsFreeForSoloVoiceScreen]);

  const handleVoiceMicTap = useCallback(() => {
    if (!speech.supported) return;
    if (speech.listening) {
      speech.stop();
      return;
    }
    speech.start((finalText) => {
      if (!finalText) return;
      runUtterance(finalText);
    });
  }, [speech, runUtterance]);

  const handleSubmitText = useCallback(
    (text) => {
      if (!text) return;
      speech.abort();
      runUtterance(text);
    },
    [speech, runUtterance],
  );

  const handlePick = useCallback(
    async (id, kind) => {
      const p = handleSelection(session, id, kind);
      refresh();
      await p;
      refresh();
    },
    [session, refresh],
  );

  // Tapping "Confirm" no longer fires the transaction directly. It opens the
  // MPIN sheet; the actual confirmation happens once the PIN is verified.
  const handleConfirm = useCallback(() => {
    speech.abort();
    setMpinOpen(true);
  }, [speech]);

  const handleMpinSuccess = useCallback(async () => {
    setMpinOpen(false);
    const p = handleConfirmTap(session, true);
    refresh();
    await p;
    refresh();
    if (session.state === 'DONE') refreshAccounts();
  }, [session, refresh, refreshAccounts]);

  const handleMpinCancel = useCallback(() => {
    setMpinOpen(false);
    // Stay on the confirm screen — user can re-tap Confirm or Cancel.
  }, []);

  const handleDecline = useCallback(async () => {
    setMpinOpen(false);
    const p = handleConfirmTap(session, false);
    refresh();
    await p;
    refresh();
  }, [session, refresh]);

  const handleClose = useCallback(async () => {
    speech.abort();
    setOpen(false);
    if (!['DONE', 'CANCELLED', 'FAILED'].includes(session.state)) {
      await cancelSession(session);
    }
    refresh();
  }, [session, speech, refresh]);

  const handleDone = useCallback(async () => {
    speech.abort();
    await reset(session);
    setOpen(false);
    refresh();
  }, [session, speech, refresh]);

  const handleRetry = useCallback(() => {
    setForceFail(session, null);
    setFF(null);
    session.state = 'CONFIRM';
    refresh();
    // Re-confirmation also requires a fresh MPIN, same as a first-time confirm.
    setMpinOpen(true);
  }, [session, refresh]);

  const handleChangeLang = useCallback(
    async (newLang) => {
      if (newLang === lang) return;
      setLangState(newLang);
      speech.abort();
      await setLang(session, newLang);
      refresh();
    },
    [lang, session, speech, refresh],
  );

  const handleDemoSpeak = useCallback(
    (text) => {
      stopHandsFreeForSoloVoiceScreen();
      setHomeAiCloseSignal((n) => n + 1);
      setOpen(true);
      runUtterance(text);
    },
    [runUtterance, stopHandsFreeForSoloVoiceScreen],
  );

  // Bumped every time we leave the home screen for another journey. HomeScreen
  // watches this to force-close its own "Universal AI Assistant" panel — it
  // otherwise has no way to know a hands-free voice command (driven from here,
  // not from inside that panel) just navigated elsewhere, so it would stay
  // open and visually overlay the destination screen.
  const [homeAiCloseSignal, setHomeAiCloseSignal] = useState(0);

  // Close every open journey overlay + the conversational modal → back to Home.
  const goHome = useCallback(() => {
    speech.abort();
    setHomeAiCloseSignal((n) => n + 1);
    setOpen(false);
    setImpsOpen(false);
    setFundTransferVoiceOpen(false);
    setFundTransferVoicePrimer('');
    setDepositVoiceOpen(false);
    setDepositVoicePrimer('');
    setLoanLosOpen(false);
    setDepositOpen(false);
    setTxnHistOpen(false);
    setHotelBookingOpen(false);
    setFlightBookingOpen(false);
    setDebitCardOpen(false);
    setDebitCardSubFlow(null);
    setCreditCardOpen(false);
    setCreditCardSubFlow(null);
    setImpsPrimer('');
    setLoanPrimer('');
    setDepositPrimer('');
    setTxnHistPrimer('');
    setTxnHistDateFrom(null);
    setTxnHistDateTo(null);
  }, [speech]);

  const openTxnHistory = useCallback(({ primer = '', dateFrom = null, dateTo = null } = {}) => {
    setTxnHistPrimer(primer);
    setTxnHistDateFrom(dateFrom);
    setTxnHistDateTo(dateTo);
    setTxnHistOpen(true);
  }, []);

  const handleForceFail = useCallback(
    (mode) => {
      setFF(mode);
      setForceFail(session, mode);
    },
    [session],
  );

  const handleResetBalances = useCallback(async () => {
    try {
      await resetServerState();
    } catch {}
    await reset(session);
    await refreshAccounts();
    setOpen(false);
    refresh();
  }, [session, refresh, refreshAccounts]);

  // Called by HomeScreen's AI assistant when navigate_to tool fires.
  // Pass { silent: true } when called from voice-to-command mode so TTS is skipped.
  const handleNavigate = useCallback(
    async (destination, context, routingStatus, { silent = false } = {}) => {
      stopGlobalCartesiaTts();

      // Intercept over-limit UPI amounts BEFORE speaking anything — context
      // may carry the original utterance (LLM is asked to always restate the
      // amount as digits). Shows a banner and redirects to Fund Transfer
      // instead of announcing "Opening UPI payment" first.
      if (destination === 'upi_payment') {
        const UPI_LIMIT = 100000;
        const mentionedAmount = context ? parseAmountFromUtterance(context) : null;
        if (mentionedAmount !== null && mentionedAmount > UPI_LIMIT) {
          clearTimeout(upiLimitTimerRef.current);
          setUpiLimitBanner({ amount: mentionedAmount, redirecting: true });
          upiLimitTimerRef.current = setTimeout(() => {
            setUpiLimitBanner(null);
            setImpsPrimer(
              `Customer wanted to send ₹${mentionedAmount.toLocaleString('en-IN')} but was redirected from UPI (limit ₹1,00,000) to Fund Transfer. Reuse the amount and any recipient already mentioned.`,
            );
            setImpsOpen(true);
          }, 3000);
          return;
        }
      }

      const statusLine = (routingStatus || defaultRoutingStatus(destination)).trim();
      if (statusLine && !silent) {
        await speakViaCartesia(statusLine);
        await waitUntilTtsIdle();
        await new Promise((r) => setTimeout(r, 350));
      }

      if (destination === 'upi_payment') {
        setOpen(true);
        await ensureFresh();
        await startAction(session, 'send_money');
        refresh();
      } else if (destination === 'fund_transfer') {
        setImpsPrimer(context || '');
        setImpsOpen(true);
      } else if (destination === 'loan_application') {
        setLoanPrimer(context || '');
        setLoanLosOpen(true);
      } else if (destination === 'create_deposit') {
        // Always land on the Term Deposit menu and force FD vs RD choice first.
        // Do not forward utterance product hints (e.g. "fixed deposit") — that made the
        // deposit agent skip the menu and jump straight into one form.
        const amountHint = String(context || '').match(/₹\s*([\d]+)/)?.[1];
        const tenureHint = String(context || '').match(
          /(\d+)\s*(year|years|yr|yrs|month|months|mo)\b/i,
        );
        let depositPrimerText =
          'Customer opened the DCB Term Deposit menu via Voice Assist. There are two products on screen: DCB Fixed Deposit and DCB Pragati Recurring Deposit. You MUST ask which one they want before calling set_field(depositType). Do not assume Fixed Deposit even if they said "fixed deposit" earlier — wait for their choice from the on-screen menu. After they choose, help fill the deposit form step by step.';
        if (amountHint || tenureHint) {
          depositPrimerText += ' After product selection, reuse any amount/tenure already mentioned instead of re-asking.';
          if (amountHint) depositPrimerText += ` Amount mentioned: ₹${amountHint}.`;
          if (tenureHint) depositPrimerText += ` Tenure mentioned: ${tenureHint[0]}.`;
        }
        setDepositPrimer(depositPrimerText);
        setDepositOpen(true);
      } else if (destination === 'transaction_history') {
        openTxnHistory({ primer: context || '', dateFrom: null, dateTo: null });
      } else if (destination === 'hotel_booking') {
        setHotelBookingOpen(true);
      } else if (destination === 'flight_booking') {
        setFlightBookingOpen(true);
      } else if (destination === 'debit_card') {
        setDebitCardSubFlow(context || null);
        setDebitCardOpen(true);
      } else if (destination === 'credit_card') {
        const ctx = String(context || '').toLowerCase();
        let subFlow = null;
        if (ctx.includes('change_pin') || /\b(change|reset|update)\b.*\bpin\b/.test(ctx) || /\bpin\b.*\b(change|reset|update)\b/.test(ctx)) {
          subFlow = 'change_pin';
        } else if (ctx.includes('card_statement') || ctx.includes('statement')) {
          subFlow = 'card_statement';
        } else if (context === 'change_pin' || context === 'card_statement') {
          subFlow = context;
        }
        setCreditCardSubFlow(subFlow);
        setCreditCardOpen(true);
      }
    },
    [ensureFresh, session, refresh, openTxnHistory],
  );

  // Word-number vocabulary — STT engines sometimes transcribe spoken numbers
  // as words ("two lakh") rather than digits ("2 lakh"), so we need both.
  const _NUM_WORDS = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
    sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
    twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  };
  const _NUM_WORD_PATTERN = Object.keys(_NUM_WORDS).concat('hundred').join('|');

  function wordsToNumber(str) {
    const words = str.trim().toLowerCase().split(/[\s-]+/).filter(Boolean);
    if (!words.length) return null;
    let total = 0;
    let current = 0;
    for (const w of words) {
      if (w === 'hundred') {
        current = (current || 1) * 100;
      } else if (w in _NUM_WORDS) {
        current += _NUM_WORDS[w];
      } else {
        return null;
      }
    }
    total += current;
    return total || null;
  }

  // Extract a numeric rupee amount from a natural-language utterance.
  // Understands digits ("50000", "1,00,000", "1 lakh", "2.5 lakh") AND
  // spoken word-numbers ("two lakh", "fifty thousand") since STT output varies.
  function parseAmountFromUtterance(text) {
    const t = text.toLowerCase();
    const wordUnit = `(?:${_NUM_WORD_PATTERN})(?:[\\s-]+(?:${_NUM_WORD_PATTERN}))*`;

    // "X lakh" / "X.Y lakh" (digits) — checked first as it's unambiguous
    const lakhDigit = t.match(/(\d+(?:\.\d+)?)\s*lakh/);
    if (lakhDigit) return Math.round(parseFloat(lakhDigit[1]) * 100000);
    // "two lakh" / "twenty five lakh" (words)
    const lakhWord = t.match(new RegExp(`\\b(${wordUnit})\\s*lakh`));
    if (lakhWord) {
      const n = wordsToNumber(lakhWord[1]);
      if (n) return Math.round(n * 100000);
    }

    // "X crore" (digits) / word form
    const croreDigit = t.match(/(\d+(?:\.\d+)?)\s*crore/);
    if (croreDigit) return Math.round(parseFloat(croreDigit[1]) * 10000000);
    const croreWord = t.match(new RegExp(`\\b(${wordUnit})\\s*crore`));
    if (croreWord) {
      const n = wordsToNumber(croreWord[1]);
      if (n) return Math.round(n * 10000000);
    }

    // "X thousand" (digits) / word form
    const thousandDigit = t.match(/(\d+(?:\.\d+)?)\s*thousand/);
    if (thousandDigit) return Math.round(parseFloat(thousandDigit[1]) * 1000);
    const thousandWord = t.match(new RegExp(`\\b(${wordUnit})\\s*thousand`));
    if (thousandWord) {
      const n = wordsToNumber(thousandWord[1]);
      if (n) return Math.round(n * 1000);
    }

    // plain digits possibly with commas/spaces: "1,00,000" or "100000"
    const numMatch = t.match(/\b(\d[\d,\s]{2,}|\d{5,})\b/);
    if (numMatch) {
      const n = parseInt(numMatch[1].replace(/[,\s]/g, ''), 10);
      if (!isNaN(n)) return n;
    }
    return null;
  }

  // Voice-to-Command: map an utterance straight to a screen and navigate, with
  // no dialogue. Returns the match (or null) so the demo panel can show feedback.
  const handleVoiceCommandCore = useCallback(
    async (text) => {
      const match = routeVoiceCommand(text);
      const range = parseDateRangeFromUtterance(text);

      // Already on account statement — apply date filter in place (demo mic or assistant).
      if (txnHistOpen && range?.dateFrom && range?.dateTo) {
        stopGlobalCartesiaTts();
        setTxnHistDateFrom(range.dateFrom);
        setTxnHistDateTo(range.dateTo);
        const period = formatPeriodLabel(range.dateFrom, range.dateTo);
        const statusLine = `Showing transactions for ${period}.`;
        return {
          text,
          match: match || {
            destination: 'transaction_history',
            label: `Transaction history (${period})`,
            routingStatus: statusLine,
            dateFrom: range.dateFrom,
            dateTo: range.dateTo,
          },
        };
      }

      if (!match) {
        return { text, match: null };
      }

      if (match.destination === 'home') {
        stopGlobalCartesiaTts();
        goHome();
        return { text, match };
      }

      // Close other journeys, but do NOT wipe the destination we're about to open.
      // (goHome() used to setTxnHistOpen(false) and race with openTxnHistory.)
      stopGlobalCartesiaTts();
      setHomeAiCloseSignal((n) => n + 1);
      setOpen(false);
      setImpsOpen(false);
      setFundTransferVoiceOpen(false);
      setFundTransferVoicePrimer('');
      setDepositVoiceOpen(false);
      setDepositVoicePrimer('');
      setLoanLosOpen(false);
      setDepositOpen(false);
      setHotelBookingOpen(false);
      setFlightBookingOpen(false);
      setDebitCardOpen(false);
      setDebitCardSubFlow(null);
      setCreditCardOpen(false);
      setCreditCardSubFlow(null);
      setImpsPrimer('');
      setLoanPrimer('');
      setDepositPrimer('');
      if (match.destination !== 'transaction_history') {
        setTxnHistOpen(false);
        setTxnHistPrimer('');
        setTxnHistDateFrom(null);
        setTxnHistDateTo(null);
      }

      if (match.destination === 'fund_transfer') {
        stopHandsFreeForSoloVoiceScreen();
        setFundTransferVoicePrimer(
          match.subFlow ||
            `Customer opened fund transfer via voice navigation, saying: "${text}". Reuse any amount, payee, account, or bank details already mentioned instead of asking again — only ask for what's still missing (e.g. whether the payee is within Indian Bank or another bank, then account/mobile details).`,
        );
        setFundTransferVoiceOpen(true);
        return { text, match };
      }

      if (match.destination === 'create_deposit') {
        stopHandsFreeForSoloVoiceScreen();
        setDepositVoicePrimer(
          match.subFlow ||
            `Customer opened create deposit via voice navigation, saying: "${text}". Reuse any deposit type, amount, or tenure already mentioned instead of asking again — only ask for what's still missing.`,
        );
        setDepositVoiceOpen(true);
        return { text, match };
      }

      if (match.destination === 'upi_payment') {
        // If the utterance mentions an amount over the UPI limit (₹1 lakh),
        // show an inline banner and redirect to Fund Transfer instead.
        const UPI_LIMIT = 100000;
        const mentionedAmount = parseAmountFromUtterance(text);
        if (mentionedAmount !== null && mentionedAmount > UPI_LIMIT) {
          stopHandsFreeForSoloVoiceScreen();
          clearTimeout(upiLimitTimerRef.current);
          setUpiLimitBanner({ amount: mentionedAmount, redirecting: true });
          upiLimitTimerRef.current = setTimeout(() => {
            setUpiLimitBanner(null);
            setFundTransferVoicePrimer(
              `Customer wanted to send ₹${mentionedAmount.toLocaleString('en-IN')} but was redirected from UPI (limit ₹1,00,000) to Fund Transfer. Reuse the amount and any recipient already mentioned.`,
            );
            setFundTransferVoiceOpen(true);
          }, 3000);
          return { text, match: { ...match, destination: 'fund_transfer', label: 'Fund Transfer (UPI limit exceeded)' } };
        }

        stopHandsFreeForSoloVoiceScreen();
        setOpen(true);
        await ensureFresh();
        await startAction(session, 'send_money');
        const hasPaymentDetails = /\d/.test(text) || /\bto\s+\w+/i.test(text);
        if (hasPaymentDetails) {
          await handleUtterance(session, text);
        }
        refresh();
        return { text, match };
      }

      if (match.destination === 'transaction_history') {
        openTxnHistory({
          dateFrom: match.dateFrom || null,
          dateTo: match.dateTo || null,
        });
        return { text, match };
      }

      // Every remaining destination (loan application, hotel/flight booking,
      // debit/credit card) opens its own screen — hand off the mic to it (if
      // it has one) and stop the hands-free navigation loop.
      stopHandsFreeForSoloVoiceScreen();
      await handleNavigate(match.destination, match.subFlow || '', match.routingStatus, { silent: true });
      return { text, match };
    },
    [
      handleNavigate,
      openTxnHistory,
      txnHistOpen,
      stopHandsFreeForSoloVoiceScreen,
      ensureFresh,
      session,
      refresh,
      goHome,
    ],
  );

  // When the UPI VoiceModal is in an active conversation state (collecting
  // recipient / amount / confirmation) the modal owns the mic via its own
  // `speech` hook.  We must pause the voice-to-command loop so `cmdSpeech`
  // doesn't simultaneously record and swallow the user's answers — including
  // the "yes" that should route through MPIN before executing a payment.
  const upiModalOwningMic = open && VOICE_INPUT_STATES.has(session?.state);

  const continuousVoice = useContinuousVoiceCommand({
    enabled: voiceCommandMode && !upiModalOwningMic,
    speech: cmdSpeech,
    onCommand: handleVoiceCommandCore,
    onResult: setVoiceCmdFeedback,
  });

  useEffect(() => {
    continuousVoiceStopRef.current = continuousVoice.stop;
  }, [continuousVoice.stop]);

  // Leaving Voice-to-Command must end the hands-free listen loop.
  useEffect(() => {
    if (!voiceCommandMode) continuousVoiceStopRef.current?.();
  }, [voiceCommandMode]);

  const handleVoiceCommand = continuousVoice.runCommand;

  const startVoiceCommandSession = useCallback(() => {
    if (!voiceCommandMode) return;
    stopGlobalCartesiaTts();
    // Must stay sync — called from bot FAB click (user gesture for Web Speech).
    continuousVoice.start();
  }, [continuousVoice, voiceCommandMode]);

  const handleVoiceCommandMic = useCallback(() => {
    if (continuousVoice.active) {
      continuousVoice.stop();
      return;
    }
    startVoiceCommandSession();
  }, [continuousVoice, startVoiceCommandSession]);

  const inlineExtra = (
    <>
      {session.state === 'CONFIRM' && (
        <ConfirmCard
          session={session}
          onConfirm={handleConfirm}
          onCancel={handleDecline}
          lang={lang}
        />
      )}
      {(session.state === 'DONE' ||
        session.state === 'FAILED' ||
        session.state === 'CANCELLED') && (
        <ResultCard session={session} onDone={handleDone} onRetry={handleRetry} lang={lang} />
      )}
    </>
  );

  return (
    <div {...upiRageProps} className="contents">
      <CompanyShell
        overlay={
          <>
            {/* VoiceCommandBar only on non-home screens — the home screen's
                LoanAguiPanel handles voice feedback when the user is there. */}
            {voiceCommandMode && continuousVoice.active &&
              (open || impsOpen || loanLosOpen || depositOpen || txnHistOpen ||
               hotelBookingOpen || flightBookingOpen || debitCardOpen || creditCardOpen) && (
              <VoiceCommandBar
                listening={continuousVoice.listening}
                liveTranscript={cmdLiveTranscript}
                lastTranscript={continuousVoice.transcript}
                onSend={() => { try { cmdSpeech.stop(); } catch { /* ignore */ } }}
              />
            )}
            <RMHelpPrompt
              open={rmUpiPromptOpen}
              onHelp={() => {
                setRmUpiPromptOpen(false);
                dismissUpiRage();
                setOpen(true);
              }}
              onDismiss={() => {
                setRmUpiPromptOpen(false);
                dismissUpiRage();
              }}
            />
            <AnimatePresence>
              {depositVoiceOpen && (
                <CreateDepositVoiceScreen
                  key="deposit-voice"
                  onClose={() => {
                    setDepositVoiceOpen(false);
                    setDepositVoicePrimer('');
                  }}
                  lang={lang}
                  aiPrimer={depositVoicePrimer}
                  voiceAssist={voiceAssistMode}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {fundTransferVoiceOpen && (
                <FundTransferVoiceScreen
                  key="fund-transfer-voice"
                  onClose={() => {
                    setFundTransferVoiceOpen(false);
                    setFundTransferVoicePrimer('');
                  }}
                  lang={lang}
                  aiPrimer={fundTransferVoicePrimer}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {impsOpen && (
                <ImpsFundTransferScreen
                  key="imps-fund"
                  onClose={() => { setImpsOpen(false); setImpsPrimer(''); }}
                  lang={lang}
                  accounts={accounts}
                  aiPrimer={impsPrimer}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {loanLosOpen && (
                <LoanScreen
                  key="loan-los"
                  onClose={() => { setLoanLosOpen(false); setLoanPrimer(''); }}
                  lang={lang}
                  aiPrimer={loanPrimer}
                  voiceAssist={voiceAssistMode}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {txnHistOpen && (
                <TransactionHistoryScreen
                  key="txn-history"
                  onClose={() => {
                    setTxnHistOpen(false);
                    setTxnHistPrimer('');
                    setTxnHistDateFrom(null);
                    setTxnHistDateTo(null);
                  }}
                  onNavigate={async (dest, ctx, routingStatus) => {
                    setTxnHistOpen(false);
                    setTxnHistPrimer('');
                    setTxnHistDateFrom(null);
                    setTxnHistDateTo(null);
                    await handleNavigate(dest, ctx, routingStatus);
                  }}
                  onDateRangeChange={(from, to) => {
                    setTxnHistDateFrom(from || null);
                    setTxnHistDateTo(to || null);
                  }}
                  lang={lang}
                  aiPrimer={txnHistPrimer}
                  initialDateFrom={txnHistDateFrom}
                  initialDateTo={txnHistDateTo}
                  voiceCommandMode={voiceCommandMode}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {depositOpen && (
                <CreateDepositScreen
                  key="create-deposit"
                  onClose={() => { setDepositOpen(false); setDepositPrimer(''); }}
                  onNavigate={async (dest, ctx, routingStatus) => {
                    setDepositOpen(false);
                    await handleNavigate(dest, ctx, routingStatus);
                  }}
                  lang={lang}
                  aiPrimer={depositPrimer}
                  voiceAssist={voiceAssistMode}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {hotelBookingOpen && (
                <HotelBookingScreen
                  key="hotel-booking"
                  onClose={() => setHotelBookingOpen(false)}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {flightBookingOpen && (
                <FlightBookingScreen
                  key="flight-booking"
                  onClose={() => setFlightBookingOpen(false)}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {debitCardOpen && (
                <DebitCardDashboardScreen
                  key="debit-card"
                  initialSubFlow={debitCardSubFlow}
                  onClose={() => {
                    setDebitCardOpen(false);
                    setDebitCardSubFlow(null);
                  }}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {creditCardOpen && (
                <CreditCardDashboardScreen
                  key={`credit-card-${creditCardSubFlow || 'default'}`}
                  initialSubFlow={creditCardSubFlow}
                  onClose={() => {
                    setCreditCardOpen(false);
                    setCreditCardSubFlow(null);
                  }}
                />
              )}
            </AnimatePresence>
            <VoiceModal
              open={open}
              session={session}
              isListening={speech.listening}
              liveTranscript={sagaLiveTranscript || speech.transcript}
              onSendVoice={() => { try { speech.stop(); } catch { /* ignore */ } }}
              speechSupported={speech.supported}
              onClose={handleClose}
              onSubmitText={handleSubmitText}
              onMicTap={handleVoiceMicTap}
              onPick={handlePick}
              lang={lang}
              onChangeLang={handleChangeLang}
              inlineExtra={inlineExtra}
            />
            <MpinSheet
              open={mpinOpen}
              lang={lang}
              onCancel={handleMpinCancel}
              onSuccess={handleMpinSuccess}
            />
          </>
        }
      >
        <HomeScreen
          lang={lang}
          onMicTap={handleMicTap}
          onQuickAction={handleOpenWithAction}
          onFundTransferImps={() => {
            stopHandsFreeForSoloVoiceScreen();
            setHomeAiCloseSignal((n) => n + 1);
            setImpsOpen(true);
          }}
          onApplyNewLoan={() => {
            stopHandsFreeForSoloVoiceScreen();
            setHomeAiCloseSignal((n) => n + 1);
            setLoanLosOpen(true);
          }}
          onOpenDeposit={() => {
            stopHandsFreeForSoloVoiceScreen();
            setHomeAiCloseSignal((n) => n + 1);
            setDepositOpen(true);
          }}
          onOpenTxnHistory={() => {
            setHomeAiCloseSignal((n) => n + 1);
            openTxnHistory();
          }}
          onNavigate={handleNavigate}
          navMode={voiceCommandMode}
          voiceAssistMode={voiceAssistMode}
          onVoiceCommand={handleVoiceCommand}
          voiceCommandSessionActive={continuousVoice.active}
          voiceCommandListening={continuousVoice.listening}
          voiceCommandTranscript={continuousVoice.transcript}
          voiceCommandLiveTranscript={cmdLiveTranscript}
          onStartVoiceCommandSession={startVoiceCommandSession}
          onStopVoiceCommandSession={continuousVoice.stop}
          aiPanelCloseSignal={homeAiCloseSignal}
          accounts={accounts}
        />
      </CompanyShell>

      <DemoPanel
        onSpeak={handleDemoSpeak}
        onForceFail={handleForceFail}
        forceFail={forceFail}
        onResetBalances={handleResetBalances}
        onChangeLang={handleChangeLang}
        onVoiceCommand={handleVoiceCommand}
        onVoiceCommandMic={handleVoiceCommandMic}
        voiceCommandSupported={continuousVoice.supported}
        voiceCommandListening={continuousVoice.listening}
        voiceCommandTranscript={continuousVoice.transcript}
        voiceCommandMode={voiceCommandMode}
        voiceCommandSessionActive={continuousVoice.active}
        voiceCommandFeedback={voiceCmdFeedback}
        onVoiceCommandModeChange={setVoiceCommandMode}
        onStopVoiceCommandSession={continuousVoice.stop}
        voiceAssistMode={voiceAssistMode}
        onVoiceAssistModeChange={setVoiceAssistMode}
      />

      {/* UPI limit exceeded banner */}
      {upiLimitBanner && (
        <div className="fixed inset-x-0 bottom-24 z-[90] flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-amber-500 px-4 py-3 flex items-start gap-3">
              <span className="text-2xl shrink-0">⚠️</span>
              <div>
                <p className="text-[13px] font-bold text-white leading-snug">
                  UPI limit is ₹1,00,000
                </p>
                <p className="text-[11px] text-amber-100 mt-0.5 leading-snug">
                  ₹{upiLimitBanner.amount.toLocaleString('en-IN')} exceeds the UPI per-transaction limit.
                </p>
              </div>
            </div>
            {upiLimitBanner.redirecting && (
              <div className="bg-white px-4 py-2.5 flex items-center gap-2">
                <span className="flex gap-[3px]">
                  {[0,1,2].map(i => (
                    <span key={i} className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </span>
                <p className="text-[12px] font-semibold text-ink">
                  Redirecting you to Fund Transfer…
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
