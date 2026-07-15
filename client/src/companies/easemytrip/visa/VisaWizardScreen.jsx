import React from 'react';
import VisaShell, { OrangeButton, EstimatedDateBanner } from './VisaShell.jsx';
import { VISA_STEPS, STEP_LABELS, stepIndex } from './visaJourney.js';
import { EMT } from '../theme.js';

function StepIndicator({ currentStep }) {
  const idx = stepIndex(currentStep);
  const labels = ['Completed', 'In Process', 'Pending', 'Pending'];

  return (
    <div className="border-b border-emt-borderLight bg-white px-3 py-4">
      <button type="button" className="press mb-3 flex items-center gap-1 text-[12px] text-emt-ink">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M15 19l-7-7 7-7" strokeLinecap="round" />
        </svg>
        Back
      </button>
      <p className="mb-3 text-[11px] font-medium text-emt-muted">Complete The Process In 4 Easy Steps</p>
      <div className="flex justify-between gap-1">
        {VISA_STEPS.map((step, i) => {
          const done = i < idx;
          const active = i === idx;
          const status = done ? 'Completed' : active ? 'In Process' : 'Pending';
          const badgeColor = done ? '#00A651' : active ? EMT.brandBlue : '#9CA3AF';
          return (
            <div key={step} className="flex flex-1 flex-col items-center">
              <div
                className="mb-1 flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm"
                style={{
                  borderColor: badgeColor,
                  backgroundColor: done ? '#E8F5E9' : active ? '#E8F3FF' : 'white',
                  color: badgeColor,
                }}
              >
                {done ? '✓' : i + 1}
              </div>
              <p className="text-center text-[8px] font-semibold leading-tight text-emt-ink">
                {STEP_LABELS[step]}
              </p>
              <span
                className="mt-0.5 rounded-full px-1.5 py-0.5 text-[7px] font-bold text-white"
                style={{ backgroundColor: badgeColor }}
              >
                {status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UploadPhotoStep({ form, onChange, onNext }) {
  return (
    <div className="mx-4 mt-4 rounded-2xl border border-emt-border bg-white p-4 shadow-sm">
      <div
        className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-white"
        style={{ backgroundColor: EMT.brandBlue }}
      >
        <span className="text-sm">👍</span>
        <div>
          <p className="text-[9px] opacity-90">Estimated Date</p>
          <p className="text-[11px] font-bold">{form.departureDateLabel || '30 Jul 2026, 06:33 PM'}</p>
        </div>
      </div>
      <p className="text-right text-[10px] font-medium text-red-500">{form.travellers}/ Adult Added</p>
      <h3 className="mt-3 text-[14px] font-bold text-emt-ink">Click or Upload Your Photo</h3>
      <div className="mt-3 border-b-2 pb-1" style={{ borderColor: EMT.brandBlue }}>
        <span className="text-[12px] font-semibold" style={{ color: EMT.brandBlue }}>
          Adult 1
        </span>
      </div>
      <button
        type="button"
        onClick={() => onChange({ photoUploaded: true })}
        className="press mt-4 flex h-40 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-emt-border bg-gray-50"
      >
        {form.photoUploaded ? (
          <>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emt-blue/10 text-3xl">👤</div>
            <p className="mt-2 text-[11px] font-medium text-green-600">Photo uploaded ✓</p>
          </>
        ) : (
          <>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={EMT.muted} strokeWidth="1.5">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="12" cy="11" r="3" />
              <path d="M8 19l2-3h4l2 3" />
            </svg>
            <p className="mt-2 text-[11px] text-emt-muted">Tap to upload photo</p>
          </>
        )}
      </button>
      {form.photoUploaded && (
        <div className="mt-4">
          <OrangeButton onClick={onNext}>Continue</OrangeButton>
        </div>
      )}
    </div>
  );
}

function ScanPassportStep({ form, onChange, onNext }) {
  return (
    <div className="mx-4 mt-4 rounded-2xl border border-emt-border bg-white p-4 shadow-sm">
      <h3 className="text-[14px] font-bold text-emt-ink">Scan Your Passport</h3>
      <p className="mt-1 text-[11px] text-emt-muted">Position your passport within the frame for automatic scanning.</p>
      <button
        type="button"
        onClick={() => onChange({ passportScanned: true })}
        className="press mt-4 flex h-48 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-emt-border bg-gray-50"
      >
        {form.passportScanned ? (
          <>
            <span className="text-4xl">🛂</span>
            <p className="mt-2 text-[11px] font-medium text-green-600">Passport scanned ✓</p>
            <p className="text-[10px] text-emt-muted">AB1234567 · Valid until 2030</p>
          </>
        ) : (
          <>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={EMT.muted} strokeWidth="1.2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <circle cx="8" cy="10" r="2" />
              <path d="M14 8h4M14 12h4M14 16h2" />
            </svg>
            <p className="mt-2 text-[11px] text-emt-muted">Tap to scan passport</p>
          </>
        )}
      </button>
      {form.passportScanned && (
        <div className="mt-4">
          <OrangeButton onClick={onNext}>Continue</OrangeButton>
        </div>
      )}
    </div>
  );
}

function TravellerDetailsStep({ form, onChange, onSubmit }) {
  return (
    <div className="mx-4 mt-4 rounded-2xl border border-emt-border bg-white p-4 shadow-sm">
      <h3 className="text-[14px] font-bold text-emt-ink">Traveller Details</h3>
      <p className="mt-1 text-[11px] text-emt-muted">Enter details as per your passport.</p>
      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-emt-ink">Full Name *</span>
          <input
            type="text"
            value={form.travellerName}
            onChange={(e) => onChange({ travellerName: e.target.value })}
            placeholder="As per passport"
            className="w-full rounded-lg border border-emt-border px-3 py-2.5 text-[13px] outline-none focus:border-emt-blue"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-emt-ink">Passport Number *</span>
          <input
            type="text"
            value={form.travellerPassport}
            onChange={(e) => onChange({ travellerPassport: e.target.value.toUpperCase() })}
            placeholder="e.g. A1234567"
            className="w-full rounded-lg border border-emt-border px-3 py-2.5 text-[13px] outline-none focus:border-emt-blue"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-emt-ink">Date of Birth *</span>
          <input
            type="text"
            value={form.travellerDob}
            onChange={(e) => onChange({ travellerDob: e.target.value })}
            placeholder="DD/MM/YYYY"
            className="w-full rounded-lg border border-emt-border px-3 py-2.5 text-[13px] outline-none focus:border-emt-blue"
          />
        </label>
      </div>
      <div className="mt-4">
        <OrangeButton
          onClick={onSubmit}
          disabled={!form.travellerName || !form.travellerPassport || !form.travellerDob}
        >
          Submit Application
        </OrangeButton>
      </div>
    </div>
  );
}

function SelectDateStep({ form }) {
  return (
    <div className="mx-4 mt-4 rounded-2xl border border-emt-border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">✓</span>
        <div>
          <p className="text-[12px] font-bold text-emt-ink">Departure Date Selected</p>
          <p className="text-[11px] text-emt-muted">
            {form.departureDateLabel || `15 Jul 2026`}
          </p>
        </div>
      </div>
      <p className="mt-4 text-center text-[11px] text-emt-muted">Proceeding to upload picture...</p>
    </div>
  );
}

export default function VisaWizardScreen({
  form,
  onChange,
  onBack,
  onNextStep,
  onSubmit,
  onRegisterToolHandler,
}) {
  const toolHandler = React.useCallback(
    (name, args) => {
      if (name === 'set_field' || name === 'select_option') {
        const fieldMap = {
          traveller_name: 'travellerName',
          traveller_passport: 'travellerPassport',
          traveller_dob: 'travellerDob',
          photo_uploaded: 'photoUploaded',
          passport_scanned: 'passportScanned',
          current_step: 'currentStep',
          travellers: 'travellers',
          visa_type: 'visaType',
          duration: 'duration',
          entry_type: 'entryType',
        };
        const key = fieldMap[args.field] || args.field;
        let val = args.value;
        if (key === 'photoUploaded' || key === 'passportScanned') val = val === 'true' || val === true;
        if (key === 'travellers') val = parseInt(val, 10);
        onChange({ [key]: val });
      } else if (name === 'click_button') {
        const btn = args.button;
        if (btn === 'upload_photo') onChange({ photoUploaded: true });
        if (btn === 'scan_passport') onChange({ passportScanned: true });
        if (btn === 'next_step') onNextStep();
        if (btn === 'submit_application') onSubmit();
      }
    },
    [onChange, onNextStep, onSubmit],
  );

  React.useEffect(() => {
    onRegisterToolHandler?.(toolHandler);
  }, [toolHandler, onRegisterToolHandler]);

  const step = form.currentStep;

  return (
    <VisaShell onBack={onBack}>
      <StepIndicator currentStep={step} />
      {step === 'select_date' && <SelectDateStep form={form} />}
      {step === 'upload_picture' && (
        <UploadPhotoStep form={form} onChange={onChange} onNext={onNextStep} />
      )}
      {step === 'scan_passport' && (
        <ScanPassportStep form={form} onChange={onChange} onNext={onNextStep} />
      )}
      {step === 'traveller_details' && (
        <TravellerDetailsStep form={form} onChange={onChange} onSubmit={onSubmit} />
      )}
    </VisaShell>
  );
}
