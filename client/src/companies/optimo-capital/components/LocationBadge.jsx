import React, { useEffect, useState } from 'react';
import { FONTS } from '../theme.js';

/** Location indicator — anchored to top-right of the content column */
export default function LocationBadge() {
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 1100);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="pointer-events-none absolute -top-1 right-0 z-20 hidden sm:block">
      <div
        className="flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
        style={{
          fontFamily: FONTS.body,
          fontSize: 12,
          fontWeight: 500,
          color: '#6B7C93',
        }}
      >
        <span
          className={`h-2 w-2 rounded-full bg-[#94A3B8] transition-opacity duration-700 ${pulse ? 'opacity-100' : 'opacity-25'}`}
        />
        Capturing location...
      </div>
    </div>
  );
}
