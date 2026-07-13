import React, { useCallback, useEffect, useState } from 'react';
import { OPTIMO, FONTS, CONTENT_MAX_W } from '../theme.js';
import OptimoHeader from '../components/OptimoHeader.jsx';
import HeroSection from '../components/HeroSection.jsx';
import LocationBadge from '../components/LocationBadge.jsx';
import ApplicationForm, {
  agentStateToFormPatch,
  createEmptyForm,
  formToAgentState,
  isFormComplete,
  isMobileValid,
} from '../components/ApplicationForm.jsx';

function collectErrors(form, consent) {
  const errors = [];
  if (!isMobileValid(form.mobile)) errors.push('Enter a valid 10-digit mobile number.');
  if (form.name.trim().length < 2) errors.push('Enter your full name.');
  if (!consent) errors.push('Please authorize Optimo Capital to reach out.');
  if (form.businessName.trim().length < 1) errors.push('Enter your business name.');
  if (!(Number(form.loanAmount) > 0)) errors.push('Enter the loan amount needed.');
  if (!(Number(form.propertyValue) > 0)) errors.push('Enter your property value.');
  if (!/^\d{6}$/.test(form.propertyPincode)) errors.push('Enter a valid 6-digit property pincode.');
  if (!(Number(form.businessRevenue) > 0)) errors.push('Enter your monthly business revenue.');
  if (form.businessProfit === '' || Number(form.businessProfit) < 0) {
    errors.push('Enter your monthly business profit.');
  }
  return errors;
}

export default function LapApplicationScreen({
  form,
  onFormChange,
  consent,
  onConsentChange,
  onApply,
  onBack,
  onRegisterApply,
  product = 'lap',
}) {
  const [errors, setErrors] = useState([]);
  const [applying, setApplying] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const canExpand = isMobileValid(form.mobile) && form.name.trim().length >= 2;

  useEffect(() => {
    if (canExpand) setExpanded(true);
  }, [canExpand]);

  const handleChange = useCallback(
    (field, value) => {
      onFormChange({ ...form, [field]: value });
      setErrors([]);
    },
    [form, onFormChange],
  );

  const handleApplyClick = useCallback(async () => {
    const nextErrors = collectErrors(form, consent);
    if (nextErrors.length > 0) {
      setErrors(nextErrors);
      return;
    }
    if (!isFormComplete(form)) return;

    setApplying(true);
    setErrors([]);
    await new Promise((r) => setTimeout(r, 800));
    setApplying(false);
    onApply?.();
  }, [form, consent, onApply]);

  useEffect(() => {
    onRegisterApply?.(handleApplyClick);
  }, [handleApplyClick, onRegisterApply]);

  const showIntroHero = !expanded || !canExpand;

  const productLabel =
    product === 'balance_transfer'
      ? 'LAP Balance Transfer'
      : product === 'top_up'
        ? 'LAP Top-Up'
        : 'Loan Against Property';

  return (
    <div style={{ backgroundColor: OPTIMO.bg, fontFamily: FONTS.body }}>
      <OptimoHeader />
      <div className="border-b border-[#E4E9EF] bg-white px-6 py-3">
        <div className="mx-auto flex items-center gap-3" style={{ maxWidth: CONTENT_MAX_W }}>
          <button
            type="button"
            onClick={onBack}
            className="text-[14px] font-medium text-[#64748B] transition hover:text-[#F15A29]"
          >
            ← Back to Home
          </button>
          <span className="text-[#CBD5E1]">|</span>
          <span className="text-[14px] font-semibold" style={{ color: OPTIMO.navy }}>
            {productLabel}
          </span>
        </div>
      </div>

      <main className="relative mx-auto px-6 pb-12 pt-8 sm:pt-10" style={{ maxWidth: CONTENT_MAX_W }}>
        <LocationBadge />

        {showIntroHero && (
          <div className="mb-8 sm:mb-10">
            <HeroSection consent={consent} onConsentChange={onConsentChange} />
          </div>
        )}

        {!showIntroHero && (
          <p className="mb-7 text-center sm:mb-9" style={{ fontFamily: FONTS.body, fontSize: 18, fontWeight: 500, color: OPTIMO.navy }}>
            Takes just <span style={{ fontSize: 26, fontWeight: 700, color: OPTIMO.orange }}>2 mins</span> to fill
          </p>
        )}

        <ApplicationForm
          form={form}
          onChange={handleChange}
          expanded={expanded}
          consent={consent}
          onApply={handleApplyClick}
          errors={errors}
          applying={applying}
        />
      </main>
    </div>
  );
}

export { collectErrors, formToAgentState, agentStateToFormPatch, createEmptyForm, isFormComplete };
