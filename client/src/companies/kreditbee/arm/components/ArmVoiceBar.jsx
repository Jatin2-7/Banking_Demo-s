import React from 'react';
import { KB } from '../../theme.js';

export default function ArmVoiceBar({
  textInput,
  onTextChange,
  onSend,
  onMicTap,
  listening,
  voiceHint,
  showTextInput = true,
  disabled = false,
}) {
  return (
    <div className="shrink-0 border-t border-kb-border bg-[#FAFAFA] px-3 pb-4 pt-3">
      {showTextInput && (
        <input
          type="text"
          value={textInput}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSend()}
          placeholder="Type your message..."
          disabled={disabled}
          className="mb-2 w-full rounded-xl border border-kb-border bg-white px-4 py-3 text-[14px] outline-none focus:border-kb-yellow disabled:opacity-50"
        />
      )}
      <p className="mb-3 text-center text-[11px] text-kb-muted">
        {listening ? 'Tap Stop when finished' : voiceHint || 'Tap mic to speak naturally'}
      </p>
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onMicTap}
          disabled={disabled}
          className={`relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full press transition disabled:opacity-50 ${
            listening ? 'bg-red-500 ring-4 ring-red-200' : ''
          }`}
          style={listening ? undefined : { backgroundColor: KB.yellow, boxShadow: `0 0 0 4px ${KB.yellowRing}` }}
          aria-label={listening ? 'Stop listening' : 'Start voice input'}
        >
          {listening ? (
            <span className="block h-5 w-5 rounded-sm bg-white" />
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#1A1A1A">
              <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !textInput?.trim()}
          className="flex h-11 w-11 items-center justify-center rounded-full press disabled:opacity-40"
          style={{ backgroundColor: KB.yellowPale }}
          aria-label="Send message"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function ArmListeningOverlay({ visible }) {
  if (!visible) return null;
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 rounded-t-2xl border-t border-kb-border bg-white/95 px-4 pb-6 pt-4 shadow-2xl backdrop-blur-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
        <span className="text-[11px] font-bold tracking-wider text-red-500">LISTENING...</span>
      </div>
      <p className="text-[16px] font-bold text-kb-ink">Listening...</p>
    </div>
  );
}
