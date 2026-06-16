import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import PhoneFrame from './components/PhoneFrame';
import HomeScreen from './components/HomeScreen';
import ImpsFundTransferScreen from './components/ImpsFundTransferScreen';
import FundTransferVoiceScreen from './components/FundTransferVoiceScreen';
import CreateDepositVoiceScreen from './components/CreateDepositVoiceScreen';
import LoanApplicationScreen from './components/LoanApplicationScreen';
import TransactionHistoryScreen from './components/TransactionHistoryScreen';
import CreateDepositScreen from './components/CreateDepositScreen';
import HotelBookingScreen from './components/HotelBookingScreen';
import FlightBookingScreen from './components/FlightBookingScreen';
import DebitCardDashboardScreen from './components/DebitCardDashboardScreen';
import CreditCardDashboardScreen from './components/CreditCardDashboardScreen';
import VoiceModal from './components/VoiceModal';
import ConfirmCard from './components/ConfirmCard';
import ResultCard from './components/ResultCard';
import DemoPanel from './components/DemoPanel';
import MpinSheet from './components/MpinSheet';
import RMHelpPrompt from './components/RMHelpPrompt.jsx';
import { useRageDetect } from './hooks/useRageDetect.js';
import { useSpeech } from './hooks/useSpeech';
import { useElevenSpeech } from './hooks/useElevenSpeech';
import { ELEVENLABS_STT_ENABLED } from './config/voiceBackend.js';
import {
  isTtsPlaying,
  onTtsPlayingChange,
  speakViaCartesia,
  stopGlobalCartesiaTts,
  waitUntilTtsIdle,
} from './lib/cartesiaTts.js';

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
} from './engine/simEngine.js';
import { LANGUAGES, DEFAULT_LANG } from './i18n/strings.js';
import { getAccounts, resetServerState } from './services/engineClient.js';
import { routeVoiceCommand } from './lib/voiceCommandRouter.js';

// Quick per-language "yes" matcher. Mirrors the patterns in
// server/engine/confirmParser.js so the client can intercept voice confirm and
// route it through the MPIN sheet. Kept intentionally minimal — the server
// remains the source of truth, this is just a UI-side gate.
const YES_PATTERNS = {
  en: /\b(yes|yeah|yep|yup|ok|okay|sure|confirm|do it|go ahead|pay|send)\b/i,
  hi: /(हाँ|हां|जी|कर दो|करो|भेज|ठीक|ओके|ok)/i,
  te: /(అవును|సరే|చేయి|పంపు|ఓకే|ok)/i,
  ta: /(ஆம்|சரி|ஓகே|ok|செய்|அனுப்பு)/i,
};
function looksLikeYes(text, lang) {
  const re = YES_PATTERNS[lang] || YES_PATTERNS.en;
  return re.test(String(text).trim());
}

// States in which the user is expected to speak/respond. Auto-mic re-arms
// after each bot reply when the session is in one of these states.
const VOICE_INPUT_STATES = new Set(['FILL', 'DISAMBIGUATE', 'CHOOSE', 'CONFIRM']);

export default function App() {
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
  const [ttsPlaying, setTtsPlaying] = useState(false);
  // When true, the AI RM is scoped to pure screen navigation (no conversation).
  // Toggled from the demo panel's Voice-to-Command mode. Kept fully separate
  // from the normal-mode conversational flows.
  const [voiceCommandMode, setVoiceCommandMode] = useState(false);

  const bcp47 = LANGUAGES.find((l) => l.code === lang)?.bcp47 || 'en-IN';
  const speech = useVoiceHook({ lang: bcp47 });
  // Dedicated, independent voice channel for the "Voice-to-Command" demo mode.
  // Kept separate from `speech` so navigation commands never interfere with the
  // conversational flow's hands-free mic.
  const cmdSpeech = useVoiceHook({ lang: bcp47 });

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

  const handleOpenWithAction = useCallback(
    async (actionName) => {
      setOpen(true);
      setForceFail(session, forceFail);
      if (actionName) {
        await startAction(session, actionName);
      } else {
        await reset(session);
      }
      refresh();
    },
    [session, forceFail, refresh],
  );

  const runUtterance = useCallback(
    async (text) => {
      if (!text) return;
      // Voice "yes" during CONFIRM must route through MPIN, not straight to the
      // backend. Voice "no" / cancel passes through normally so users can still
      // abort by speaking. (Production: replace with a server-side mpin_check
      // saga step + auth token.)
      if (session.state === 'CONFIRM' && looksLikeYes(text, lang)) {
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
    setOpen(true);
    if (speech.supported) {
      speech.start((finalText) => {
        if (!finalText) return;
        runUtterance(finalText);
      });
    }
    refresh();
  }, [speech, refresh, runUtterance]);

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
      setOpen(true);
      runUtterance(text);
    },
    [runUtterance],
  );

  // Close every open journey overlay + the conversational modal → back to Home.
  const goHome = useCallback(() => {
    speech.abort();
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
  }, [speech]);

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

  // Called by HomeScreen's AI assistant when navigate_to tool fires
  const handleNavigate = useCallback(
    async (destination, context, routingStatus) => {
      stopGlobalCartesiaTts();

      const statusLine = (routingStatus || defaultRoutingStatus(destination)).trim();
      if (statusLine) {
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
        setDepositPrimer(context || '');
        setDepositOpen(true);
      } else if (destination === 'transaction_history') {
        setTxnHistPrimer(context || '');
        setTxnHistOpen(true);
      } else if (destination === 'hotel_booking') {
        setHotelBookingOpen(true);
      } else if (destination === 'flight_booking') {
        setFlightBookingOpen(true);
      } else if (destination === 'debit_card') {
        setDebitCardSubFlow(context || null);
        setDebitCardOpen(true);
      } else if (destination === 'credit_card') {
        setCreditCardSubFlow(context || null);
        setCreditCardOpen(true);
      }
    },
    [ensureFresh, session, refresh],
  );

  // Voice-to-Command: map an utterance straight to a screen and navigate, with
  // no dialogue. Returns the match (or null) so the demo panel can show feedback.
  const handleVoiceCommand = useCallback(
    async (text) => {
      const match = routeVoiceCommand(text);
      if (!match) return { text, match: null };

      if (match.destination === 'home') {
        goHome();
        return { text, match };
      }

      // Leave whatever flow we're in before opening the requested screen.
      goHome();

      if (match.destination === 'fund_transfer') {
        stopGlobalCartesiaTts();
        const statusLine = (match.routingStatus || 'Opening fund transfer.').trim();
        if (statusLine) {
          await speakViaCartesia(statusLine);
          await waitUntilTtsIdle();
          await new Promise((r) => setTimeout(r, 350));
        }
        setFundTransferVoicePrimer(
          match.subFlow ||
            'Customer opened fund transfer via voice navigation. Ask whether the payee is within Indian Bank or another bank, then collect account or mobile details.',
        );
        setFundTransferVoiceOpen(true);
        return { text, match };
      }

      if (match.destination === 'create_deposit') {
        stopGlobalCartesiaTts();
        const statusLine = (match.routingStatus || 'Opening create deposit.').trim();
        if (statusLine) {
          await speakViaCartesia(statusLine);
          await waitUntilTtsIdle();
          await new Promise((r) => setTimeout(r, 350));
        }
        setDepositVoicePrimer(
          match.subFlow ||
            'Customer opened create deposit via voice navigation. Help them choose FD, MMD, or RD, then collect amount and tenure.',
        );
        setDepositVoiceOpen(true);
        return { text, match };
      }

      await handleNavigate(match.destination, match.subFlow || '', match.routingStatus);
      return { text, match };
    },
    [goHome, handleNavigate],
  );

  const handleVoiceCommandMic = useCallback(
    (onResult) => {
      if (!cmdSpeech.supported) return;
      if (cmdSpeech.listening) {
        cmdSpeech.stop();
        return;
      }
      cmdSpeech.start(async (finalText) => {
        if (!finalText) return;
        const result = await handleVoiceCommand(finalText);
        onResult?.(result);
      });
    },
    [cmdSpeech, handleVoiceCommand],
  );

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
      <PhoneFrame
        overlay={
          <>
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
                <LoanApplicationScreen
                  key="loan-los"
                  onClose={() => { setLoanLosOpen(false); setLoanPrimer(''); }}
                  lang={lang}
                  aiPrimer={loanPrimer}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {txnHistOpen && (
                <TransactionHistoryScreen
                  key="txn-history"
                  onClose={() => { setTxnHistOpen(false); setTxnHistPrimer(''); }}
                  onNavigate={async (dest, ctx, routingStatus) => {
                    setTxnHistOpen(false);
                    setTxnHistPrimer('');
                    await handleNavigate(dest, ctx, routingStatus);
                  }}
                  lang={lang}
                  aiPrimer={txnHistPrimer}
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
              liveTranscript={speech.transcript}
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
          onFundTransferImps={() => setImpsOpen(true)}
          onApplyNewLoan={() => setLoanLosOpen(true)}
          onOpenDeposit={() => setDepositOpen(true)}
          onOpenTxnHistory={() => setTxnHistOpen(true)}
          onNavigate={handleNavigate}
          navMode={voiceCommandMode}
          onVoiceCommand={handleVoiceCommand}
          accounts={accounts}
        />
      </PhoneFrame>

      <DemoPanel
        onSpeak={handleDemoSpeak}
        onForceFail={handleForceFail}
        forceFail={forceFail}
        onResetBalances={handleResetBalances}
        onChangeLang={handleChangeLang}
        onVoiceCommand={handleVoiceCommand}
        onVoiceCommandMic={handleVoiceCommandMic}
        voiceCommandSupported={cmdSpeech.supported}
        voiceCommandListening={cmdSpeech.listening}
        voiceCommandTranscript={cmdSpeech.transcript}
        voiceCommandMode={voiceCommandMode}
        onVoiceCommandModeChange={setVoiceCommandMode}
      />
    </div>
  );
}
