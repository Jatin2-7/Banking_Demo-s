import React from 'react';
import { OPTIMO, FONTS, CONTACT_PHONE, CONTACT_PHONE_DISPLAY, CONTENT_MAX_W } from '../theme.js';
import OptimoHeader from './OptimoHeader.jsx';

export default function SuccessScreen() {
  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: OPTIMO.bg }}>
      <OptimoHeader />

      <div
        className="relative mx-auto flex flex-1 flex-col items-center justify-center px-6 py-14"
        style={{ maxWidth: CONTENT_MAX_W }}
      >
        <div className="relative mx-auto w-full max-w-xl text-center pt-2">
          <p style={{ fontFamily: FONTS.body, fontSize: 20, fontWeight: 500, color: OPTIMO.navy }}>
            Your Application for
          </p>
          <h1
            className="mt-1 uppercase leading-tight"
            style={{
              fontFamily: FONTS.display,
              fontSize: 34,
              fontWeight: 800,
              color: OPTIMO.orange,
              letterSpacing: '-0.01em',
            }}
          >
            Loan Against Property
          </h1>
          <p
            className="mt-1"
            style={{ fontFamily: FONTS.body, fontSize: 20, fontWeight: 500, color: OPTIMO.navy }}
          >
            has been Submitted
          </p>

          <div className="mx-auto mt-10 flex h-[120px] w-[120px] items-center justify-center rounded-full bg-[#DCFCE7] sm:h-[140px] sm:w-[140px]">
            <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] sm:h-[100px] sm:w-[100px]">
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill={OPTIMO.success} />
                <path
                  d="M8 12l3 3 6-6"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <p
            className="mt-10"
            style={{ fontFamily: FONTS.body, fontSize: 19, fontWeight: 500, color: OPTIMO.navy }}
          >
            We will <span style={{ color: OPTIMO.orange, fontWeight: 700 }}>call you</span> from
            this number
          </p>

          <p
            className="mt-4"
            style={{
              fontFamily: FONTS.display,
              fontSize: 42,
              fontWeight: 800,
              color: OPTIMO.orange,
              letterSpacing: '-0.02em',
            }}
          >
            {CONTACT_PHONE_DISPLAY}
          </p>

          <a
            href={`tel:${CONTACT_PHONE}`}
            className="mx-auto mt-10 flex w-full max-w-md items-center justify-center gap-3 rounded-full px-10 py-[16px] text-[18px] font-bold text-white shadow-[0_4px_20px_rgba(76,175,80,0.4)] transition hover:brightness-105 active:scale-[0.99]"
            style={{
              background: `linear-gradient(180deg, ${OPTIMO.callGreen} 0%, ${OPTIMO.callGreenDark} 100%)`,
              fontFamily: FONTS.display,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M6.6 10.8c1.4 2.8 3.4 4.9 6.2 6.2l2-2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.3 0 .7-.2 1l-2.3 2.3z" />
            </svg>
            Call Now
          </a>

          <p
            className="mt-10 text-center"
            style={{
              fontFamily: FONTS.body,
              fontSize: 12,
              lineHeight: 1.6,
              color: OPTIMO.disclaimer,
            }}
          >
            *You can save this number or call for any queries regarding your inquiries.
          </p>
        </div>
      </div>
    </div>
  );
}
