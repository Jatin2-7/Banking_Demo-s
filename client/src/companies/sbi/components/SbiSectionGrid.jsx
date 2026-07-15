import React from 'react';
import { SBI } from '../theme.js';

export function SbiSectionGrid({ title, items, onViewAll, onItemClick }) {
  return (
    <section className="border-t border-slate-100 px-4 py-3.5 first:border-t-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-bold" style={{ color: SBI.ink }}>
          {title}
        </h3>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="press text-[11px] font-semibold"
            style={{ color: SBI.link }}
          >
            View All
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-x-1 gap-y-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onItemClick?.(item)}
            className="press flex min-h-[4.75rem] flex-col items-center justify-start gap-2 px-0.5"
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed [&>svg]:h-[22px] [&>svg]:w-[22px]"
              style={{ borderColor: `${SBI.purple}44`, color: SBI.purple }}
            >
              {item.icon}
            </div>
            <span className="line-clamp-2 w-full text-center text-[9px] font-medium leading-[1.25] text-slate-600">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
