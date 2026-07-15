import React from 'react';

/** Silversuits voice assistant FAB — matches LoanAguiPanel avatar. */
export default function IncredAiFab({ onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-ai-fab
      className={`press-bright z-30 flex items-center justify-center rounded-full shadow-lg ring-2 ring-[#004A99]/30 ${className}`}
      style={{ width: 52, height: 52, backgroundColor: '#004b70' }}
      aria-label="Open InCred Voice Assistant"
      title="InCred Voice Assistant"
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
