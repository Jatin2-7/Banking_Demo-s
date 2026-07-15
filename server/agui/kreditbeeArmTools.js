import { KB_ARM_FIELD_IDS } from './kreditbeeArmConfig.js';

function resolveNextJourneyStep(currentStep, value) {
  const v = String(value || '')
    .trim()
    .toLowerCase();
  switch (currentStep) {
    case 'terms':
      if (v === 'no')
        return { step: 'terms', error: 'You need to agree to continue with your application.' };
      return { step: 'aadhaar_consent' };
    case 'aadhaar_consent':
      if (v === 'no')
        return { step: 'aadhaar_consent', error: 'Aadhaar KYC is required to proceed.' };
      return { step: 'aadhaar_mobile_link' };
    case 'aadhaar_mobile_link':
      return { step: 'aadhaar_number' };
    case 'aadhaar_number':
      return { step: 'aadhaar_otp' };
    case 'aadhaar_otp':
      return { step: 'email' };
    case 'email':
      return { step: 'email_otp' };
    case 'email_otp':
      return { step: 'marital_status' };
    case 'marital_status':
      return { step: 'education' };
    case 'education':
      return { step: 'differently_abled' };
    case 'differently_abled':
      return { step: 'address_same' };
    case 'address_same':
      return { step: 'residence_type' };
    case 'residence_type':
      return { step: 'income_verify' };
    case 'income_verify':
      return { step: 'family_reference' };
    case 'family_reference':
      if (v === 'skip' || v === 'skip for now') return { step: 'friend_details' };
      return { step: 'family_mobile' };
    case 'family_mobile':
      return { step: 'friend_details' };
    case 'friend_details':
      return { step: 'success' };
    default:
      return { step: currentStep };
  }
}

function resolveSubmitNextStep(currentStep) {
  return resolveNextJourneyStep(currentStep, 'submit');
}

function validateField(fieldId, raw) {
  const value = raw == null ? '' : String(raw).trim();
  switch (fieldId) {
    case 'aadhaarNumber':
      if (!/^\d{12}$/.test(value.replace(/\D/g, ''))) return 'Aadhaar must be 12 digits.';
      return null;
    case 'aadhaarOtp':
    case 'emailOtp':
      if (!/^\d{6}$/.test(value.replace(/\D/g, ''))) return 'OTP must be 6 digits.';
      return null;
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Valid email required.';
      return null;
    case 'familyMobile':
    case 'friendMobile': {
      const d = value.replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(d)) return 'Mobile must be 10 digits starting with 6-9.';
      return null;
    }
    case 'friendName':
      if (value.length < 2) return 'Friend name required.';
      return null;
    default:
      return null;
  }
}

export function executeKreditbeeArmTool(toolName, args, state) {
  switch (toolName) {
    case 'set_field': {
      const { field_id, value } = args;
      if (!KB_ARM_FIELD_IDS.includes(field_id)) {
        return { result: { ok: false, error: `Unknown field_id: ${field_id}` }, statePatches: [] };
      }
      let normalized = String(value).trim();
      if (
        ['aadhaarNumber', 'aadhaarOtp', 'emailOtp', 'familyMobile', 'friendMobile'].includes(
          field_id,
        )
      ) {
        normalized = normalized.replace(/\D/g, '');
      }
      const err = validateField(field_id, normalized);
      if (err) {
        return { result: { ok: false, field_id, error: err }, statePatches: [] };
      }
      state[field_id] = normalized;
      return {
        result: { ok: true, field_id, value: state[field_id] },
        statePatches: [{ op: 'replace', path: `/${field_id}`, value: state[field_id] }],
      };
    }
    case 'select_option': {
      const { value } = args;
      const step = state.journeyStep || 'terms';
      const fieldMap = {
        terms: 'termsAccepted',
        aadhaar_consent: 'aadhaarConsent',
        aadhaar_mobile_link: 'aadhaarMobileLinked',
        marital_status: 'maritalStatus',
        education: 'education',
        differently_abled: 'differentlyAbled',
        address_same: 'addressSame',
        residence_type: 'residenceType',
        income_verify: 'incomeVerify',
        family_reference: 'familyReference',
      };
      const fid = fieldMap[step];
      const next = resolveNextJourneyStep(step, value);
      if (next.error) {
        return { result: { ok: false, error: next.error }, statePatches: [] };
      }
      if (fid) state[fid] = String(value).trim();
      state.journeyStep = next.step;
      const patches = [{ op: 'replace', path: '/__action', value: 'select_option' }];
      if (fid) patches.unshift({ op: 'replace', path: `/${fid}`, value: state[fid] });
      return {
        result: { ok: true, step, value: fid ? state[fid] : value, journeyStep: next.step },
        statePatches: patches,
      };
    }
    case 'submit_step': {
      const step = state.journeyStep || 'terms';
      const next = resolveSubmitNextStep(step);
      state.journeyStep = next.step;
      return {
        result: { ok: true, journeyStep: next.step },
        statePatches: [{ op: 'replace', path: '/__action', value: 'submit_step' }],
      };
    }
    case 'click_button':
      return {
        result: { ok: true, action: args.action || 'advance' },
        statePatches: [{ op: 'replace', path: '/__action', value: args.action || 'advance' }],
      };
    default:
      return { result: { ok: false, error: `Unknown tool: ${toolName}` }, statePatches: [] };
  }
}

export function kreditbeeArmOpenAiTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'set_field',
        description: 'Update a form field on the KreditBee ARM screen.',
        parameters: {
          type: 'object',
          properties: {
            field_id: { type: 'string', enum: KB_ARM_FIELD_IDS },
            value: { type: 'string' },
          },
          required: ['field_id', 'value'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'select_option',
        description: 'Select a quick-option answer for the current step.',
        parameters: {
          type: 'object',
          properties: { value: { type: 'string' } },
          required: ['value'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'submit_step',
        description: 'Submit the current digit/email/form step after fields are filled.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'click_button',
        description: 'Advance the journey.',
        parameters: {
          type: 'object',
          properties: { action: { type: 'string', enum: ['advance', 'back'] } },
        },
      },
    },
  ];
}
