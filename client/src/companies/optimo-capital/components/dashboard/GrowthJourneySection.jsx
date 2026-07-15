import React from 'react';
import { OPTIMO, FONTS } from '../../theme.js';

export default function GrowthJourneySection({ onContact }) {
  return (
    <section className="py-4 text-center">
      <h2 style={{ fontFamily: FONTS.display, fontSize: 28, fontWeight: 700, color: OPTIMO.navy }}>
        Let&apos;s Start Your <span style={{ color: OPTIMO.orange }}>Growth Journey</span>
      </h2>
      <p
        className="mx-auto mt-3 max-w-xl"
        style={{ fontSize: 15, color: OPTIMO.navySoft, fontFamily: FONTS.body }}
      >
        Ready to unlock your business potential? Get in touch with our experts today.
      </p>
      <button
        type="button"
        onClick={onContact}
        className="mt-6 rounded-full px-8 py-3 text-[15px] font-bold text-white"
        style={{ backgroundColor: OPTIMO.orange, fontFamily: FONTS.display }}
      >
        Talk to an Expert
      </button>
    </section>
  );
}
