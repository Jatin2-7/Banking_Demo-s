import React from 'react';
import { FONTS } from '../../theme.js';

export default function RbiFooter() {
  return (
    <footer className="border-t border-[#E4E9EF] bg-white py-8">
      <div
        className="flex flex-col items-center justify-center gap-3"
        style={{ fontFamily: FONTS.body }}
      >
        <p className="text-[14px] font-medium text-[#64748B]">Registered with</p>
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#C4A052] bg-[#FFF8E7] text-[10px] font-bold text-[#8B6914]"
            aria-hidden
          >
            RBI
          </div>
          <div className="text-left">
            <p className="text-[13px] font-semibold text-[#2B3A4E]">भारतीय रिज़र्व बैंक</p>
            <p className="text-[12px] font-medium tracking-wide text-[#64748B]">
              RESERVE BANK OF INDIA
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
