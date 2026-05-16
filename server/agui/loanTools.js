import { LOAN_FIELD_IDS, isAllowedSelect } from './loanAgentConfig.js';

function validateFieldValue(fieldId, raw) {
  const value = raw == null ? '' : String(raw).trim();
  switch (fieldId) {
    case 'occupation':
    case 'subProduct':
    case 'purposeLoan':
    case 'variant':
    case 'facility':
    case 'proposal':
      if (!isAllowedSelect(fieldId, value)) return `Invalid option for ${fieldId}. Use allowed id.`;
      return null;
    case 'interestType':
      if (value && value !== 'floating') return 'Only "floating" is accepted.';
      return null;
    case 'loanAmount': {
      const n = Number(value);
      if (!value || Number.isNaN(n) || n <= 0) return 'Amount must be a positive number.';
      return null;
    }
    case 'tenureMonths': {
      const n = parseInt(value, 10);
      if (!/^\d+$/.test(value) || n < 1 || n > 360) return 'Tenure must be 1–360 months.';
      return null;
    }
    case 'branchPin':
      if (!/^\d{6}$/.test(value)) return 'Pincode must be exactly 6 digits.';
      return null;
    default:
      return `Unknown field: ${fieldId}`;
  }
}

export function loanOpenAiTools() {
  const fieldEnum = LOAN_FIELD_IDS;
  return [
    {
      type: 'function',
      function: {
        name: 'set_field',
        description:
          'Set a loan form field. Values for dropdowns must be exact option ids (see system prompt).',
        parameters: {
          type: 'object',
          properties: {
            field_id: { type: 'string', enum: fieldEnum },
            value: { type: 'string', description: 'New value for the field.' },
          },
          required: ['field_id', 'value'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'request_field',
        description: 'Ask the UI to highlight a field the user should focus on.',
        parameters: {
          type: 'object',
          properties: {
            field_id: { type: 'string', enum: fieldEnum },
          },
          required: ['field_id'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'validate_form',
        description: 'Return missing required fields and validation errors for the current state.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'click_button',
        description:
          'Simulate pressing submit or cancel in the assistant. submit = advance in the loan flow when valid.',
        parameters: {
          type: 'object',
          properties: {
            button: { type: 'string', enum: ['submit', 'cancel'] },
          },
          required: ['button'],
        },
      },
    },
  ];
}

const REQUIRED = [
  'occupation',
  'subProduct',
  'purposeLoan',
  'variant',
  'facility',
  'proposal',
  'loanAmount',
  'tenureMonths',
  'branchPin',
];

export function runValidateForm(state) {
  const missing = [];
  const errors = [];
  for (const id of REQUIRED) {
    const v = state[id];
    const empty = v == null || (typeof v === 'string' && v.trim() === '');
    if (empty) missing.push(id);
    else {
      const err = validateFieldValue(id, v);
      if (err) errors.push({ field_id: id, message: err });
    }
  }
  return {
    ok: missing.length === 0 && errors.length === 0,
    missing_required: missing,
    field_errors: errors,
  };
}

/**
 * @returns {{ result: object, statePatches: Array<{op:string,path:string,value?:unknown}> }}
 */
export function executeLoanTool(name, args, state) {
  if (name === 'set_field') {
    const field_id = args.field_id;
    const value = args.value != null ? String(args.value) : '';
    const err = validateFieldValue(field_id, value);
    if (err) {
      return {
        result: { ok: false, field_id, error: err },
        statePatches: [],
      };
    }
    state[field_id] = value;
    return {
      result: { ok: true, field_id, value },
      statePatches: [{ op: 'replace', path: `/${field_id}`, value }],
    };
  }
  if (name === 'request_field') {
    const field_id = args.field_id;
    return {
      result: { ok: true, field_id },
      statePatches: [],
    };
  }
  if (name === 'validate_form') {
    return {
      result: runValidateForm(state),
      statePatches: [],
    };
  }
  if (name === 'click_button') {
    const button = args.button;
    const v = runValidateForm(state);
    if (button === 'cancel') {
      return { result: { ok: true, button: 'cancel' }, statePatches: [] };
    }
    if (button === 'submit') {
      if (!v.ok) {
        return {
          result: {
            ok: false,
            button: 'submit',
            missing_required: v.missing_required,
            field_errors: v.field_errors,
          },
          statePatches: [],
        };
      }
      return { result: { ok: true, button: 'submit' }, statePatches: [] };
    }
  }
  return { result: { ok: false, error: `unknown tool ${name}` }, statePatches: [] };
}
