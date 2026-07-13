import React from 'react';
import { OPTIMO, FONTS } from '../theme.js';

function CheckIcon({ valid }) {
  if (!valid) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#CBD5E1]">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill={OPTIMO.success} />
      <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Label({ children, required }) {
  return (
    <label
      className="mb-2 block"
      style={{
        fontFamily: FONTS.body,
        fontSize: 14,
        fontWeight: 600,
        color: OPTIMO.label,
      }}
    >
      {children}
      {required && <span style={{ color: '#E53E3E' }}>*</span>}
    </label>
  );
}

const inputBase =
  'w-full rounded-[10px] px-4 py-[12px] text-[15px] outline-none transition placeholder:text-[#9AA5B4]';

export function MobileField({ value, onChange, onBlur }) {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  const valid = digits.length === 10;

  return (
    <div>
      <Label required>Mobile Number</Label>
      <div
        className="flex overflow-hidden rounded-[10px] border bg-white focus-within:ring-2"
        style={{ borderColor: OPTIMO.border, '--tw-ring-color': `${OPTIMO.focus}33` }}
      >
        <span
          className="flex items-center border-r px-4 text-[15px] font-medium"
          style={{ borderColor: OPTIMO.borderLight, color: OPTIMO.navySoft, backgroundColor: '#FAFBFC' }}
        >
          +91
        </span>
        <input
          type="tel"
          inputMode="numeric"
          value={digits}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
          onBlur={onBlur}
          placeholder="e.g. 93678 XXXXX"
          className={`min-w-0 flex-1 ${inputBase}`}
          style={{ color: OPTIMO.navy, fontFamily: FONTS.body }}
        />
        <span className="flex items-center pr-3">
          <CheckIcon valid={valid} />
        </span>
      </div>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  required = true,
  prefilled = false,
  type = 'text',
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`${inputBase} border focus:ring-2`}
        style={{
          fontFamily: FONTS.body,
          color: OPTIMO.navy,
          borderColor: prefilled ? '#BFDBFE' : OPTIMO.border,
          backgroundColor: prefilled ? OPTIMO.prefilled : 'white',
          '--tw-ring-color': `${OPTIMO.focus}33`,
        }}
      />
    </div>
  );
}

export function NumberField({ label, value, onChange, onBlur, placeholder, required = true }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        min="0"
        className={`${inputBase} border focus:ring-2`}
        style={{
          fontFamily: FONTS.body,
          color: OPTIMO.navy,
          borderColor: OPTIMO.border,
          backgroundColor: 'white',
          '--tw-ring-color': `${OPTIMO.focus}33`,
        }}
      />
    </div>
  );
}
