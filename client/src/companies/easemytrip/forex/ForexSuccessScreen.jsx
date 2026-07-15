import React from 'react';
import { EmtForexHeader } from '../components/EmtHeader.jsx';
import { EMT } from '../theme.js';
import { CURRENCIES } from './forexJourney.js';

function SuccessIllustration() {
  return (
    <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
      <div
        className="absolute inset-0 rounded-full opacity-15"
        style={{ backgroundColor: EMT.green }}
      />
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: EMT.green }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

export default function ForexSuccessScreen({ form, onBackHome, onNewOrder }) {
  const currency = CURRENCIES.find((c) => c.code === form.foreignCurrency);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-emt-page">
      <EmtForexHeader onBack={onBackHome} />
      <div className="flex flex-1 flex-col items-center overflow-y-auto px-6 py-8">
        <SuccessIllustration />
        <h2 className="text-center text-[20px] font-bold text-emt-ink">
          Order Placed Successfully!
        </h2>
        <p className="mt-2 text-center text-[13px] leading-relaxed text-emt-muted">
          Your forex order has been confirmed. Our partner will contact you shortly for delivery in{' '}
          <strong>{form.city}</strong>.
        </p>

        <div className="mt-6 w-full rounded-2xl border border-emt-border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-emt-borderLight pb-3">
            <span className="text-[12px] text-emt-muted">Order Reference</span>
            <span className="text-[13px] font-bold" style={{ color: EMT.blue }}>
              {form.orderRef}
            </span>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between">
              <span className="text-[12px] text-emt-muted">Service</span>
              <span className="text-[12px] font-semibold text-emt-ink">
                {form.activeTab === 'forex_card' ? 'Forex Card' : 'Currency Notes'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[12px] text-emt-muted">Type</span>
              <span className="text-[12px] font-semibold capitalize text-emt-ink">
                {form.activeTab === 'forex_card' ? form.cardAction : form.transactionType}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[12px] text-emt-muted">You Get</span>
              <span className="text-[12px] font-semibold text-emt-ink">
                {currency?.flag} {form.foreignAmount} {form.foreignCurrency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[12px] text-emt-muted">You Pay</span>
              <span className="text-[12px] font-semibold text-emt-ink">₹ {form.inrAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[12px] text-emt-muted">Delivery City</span>
              <span className="text-[12px] font-semibold text-emt-ink">{form.city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[12px] text-emt-muted">Contact</span>
              <span className="text-[12px] font-semibold text-emt-ink">{form.mobile}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 w-full rounded-xl px-4 py-3" style={{ backgroundColor: '#E8F5E9' }}>
          <p className="text-[11px] leading-relaxed" style={{ color: '#2E7D32' }}>
            ✓ OTP verified · Home delivery within 24–48 hours · Zero markup forex card benefits
            applied
          </p>
        </div>

        <button
          type="button"
          onClick={onBackHome}
          className="mt-6 w-full rounded-full py-3.5 text-[14px] font-semibold text-white press"
          style={{ backgroundColor: EMT.blue }}
        >
          Back to Home
        </button>
        <button
          type="button"
          onClick={onNewOrder}
          className="mt-3 w-full rounded-full border-2 py-3 text-[14px] font-semibold press"
          style={{ borderColor: EMT.blue, color: EMT.blue }}
        >
          Place Another Order
        </button>
      </div>
    </div>
  );
}
