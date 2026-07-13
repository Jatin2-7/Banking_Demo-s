import React from 'react';
import { CONTACT_PHONE } from '../../theme.js';

export default function FloatingSideTabs() {
  return (
    <div className="pointer-events-none fixed right-0 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
      <a
        href={`tel:${CONTACT_PHONE}`}
        className="pointer-events-auto flex items-center gap-2 rounded-l-lg bg-[#22C55E] px-2 py-4 text-white shadow-lg transition hover:brightness-105"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}
      >
        <span className="mb-1 text-base">📞</span>
        CONTACT US
      </a>
      <button
        type="button"
        className="pointer-events-auto flex items-center gap-2 rounded-l-lg bg-[#3B82F6] px-2 py-4 text-white shadow-lg transition hover:brightness-105"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}
        onClick={() => window.alert('Nearest branch locator — demo placeholder')}
      >
        <span className="mb-1 text-base">📍</span>
        NEAREST BRANCH
      </button>
    </div>
  );
}
