import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const AIRPORTS = [
  { code: 'BOM', city: 'Mumbai' },
  { code: 'DEL', city: 'New Delhi' },
  { code: 'BLR', city: 'Bengaluru' },
  { code: 'GOI', city: 'Goa' },
  { code: 'JAI', city: 'Jaipur' },
];
const CABIN_CLASSES = ['Economy', 'Premium Economy', 'Business'];
const BASE_DATE = new Date(2026, 6, 1); // 1 Jul 2026

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date) {
  return {
    date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    day: date.toLocaleDateString('en-IN', { weekday: 'long' }),
  };
}

function HeaderIcon({ children, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/12 text-white hover:bg-white/20"
      aria-label={label}
    >
      {children}
    </button>
  );
}

function HomeIconButton({ onClick, tone = 'light' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        tone === 'solid'
          ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-[#1452a5] shadow-sm hover:bg-white/90'
          : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/12 text-white hover:bg-white/20'
      }
      aria-label="Home"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    </button>
  );
}

function ValueStepper({ label, value, onMinus, onPlus }) {
  return (
    <div className="flex min-h-[58px] flex-1 items-center justify-between border-r border-slate-200 px-4 py-3 last:border-r-0">
      <span>
        <span className="block text-[11px] font-medium text-slate-500">{label}</span>
        <span className="block text-sm font-bold text-slate-900">{value}</span>
      </span>
      <span className="flex items-center gap-1">
        <button
          type="button"
          onClick={onMinus}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-base font-bold text-slate-600"
          aria-label={`Decrease ${label}`}
        >
          -
        </button>
        <button
          type="button"
          onClick={onPlus}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1452a5] text-base font-bold text-white"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </span>
    </div>
  );
}

export default function FlightBookingScreen({ onClose }) {
  const [step, setStep] = useState('services');
  const [fromIndex, setFromIndex] = useState(0);
  const [toIndex, setToIndex] = useState(1);
  const [departureOffset, setDepartureOffset] = useState(0);
  const [returnOffset, setReturnOffset] = useState(null);
  const [classIndex, setClassIndex] = useState(0);
  const [travellers, setTravellers] = useState(1);
  const [nonStop, setNonStop] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (step !== 'services') return undefined;
    const t = setTimeout(() => setStep('booking'), 900);
    return () => clearTimeout(t);
  }, [step]);

  const from = AIRPORTS[fromIndex];
  const to = AIRPORTS[toIndex];
  const departure = useMemo(() => addDays(BASE_DATE, departureOffset), [departureOffset]);
  const departureLabel = formatDate(departure);
  const returnLabel = returnOffset == null ? null : formatDate(addDays(departure, returnOffset));

  const cycleAirport = (setter, avoidIndex) => {
    setter((current) => {
      let next = (current + 1) % AIRPORTS.length;
      if (next === avoidIndex) next = (next + 1) % AIRPORTS.length;
      return next;
    });
  };

  if (step === 'services') {
    return (
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="absolute inset-0 z-40 flex flex-col bg-white"
      >
        <header className="shrink-0 bg-[#1452a5] text-white">
          <div className="flex items-center gap-3 px-3 py-2">
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/10"
              aria-label="Menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>
            <h1 className="flex-1 text-center text-base font-bold">Nuclei</h1>
            <HomeIconButton onClick={onClose} />
            <button
              type="button"
              className="flex h-7 items-center gap-1 rounded-full bg-white/10 px-2 text-xs font-bold"
              aria-label="Wallet balance"
            >
              ₹0.0
            </button>
            <HeaderIcon label="More">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </HeaderIcon>
          </div>
        </header>

        <main className="grid auto-rows-[108px] grid-cols-3 border-t border-slate-200">
          {[
            { label: 'Bus', icon: '▭' },
            { label: 'Hotels', icon: '▥' },
            { label: 'Recharge', icon: '▯' },
            { label: 'Flights', icon: '✈', onClick: () => setStep('booking') },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="relative flex flex-col items-center justify-center gap-2 border-b border-r border-slate-200 bg-white text-slate-800"
            >
              <span className="relative flex h-10 w-10 items-center justify-center text-3xl text-[#1452a5]">
                {item.icon}
              </span>
              <span className="relative text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </main>

        <footer className="mt-auto shrink-0 border-t border-slate-200 bg-white/90 py-2 text-center text-[11px] font-medium text-slate-500">
          Powered by <span className="font-bold text-sky-500">Nuclei</span>
        </footer>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 280 }}
      className="absolute inset-0 z-40 flex flex-col bg-[#f2f2f6]"
    >
      <header className="shrink-0 bg-[#1452a5] text-white">
        <div className="flex items-center gap-2 px-3 pb-2 pt-2">
          <button
            type="button"
            onClick={() => setStep('services')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10"
            aria-label="Back"
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="min-w-0 flex-1 text-base font-bold">Flights</h1>
          <HomeIconButton onClick={onClose} tone="solid" />
          <button
            type="button"
            className="flex h-8 items-center gap-1 rounded-md bg-white px-2.5 text-xs font-bold text-[#1452a5] shadow-sm"
            aria-label="Wallet balance"
          >
            ₹ 0
          </button>
          <HeaderIcon label="Settings">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19 12a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </HeaderIcon>
          <HeaderIcon label="More">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </HeaderIcon>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <section className="relative rounded-lg bg-white px-4 py-4 shadow-sm">
          <div className="absolute left-7 top-7 h-12 border-l-2 border-dashed border-[#1452a5]/55" />
          <button
            type="button"
            onClick={() => cycleAirport(setFromIndex, toIndex)}
            className="relative flex w-full items-center gap-3 pb-3 text-left"
          >
            <span className="h-2 w-2 rounded-full bg-[#1452a5]" />
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">{from.code}</span>
            <span className="text-sm font-bold text-slate-900">{from.city}</span>
          </button>
          <button
            type="button"
            onClick={() => cycleAirport(setToIndex, fromIndex)}
            className="relative flex w-full items-center gap-3 pt-3 text-left"
          >
            <span className="h-2 w-2 rounded-full bg-[#1452a5]" />
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">{to.code}</span>
            <span className="text-sm font-bold text-slate-900">{to.city}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFromIndex(toIndex);
              setToIndex(fromIndex);
            }}
            className="absolute right-4 top-8 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#1452a5] bg-white text-[#1452a5]"
            aria-label="Swap route"
          >
            ↕
          </button>
        </section>

        <section className="mt-3 grid grid-cols-2 overflow-hidden rounded-lg bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setDepartureOffset((d) => d + 1)}
            className="border-r border-slate-200 px-5 py-4 text-left"
          >
            <span className="block text-[11px] text-slate-500">Departure</span>
            <span className="block text-sm font-bold text-slate-900">{departureLabel.date}</span>
            <span className="block text-[11px] text-slate-500">{departureLabel.day}</span>
          </button>
          <button
            type="button"
            onClick={() => setReturnOffset((r) => (r == null ? 2 : Math.min(14, r + 1)))}
            className="px-5 py-4 text-left"
          >
            <span className="block text-[11px] text-slate-500">Return</span>
            <span className="block text-sm font-bold text-slate-900">{returnLabel ? returnLabel.date : 'Add Return'}</span>
            <span className="block text-[11px] text-slate-500">{returnLabel ? returnLabel.day : 'and save more!'}</span>
          </button>
        </section>

        <section className="mt-3 flex overflow-hidden rounded-lg bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setClassIndex((i) => (i + 1) % CABIN_CLASSES.length)}
            className="flex min-h-[58px] flex-1 items-center justify-between border-r border-slate-200 px-4 py-3 text-left"
          >
            <span>
              <span className="block text-[11px] text-slate-500">Class</span>
              <span className="block text-sm font-bold text-slate-900">{CABIN_CLASSES[classIndex]}</span>
            </span>
            <span className="text-lg text-slate-800">⌄</span>
          </button>
          <ValueStepper
            label="Traveller"
            value={travellers}
            onMinus={() => setTravellers((n) => Math.max(1, n - 1))}
            onPlus={() => setTravellers((n) => Math.min(6, n + 1))}
          />
        </section>

        <label className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
          <input
            type="checkbox"
            checked={nonStop}
            onChange={(e) => setNonStop(e.target.checked)}
            className="h-4 w-4 rounded border-[#1452a5] accent-[#1452a5]"
          />
          Show only non-stop flights
        </label>

        <button
          type="button"
          onClick={() => setSearched(true)}
          className="mt-4 h-[50px] w-full rounded-lg bg-[#1452a5] text-lg font-bold text-white shadow-sm"
        >
          Search Flights
        </button>

        {searched && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-bold">Flights ready to search</p>
            <p className="mt-1 text-xs leading-snug">
              {from.city} to {to.city} · {departureLabel.date}
              {returnLabel ? ` to ${returnLabel.date}` : ''} · {CABIN_CLASSES[classIndex]} · {travellers}{' '}
              {travellers === 1 ? 'traveller' : 'travellers'}
              {nonStop ? ' · non-stop only' : ''}
            </p>
          </div>
        )}
      </main>

      <footer className="shrink-0 border-t border-slate-200 bg-white/90 py-2 text-center text-[11px] font-medium text-slate-500">
        Powered by <span className="font-bold text-sky-500">Nuclei</span>
      </footer>
    </motion.div>
  );
}
