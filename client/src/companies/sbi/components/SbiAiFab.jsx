import React from 'react';

/** Silversuits AGUI assistant avatar — matches LoanAguiPanel. */
export function SbiAiFab({ onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-ai-fab
      className={`press-bright z-30 flex items-center justify-center rounded-full shadow-lg ring-2 ring-[#7B2D8E]/25 ${className}`}
      style={{ width: 48, height: 48, backgroundColor: '#004b70' }}
      aria-label="Open YONO Assistant"
      title="YONO Assistant"
    >
      <img
        src="/silversuits-logo.png"
        alt="Silversuits.ai"
        className="h-full w-full rounded-full object-cover"
        draggable="false"
      />
    </button>
  );
}
