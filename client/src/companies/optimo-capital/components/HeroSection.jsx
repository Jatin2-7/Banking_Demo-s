import React from 'react';
import { OPTIMO, FONTS } from '../theme.js';

function ConsentCheckbox({ checked, onChange }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[2px]"
      style={{
        backgroundColor: checked ? OPTIMO.orange : 'white',
        border: `2px solid ${OPTIMO.orange}`,
      }}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6l2.5 2.5 4.5-5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

export default function HeroSection({ showConsent = true, consent, onConsentChange }) {
  return (
    <div className="w-full text-center">
      <h1
        className="leading-[1.35]"
        style={{
          fontFamily: FONTS.display,
          fontSize: 24,
          fontWeight: 600,
          color: OPTIMO.headlineDark,
        }}
      >
        Get Instant Business
      </h1>
      <p
        className="mt-1 leading-[1.25]"
        style={{
          fontFamily: FONTS.display,
          fontSize: 32,
          fontWeight: 700,
          color: OPTIMO.orange,
          letterSpacing: '-0.01em',
        }}
      >
        Loan Against Property @ 1.2%* per month.
      </p>
      <p
        className="mt-4"
        style={{
          fontFamily: FONTS.body,
          fontSize: 17,
          fontWeight: 500,
          color: OPTIMO.headlineDark,
        }}
      >
        Use <span style={{ color: OPTIMO.orange, fontWeight: 600 }}>house, office or shop</span> as
        collateral.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        <div
          className="rounded-full px-6 py-2"
          style={{
            backgroundColor: OPTIMO.pillBg,
            border: `1px solid ${OPTIMO.pillBorder}`,
            fontFamily: FONTS.body,
            fontSize: 14,
            fontWeight: 500,
            color: OPTIMO.pillText,
          }}
        >
          Loan Amount: <span style={{ color: OPTIMO.orange, fontWeight: 600 }}>₹10L - ₹5Cr</span>
        </div>
        <div
          className="rounded-full px-6 py-2"
          style={{
            backgroundColor: OPTIMO.pillBg,
            border: `1px solid ${OPTIMO.pillBorder}`,
            fontFamily: FONTS.body,
            fontSize: 14,
            fontWeight: 500,
            color: OPTIMO.pillText,
          }}
        >
          Interest Rate:{' '}
          <span style={{ color: OPTIMO.orange, fontWeight: 600 }}>7-15Y for low EMI</span>
        </div>
      </div>

      <p
        className="mt-4"
        style={{
          fontFamily: FONTS.body,
          fontSize: 13,
          fontWeight: 500,
          color: OPTIMO.orange,
        }}
      >
        *Depending on your business &amp; credibility
      </p>

      {showConsent && (
        <div className="mt-5 flex w-full justify-center px-2">
          <label className="inline-flex cursor-pointer items-start gap-2.5 text-left sm:items-center">
            <ConsentCheckbox checked={consent} onChange={onConsentChange} />
            <span
              className="leading-snug"
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                fontWeight: 400,
                color: OPTIMO.consent,
              }}
            >
              I Authorize Optimo Capital to reach out Via SMS/RCS/Whatsapp/Email/Call
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
