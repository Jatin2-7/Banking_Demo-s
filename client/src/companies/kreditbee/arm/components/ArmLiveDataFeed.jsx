import React from 'react';
import { KB } from '../../theme.js';

export default function ArmLiveDataFeed({
  label,
  spokenText,
  digits,
  length,
  groups,
  active,
  variant = 'panel',
}) {
  if (!active) return null;

  const isChat = variant === 'chat';

  const chars = String(digits || '')
    .padEnd(length, ' ')
    .slice(0, length)
    .split('')
    .map((c) => (c === ' ' ? '' : c));

  const renderBox = (idx) => {
    const filled = !!chars[idx];
    const isNext = !filled && (idx === 0 || chars[idx - 1]);
    return (
      <div
        key={idx}
        className={`flex items-center justify-center rounded-md border-2 font-bold transition-all duration-150 ${
          isChat ? 'h-7 w-6 text-xs' : 'h-9 w-7 text-sm sm:h-10 sm:w-8'
        } ${
          filled
            ? 'border-kb-yellow bg-kb-yellow/20 text-kb-ink scale-105'
            : isNext
              ? 'animate-pulse border-kb-yellow bg-white text-kb-muted'
              : 'border-kb-border bg-white text-kb-muted'
        }`}
      >
        {chars[idx] || (isNext ? '|' : '–')}
      </div>
    );
  };

  let idx = 0;
  const grouped = groups ? (
    <div className="flex flex-nowrap items-center justify-center gap-0.5 overflow-x-auto no-scrollbar">
      {groups.map((size, gi) => (
        <React.Fragment key={gi}>
          {gi > 0 && <span className="mx-0.5 text-kb-muted">-</span>}
          {Array.from({ length: size }, () => renderBox(idx++))}
        </React.Fragment>
      ))}
    </div>
  ) : (
    <div className="flex flex-nowrap justify-center gap-0.5 overflow-x-auto no-scrollbar">
      {Array.from({ length }, (_, i) => renderBox(i))}
    </div>
  );

  return (
    <div
      className={`overflow-hidden rounded-xl border-2 border-kb-yellow/60 bg-gradient-to-b from-kb-yellowPale to-white shadow-md ring-2 ring-kb-yellow/20 ${
        isChat ? 'mx-0 mb-1.5' : 'mx-3 mb-2'
      }`}
    >
      <div className={`flex items-center gap-2 border-b border-kb-yellow/30 bg-kb-yellow/15 ${isChat ? 'px-2 py-1.5' : 'px-3 py-2'}`}>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-kb-ink/80">
          {label || 'Live data feed'}
        </span>
      </div>
      <div className={isChat ? 'px-2 py-2' : 'px-3 py-3'}>
        {spokenText && (
          <p className={`mb-1.5 truncate italic text-kb-muted ${isChat ? 'text-[10px]' : 'text-[11px]'}`}>
            Hearing: &ldquo;{spokenText}&rdquo;
          </p>
        )}
        {grouped}
        <p className={`mt-1.5 text-center font-medium text-kb-yellowDark ${isChat ? 'text-[9px]' : 'text-[10px]'}`}>
          Filling form as you speak…
        </p>
      </div>
    </div>
  );
}
