import React from 'react';
import { INCRED } from '../theme.js';

export default function IncredProgressBar({ login = 0, basic = 0, offer = 0 }) {
  const steps = [
    { label: 'Login info', pct: login },
    { label: 'Basic details', pct: basic },
    { label: 'Get offer', pct: offer },
  ];

  return (
    <div className="shrink-0 bg-white px-4 pb-3 pt-2">
      <div className="flex gap-1">
        {steps.map((s) => (
          <div key={s.label} className="flex-1">
            <div className="h-1 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${s.pct}%`, backgroundColor: INCRED.green }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex">
        {steps.map((s) => (
          <span key={s.label} className="flex-1 text-center text-[10px] text-incred-muted">
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
