import React, { useRef, useEffect } from 'react';
import { KB } from '../../theme.js';

export default function ArmDigitInput({
  length,
  value,
  onChange,
  label,
  groups = null,
  error,
  hint = 'Tap the boxes above to open keyboard',
  highlightIndex = -1,
  readOnly = false,
  embedded = false,
}) {
  const refs = useRef([]);
  const digits = String(value || '')
    .padEnd(length, ' ')
    .slice(0, length)
    .split('')
    .map((c) => (c === ' ' ? '' : c));

  useEffect(() => {
    const firstEmpty = digits.findIndex((d) => !d);
    if (firstEmpty >= 0 && refs.current[firstEmpty]) {
      refs.current[firstEmpty]?.focus();
    }
  }, [value, length]);

  const handleChange = (idx, char) => {
    const d = char.replace(/\D/g, '').slice(-1);
    const arr = [...digits];
    arr[idx] = d;
    const next = arr.join('').replace(/\s/g, '');
    onChange(next);
    if (d && idx < length - 1) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const renderBox = (idx) => (
    <input
      key={idx}
      ref={(el) => {
        refs.current[idx] = el;
      }}
      type="tel"
      inputMode="numeric"
      maxLength={1}
      value={digits[idx]}
      readOnly={readOnly}
      onChange={(e) => handleChange(idx, e.target.value)}
      onKeyDown={(e) => handleKeyDown(idx, e)}
      className={`rounded-lg border-2 text-center font-semibold outline-none transition-all duration-150 ${
        embedded ? 'h-10 w-7 text-base' : 'h-11 w-8 text-lg sm:h-12 sm:w-9'
      } ${
        error
          ? 'border-kb-error'
          : highlightIndex === idx
            ? 'scale-105 border-kb-yellow bg-kb-yellow/15 ring-2 ring-kb-yellow/40'
            : digits[idx]
              ? 'border-kb-yellow bg-kb-yellow/10'
              : 'border-kb-border focus:border-kb-yellow'
      }`}
    />
  );

  const renderGrouped = () => {
    if (!groups) {
      return (
        <div className="flex flex-nowrap justify-center gap-1 overflow-x-auto no-scrollbar">
          {Array.from({ length }, (_, i) => renderBox(i))}
        </div>
      );
    }
    let idx = 0;
    return (
      <div className="flex flex-nowrap items-center justify-center gap-1 overflow-x-auto no-scrollbar">
        {groups.map((size, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <span className="mx-0.5 text-kb-muted">-</span>}
            {Array.from({ length: size }, () => {
              const i = idx++;
              return renderBox(i);
            })}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`rounded-xl border border-kb-border bg-white shadow-sm ${
        embedded ? 'w-full px-2 py-3' : 'mx-3 mb-2 px-3 py-4'
      }`}
    >
      {label && (
        <p className="mb-3 text-[10px] font-semibold tracking-wider text-kb-muted">{label}</p>
      )}
      {renderGrouped()}
      {error && <p className="mt-2 text-center text-[12px] text-kb-error">{error}</p>}
      <p className="mt-2 text-center text-[11px] text-kb-muted">{hint}</p>
    </div>
  );
}

export function ArmEmailInput({ value, onChange, onSubmit, error, label, embedded = false }) {
  return (
    <div
      className={`rounded-xl border border-kb-border bg-white shadow-sm ${
        embedded ? 'w-full px-2 py-3' : 'mx-3 mb-2 px-3 py-4'
      }`}
    >
      {label && (
        <p className="mb-2 text-[10px] font-semibold tracking-wider text-kb-muted">{label}</p>
      )}
      <div
        className={`flex items-center overflow-hidden rounded-xl border-2 px-3 ${
          error ? 'border-kb-error' : 'border-kb-border focus-within:border-kb-yellow'
        }`}
      >
        <span className="mr-1 text-kb-muted">@</span>
        <input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="your.email@gmail.com"
          className="min-w-0 flex-1 py-3.5 text-[14px] outline-none"
        />
      </div>
      {error && <p className="mt-2 text-[12px] text-kb-error">{error}</p>}
      <button
        type="button"
        onClick={onSubmit}
        className="mt-4 w-full rounded-xl py-3.5 text-[15px] font-bold text-kb-ink press"
        style={{ backgroundColor: KB.yellow }}
      >
        Send OTP
      </button>
    </div>
  );
}

export function ArmFriendForm({
  name,
  mobile,
  onNameChange,
  onMobileChange,
  onSubmit,
  error,
  label,
}) {
  return (
    <div className="mx-3 mb-2 rounded-xl border border-kb-border bg-white px-3 py-4 shadow-sm">
      {label && (
        <p className="mb-3 text-[10px] font-semibold tracking-wider text-kb-muted">{label}</p>
      )}
      <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-kb-muted">
        FRIEND&apos;S FULL NAME
      </p>
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="e.g. Rahul Sharma"
        className="mb-4 w-full rounded-xl border border-kb-border px-3 py-3.5 text-[14px] outline-none focus:border-kb-yellow"
      />
      <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-kb-muted">
        FRIEND&apos;S MOBILE NUMBER
      </p>
      <ArmDigitInput
        length={10}
        value={mobile}
        onChange={onMobileChange}
        groups={[5, 5]}
        error={error}
        hint="Must be different from your number and the family reference. Starts with 6–9."
      />
      <button
        type="button"
        onClick={onSubmit}
        className="mt-2 w-full rounded-xl py-3.5 text-[15px] font-bold text-kb-ink/70 press"
        style={{ backgroundColor: KB.yellowPale }}
      >
        Continue
      </button>
    </div>
  );
}
