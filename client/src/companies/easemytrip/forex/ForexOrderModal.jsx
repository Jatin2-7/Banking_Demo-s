import React from 'react';
import { EMT } from '../theme.js';

export default function ForexOrderModal({ form, onChange, onClose, onProceed, onContinue }) {
  const showConsentBlock = String(form.mobile || '').length >= 10;
  const isOtpPhase = form.phase === 'otp_sent';

  const handleProceed = () => {
    if (!form.mobile || form.mobile.length < 10) return;
    if (!form.consentGiven) return;
    onProceed?.();
  };

  const handleContinue = () => {
    if (!form.otp || form.otp.length < 4) return;
    onContinue?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-[16px] font-bold text-emt-ink">Continue with your Order</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-full press"
            style={{ backgroundColor: EMT.red }}
            aria-label="Close"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
            >
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {!isOtpPhase ? (
          <>
            <label className="mb-1 block text-[12px] font-medium text-emt-ink">
              Mobile Number<span className="text-emt-red">*</span>
            </label>
            <input
              type="tel"
              value={form.mobile}
              onChange={(e) => onChange({ mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              placeholder="Phone Number"
              className="mb-4 w-full rounded-lg border border-emt-border px-3 py-2.5 text-[14px] outline-none focus:border-emt-blue"
            />

            {showConsentBlock && (
              <label className="mb-4 flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={form.consentGiven}
                  onChange={(e) => onChange({ consentGiven: e.target.checked })}
                  className="mt-0.5"
                />
                <span className="text-[11px] leading-relaxed text-emt-muted">
                  I provide my consent for processing my data for purposes mentioned in the{' '}
                  <span style={{ color: EMT.blue }}>Privacy Policy</span> and{' '}
                  <span style={{ color: EMT.blue }}>Terms and Conditions</span>.
                </span>
              </label>
            )}

            <button
              type="button"
              onClick={handleProceed}
              disabled={!form.mobile || form.mobile.length < 10 || !form.consentGiven}
              className="w-full rounded-full py-3 text-[14px] font-semibold text-white press disabled:opacity-50"
              style={{ backgroundColor: EMT.black }}
            >
              Proceed
            </button>
          </>
        ) : (
          <>
            <label className="mb-1 block text-[12px] font-medium text-emt-ink">
              Mobile Number<span className="text-emt-red">*</span>
            </label>
            <input
              type="tel"
              value={form.mobile}
              readOnly
              className="mb-3 w-full rounded-lg border border-emt-border bg-gray-50 px-3 py-2.5 text-[14px] text-emt-muted"
            />

            <label className="mb-1 block text-[12px] font-medium text-emt-ink">
              Email Id<span className="text-emt-red">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="your@email.com"
              className="mb-3 w-full rounded-lg border border-emt-border px-3 py-2.5 text-[14px] outline-none focus:border-emt-blue"
            />

            <label className="mb-1 block text-[12px] font-medium text-emt-ink">
              OTP<span className="text-emt-red">*</span>
            </label>
            <input
              type="text"
              value={form.otp}
              onChange={(e) => onChange({ otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              placeholder="Enter OTP"
              className="mb-2 w-full rounded-lg border border-emt-border px-3 py-2.5 text-[14px] outline-none focus:border-emt-blue"
            />

            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-medium" style={{ color: EMT.green }}>
                OTP Sent Successfully on {form.mobile}
              </p>
              <button type="button" className="text-[11px] font-semibold text-emt-ink press">
                Resend OTP
              </button>
            </div>

            <button
              type="button"
              onClick={handleContinue}
              disabled={!form.otp || form.otp.length < 4}
              className="w-full rounded-full py-3 text-[14px] font-semibold text-white press disabled:opacity-50"
              style={{ backgroundColor: EMT.black }}
            >
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
