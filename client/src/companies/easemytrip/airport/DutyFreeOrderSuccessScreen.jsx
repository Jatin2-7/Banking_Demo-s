import React from 'react';
import { EMT } from '../theme.js';
import { formatPrice, getAirport, getCartTotal, getProductById } from './airportJourney.js';

function SuccessIllustration() {
  return (
    <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
      <div className="absolute inset-0 rounded-full opacity-15" style={{ backgroundColor: '#7C3AED' }} />
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: '#7C3AED' }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

export default function DutyFreeOrderSuccessScreen({ form, onBackHome, onShopAgain }) {
  const airport = getAirport(form.airport);
  const items = (form.cartItems || []).map((id) => getProductById(id)).filter(Boolean);
  const total = getCartTotal(form.cartItems);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <header className="shrink-0 px-3 py-3 text-white" style={{ backgroundColor: '#1A8ADB' }}>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBackHome} className="press">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" />
            </svg>
          </button>
          <span className="text-[15px] font-semibold">Order Placed</span>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-y-auto px-6 py-8">
        <SuccessIllustration />
        <h2 className="text-center text-[20px] font-bold text-emt-ink">Order Placed Successfully!</h2>
        <p className="mt-2 text-center text-[13px] leading-relaxed text-emt-muted">
          Your duty-free pre-order is confirmed. Collect at{' '}
          <strong>
            {airport.name} Terminal {airport.terminal}
          </strong>{' '}
          on {form.collectionType === 'arrival' ? 'arrival' : 'departure'}.
        </p>

        <div className="mt-6 w-full rounded-2xl border border-emt-border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-emt-borderLight pb-3">
            <span className="text-[12px] text-emt-muted">Order Reference</span>
            <span className="text-[13px] font-bold" style={{ color: EMT.brandBlue }}>
              {form.orderRef}
            </span>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between">
              <span className="text-[12px] text-emt-muted">Items</span>
              <span className="text-[12px] font-semibold text-emt-ink">{form.cartCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[12px] text-emt-muted">Total</span>
              <span className="text-[12px] font-semibold text-emt-ink">{formatPrice(total)}</span>
            </div>
          </div>
          {items.length > 0 && (
            <ul className="mt-3 space-y-2 border-t border-emt-borderLight pt-3">
              {items.map((p) => (
                <li key={p.id} className="flex justify-between gap-2 text-[11px]">
                  <span className="line-clamp-1 text-emt-ink">{p.brand}</span>
                  <span className="shrink-0 font-semibold text-emt-ink">{formatPrice(p.price)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 w-full rounded-xl px-4 py-3" style={{ backgroundColor: '#F3E8FF' }}>
          <p className="text-[11px] leading-relaxed" style={{ color: '#5B21B6' }}>
            ✓ Pre-order confirmed · Collect at duty-free counter · Up to 10% pre-order discount applied
          </p>
        </div>

        <button
          type="button"
          onClick={onBackHome}
          className="mt-6 w-full rounded-full py-3.5 text-[14px] font-semibold text-white press"
          style={{ backgroundColor: '#1A8ADB' }}
        >
          Back to Home
        </button>
        <button
          type="button"
          onClick={onShopAgain}
          className="mt-3 w-full rounded-full border-2 py-3 text-[14px] font-semibold press"
          style={{ borderColor: '#1A8ADB', color: '#1A8ADB' }}
        >
          Shop More
        </button>
      </div>
    </div>
  );
}
