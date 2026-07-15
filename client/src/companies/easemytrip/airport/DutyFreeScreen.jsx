import React from 'react';
import AirportShell, { DutyFreeBottomNav, PreOrderPill } from './AirportShell.jsx';
import { DUTY_FREE_CATEGORIES, getAirport } from './airportJourney.js';
import { EMT } from '../theme.js';

export default function DutyFreeScreen({ form, onChange, onBack, onOpenFragrances, onOpenCategory }) {
  const airport = getAirport(form.airport);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="shrink-0 px-3 py-3 text-white" style={{ backgroundColor: '#1A8ADB' }}>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="press">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" />
            </svg>
          </button>
          <span className="text-[15px] font-semibold">Airport Services</span>
        </div>
      </div>

      <div
        className="shrink-0 px-4 py-3 text-center text-white"
        style={{ backgroundColor: '#2E7D32' }}
      >
        <p className="text-[13px] font-bold">Up to 15% pre-order discount applied</p>
        <p className="text-[10px] opacity-90">Select your Pickup Date & Time</p>
      </div>

      <div
        className="shrink-0 px-4 pb-4 pt-3"
        style={{ background: 'linear-gradient(180deg, #7EC8E3 0%, #B8E6F5 50%, #E8F4FC 100%)' }}
      >
        <div className="flex items-center justify-between">
          <button type="button" onClick={onBack} className="press flex h-8 w-8 items-center justify-center rounded-full bg-white shadow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex-1 px-2 text-white">
            <p className="text-[14px] font-bold">Duty Free</p>
            <p className="text-[10px] opacity-90">
              {airport.name} • {airport.terminal} • {airport.type}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PreOrderPill />
            <button type="button" className="press flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
              🛍️
            </button>
          </div>
        </div>

        <div className="mt-3 flex overflow-hidden rounded-xl bg-white/30 p-1">
          <button
            type="button"
            onClick={() => onChange({ collectionType: 'departure' })}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2.5 text-[11px] font-semibold press"
            style={{
              backgroundColor: form.collectionType === 'departure' ? 'white' : 'transparent',
              color: form.collectionType === 'departure' ? EMT.ink : 'white',
            }}
          >
            ✈️ Collect at Departure
          </button>
          <button
            type="button"
            onClick={() => onChange({ collectionType: 'arrival' })}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2.5 text-[11px] font-semibold press"
            style={{
              backgroundColor: form.collectionType === 'arrival' ? '#000' : 'transparent',
              color: 'white',
            }}
          >
            ✈️ Collect at Arrival
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={EMT.muted} strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={form.searchQuery}
            onChange={(e) => onChange({ searchQuery: e.target.value })}
            placeholder="Search for brands & items"
            className="flex-1 text-[12px] outline-none"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-emt-muted">
          Explore {airport.name} Duty-Free
        </p>
        <div className="grid grid-cols-5 gap-3">
          {DUTY_FREE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                if (cat.id === 'beauty' || cat.id === 'hot_deals') onOpenFragrances();
                else onOpenCategory?.(cat.id);
              }}
              className="press relative flex flex-col items-center gap-1"
            >
              {cat.locked && (
                <span className="absolute -right-0.5 -top-0.5 text-[10px]">🔒</span>
              )}
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-50 text-xl">
                {cat.emoji}
              </div>
              <span className="text-center text-[8px] font-medium leading-tight text-emt-ink">
                {cat.label}
              </span>
            </button>
          ))}
        </div>

        <div
          className="mt-6 rounded-2xl p-4 text-white"
          style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
        >
          <p className="text-[14px] font-bold leading-snug">
            Enjoy Additional <strong>Discounts</strong> on <strong>Duty Free Products</strong>
          </p>
          <p className="mt-1 text-[10px] opacity-80">Exclusive on online pre-order products during the journey.</p>
          <p className="mt-2 text-[8px] opacity-60">*T&C Apply</p>
          <div className="mt-3 flex gap-2">
            <div className="h-16 w-12 rounded-lg bg-amber-900/50" />
            <div className="h-12 w-16 rounded-lg bg-rose-900/40" />
            <div className="h-14 w-10 rounded-lg bg-yellow-900/40" />
          </div>
        </div>
      </div>

      <DutyFreeBottomNav active={form.activeNavTab} />
    </div>
  );
}
