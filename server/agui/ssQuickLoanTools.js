import {
  SS_QUICKLOAN_FIELD_IDS,
  SS_QUICKLOAN_PROPERTY_TYPE_OPTIONS,
  SS_QUICKLOAN_EMPLOYMENT_OPTIONS,
} from './ssQuickLoanConfig.js';

// ── Validation ──────────────────────────────────────────────────────────────

function validateField(fieldId, raw) {
  const value = raw == null ? '' : String(raw).trim();
  switch (fieldId) {
    case 'property_address':
      if (!value) return 'Property address is required.';
      if (value.length < 10) return 'Please enter the full address including city, state and PIN.';
      return null;

    case 'loan_amount': {
      const n = Number(value);
      if (!value || Number.isNaN(n) || n <= 0) return 'Loan amount must be a positive number.';
      if (n < 500000) return 'Minimum loan amount is ₹5,00,000 (500000).';
      if (n > 50000000) return 'Maximum loan amount is ₹5,00,00,000 (50000000).';
      return null;
    }

    case 'pan_number':
      if (!value) return 'PAN number is required.';
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value))
        return 'PAN must be 10 characters: ABCDE1234F format (5 uppercase letters, 4 digits, 1 uppercase letter).';
      return null;

    case 'property_type':
      if (!SS_QUICKLOAN_PROPERTY_TYPE_OPTIONS.includes(value))
        return `property_type must be one of: ${SS_QUICKLOAN_PROPERTY_TYPE_OPTIONS.join(', ')}.`;
      return null;

    case 'employment_status':
      if (!SS_QUICKLOAN_EMPLOYMENT_OPTIONS.includes(value))
        return `employment_status must be one of: ${SS_QUICKLOAN_EMPLOYMENT_OPTIONS.join(', ')}.`;
      return null;

    case 'salary_amount': {
      const n = Number(value);
      if (!value || Number.isNaN(n) || n <= 0) return 'Monthly income must be a positive number.';
      if (n < 15000) return 'Minimum monthly income is ₹15,000.';
      return null;
    }

    case 'company_name':
      if (!value) return 'Employer / company name is required.';
      return null;

    case 'employment_years': {
      const n = parseFloat(value);
      if (!value || Number.isNaN(n) || n < 0) return 'Employment years must be 0 or greater.';
      if (n > 50) return 'Employment years cannot exceed 50.';
      return null;
    }

    default:
      return `Unknown field: ${fieldId}`;
  }
}

// ── Validation summary ──────────────────────────────────────────────────────

export function runValidateForm(state) {
  const errors = {};
  const missing = [];
  for (const id of SS_QUICKLOAN_FIELD_IDS) {
    if (id === 'salary_amount' || id === 'company_name' || id === 'employment_years') {
      // Step 2 fields — only validate if user is on income page
      const v = state[id];
      if (v == null || String(v).trim() === '') continue;
    }
    const err = validateField(id, state[id]);
    if (err) {
      errors[id] = err;
      if (!state[id] || String(state[id]).trim() === '') missing.push(id);
    }
  }
  return { valid: Object.keys(errors).length === 0, errors, missing };
}

// ── Tool execution ──────────────────────────────────────────────────────────

export function executeSSQuickLoanTool(toolName, args, state) {
  switch (toolName) {
    case 'set_field': {
      const { field_id, value } = args;
      if (!SS_QUICKLOAN_FIELD_IDS.includes(field_id)) {
        return {
          result: { ok: false, error: `Unknown field_id: ${field_id}` },
          statePatches: [],
        };
      }
      const err = validateField(field_id, value);
      if (err) {
        return {
          result: { ok: false, field_id, error: err },
          statePatches: [],
        };
      }
      state[field_id] = String(value).trim();
      return {
        result: { ok: true, field_id, value: state[field_id] },
        statePatches: [{ op: 'replace', path: `/${field_id}`, value: state[field_id] }],
      };
    }

    case 'request_field': {
      const { field_id } = args;
      return {
        result: { ok: true, action: 'highlight', field_id },
        statePatches: [],
      };
    }

    case 'validate_form': {
      const validation = runValidateForm(state);
      return { result: validation, statePatches: [] };
    }

    case 'click_button': {
      const action = args.action || args.button || 'next';
      return {
        result: { ok: true, action },
        statePatches: [{ op: 'replace', path: '/__action', value: action }],
      };
    }

    default:
      return { result: { ok: false, error: `Unknown tool: ${toolName}` }, statePatches: [] };
  }
}

// ── OpenAI tool schemas ─────────────────────────────────────────────────────

export function ssQuickLoanOpenAiTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'set_field',
        description:
          'Set a form field value. For dropdowns (property_type, employment_status), use the exact option string listed in the system prompt.',
        parameters: {
          type: 'object',
          properties: {
            field_id: {
              type: 'string',
              enum: SS_QUICKLOAN_FIELD_IDS,
              description: 'The field ID to update.',
            },
            value: {
              type: 'string',
              description:
                'New value. Numbers as digit strings (no commas, no currency symbols). Dropdowns as exact option strings.',
            },
          },
          required: ['field_id', 'value'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'request_field',
        description:
          "Highlight a specific field on screen and bring it to the user's attention while you explain what to enter.",
        parameters: {
          type: 'object',
          properties: {
            field_id: {
              type: 'string',
              enum: SS_QUICKLOAN_FIELD_IDS,
            },
          },
          required: ['field_id'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'validate_form',
        description:
          'Return a summary of all fields that are still missing or have validation errors. Call this before suggesting the user proceed to the next step.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'click_button',
        description:
          'Simulate clicking the Continue / Next button to advance the form. Only call this when all required fields are valid.',
        parameters: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['next', 'back'],
              description: '"next" advances to the next step; "back" goes to the previous step.',
            },
          },
          required: ['action'],
        },
      },
    },
  ];
}
