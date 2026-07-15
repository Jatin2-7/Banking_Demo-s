import { IMPS_FIELD_IDS } from './impsAguiConfig.js';

function validateFieldValue(fieldId, raw) {
  const value = raw == null ? '' : String(raw).trim();
  switch (fieldId) {
    case 'transferType':
      if (!['within', 'other'].includes(value)) return "transferType must be 'within' or 'other'.";
      return null;
    case 'payeeType':
      if (!['account', 'mobile'].includes(value)) return "payeeType must be 'account' or 'mobile'.";
      return null;
    case 'payeeName':
      if (value.length < 2) return 'Payee name must be at least 2 characters.';
      return null;
    case 'payeeAccountNo':
      if (!/^\d{9,18}$/.test(value.replace(/\s/g, '')))
        return 'Account number must be 9–18 digits.';
      return null;
    case 'ifsc':
      if (!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(value.replace(/\s/g, '')))
        return 'IFSC must be 11 chars: 4 letters, digit 0, then 6 alphanumeric (e.g. IDIB000A001).';
      return null;
    case 'payeeBank':
      if (value.length < 2) return 'Payee bank name must be at least 2 characters.';
      return null;
    case 'mobileNo':
      if (!/^\d{10}$/.test(value.replace(/\s/g, '')))
        return 'Mobile number must be exactly 10 digits.';
      return null;
    case 'amount': {
      const n = Number(value);
      if (!value || Number.isNaN(n) || n <= 0) return 'Amount must be a positive number.';
      return null;
    }
    case 'remarks':
      if (value.length > 50) return 'Remarks must be 50 characters or fewer.';
      return null;
    default:
      return `Unknown field: ${fieldId}`;
  }
}

export function impsOpenAiTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'set_field',
        description: 'Set a fund transfer form field. Use exact field IDs from the system prompt.',
        parameters: {
          type: 'object',
          properties: {
            field_id: { type: 'string', enum: IMPS_FIELD_IDS },
            value: { type: 'string', description: 'New value for the field.' },
          },
          required: ['field_id', 'value'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'validate_form',
        description:
          'Return missing required fields and validation errors for the current form state.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'submit_transfer',
        description: 'Advance to the review/confirm step when form is valid and user confirms.',
        parameters: { type: 'object', properties: {} },
      },
    },
  ];
}

function getRequiredFields(state) {
  const tt = state.transferType || 'within';
  const pt = state.payeeType || 'account';
  if (tt === 'within') return ['payeeName', 'payeeAccountNo', 'amount'];
  if (pt === 'account') return ['payeeAccountNo', 'ifsc', 'amount'];
  return ['payeeBank', 'mobileNo', 'amount'];
}

export function runImpsValidateForm(state) {
  const missing = [];
  const errors = [];
  const required = getRequiredFields(state);
  for (const id of required) {
    const v = state[id];
    const empty = v == null || (typeof v === 'string' && v.trim() === '');
    if (empty) {
      missing.push(id);
    } else {
      const err = validateFieldValue(id, v);
      if (err) errors.push({ field_id: id, message: err });
    }
  }
  return {
    ok: missing.length === 0 && errors.length === 0,
    required_for_current_path: required,
    missing_required: missing,
    field_errors: errors,
  };
}

export function executeImpsTool(name, args, state) {
  if (name === 'set_field') {
    const field_id = args.field_id;
    const value = args.value != null ? String(args.value).trim() : '';
    const err = validateFieldValue(field_id, value);
    if (err) return { result: { ok: false, field_id, error: err }, statePatches: [] };
    state[field_id] = value;
    return {
      result: { ok: true, field_id, value },
      statePatches: [{ op: 'replace', path: `/${field_id}`, value }],
    };
  }
  if (name === 'validate_form') {
    return { result: runImpsValidateForm(state), statePatches: [] };
  }
  if (name === 'submit_transfer') {
    const v = runImpsValidateForm(state);
    if (!v.ok) return { result: { ok: false, ...v }, statePatches: [] };
    return { result: { ok: true, action: 'submit' }, statePatches: [] };
  }
  return { result: { ok: false, error: `unknown tool ${name}` }, statePatches: [] };
}
