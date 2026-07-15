import React from 'react';
import AirportShell from './AirportShell.jsx';
import { EMT } from '../theme.js';

function ServiceCard({ icon, title, description, onBook }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-emt-border bg-white shadow-sm">
      <div
        className="flex h-20 items-center px-4"
        style={{
          background:
            'repeating-linear-gradient(45deg, #f9f9f9 0, #f9f9f9 2px, #fff 2px, #fff 8px)',
        }}
      >
        <span className="text-4xl">{icon}</span>
      </div>
      <div className="p-4">
        <h3 className="text-[15px] font-bold text-emt-ink">{title}</h3>
        <p className="mt-2 text-[11px] leading-relaxed text-emt-muted">{description}</p>
        <button
          type="button"
          onClick={onBook}
          className="mt-3 text-[13px] font-semibold press"
          style={{ color: EMT.brandBlue }}
        >
          Book Now ↗
        </button>
      </div>
    </div>
  );
}

export default function AirportHomeScreen({ onBack, onDutyFree, onMeetGreet }) {
  return (
    <AirportShell onBack={onBack}>
      <div
        className="relative px-4 py-10 text-center text-white"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 100%), linear-gradient(135deg, #1a2a3a 0%, #2d4a6a 100%)',
          minHeight: '12rem',
        }}
      >
        <p className="text-[12px]">Travel Smoothly, Shop Seamlessly! Introducing</p>
        <h2 className="mt-2 font-serif text-[22px] italic leading-snug">
          Extraordinary Airport Services
        </h2>
      </div>

      <div
        className="px-4 py-6"
        style={{
          background:
            'repeating-linear-gradient(45deg, #fafafa 0, #fafafa 2px, #fff 2px, #fff 10px)',
        }}
      >
        <div className="space-y-4">
          <ServiceCard
            icon="🛍️"
            title="Duty-Free Shopping"
            description="Discover exclusive discounts on premium brands with our exemplary duty-free program. Purchase luxurious goods like fragrances, liquor, electronic gadgets and more at tax-free rates – all within the airport like never before."
            onBook={onDutyFree}
          />
          <ServiceCard
            icon="🤵"
            title="Meet & Greet Assistance"
            description="Kickstart your leisurely journey with our premium meet & greet services. Enjoy seamless airport navigation, priority check-in, and personalised assistance from arrival to departure."
            onBook={onMeetGreet}
          />
        </div>
      </div>
    </AirportShell>
  );
}
