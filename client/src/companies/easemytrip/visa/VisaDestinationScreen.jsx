import React from 'react';
import VisaShell, {
  OrangeButton,
  PaymentLogos,
  EstimatedDateBanner,
  TravellerStepper,
} from './VisaShell.jsx';
import { DESTINATIONS, getEstimatedDateLabel } from './visaJourney.js';
import { EMT } from '../theme.js';

function ProcessStep({ step, title, description, icon }) {
  return (
    <div
      className="relative flex gap-3 rounded-xl p-4"
      style={{ backgroundColor: '#F0F7FF' }}
    >
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold text-white"
        style={{ backgroundColor: EMT.brandBlue }}
      >
        STEP {step}
      </span>
      <div className="flex-1">
        <p className="text-[13px] font-bold text-emt-ink">{title}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-emt-muted">{description}</p>
      </div>
      <span className="text-3xl opacity-60">{icon}</span>
    </div>
  );
}

function TimelineItem({ date, title, description, active }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className="h-3 w-3 rounded-full border-2"
          style={{
            borderColor: active ? EMT.brandBlue : '#D1D1D1',
            backgroundColor: active ? EMT.brandBlue : 'white',
          }}
        />
        <div className="w-px flex-1 bg-emt-border" style={{ minHeight: '3rem' }} />
      </div>
      <div className="flex-1 pb-4">
        {date && <p className="text-[10px] text-emt-muted">{date}</p>}
        <p className="text-[12px] font-bold text-emt-ink">{title}</p>
        {description && <p className="mt-1 text-[10px] leading-relaxed text-emt-muted">{description}</p>}
      </div>
    </div>
  );
}

export default function VisaDestinationScreen({ form, onChange, onBack, onStartApplication }) {
  const dest = DESTINATIONS.find((d) => d.id === form.destination) || DESTINATIONS[0];
  const estimated = getEstimatedDateLabel();

  return (
    <VisaShell onBack={onBack}>
      <div
        className="px-4 py-5 text-white"
        style={{ background: 'linear-gradient(180deg, #4A5568 0%, #2D3748 100%)' }}
      >
        <button type="button" onClick={onBack} className="press mb-3 flex items-center gap-1 text-[12px]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" />
          </svg>
          Back
        </button>
        <h1 className="text-[22px] font-bold">{dest.label}</h1>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="overflow-hidden rounded-2xl border-2 shadow-sm" style={{ borderColor: EMT.brandBlue }}>
          <EstimatedDateBanner dateLabel={estimated} />
          <div className="space-y-3 bg-white p-4">
            <TravellerStepper
              count={form.travellers}
              onChange={(n) => onChange({ travellers: n })}
            />
            <OrangeButton onClick={onStartApplication}>Start Application</OrangeButton>
            <p className="flex items-center justify-center gap-1 text-[10px]" style={{ color: '#00A651' }}>
              <span>✓</span> Best Price Guaranteed
            </p>
          </div>
        </div>

        <PaymentLogos />

        <div className="rounded-2xl border border-emt-border bg-white p-4">
          <h3 className="text-[15px] font-bold text-emt-ink">Visa Type</h3>
          <p className="mt-1 text-[11px] text-emt-muted">
            Kindly select your preferred visa type as per the requirement.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[10px] text-emt-muted">Select Visa Type</span>
              <select
                value={form.visaType}
                onChange={(e) => onChange({ visaType: e.target.value })}
                className="w-full rounded-lg border border-emt-border bg-gray-50 px-3 py-2.5 text-[13px]"
              >
                <option>Tourist</option>
                <option>Business</option>
                <option>Transit</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] text-emt-muted">Select Duration</span>
              <select
                value={form.duration}
                onChange={(e) => onChange({ duration: e.target.value })}
                className="w-full rounded-lg border border-emt-border bg-gray-50 px-3 py-2.5 text-[13px]"
              >
                <option value="5">5</option>
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="90">90</option>
              </select>
            </label>
          </div>
          <div className="mt-3">
            <label className="block">
              <span className="mb-1 block text-[10px] text-emt-muted">Select Entry Type</span>
              <select
                value={form.entryType}
                onChange={(e) => onChange({ entryType: e.target.value })}
                className="w-full rounded-lg border border-emt-border bg-gray-50 px-3 py-2.5 text-[13px]"
              >
                <option>Single</option>
                <option>Multiple</option>
              </select>
            </label>
          </div>
        </div>

        <div
          className="space-y-3 rounded-2xl border p-4"
          style={{ borderColor: '#F5C6A0', backgroundColor: '#FFF8F0' }}
        >
          <div className="flex gap-3">
            <span className="text-xl">🕐</span>
            <div>
              <p className="text-[12px] font-bold text-emt-ink">Validity Period: {form.duration} Days</p>
              <p className="text-[10px] text-emt-muted">This number presents the validity of your visa.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-xl">🚪</span>
            <div>
              <p className="text-[12px] font-bold text-emt-ink">Entry Type: {form.entryType} Entry</p>
              <p className="text-[10px] text-emt-muted">You can enter the country only once.</p>
            </div>
          </div>
        </div>

        <div
          className="flex gap-2 rounded-lg border-l-4 px-3 py-2.5"
          style={{ backgroundColor: '#FFFDE7', borderColor: '#F9A825' }}
        >
          <span className="text-sm">ℹ️</span>
          <p className="text-[10px] leading-relaxed text-emt-ink">
            <strong>Disclaimer:</strong> Visa fees and required documents may change at any time without prior notice.
          </p>
        </div>

        <div>
          <h3 className="text-[15px] font-bold text-emt-ink">Application Process</h3>
          <p className="mt-1 text-[11px] text-emt-muted">
            Check-out all the steps that are involved in visa application processing.
          </p>
          <div className="mt-3 space-y-3">
            <ProcessStep step="01" title="Apply Online" description="Visit our exclusive platform and fill in the required details hassle-free to meet criteria." icon="📋" />
            <ProcessStep step="02" title="Get An Appointment" description="Receive an appointment schedule & meet our professionals for guidance." icon="📅" />
            <ProcessStep step="03" title="Submit Document" description="Send us all the relevant documents to verify and process your visa application." icon="📤" />
            <ProcessStep step="04" title="Receive Your Visa" description="Once approved, you'll receive your visas instantly with our efficient procedure." icon="🛂" />
          </div>
        </div>

        <div className="rounded-2xl border border-emt-border bg-white p-4">
          <h3 className="text-[15px] font-bold text-emt-ink">Track Your Visa Timeline</h3>
          <p className="mt-1 text-[11px] text-emt-muted">Stay updated on your Visa application progress right here.</p>
          <div className="mt-4">
            <TimelineItem
              date="15 Jul 2026 (Today)"
              title="You provide us with your documents"
              active
            />
            <TimelineItem
              title="EMT systems verify these documents"
              description="EMT systems verify these documents & submit to the Department of Immigration."
            />
            <TimelineItem
              title="Government Relations Team processes"
              description="EMT Government Relations Team works with local authorities to ensure you get your visa on time."
            />
            <TimelineItem
              title="Track Progress in Real Time"
              description="Application has been sent to immigration authorities for review."
            />
          </div>
        </div>
      </div>
    </VisaShell>
  );
}
