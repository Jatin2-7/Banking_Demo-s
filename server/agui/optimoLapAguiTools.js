import { OPTIMO_LAP_FIELD_IDS } from './optimoLapAguiConfig.js';
import { normalizeLapMoneyField } from './optimoMoneyParse.js';

const MONEY_FIELDS = new Set(['loan_amount', 'property_value', 'business_revenue', 'business_profit']);

function validateField(fieldId, raw) {
  const value = raw == null ? '' : String(raw).trim();
  switch (fieldId) {
    case 'mobile':
      if (!/^\d{10}$/.test(value.replace(/\D/g, ''))) return 'Mobile must be 10 digits.';
      return null;
    case 'name':
      if (value.length < 2) return 'Enter full name (min 2 characters).';
      return null;
    case 'business_name':
      if (!value) return 'Business name is required.';
      return null;
    case 'loan_amount':
    case 'property_value':
    case 'business_revenue': {
      const n = Number(value);
      if (!value || Number.isNaN(n) || n <= 0) return 'Must be a positive number.';
      return null;
    }
    case 'property_pincode':
      if (!/^\d{6}$/.test(value.replace(/\D/g, ''))) return 'Pincode must be 6 digits.';
      return null;
    case 'business_profit': {
      if (value === '') return 'Business profit is required (0 allowed).';
      const n = Number(value);
      if (Number.isNaN(n) || n < 0) return 'Profit must be 0 or greater.';
      return null;
    }
    default:
      return `Unknown field: ${fieldId}`;
  }
}

function normalizeValue(fieldId, raw, userContext = '') {
  const value = raw == null ? '' : String(raw).trim();
  if (fieldId === 'mobile') return value.replace(/\D/g, '').slice(0, 10);
  if (fieldId === 'property_pincode') return value.replace(/\D/g, '').slice(0, 6);
  if (MONEY_FIELDS.has(fieldId)) return normalizeLapMoneyField(fieldId, value, userContext);
  return value;
}

export function runValidateForm(state) {
  const errors = {};
  const missing = [];
  for (const id of OPTIMO_LAP_FIELD_IDS) {
    const v = state[id];
    if (v == null || String(v).trim() === '') {
      missing.push(id);
      errors[id] = 'Required.';
      continue;
    }
    const err = validateField(id, v);
    if (err) errors[id] = err;
  }
  return { valid: Object.keys(errors).length === 0, errors, missing };
}

export function executeOptimoLapTool(toolName, args, state, { lastUserMessage = '' } = {}) {
  switch (toolName) {
    case 'set_field': {
      const { field_id, value } = args;
      if (!OPTIMO_LAP_FIELD_IDS.includes(field_id)) {
        return { result: { ok: false, error: `Unknown field_id: ${field_id}` }, statePatches: [] };
      }
      const normalized = normalizeValue(field_id, value, lastUserMessage);
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
    case 'validate_form':
      return { result: runValidateForm(state), statePatches: [] };
    case 'click_button': {
      const action = args.action || args.button || 'apply_now';
      return {
        result: { ok: true, action },
        statePatches: [{ op: 'replace', path: '/__action', value: action }],
      };
    }
    default:
      return { result: { ok: false, error: `Unknown tool: ${toolName}` }, statePatches: [] };
  }
}

export function optimoLapOpenAiTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'set_field',
        description: 'Set a LAP application form field.',
        parameters: {
          type: 'object',
          properties: {
            field_id: { type: 'string', enum: OPTIMO_LAP_FIELD_IDS },
            value: { type: 'string' },
          },
          required: ['field_id', 'value'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'validate_form',
        description: 'Check all required fields.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'click_button',
        description: 'Submit the application when form is complete.',
        parameters: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['apply_now'] },
          },
          required: ['action'],
        },
      },
    },
  ];
}
