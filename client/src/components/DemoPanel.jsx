import React, { useEffect, useState } from 'react';
import { VOICE_COMMAND_EXAMPLES } from '../lib/voiceCommandRouter.js';

// Special tab keys for the two voice demo modes.
const VOICE_TO_COMMAND = 'Voice-to-Command';
const VOICE_ASSIST = 'Voice Assist';

// Categorised, scripted utterances designed to showcase every flow + edge case.
// Clicking a script "speaks" it into the engine. Lets you demo without typing.
//
// IMPORTANT — no contact / biller / city names are baked in here. Every script
// is intent-only or account-based, so the demoer must speak (or type) the
// recipient / biller / destination themselves at runtime. That keeps every
// entity-resolution test (name disambiguation, multi-VPA picker, biller
// lookup, city → airport mapping…) genuinely live and verifiable.
const SCRIPTS = {
  'UPI · intents': [
    { label: 'just say "pay"', text: 'pay' },
    { label: 'just say "send money"', text: 'send money' },
    { label: 'send 500 (no recipient)', text: 'send 500' },
    { label: 'pay 1000 (no recipient)', text: 'pay 1000' },
  ],
  'UPI · invalid amount': [
    // These are meant to be clicked while the engine is in FILL/CONFIRM state
    // asking for an amount — they validate the amount-parser without leaking
    // a contact name into the prompt.
    { label: 'amount: 0', text: '0' },
    { label: 'amount: -500', text: '-500' },
    { label: 'amount: 5 lakh (over limit)', text: '5 lakh' },
    { label: 'amount: "abc"', text: 'abc' },
    { label: 'amount: 99,99,999 (limit)', text: '9999999' },
  ],
  'Internal transfer': [
    {
      label: 'transfer 2000 from savings to current',
      text: 'transfer 2000 from savings to current',
    },
    { label: 'move 500 to wallet', text: 'move 500 from savings to wallet' },
    { label: 'transfer 1000 (no accounts)', text: 'transfer 1000' },
    { label: 'transfer 500 same account', text: 'transfer 500 from savings to savings' },
  ],
  'Bill payment': [
    { label: 'just say "pay bill"', text: 'pay bill' },
    { label: 'pay electricity bill (category)', text: 'pay electricity bill' },
    { label: 'pay water bill (category)', text: 'pay water bill' },
    { label: 'pay gas bill (category)', text: 'pay gas bill' },
    { label: 'just say "recharge"', text: 'recharge' },
  ],
  'Multi-lingual': [
    { label: 'हिंदी: 500 भेजो', text: '500 भेजो', lang: 'hi' },
    { label: 'हिंदी: bijli ka bill bharo', text: 'bijli ka bill bharo', lang: 'hi' },
    { label: 'తెలుగు: 500 పంపు', text: '500 పంపు', lang: 'te' },
    { label: 'தமிழ்: 500 அனுப்பு', text: '500 அனுப்பு', lang: 'ta' },
  ],
  'Flight booking (saga)': [
    { label: 'just say "book a flight"', text: 'book a flight' },
    { label: 'book flight tomorrow (no cities)', text: 'book flight tomorrow' },
    { label: 'flight one-way (no slots)', text: 'flight one way' },
  ],
  'Try-to-break': [
    { label: 'gibberish: asdfgh', text: 'asdfgh qwerty' },
    { label: 'cancel mid-flow', text: 'cancel' },
    { label: 'check my balance', text: 'what is my balance' },
    { label: 'just say "yes"', text: 'yes' },
    { label: 'just say "no"', text: 'no' },
  ],
};

const FAILURE_MODES = [
  { id: null, label: 'Normal' },
  { id: 'bank', label: 'Bank decline' },
  { id: 'network', label: 'Network error' },
];

export default function DemoPanel({
  onSpeak,
  onForceFail,
  forceFail,
  onResetBalances,
  onChangeLang,
  onVoiceCommand,
  onVoiceCommandMic,
  voiceCommandSupported = false,
  voiceCommandListening = false,
  voiceCommandTranscript = '',
  voiceCommandMode = false,
  onVoiceCommandModeChange,
  voiceCommandSessionActive = false,
  voiceCommandFeedback = null,
  onStopVoiceCommandSession,
  voiceAssistMode = false,
  onVoiceAssistModeChange,
}) {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState(VOICE_TO_COMMAND);
  const [cmdFeedback, setCmdFeedback] = useState(null);

  const feedback = voiceCommandFeedback ?? cmdFeedback;

  // Tab selection drives the two exclusive voice modes.
  useEffect(() => {
    onVoiceCommandModeChange?.(tab === VOICE_TO_COMMAND);
    onVoiceAssistModeChange?.(tab === VOICE_ASSIST);
  }, [tab, onVoiceCommandModeChange, onVoiceAssistModeChange]);

  const runCommand = async (text) => {
    if (!onVoiceCommand) return;
    const result = await onVoiceCommand(text);
    setCmdFeedback(result || { text, match: null });
  };

  const TAB_KEYS = [VOICE_TO_COMMAND, VOICE_ASSIST, ...Object.keys(SCRIPTS)];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-[60] px-3 py-2 rounded-full bg-ink text-white text-[11px] font-semibold shadow-lg"
      >
        Demo panel
      </button>
    );
  }

  return (
    <div
      className="fixed top-4 right-4 z-[60] w-[300px] max-h-[88vh] overflow-hidden flex flex-col bg-white rounded-2xl shadow-2xl border border-divider"
      style={{ boxShadow: '0 20px 60px rgba(15,22,96,0.25)' }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-divider bg-ink text-white">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider">Demo control</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onResetBalances}
            className="text-[10px] px-2 py-1 rounded-md bg-white/10 hover:bg-white/20"
            title="Reset accounts"
          >
            ↺
          </button>
          <button
            onClick={() => setOpen(false)}
            className="text-[14px] w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            ×
          </button>
        </div>
      </div>

      {/* Failure mode toggle */}
      <div className="px-3 py-2 border-b border-divider bg-page">
        <div className="text-[9px] uppercase tracking-wider text-muted font-semibold mb-1">
          Next execution
        </div>
        <div className="flex gap-1">
          {FAILURE_MODES.map((m) => (
            <button
              key={String(m.id)}
              onClick={() => onForceFail(m.id)}
              className={`flex-1 text-[10px] py-1.5 rounded-md font-semibold ${
                forceFail === m.id
                  ? 'bg-rose-500 text-white'
                  : m.id === null && forceFail === null
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white border border-divider text-muted'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 px-2 py-2 border-b border-divider bg-page">
        {TAB_KEYS.map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`text-[10px] px-2 py-1 rounded-md ${
              tab === k
                ? k === VOICE_TO_COMMAND
                  ? 'bg-emerald-600 text-white'
                  : k === VOICE_ASSIST
                    ? 'bg-violet-600 text-white'
                    : 'bg-brand text-white'
                : k === VOICE_TO_COMMAND
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-700 font-semibold'
                  : k === VOICE_ASSIST
                    ? 'bg-violet-50 border border-violet-300 text-violet-700 font-semibold'
                    : 'bg-white border border-divider text-muted'
            }`}
          >
            {k === VOICE_TO_COMMAND
              ? '🎙 Voice-to-Command'
              : k === VOICE_ASSIST
                ? '🤖 Voice Assist'
                : k}
          </button>
        ))}
      </div>

      {tab === VOICE_ASSIST ? (
        <VoiceAssistPanel modeActive={voiceAssistMode} />
      ) : tab === VOICE_TO_COMMAND ? (
        <VoiceCommandPanel
          supported={voiceCommandSupported}
          listening={voiceCommandListening}
          transcript={voiceCommandTranscript}
          feedback={feedback}
          modeActive={voiceCommandMode}
          sessionActive={voiceCommandSessionActive}
          onMic={onVoiceCommandMic}
          onStopSession={onStopVoiceCommandSession}
          onRunExample={runCommand}
        />
      ) : (
        <>
          <div className="overflow-y-auto px-2 py-2 flex flex-col gap-1.5 no-scrollbar">
            {(SCRIPTS[tab] || []).map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  if (s.lang) onChangeLang?.(s.lang);
                  onSpeak(s.text);
                }}
                className="press text-left px-3 py-2 rounded-lg bg-page hover:bg-slate-100 border border-divider/60"
              >
                <div className="text-[12px] font-semibold text-ink">{s.label}</div>
                <div className="text-[10px] text-muted font-mono mt-0.5 truncate">"{s.text}"</div>
              </button>
            ))}
          </div>

          <div className="px-3 py-1.5 border-t border-divider bg-page text-[9px] text-muted text-center">
            Click any script · Acts as user voice input
          </div>
        </>
      )}
    </div>
  );
}

function VoiceCommandPanel({
  supported,
  listening,
  transcript,
  feedback,
  modeActive,
  sessionActive,
  onMic,
  onStopSession,
  onRunExample,
}) {
  return (
    <div className="overflow-y-auto px-2 py-2 flex flex-col gap-2 no-scrollbar">
      {/* App-wide mode banner */}
      <div
        className={`px-2 py-1.5 rounded-lg text-[10px] border ${
          modeActive
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
            : 'bg-slate-50 border-divider text-muted'
        }`}
      >
        <span className="font-bold">{modeActive ? '● Mode active' : '○ Mode inactive'}</span>
        <span className="ml-1">
          {sessionActive
            ? 'Hands-free session on — mic re-opens ~2.5s after each command.'
            : 'Tap the bot (🧑‍💼) or Start session — mic stays on between commands.'}
        </span>
      </div>

      <div className="px-1">
        <div className="text-[11px] font-bold text-ink">Voice navigation</div>
        <div className="text-[9px] text-muted leading-snug mt-0.5">
          Open the bot (🧑‍💼) or rage-tap for help — speak once and keep giving commands without
          tapping the mic again. The mic detects when you start and stop speaking.
        </div>
      </div>

      {/* Session control */}
      <button
        onClick={sessionActive ? onStopSession : onMic}
        disabled={!supported}
        className={`press w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-[12px] ${
          !supported
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : sessionActive
              ? listening
                ? 'bg-emerald-600 text-white animate-pulse'
                : 'bg-amber-500 text-white'
              : 'bg-emerald-600 text-white'
        }`}
      >
        <span className="text-base">🎙</span>
        {!supported
          ? 'Mic not supported'
          : sessionActive
            ? listening
              ? 'Listening… tap to end session'
              : 'Session active — tap to end'
            : 'Start hands-free session'}
      </button>

      {/* Live transcript */}
      {sessionActive && (
        <div className="px-2 py-1.5 rounded-lg bg-page border border-divider/60 text-[10px] text-muted min-h-[1.75rem]">
          {listening
            ? transcript
              ? `"${transcript}"`
              : 'Listening…'
            : 'Waiting — speak your next command…'}
        </div>
      )}

      {/* Last result feedback */}
      {feedback && (
        <div
          className={`px-2 py-1.5 rounded-lg text-[10px] border ${
            feedback.match
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-amber-50 border-amber-300 text-amber-800'
          }`}
        >
          <div className="font-mono truncate">Heard: "{feedback.text}"</div>
          <div className="font-semibold mt-0.5">
            {feedback.match
              ? `→ Opening ${feedback.match.label}`
              : 'No matching screen — try another phrase'}
          </div>
        </div>
      )}

      <div className="text-[9px] uppercase tracking-wider text-muted font-semibold mt-1 px-1">
        Example commands
      </div>
      {VOICE_COMMAND_EXAMPLES.map((c, i) => (
        <button
          key={i}
          onClick={() => onRunExample(c.text)}
          className="press text-left px-3 py-2 rounded-lg bg-page hover:bg-emerald-50 border border-divider/60"
        >
          <div className="text-[12px] font-semibold text-ink">{c.label}</div>
          <div className="text-[10px] text-muted font-mono mt-0.5 truncate">"{c.text}"</div>
        </button>
      ))}

      <div className="border-t border-divider mt-1 pt-1.5 text-[9px] text-muted text-center">
        Example commands also work mid-session · End session via mic button or close the bot
      </div>
    </div>
  );
}

function VoiceAssistPanel({ modeActive }) {
  const steps = [
    { icon: '🗣️', text: 'Assistant speaks every question & response (TTS)' },
    { icon: '🎙', text: 'Mic auto-arms after the assistant finishes speaking' },
    { icon: '💬', text: 'Answer by speaking — hands-free conversation' },
    { icon: '🔢', text: 'Numbers read naturally: "one lakh" not "one zero zero zero zero zero"' },
  ];
  return (
    <div className="overflow-y-auto px-2 py-2 flex flex-col gap-2 no-scrollbar">
      <div
        className={`px-2 py-1.5 rounded-lg text-[10px] border ${
          modeActive
            ? 'bg-violet-50 border-violet-300 text-violet-800'
            : 'bg-slate-50 border-divider text-muted'
        }`}
      >
        <span className="font-bold">{modeActive ? '● Mode active' : '○ Mode inactive'}</span>
        <span className="ml-1">
          {modeActive
            ? 'Voice Assist is on — tap the bot (🧑‍💼) on Home, or open Loan / FD Deposit.'
            : 'Select this tab to enable Voice Assist mode.'}
        </span>
      </div>

      <div className="px-1">
        <div className="text-[11px] font-bold text-ink">Voice Assistance mode</div>
        <div className="text-[9px] text-muted leading-snug mt-0.5">
          Full hands-free conversation on Home, Loan Application, and Fixed Deposit. The assistant
          guides you step-by-step using voice — no typing needed.
        </div>
      </div>

      <div className="flex flex-col gap-1.5 px-1">
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-2 text-[10px] text-ink">
            <span className="shrink-0 text-sm">{s.icon}</span>
            <span className="leading-snug">{s.text}</span>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-violet-200 bg-violet-50 px-2 py-2 text-[9px] text-violet-800 leading-snug">
        <span className="font-bold">How to use:</span> Switch to this tab → tap the bot on Home (or
        open Loan / Term Deposit) → the assistant speaks, then the mic listens for your reply.
      </div>

      <div className="border-t border-divider pt-1.5 text-[9px] text-muted text-center">
        Switch to another tab to turn off Voice Assist mode
      </div>
    </div>
  );
}
