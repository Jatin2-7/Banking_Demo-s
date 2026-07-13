import React from 'react';
import { OPTIMO, FONTS } from '../../theme.js';

const PRODUCTS = [
  {
    id: 'lap',
    title: 'Loan Against Property',
    iconBg: '#22C55E',
    icon: '🏠',
    description: (
      <>
        Get instant business loans from <strong style={{ color: OPTIMO.orange }}>10 Lakh - 2 Crore*</strong> with long{' '}
        <strong style={{ color: OPTIMO.orange }}>7-15 years</strong> tenure.
      </>
    ),
  },
  {
    id: 'balance_transfer',
    title: 'LAP Balance Transfer',
    iconBg: '#F97316',
    icon: '📈',
    description: (
      <>
        Transfer your <strong style={{ color: OPTIMO.orange }}>LAP up to 2 Crore</strong> with long{' '}
        <strong style={{ color: OPTIMO.orange }}>7-15 years</strong> tenure.
      </>
    ),
  },
  {
    id: 'top_up',
    title: 'LAP Top-Up',
    iconBg: '#8B5CF6',
    icon: '📊',
    description: (
      <>
        <strong style={{ color: OPTIMO.orange }}>Already have a LAP?</strong> Get an additional loan up to{' '}
        <strong style={{ color: OPTIMO.orange }}>₹2 Crore*</strong> with long{' '}
        <strong style={{ color: OPTIMO.orange }}>7-15 years</strong> tenure.
      </>
    ),
  },
];

export default function ProductCards({ onApply }) {
  return (
    <section>
      <h2
        className="mb-8 text-center"
        style={{ fontFamily: FONTS.display, fontSize: 28, fontWeight: 700, color: OPTIMO.orange }}
      >
        One Property, Many Possibilities!
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PRODUCTS.map((p) => (
          <article
            key={p.id}
            className="flex flex-col rounded-[16px] bg-white px-6 py-8 shadow-[0_4px_24px_rgba(15,23,42,0.06)]"
          >
            <div
              className="mb-5 flex h-12 w-12 items-center justify-center rounded-[10px] text-xl text-white"
              style={{ backgroundColor: p.iconBg }}
            >
              {p.icon}
            </div>
            <h3
              className="mb-3"
              style={{ fontFamily: FONTS.display, fontSize: 20, fontWeight: 700, color: OPTIMO.navy }}
            >
              {p.title}
            </h3>
            <p className="mb-8 flex-1 leading-relaxed" style={{ fontSize: 14, color: OPTIMO.navySoft }}>
              {p.description}
            </p>
            <button
              type="button"
              onClick={() => onApply(p.id)}
              className="w-full rounded-full py-3.5 text-[15px] font-bold text-white transition hover:brightness-105"
              style={{ backgroundColor: OPTIMO.orange, fontFamily: FONTS.display }}
            >
              Apply Now →
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
