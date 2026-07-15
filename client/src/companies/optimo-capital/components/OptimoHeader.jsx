import React, { useState } from 'react';
import OptimoLogo from './OptimoLogo.jsx';
import { OPTIMO, FONTS } from '../theme.js';

function TranslateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 8h8M9 4v4M6 16l3-6M14 8h2.5a2.5 2.5 0 010 5H14v-5zM14 13h3"
        stroke="#5B8FC9"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x="15" y="11" fill="#5B8FC9" fontSize="7" fontWeight="600">
        A
      </text>
    </svg>
  );
}

export default function OptimoHeader() {
  const [langOpen, setLangOpen] = useState(false);

  return (
    <header className="relative z-30 w-full bg-white" style={{ borderBottom: '1px solid #ECEEF2' }}>
      <div className="flex w-full items-center justify-between px-6 py-5 sm:px-8 sm:py-6">
        <OptimoLogo />
        <div className="relative">
          <button
            type="button"
            onClick={() => setLangOpen((o) => !o)}
            className="flex items-center gap-2.5 rounded-full border-2 bg-white px-5 py-2 transition hover:bg-[#FAFBFC]"
            style={{
              borderColor: OPTIMO.langBorder,
              fontFamily: FONTS.body,
              fontSize: 14,
              fontWeight: 500,
              color: OPTIMO.navy,
            }}
          >
            <TranslateIcon />
            English
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748B"
              strokeWidth="2.5"
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" />
            </svg>
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full mt-1.5 min-w-[130px] rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/[0.06]">
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left text-[14px] font-medium hover:bg-[#F8F9FA]"
                style={{ color: OPTIMO.navy, fontFamily: FONTS.body }}
                onClick={() => setLangOpen(false)}
              >
                English
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
