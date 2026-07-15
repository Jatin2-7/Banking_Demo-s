import React, { useState } from 'react';
import { EMT } from '../theme.js';

const BANNERS = [
  {
    id: 'baggage',
    title: 'Incredible Savings on Pre-Booked 5kg Extra Baggage',
    cta: 'Book Now',
    gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    emoji: '🧳',
  },
  {
    id: 'easydarshan',
    title: "Discover India's Most Revered Pilgrimage Destinations with EasyDarshan",
    cta: 'Know More',
    gradient: 'linear-gradient(135deg, #8B1A1A 0%, #C62828 50%, #4A148C 100%)',
    emoji: '🛕',
  },
];

export default function EmtPromoBanner() {
  const [active, setActive] = useState(0);
  const banner = BANNERS[active];

  return (
    <div className="px-3 py-3">
      <div
        className="relative overflow-hidden rounded-xl px-4 py-5"
        style={{ background: banner.gradient, minHeight: '7rem' }}
      >
        <div className="relative z-10 max-w-[65%]">
          <p className="text-[13px] font-bold leading-snug text-white">{banner.title}</p>
          <button
            type="button"
            className="mt-3 rounded-full border-2 border-white px-4 py-1 text-[11px] font-bold text-white press"
          >
            {banner.cta}
          </button>
        </div>
        <span className="absolute bottom-2 right-4 text-5xl opacity-80">{banner.emoji}</span>
      </div>
      <div className="mt-2 flex justify-center gap-1.5">
        {BANNERS.map((b, i) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setActive(i)}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: i === active ? '1.25rem' : '0.375rem',
              backgroundColor: i === active ? EMT.blue : '#D1D1D1',
            }}
            aria-label={`Banner ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
