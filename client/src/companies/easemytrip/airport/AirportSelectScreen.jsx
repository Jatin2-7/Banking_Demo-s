import React from 'react';
import AirportShell from './AirportShell.jsx';
import { AIRPORTS } from './airportJourney.js';

function AirportCard({ airport, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(airport.id)}
      className="press min-w-[10rem] shrink-0 overflow-hidden rounded-2xl border border-emt-border bg-white text-left shadow-sm"
    >
      <div className="h-28" style={{ background: airport.gradient }} />
      <div className="p-3">
        <p className="text-[14px] font-bold text-emt-ink">{airport.name}</p>
        <p className="mt-1 text-[9px] leading-snug text-emt-muted">{airport.fullName}</p>
      </div>
    </button>
  );
}

export default function AirportSelectScreen({ onBack, onSelect }) {
  return (
    <AirportShell onBack={onBack}>
      <div className="bg-emt-page px-4 py-6">
        <h2 className="text-[20px] text-emt-ink">
          Choose <strong>Your Airport</strong>
        </h2>
        <p className="mt-3 text-[12px] leading-relaxed text-emt-muted">
          Select your departure airport now and unlock exclusive deals on top duty-free products
          from premium brands. Enjoy extra savings on luxury products and make your travel
          experience more rewarding.
        </p>
        <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
          {AIRPORTS.map((a) => (
            <AirportCard key={a.id} airport={a} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </AirportShell>
  );
}
