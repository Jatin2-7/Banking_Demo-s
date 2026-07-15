import React from 'react';
import VisaShell, { OrangeButton } from './VisaShell.jsx';
import { DESTINATIONS } from './visaJourney.js';
import { EMT } from '../theme.js';

export default function VisaSuccessScreen({ form, onBackHome, onTrackApplication }) {
  const dest = DESTINATIONS.find((d) => d.id === form.destination) || DESTINATIONS[0];

  return (
    <VisaShell onBack={onBackHome} showTabs={false}>
      <div className="flex flex-1 flex-col items-center px-6 py-8">
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full opacity-15" style={{ backgroundColor: EMT.green }} />
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: EMT.green }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <h2 className="text-center text-[20px] font-bold text-emt-ink">Application Submitted!</h2>
        <p className="mt-2 text-center text-[13px] leading-relaxed text-emt-muted">
          Your {dest.name} visa application has been submitted successfully. Track your progress anytime.
        </p>

        <div className="mt-6 w-full rounded-2xl border border-emt-border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-emt-borderLight pb-3">
            <span className="text-[12px] text-emt-muted">Application Reference</span>
            <span className="text-[13px] font-bold" style={{ color: EMT.brandBlue }}>
              {form.applicationRef}
            </span>
          </div>
          <div className="space-y-2">
            {[
              ['Destination', dest.name],
              ['Visa Type', form.visaType],
              ['Duration', `${form.duration} days`],
              ['Entry Type', `${form.entryType} Entry`],
              ['Travellers', String(form.travellers)],
              ['Departure', form.departureDateLabel || '15 Jul 2026'],
              ['Applicant', form.travellerName || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-[11px] text-emt-muted">{k}</span>
                <span className="text-[11px] font-semibold text-emt-ink">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 w-full rounded-xl px-4 py-3" style={{ backgroundColor: '#E8F5E9' }}>
          <p className="text-[11px] leading-relaxed" style={{ color: '#2E7D32' }}>
            ✓ Documents received · Estimated processing: 5-7 business days · Track status in Bookings
          </p>
        </div>

        <div className="mt-6 w-full space-y-3">
          <OrangeButton onClick={onTrackApplication}>Track Application</OrangeButton>
          <button
            type="button"
            onClick={onBackHome}
            className="w-full rounded-full border-2 py-3 text-[14px] font-semibold press"
            style={{ borderColor: EMT.brandBlue, color: EMT.brandBlue }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </VisaShell>
  );
}
