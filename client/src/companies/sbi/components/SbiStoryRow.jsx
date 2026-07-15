import React from 'react';
import { SBI } from '../theme.js';

const STORIES = [
  { id: 'ipo', label: 'IPO', color: '#EDE7F6', emoji: '📈' },
  { id: 'fraud', label: 'Fraud Awareness', color: '#FCE4EC', emoji: '👥' },
  { id: 'discover', label: 'Discover', color: '#E3F2FD', emoji: '📱' },
  { id: 'savings', label: 'Savings Ac', color: '#FFF8E1', emoji: '💰' },
  { id: 'edu', label: 'Education Loan', color: '#F3E5F5', emoji: '🎓' },
];

export function SbiStoryRow() {
  return (
    <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 py-2">
      {STORIES.map((s) => (
        <button
          key={s.id}
          type="button"
          className="press flex w-[4.25rem] shrink-0 flex-col items-center gap-1.5"
        >
          <div
            className="flex h-[3.5rem] w-[3.5rem] items-center justify-center rounded-full border-[2.5px] text-base"
            style={{ borderColor: SBI.purple, backgroundColor: s.color }}
          >
            {s.emoji}
          </div>
          <span className="line-clamp-2 w-full text-center text-[9px] font-semibold leading-tight text-slate-700">
            {s.label}
          </span>
        </button>
      ))}
    </div>
  );
}
