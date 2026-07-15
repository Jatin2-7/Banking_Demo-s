import React from 'react';
import { EMT } from '../theme.js';

export default function AirportShell({ title = 'Airport Services', onBack, children, headerExtra }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <header className="shrink-0 px-3 py-3 text-white" style={{ backgroundColor: '#1A8ADB' }}>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="press p-0.5" aria-label="Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="flex-1 text-[15px] font-semibold">{title}</h1>
          {headerExtra}
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

export function DutyFreeBottomNav({ active = 'duty_free' }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: '←' },
    { id: 'duty_free', label: 'Duty-Free', icon: '🛍️' },
    { id: 'categories', label: 'Categories', icon: '▦' },
    { id: 'brands', label: 'Brands', icon: '🏷️' },
  ];
  return (
    <nav className="shrink-0 border-t border-emt-borderLight bg-white px-4 py-2 pb-5">
      <div
        className="mx-auto flex max-w-sm items-center justify-around rounded-full bg-white px-2 py-2 shadow-lg"
        style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button key={tab.id} type="button" className="press flex flex-col items-center gap-0.5 px-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
                style={{
                  backgroundColor: isActive ? '#F3E8FF' : 'transparent',
                  color: isActive ? '#7C3AED' : EMT.muted,
                }}
              >
                {tab.icon}
              </span>
              <span
                className="text-[9px] font-semibold"
                style={{ color: isActive ? '#7C3AED' : EMT.muted }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function PreOrderPill() {
  return (
    <span
      className="flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold"
      style={{ borderColor: '#EF6614', color: '#EF6614' }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" strokeLinecap="round" />
      </svg>
      Pre-order
    </span>
  );
}

export function ProductCard({ product, onAdd }) {
  return (
    <div className="border-b border-r border-emt-borderLight p-3">
      <div
        className="relative mx-auto mb-2 flex h-28 w-full items-center justify-center rounded-lg"
        style={{ backgroundColor: `${product.color}18` }}
      >
        <div
          className="h-20 w-12 rounded-lg shadow-md"
          style={{ background: `linear-gradient(180deg, ${product.color} 0%, ${product.color}99 100%)` }}
        />
        <button
          type="button"
          onClick={() => onAdd?.(product)}
          className="absolute bottom-1 right-1 rounded border-2 bg-white px-3 py-0.5 text-[11px] font-bold press"
          style={{ borderColor: '#00A651', color: '#00A651' }}
        >
          ADD
        </button>
      </div>
      <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-emt-ink">{product.name}</p>
      <p className="mt-1 text-[8px] font-medium uppercase tracking-wide text-emt-muted">Pre-order Price</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-1">
        <span className="text-[13px] font-bold text-emt-ink">{`₹${product.price.toLocaleString('en-IN')}`}</span>
        <span className="text-[10px] text-emt-muted line-through">{`₹${product.original.toLocaleString('en-IN')}`}</span>
        <span
          className="rounded px-1 py-0.5 text-[8px] font-bold text-white"
          style={{ backgroundColor: '#EF6614' }}
        >
          {product.discount}% OFF
        </span>
      </div>
    </div>
  );
}
