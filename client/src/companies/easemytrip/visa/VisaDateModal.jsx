import React from 'react';
import { OrangeButton } from './VisaShell.jsx';
import { EMT } from '../theme.js';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const JULY_2026 = Array.from({ length: 31 }, (_, i) => i + 1);
const START_OFFSET = 3;

export default function VisaDateModal({ selectedDay, onSelect, onClose, onProceed }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="mb-4 text-center text-[16px] font-bold text-emt-ink">
          Select Your Departure Date
        </h2>

        <div className="mb-4 flex items-center justify-between">
          <span
            className="rounded-full px-4 py-1.5 text-[12px] font-semibold"
            style={{ backgroundColor: '#E8F3FF', color: EMT.brandBlue }}
          >
            July 2026
          </span>
          <button
            type="button"
            className="text-[12px] font-semibold press"
            style={{ color: EMT.brandBlue }}
          >
            Next
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 text-center">
          {DAYS.map((d) => (
            <span key={d} className="text-[10px] font-medium text-emt-muted">
              {d}
            </span>
          ))}
        </div>

        <div className="mb-5 grid grid-cols-7 gap-1 text-center">
          {Array.from({ length: START_OFFSET }).map((_, i) => (
            <span key={`e-${i}`} />
          ))}
          {JULY_2026.map((day) => {
            const isSelected = day === selectedDay;
            const isPast = day < 15;
            return (
              <button
                key={day}
                type="button"
                onClick={() => onSelect(day)}
                className="press flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-medium"
                style={{
                  backgroundColor: isSelected ? EMT.brandBlue : 'transparent',
                  color: isSelected ? 'white' : isPast ? '#E8751A' : EMT.ink,
                }}
              >
                {day}
              </button>
            );
          })}
        </div>

        <OrangeButton onClick={onProceed}>Proceed To Application</OrangeButton>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full text-center text-[12px] text-emt-muted press"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
