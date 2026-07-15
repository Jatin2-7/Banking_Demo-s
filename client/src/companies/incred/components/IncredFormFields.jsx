import React from 'react';
import { INCRED } from '../theme.js';

function HelpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={INCRED.muted} strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.5 9a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4M12 17h.01" strokeLinecap="round" />
    </svg>
  );
}

export function FieldLabel({ children, help }) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <label className="text-[13px] font-medium text-incred-ink">{children}</label>
      {help !== false && <HelpIcon />}
    </div>
  );
}

export function TextInput({ icon, placeholder, value, onChange, maxLength, inputMode, className = '' }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg border border-incred-border bg-white px-3 py-2.5 ${className}`}>
      {icon && <span className="shrink-0 text-incred-muted">{icon}</span>}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        className="min-w-0 flex-1 bg-transparent text-[14px] text-incred-ink outline-none placeholder:text-gray-400"
      />
    </div>
  );
}

export function DobInputs({ day, month, year, onDay, onMonth, onYear, hint }) {
  const box = 'w-[4.5rem] rounded-lg border border-incred-border bg-white px-2 py-2.5 text-center text-[14px] outline-none placeholder:text-gray-400';
  return (
    <div>
      <div className="flex gap-2">
        <input type="text" inputMode="numeric" maxLength={2} placeholder="dd" value={day} onChange={onDay} className={box} />
        <input type="text" inputMode="numeric" maxLength={2} placeholder="mm" value={month} onChange={onMonth} className={box} />
        <input type="text" inputMode="numeric" maxLength={4} placeholder="yyyy" value={year} onChange={onYear} className={`${box} flex-1`} />
      </div>
      {hint && <p className="mt-1 text-[12px] font-medium" style={{ color: INCRED.green }}>{hint}</p>}
    </div>
  );
}

export function GenderRadio({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-4">
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <label key={opt.id} className="flex cursor-pointer items-center gap-2 press">
            <span
              className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-2"
              style={{ borderColor: INCRED.orange }}
            >
              {selected && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: INCRED.orange }} />}
            </span>
            <input type="radio" name="gender" value={opt.id} checked={selected} onChange={() => onChange(opt.id)} className="sr-only" />
            <span className="text-[14px] text-incred-ink">{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}

export function SelectField({ icon, placeholder, value, options, onChange, labelKey = 'label', valueKey = 'id' }) {
  return (
    <div className="relative flex items-center gap-2 rounded-lg border border-incred-border bg-white px-3 py-2.5">
      {icon && <span className="shrink-0 text-incred-muted">{icon}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 appearance-none bg-transparent text-[14px] text-incred-ink outline-none"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={typeof o === 'string' ? o : o[valueKey]} value={typeof o === 'string' ? o : o[valueKey]}>
            {typeof o === 'string' ? o : o[labelKey]}
          </option>
        ))}
      </select>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={INCRED.muted} strokeWidth="2" className="shrink-0">
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function CheckboxRow({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 press">
      <span
        className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm"
        style={{ backgroundColor: checked ? INCRED.orange : 'white', border: checked ? 'none' : `2px solid ${INCRED.border}` }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span className="text-[12px] leading-snug text-incred-ink">{children}</span>
    </label>
  );
}

export function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  );
}

export function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function PanIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 10h4M7 14h6" strokeLinecap="round" />
    </svg>
  );
}

export function BriefcaseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2M12 12v4" strokeLinecap="round" />
    </svg>
  );
}

export function BuildingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M9 7h1M9 11h1M9 15h1M14 7h1M14 11h1M14 15h1" strokeLinecap="round" />
    </svg>
  );
}

export function EmailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" strokeLinecap="round" />
    </svg>
  );
}

export function RupeeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <text x="12" y="16" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="bold" stroke="none">
        ₹
      </text>
    </svg>
  );
}

export function RingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="8" cy="14" r="4" />
      <circle cx="16" cy="14" r="4" />
    </svg>
  );
}

export function HouseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-6H9v6H5a2 2 0 01-2-2v-9z" />
    </svg>
  );
}

export function OrangeButton({ children, onClick, disabled, className = '', outline }) {
  const base = 'w-full rounded-lg py-3.5 text-[15px] font-bold press transition-opacity disabled:opacity-50';
  if (outline) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`${base} border-2 bg-white ${className}`}
        style={{ borderColor: INCRED.orange, color: INCRED.orange }}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} text-white ${className}`}
      style={{ backgroundColor: INCRED.orange }}
    >
      {children}
    </button>
  );
}
