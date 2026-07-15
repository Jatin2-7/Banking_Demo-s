import React, { useState } from 'react';
import VisaShell, { OrangeButton } from './VisaShell.jsx';
import { DESTINATIONS } from './visaJourney.js';
import { EMT } from '../theme.js';

function HeroBanner({ query, onChange, onSearch }) {
  return (
    <div
      className="relative px-4 pb-16 pt-6"
      style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.5) 100%), linear-gradient(135deg, #4A6FA5 0%, #2C5282 50%, #1A365D 100%)',
        minHeight: '14rem',
      }}
    >
      <p className="text-center text-[11px] font-medium" style={{ color: '#7DD3FC' }}>
        Fly Around the World Easily
      </p>
      <h2 className="mt-1 text-center text-[20px] font-bold leading-tight text-white">
        Get Your Visas Right
        <br />
        on Time with Us
      </h2>
      <div className="absolute -bottom-5 left-4 right-4">
        <div className="flex items-center overflow-hidden rounded-full bg-white shadow-md">
          <div className="flex flex-1 items-center gap-2 px-4 py-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={EMT.muted} strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Hey Traveller, Search..."
              className="flex-1 text-[13px] outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onSearch}
            className="press shrink-0 rounded-full px-6 py-3 text-[13px] font-bold text-white"
            style={{ backgroundColor: '#EF6614', margin: '4px' }}
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}

function DestinationCard({ dest, onSelect }) {
  const gradients = {
    coastal: 'linear-gradient(135deg, #2D6A4F 0%, #40916C 40%, #52B788 100%)',
    desert: 'linear-gradient(135deg, #D4A574 0%, #C9956B 50%, #A67C52 100%)',
    temple: 'linear-gradient(135deg, #E07A5F 0%, #F2CC8F 50%, #81B29A 100%)',
  };
  return (
    <button
      type="button"
      onClick={() => onSelect(dest.id)}
      className="press w-full overflow-hidden rounded-2xl text-left shadow-sm"
    >
      <div className="h-36" style={{ background: gradients[dest.image] || gradients.coastal }} />
      <div className="bg-white px-3 py-2">
        <p className="text-[13px] font-bold text-emt-ink">{dest.name} Visa</p>
        <p className="text-[10px] text-emt-muted">For Indian passport holders</p>
      </div>
    </button>
  );
}

export default function VisaHomeScreen({ form, onChange, onBack, onSelectDestination, onSearch }) {
  const handleSearch = () => {
    const q = (form.searchQuery || '').toLowerCase();
    const match = DESTINATIONS.find((d) => q.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(q));
    if (match) onSelectDestination(match.id);
    else if (q) onSelectDestination('singapore');
    else onSearch?.();
  };

  return (
    <VisaShell onBack={onBack}>
      <HeroBanner
        query={form.searchQuery}
        onChange={(v) => onChange({ searchQuery: v })}
        onSearch={handleSearch}
      />
      <div className="px-4 pt-10 pb-4">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-[13px] text-emt-ink">Enjoy Visa Services</p>
            <p className="text-[14px] font-bold text-emt-ink">On Trending Tourist Attractions</p>
          </div>
          <span className="text-3xl opacity-40">🛂</span>
        </div>
        <div className="space-y-3">
          {DESTINATIONS.map((dest) => (
            <DestinationCard key={dest.id} dest={dest} onSelect={onSelectDestination} />
          ))}
        </div>
      </div>
    </VisaShell>
  );
}
