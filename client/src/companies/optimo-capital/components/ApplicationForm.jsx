import React, { useMemo } from 'react';
import { OPTIMO, FONTS } from '../theme.js';
import { MobileField, TextField, NumberField } from './FormFields.jsx';

const EMPTY_FORM = {
  mobile: '',
  name: '',
  businessName: '',
  loanAmount: '',
  propertyValue: '',
  propertyPincode: '',
  businessRevenue: '',
  businessProfit: '',
};

export function createEmptyForm() {
  return { ...EMPTY_FORM };
}

export function isMobileValid(mobile) {
  return /^\d{10}$/.test(String(mobile).replace(/\D/g, ''));
}

export function isFormComplete(form) {
  return (
    isMobileValid(form.mobile) &&
    form.name.trim().length >= 2 &&
    form.businessName.trim().length >= 1 &&
    Number(form.loanAmount) > 0 &&
    Number(form.propertyValue) > 0 &&
    /^\d{6}$/.test(form.propertyPincode) &&
    Number(form.businessRevenue) > 0 &&
    Number(form.businessProfit) >= 0
  );
}

export function formToAgentState(form) {
  return {
    mobile: form.mobile,
    name: form.name,
    business_name: form.businessName,
    loan_amount: form.loanAmount,
    property_value: form.propertyValue,
    property_pincode: form.propertyPincode,
    business_revenue: form.businessRevenue,
    business_profit: form.businessProfit,
  };
}

export function agentStateToFormPatch(values) {
  const patch = {};
  if (values.mobile != null) patch.mobile = String(values.mobile).replace(/\D/g, '').slice(0, 10);
  if (values.name != null) patch.name = String(values.name);
  if (values.business_name != null) patch.businessName = String(values.business_name);
  if (values.loan_amount != null) patch.loanAmount = String(values.loan_amount);
  if (values.property_value != null) patch.propertyValue = String(values.property_value);
  if (values.property_pincode != null) patch.propertyPincode = String(values.property_pincode).replace(/\D/g, '').slice(0, 6);
  if (values.business_revenue != null) patch.businessRevenue = String(values.business_revenue);
  if (values.business_profit != null) patch.businessProfit = String(values.business_profit);
  return patch;
}

export default function ApplicationForm({
  form,
  onChange,
  expanded,
  consent,
  onApply,
  errors,
  applying,
}) {
  const canExpand = isMobileValid(form.mobile) && form.name.trim().length >= 2;
  const showFull = expanded && canExpand;
  const applyDisabled = !isFormComplete(form) || !consent || applying;

  return (
    <div className="w-full">
      <div
        className="w-full rounded-[14px] bg-white px-8 py-8 sm:px-10 sm:py-9"
        style={{ boxShadow: '0 2px 20px rgba(15, 23, 42, 0.06)' }}
      >
        <div className="grid w-full grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          <MobileField value={form.mobile} onChange={(v) => onChange('mobile', v)} />
          <TextField
            label="Name"
            value={form.name}
            onChange={(v) => onChange('name', v)}
            placeholder="Enter your full name"
            prefilled={showFull && form.name.trim().length > 0}
          />

          {showFull && (
            <>
              <TextField
                label="Business Name"
                value={form.businessName}
                onChange={(v) => onChange('businessName', v)}
                placeholder="Enter your business name"
                prefilled={form.businessName.trim().length > 0}
              />
              <NumberField
                label="Loan Amount Needed"
                value={form.loanAmount}
                onChange={(v) => onChange('loanAmount', v)}
                placeholder="Enter loan amount needed"
              />
              <NumberField
                label="Your Property Value"
                value={form.propertyValue}
                onChange={(v) => onChange('propertyValue', v)}
                placeholder="Enter your property value"
              />
              <TextField
                label="Property Pincode"
                value={form.propertyPincode}
                onChange={(v) => onChange('propertyPincode', v.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter your property pincode"
                type="text"
              />
              <NumberField
                label="Business Revenue (monthly)"
                value={form.businessRevenue}
                onChange={(v) => onChange('businessRevenue', v)}
                placeholder="Enter your business revenue"
              />
              <NumberField
                label="Business Profit (monthly)"
                value={form.businessProfit}
                onChange={(v) => onChange('businessProfit', v)}
                placeholder="Enter your business profit"
              />
            </>
          )}
        </div>

        {errors?.length > 0 && (
          <ul className="mt-5 space-y-1 text-[13px] font-medium text-red-600" style={{ fontFamily: FONTS.body }}>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </div>

      {showFull && (
        <div className="mt-10 flex justify-center pb-16">
          <button
            type="button"
            disabled={applyDisabled}
            onClick={onApply}
            className="min-w-[300px] rounded-full px-14 py-[15px] text-[17px] font-bold text-white shadow-[0_4px_16px_rgba(229,84,53,0.35)] transition enabled:hover:brightness-[1.03] enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[340px]"
            style={{ backgroundColor: OPTIMO.orangeLight, fontFamily: FONTS.display }}
          >
            {applying ? 'Submitting…' : 'Apply Now'}
          </button>
        </div>
      )}
    </div>
  );
}

export function useFormExpansion(form) {
  return useMemo(
    () => isMobileValid(form.mobile) && form.name.trim().length >= 2,
    [form.mobile, form.name],
  );
}
