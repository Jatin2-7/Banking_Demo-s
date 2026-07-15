import React from 'react';
import { ArmHelpBox } from './ArmChatHeader.jsx';

export default function ArmQuickOptions({
  title = 'QUICK OPTIONS',
  options,
  onSelect,
  helpText,
  embedded = false,
}) {
  if (!options?.length) return null;

  return (
    <div
      className={`overflow-hidden rounded-xl border border-kb-border bg-[#FAFAFA] shadow-sm ${
        embedded ? 'w-full' : 'mx-3 mb-2'
      }`}
    >
      <p className="px-3 pt-3 text-[10px] font-semibold tracking-wider text-kb-muted">{title}</p>
      <div className="flex flex-col gap-2 p-3 pt-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value, opt.label)}
            className="flex w-full items-center justify-between rounded-xl border border-kb-border bg-white px-4 py-3.5 text-left text-[14px] font-semibold text-kb-ink press transition hover:bg-gray-50"
          >
            <span>{opt.label}</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>
      <div className="px-3 pb-3">
        <ArmHelpBox text={helpText} />
      </div>
    </div>
  );
}

export function ArmListOptions({ options, onSelect, helpText, embedded = false }) {
  if (!options?.length) return null;

  return (
    <div className={`flex flex-col gap-2 ${embedded ? 'w-full' : 'mx-3 mb-2'}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onSelect(opt.value, opt.label)}
          className="flex w-full items-center justify-between rounded-xl border border-kb-border bg-white px-4 py-3.5 text-left text-[14px] font-semibold text-kb-ink press shadow-sm"
        >
          <span>{opt.label}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9CA3AF"
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ))}
      {helpText && (
        <div className="mt-1">
          <ArmHelpBox text={helpText} />
        </div>
      )}
    </div>
  );
}
