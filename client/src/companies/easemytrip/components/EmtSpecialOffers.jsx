import React, { useState } from 'react';
import { EMT } from '../theme.js';

const TABS = ['Top Offers', 'Bank Offers', 'Flights', 'Hotels'];

const OFFERS = [
  { id: 1, title: 'Flat ₹500 off on Domestic Flights', code: 'EMT500', color: '#E3F2FD' },
  { id: 2, title: 'Zero Forex Markup on GlobalPay Card', code: 'FOREX0', color: '#E8F5E9' },
  { id: 3, title: 'Hotel Deals — Up to 60% Off', code: 'STAY60', color: '#FFF3E0' },
];

export default function EmtSpecialOffers() {
  const [activeTab, setActiveTab] = useState('Top Offers');

  return (
    <div className="px-3 pb-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-emt-ink">Special Offers</h2>
        <button type="button" className="text-[12px] font-semibold press" style={{ color: EMT.blue }}>
          View All →
        </button>
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className="shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold press"
            style={{
              borderColor: activeTab === tab ? EMT.blue : EMT.border,
              color: activeTab === tab ? EMT.blue : EMT.ink,
              backgroundColor: activeTab === tab ? '#E8F0FE' : 'white',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {OFFERS.map((offer) => (
          <div
            key={offer.id}
            className="min-w-[10rem] shrink-0 rounded-xl border border-emt-border p-3"
            style={{ backgroundColor: offer.color }}
          >
            <p className="text-[11px] font-semibold leading-snug text-emt-ink">{offer.title}</p>
            <p className="mt-2 text-[10px] font-bold" style={{ color: EMT.blue }}>
              Code: {offer.code}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
