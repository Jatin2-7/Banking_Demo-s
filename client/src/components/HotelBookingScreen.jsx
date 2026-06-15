import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const CITIES = ['Goa', 'Mumbai', 'Delhi', 'Bengaluru', 'Jaipur'];
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

function HeaderIcon({ children, label }) {
  return (
    <button
      type="button"
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
          ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#1452a5] shadow-sm hover:bg-white/90'
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

function SelectCard({ label, value, onMinus, onPlus }) {
  return (
    <div className="flex min-h-[64px] flex-1 items-center justify-between border-r border-slate-200 px-4 py-3 text-left last:border-r-0">
      <span className="min-w-0">
        <span className="block text-[10px] font-medium text-slate-500">{label}</span>
        <span className="block text-sm font-bold text-slate-900">{value}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1">
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

export default function HotelBookingScreen({ onClose }) {
  const [step, setStep] = useState('services');
  const [cityIndex, setCityIndex] = useState(0);
  const [checkInOffset, setCheckInOffset] = useState(0);
  const [nights, setNights] = useState(1);
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (step !== 'services') return undefined;
    const t = setTimeout(() => setStep('booking'), 900);
    return () => clearTimeout(t);
  }, [step]);

  const checkIn = useMemo(() => addDays(BASE_DATE, checkInOffset), [checkInOffset]);
  const checkOut = useMemo(() => addDays(checkIn, nights), [checkIn, nights]);
  const checkInLabel = formatDate(checkIn);
  const checkOutLabel = formatDate(checkOut);

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
            { label: 'Hotels', icon: '▥', featured: true, onClick: () => setStep('booking') },
            { label: 'Recharge', icon: '▯' },
            { label: 'Flights', icon: '✈' },
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
      animate={{ x: 0 }}
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

          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold leading-tight">Hotel Booking</h1>
            <p className="text-[10px] font-semibold leading-tight text-white/85">Find your perfect stay</p>
          </div>

          <HomeIconButton onClick={onClose} tone="solid" />

          <button
            type="button"
            className="flex h-8 items-center gap-1 rounded-full bg-white px-2.5 text-xs font-bold text-[#1452a5] shadow-sm"
            aria-label="Wallet balance"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="6" width="18" height="12" rx="2" />
              <path d="M16 12h4" strokeLinecap="round" />
            </svg>
            ₹0
          </button>

          <HeaderIcon label="Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1-2 2-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.6V20h-3v-.2a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1-2-2 .1-.1A1.7 1.7 0 005 15a1.7 1.7 0 00-1.6-1H3v-3h.4A1.7 1.7 0 005 9a1.7 1.7 0 00-.3-1.9l-.1-.1 2-2 .1.1A1.7 1.7 0 008.6 5a1.7 1.7 0 001-1.6V3h3v.4a1.7 1.7 0 001 1.6 1.7 1.7 0 001.9-.3l.1-.1 2 2-.1.1A1.7 1.7 0 0019 9a1.7 1.7 0 001.6 1h.4v3h-.4A1.7 1.7 0 0019.4 15z" />
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

      <main className="flex-1 overflow-y-auto px-5 py-5">
        <label className="block">
          <span className="sr-only">Destination city</span>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <input
              value={CITIES[cityIndex]}
              onChange={(e) => {
                const next = e.target.value.trim();
                const existing = CITIES.findIndex((c) => c.toLowerCase() === next.toLowerCase());
                if (existing >= 0) setCityIndex(existing);
              }}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none"
              aria-label="Destination city"
            />
            <button
              type="button"
              onClick={() => setCityIndex((i) => (i + 1) % CITIES.length)}
              className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-[#1452a5]"
            >
              Change
            </button>
          </div>
        </label>

        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
            <button
              type="button"
              onClick={() => setCheckInOffset((d) => d + 1)}
              className="px-5 py-3 text-left"
            >
              <span className="block text-[10px] font-medium text-slate-500">Check-In Date</span>
              <span className="block text-sm font-bold text-slate-900">{checkInLabel.date}</span>
              <span className="block text-[11px] text-slate-500">{checkInLabel.day}</span>
            </button>
            <div className="flex flex-col items-center justify-center gap-1 border-x border-slate-200 px-2">
              <button
                type="button"
                onClick={() => setNights((n) => Math.min(7, n + 1))}
                className="leading-none text-xs font-bold text-[#1452a5]"
                aria-label="Increase nights"
              >
                +
              </button>
              <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{nights}N</span>
              <button
                type="button"
                onClick={() => setNights((n) => Math.max(1, n - 1))}
                className="leading-none text-xs font-bold text-[#1452a5]"
                aria-label="Decrease nights"
              >
                -
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCheckInOffset((d) => Math.max(0, d - 1))}
              className="px-5 py-3 text-right"
            >
              <span className="block text-[10px] font-medium text-slate-500">Check-Out Date</span>
              <span className="block text-sm font-bold text-slate-900">{checkOutLabel.date}</span>
              <span className="block text-[11px] text-slate-500">{checkOutLabel.day}</span>
            </button>
          </div>
        </div>

        <div className="mt-3 flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <SelectCard
            label="Rooms"
            value={`${rooms} ${rooms === 1 ? 'Room' : 'Rooms'}`}
            onMinus={() => setRooms((r) => Math.max(1, r - 1))}
            onPlus={() => setRooms((r) => Math.min(4, r + 1))}
          />
          <SelectCard
            label="Guests"
            value={`${adults} ${adults === 1 ? 'Adult' : 'Adults'}`}
            onMinus={() => setAdults((a) => Math.max(1, a - 1))}
            onPlus={() => setAdults((a) => Math.min(6, a + 1))}
          />
        </div>

        <button
          type="button"
          onClick={() => setSearched(true)}
          className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#1452a5] text-base font-bold text-white shadow-sm"
        >
          Search Hotels
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 21V5a2 2 0 012-2h8a2 2 0 012 2v16" />
            <path d="M16 9h2a2 2 0 012 2v10" />
            <path d="M8 7h1M12 7h1M8 11h1M12 11h1M8 15h1M12 15h1M3 21h18" strokeLinecap="round" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => {
            setCityIndex(0);
            setCheckInOffset(0);
            setNights(1);
            setSearched(true);
          }}
          className="mt-5 flex w-full items-center gap-3 rounded-xl bg-white px-4 py-4 text-left text-sm font-bold text-slate-800 shadow-sm"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#1452a5]/30 text-[#1452a5]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
          </span>
          <span className="flex-1">Find rooms near me for tonight</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {searched && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-bold">Hotels ready to search</p>
            <p className="mt-1 text-xs leading-snug">
              {CITIES[cityIndex]} · {checkInLabel.date} to {checkOutLabel.date} · {rooms}{' '}
              {rooms === 1 ? 'room' : 'rooms'} · {adults} {adults === 1 ? 'adult' : 'adults'}
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
