import React from 'react';
import { KB } from '../../theme.js';

export default function ArmSuccessCard() {
  return (
    <div
      className="mx-3 mb-4 overflow-hidden rounded-2xl border-2 bg-kb-yellowPale p-5"
      style={{ borderColor: KB.yellow }}
    >
      <div className="flex flex-col items-center text-center">
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: KB.yellow }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth="2.5"
          >
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-[17px] font-bold text-kb-ink">Verification call pending</h2>
        <p className="mt-1 text-[13px] text-kb-muted">
          A quick call will be made shortly. Please keep your phone available.
        </p>
      </div>
      <div className="mt-4 rounded-xl bg-white p-4 text-left text-[13px] leading-relaxed text-kb-ink/90">
        <p className="font-semibold">Your application has been submitted successfully! 🎉</p>
        <p className="mt-2">Here&apos;s what happens next:</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Our team will review your application</li>
          <li>This usually takes a few minutes</li>
          <li>You may receive a verification call</li>
          <li>We&apos;ll notify you once approved</li>
        </ol>
        <p className="mt-3 text-kb-muted">
          You can check your status anytime by coming back to the app.
        </p>
      </div>
    </div>
  );
}
