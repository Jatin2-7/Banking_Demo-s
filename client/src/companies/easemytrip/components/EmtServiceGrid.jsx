import React from 'react';
import { EMT } from '../theme.js';

const PRIMARY_SERVICES = [
  {
    id: 'flights',
    label: 'Flights',
    icon: (
      <svg viewBox="0 0 64 48" className="h-10 w-14" fill="none">
        <path d="M8 28L56 8L40 40L32 28L8 28Z" fill={EMT.blue} opacity="0.9" />
        <path d="M32 28L40 40L36 44L28 32L32 28Z" fill={EMT.blueDark} />
      </svg>
    ),
  },
  {
    id: 'hotels',
    label: 'Hotels',
    badge: 'Up to 60% Off*',
    icon: (
      <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
        <rect x="8" y="16" width="32" height="28" rx="2" fill={EMT.blue} opacity="0.15" stroke={EMT.blue} strokeWidth="1.5" />
        <rect x="14" y="22" width="6" height="6" fill={EMT.blue} opacity="0.4" />
        <rect x="22" y="22" width="6" height="6" fill={EMT.blue} opacity="0.4" />
        <rect x="30" y="22" width="6" height="6" fill={EMT.blue} opacity="0.4" />
        <path d="M8 16L24 6L40 16" stroke={EMT.blue} strokeWidth="2" fill="none" />
      </svg>
    ),
  },
  {
    id: 'trains',
    label: 'Trains',
    icon: (
      <svg viewBox="0 0 56 40" className="h-10 w-14" fill="none">
        <rect x="4" y="8" width="48" height="24" rx="6" fill={EMT.blue} opacity="0.15" stroke={EMT.blue} strokeWidth="1.5" />
        <rect x="10" y="14" width="12" height="10" rx="2" fill={EMT.blue} opacity="0.5" />
        <rect x="34" y="14" width="12" height="10" rx="2" fill={EMT.blue} opacity="0.5" />
        <circle cx="14" cy="34" r="4" fill={EMT.blue} />
        <circle cx="42" cy="34" r="4" fill={EMT.blue} />
      </svg>
    ),
  },
];

const GRID_SERVICES = [
  { id: 'bus', label: 'Bus', icon: '🚌' },
  { id: 'holidays', label: 'Holidays', icon: '🏖️' },
  { id: 'cabs', label: 'Cabs', icon: '🚕' },
  { id: 'heritage', label: 'Heritage & Events', icon: '🏛️', new: true },
  { id: 'activities', label: 'Activities', icon: '🎈' },
  { id: 'giftcard', label: 'Gift Card', icon: '🎁' },
  { id: 'visa', label: 'Visa', icon: '🛂' },
  { id: 'metro', label: 'Metro', icon: '🚇' },
  { id: 'easydarshan', label: 'EasyDarshan', icon: '🛕' },
  { id: 'airport', label: 'Airport Services', icon: '🛍️' },
  { id: 'emt_cards', label: 'EMT Cards', icon: '💳' },
  { id: 'forex_cash', label: 'Forex Cash & Cards', icon: '💵', highlight: true },
];

function ServiceIcon({ item }) {
  if (typeof item.icon === 'string') {
    return <span className="text-2xl">{item.icon}</span>;
  }
  return item.icon;
}

export default function EmtServiceGrid({ onServiceTap }) {
  return (
    <div className="px-3">
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {PRIMARY_SERVICES.map((svc) => (
          <button
            key={svc.id}
            type="button"
            onClick={() => onServiceTap?.(svc.id)}
            className="press flex min-w-[6.5rem] flex-col items-center rounded-xl border border-emt-border bg-white px-3 py-3 shadow-sm"
          >
            {svc.icon}
            <span className="mt-2 text-[12px] font-semibold text-emt-ink">{svc.label}</span>
            {svc.badge && (
              <span className="mt-0.5 text-[9px] font-bold" style={{ color: EMT.green }}>
                {svc.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-emt-border bg-white p-3 shadow-sm">
        <div className="grid grid-cols-4 gap-y-4">
          {GRID_SERVICES.map((svc) => (
            <button
              key={svc.id}
              type="button"
              onClick={() => onServiceTap?.(svc.id)}
              className="press relative flex flex-col items-center gap-1.5 px-1"
            >
              {svc.new && (
                <span
                  className="absolute -top-1 right-0 rounded px-1 text-[7px] font-bold text-white"
                  style={{ backgroundColor: '#E91E8C' }}
                >
                  NEW
                </span>
              )}
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${svc.highlight ? 'bg-emt-blue/10' : ''}`}
              >
                <ServiceIcon item={svc} />
              </div>
              <span className="text-center text-[9px] font-medium leading-tight text-emt-ink">{svc.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={EMT.muted} strokeWidth="2">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
