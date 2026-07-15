import React from 'react';
import { OPTIMO, FONTS } from '../../theme.js';

const STATS = [
  { value: '48+', label: 'Branches', sub: 'MSMEs Served Across 5 States' },
  { value: '₹600 Cr+', label: '', sub: "MSMEs' Cumulative Disbursements" },
  { value: '5000+', label: '', sub: "MSMEs' Supported Across Various Segments" },
];

export default function StatsBanner() {
  return (
    <section
      className="rounded-[16px] px-6 py-8 sm:px-10"
      style={{ backgroundColor: '#FFF0EB', fontFamily: FONTS.body }}
    >
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
        {STATS.map((s) => (
          <div key={s.value} className="text-center sm:text-left">
            <p style={{ fontSize: 36, fontWeight: 700, color: OPTIMO.orange, lineHeight: 1.1 }}>
              {s.value}
              {s.label && (
                <span style={{ fontSize: 22, fontWeight: 600, color: OPTIMO.navy }}>
                  {' '}
                  {s.label}
                </span>
              )}
            </p>
            <p className="mt-1.5" style={{ fontSize: 14, fontWeight: 500, color: OPTIMO.navySoft }}>
              {s.sub}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
