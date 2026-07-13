import {
  ABCD_PL_FIELD_IDS,
  ABCD_PL_GENDER,
  ABCD_PL_EMPLOYMENT,
} from './abcdPersonalLoanConfig.js';

function validateField(fieldId, raw, journeyStep = 'landing') {
  const value = raw == null ? '' : String(raw).trim();
  switch (fieldId) {
    case 'pan':
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(value))
        return 'PAN must be ABCDE1234F format (5 letters, 4 digits, 1 letter).';
      return null;
    case 'gender':
      if (!ABCD_PL_GENDER.includes(value)) return `gender must be: ${ABCD_PL_GENDER.join(', ')}`;
      return null;
    case 'dob':
      if (value.length < 8) return 'Date of birth required (DD/MM/YYYY).';
      return null;
    case 'employment':
      if (!ABCD_PL_EMPLOYMENT.includes(value))
        return `employment must be: ${ABCD_PL_EMPLOYMENT.join(', ')}`;
      return null;
    case 'monthlyIncome': {
      const n = Number(String(value).replace(/\D/g, ''));
      if (!n || n < 10000) return 'Minimum monthly income is ₹10,000.';
      return null;
    }
    case 'pincode':
      if (!/^\d{6}$/.test(value)) return 'Pincode must be 6 digits.';
      return null;
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Valid email required.';
      return null;
    default:
      return `Unknown field: ${fieldId}`;
  }
}

function requiredForStep(step) {
  if (step === 'landing') return ['pan'];
  if (step === 'basic') return ['pan', 'gender', 'dob', 'employment', 'monthlyIncome', 'pincode', 'email'];
  return [];
}

export function runValidateForm(state) {
  const step = state.journeyStep || 'landing';
  const required = requiredForStep(step);
  const errors = {};
  const missing = [];
  for (const id of required) {
    const v = state[id];
    if (v == null || String(v).trim() === '') {
      missing.push(id);
      continue;
    }
    const err = validateField(id, v, step);
    if (err) errors[id] = err;
  }
  return { valid: missing.length === 0 && Object.keys(errors).length === 0, errors, missing, step };
}

export function executeAbcdPersonalLoanTool(toolName, args, state) {
  switch (toolName) {
    case 'set_field': {
      const { field_id, value } = args;
      if (!ABCD_PL_FIELD_IDS.includes(field_id)) {
        return { result: { ok: false, error: `Unknown field_id: ${field_id}` }, statePatches: [] };
      }
      let normalized = String(value).trim();
      if (field_id === 'pan') normalized = normalized.toUpperCase();
      if (field_id === 'monthlyIncome') normalized = String(normalized).replace(/\D/g, '');
      const err = validateField(field_id, normalized, state.journeyStep);
      if (err) {
        return { result: { ok: false, field_id, error: err }, statePatches: [] };
      }
      state[field_id] = normalized;
      return {
        result: { ok: true, field_id, value: state[field_id] },
        statePatches: [{ op: 'replace', path: `/${field_id}`, value: state[field_id] }],
      };
    }
    case 'request_field':
      return { result: { ok: true, action: 'highlight', field_id: args.field_id }, statePatches: [] };
    case 'validate_form':
      return { result: runValidateForm(state), statePatches: [] };
    case 'click_button': {
      const action = args.action || args.button || 'continue';
      return {
        result: { ok: true, action },
        statePatches: [{ op: 'replace', path: '/__action', value: action }],
      };
    }
    default:
      return { result: { ok: false, error: `Unknown tool: ${toolName}` }, statePatches: [] };
  }
}

export function abcdPersonalLoanOpenAiTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'set_field',
        description: 'Update a visible field on the ABCD personal loan screen.',
        parameters: {
          type: 'object',
          properties: {
            field_id: { type: 'string', enum: ABCD_PL_FIELD_IDS },
            value: { type: 'string' },
          },
          required: ['field_id', 'value'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'request_field',
        description: 'Highlight a field the user should focus on.',
        parameters: {
          type: 'object',
          properties: { field_id: { type: 'string', enum: ABCD_PL_FIELD_IDS } },
          required: ['field_id'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'validate_form',
        description: 'Check missing/invalid fields for the current journey step.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'click_button',
        description: 'Advance the journey: continue, got_it, verify_details, apply_now, or back.',
        parameters: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['continue', 'got_it', 'verify_details', 'apply_now', 'back'],
            },
          },
          required: ['action'],
        },
      },
    },
  ];
}
