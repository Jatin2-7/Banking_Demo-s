// JSON-Schema for an Action Manifest. Strict-ish: unknown step types are
// allowed (forward-compat) but the well-known shapes are checked.
//
// Validated at registry load time. A malformed manifest fails the boot.

const stringExpr = { type: 'string' };
const stringOrPath = { type: 'string' };

const slotExtraction = {
  type: 'object',
  additionalProperties: true,
  properties: {
    coerce: { type: 'string', enum: ['number', 'string', 'boolean'] },
    enum: { type: 'array', items: { type: 'string' } },
    regex: { type: 'string' },
    strip: { type: 'array', items: { type: 'string' } },
    from_voice: { type: 'boolean' },
    llm: { type: 'boolean' },
    llm_hint: { type: 'string' },
    accept_freetext: { type: 'boolean' },
  },
};

const slotDef = {
  type: 'object',
  required: ['type'],
  additionalProperties: true,
  properties: {
    type: { type: 'string', enum: ['string', 'number', 'enum', 'object', 'boolean'] },
    required: { type: 'boolean' },
    enum: { type: 'array', items: { type: 'string' } },
    description: { type: 'string' },
    extraction: slotExtraction,
    constraints: {
      type: 'object',
      additionalProperties: true,
      properties: {
        min: { type: 'number' },
        max: { type: 'number' },
      },
    },
    resolve_via: { type: 'string' },
  },
};

const stepCommon = {
  type: 'object',
  required: ['id', 'type'],
  additionalProperties: true,
  properties: {
    id: { type: 'string' },
    type: { type: 'string' },
    skip_if: { type: 'string' },
  },
};

const stepDefinitions = {
  ask: {
    allOf: [
      stepCommon,
      {
        type: 'object',
        required: ['slot', 'prompt_key'],
        properties: {
          slot: { type: 'string' },
          prompt_key: { type: 'string' },
          prompt_args: { type: 'array' },
          kind: { type: 'string' },
        },
      },
    ],
  },
  default_fill: {
    allOf: [
      stepCommon,
      {
        type: 'object',
        required: ['slot'],
        properties: {
          slot: { type: 'string' },
          tool: { type: 'string' },
          input_map: { type: 'object', additionalProperties: true },
          value: {},
        },
      },
    ],
  },
  lookup: {
    allOf: [
      stepCommon,
      {
        type: 'object',
        required: ['tool', 'output_slot', 'label_template', 'prompt_key'],
        properties: {
          tool: { type: 'string' },
          input_map: { type: 'object', additionalProperties: true },
          output_slot: { type: 'string' },
          state_key: { type: 'string' },
          label_template: stringExpr,
          sublabel_template: stringExpr,
          kind: { type: 'string' },
          prompt_key: { type: 'string' },
          prompt_args: { type: 'array' },
          empty_prompt_key: { type: 'string' },
          empty_prompt_args: { type: 'array' },
          on_empty_goto: { type: 'string' },
          auto_select_if_single: { type: 'boolean' },
        },
      },
    ],
  },
  choose: {
    allOf: [
      stepCommon,
      {
        type: 'object',
        required: ['store_to_slot', 'label_template', 'prompt_key'],
        properties: {
          from: stringOrPath,
          from_state: { type: 'string' },
          tool: { type: 'string' },
          input_map: { type: 'object', additionalProperties: true },
          store_to_slot: { type: 'string' },
          label_template: stringExpr,
          sublabel_template: stringExpr,
          kind: { type: 'string' },
          prompt_key: { type: 'string' },
          prompt_args: { type: 'array' },
          empty_prompt_key: { type: 'string' },
          empty_prompt_args: { type: 'array' },
          on_empty_goto: { type: 'string' },
          clear_slots_on_empty: { type: 'array', items: { type: 'string' } },
          auto_select_if_single: { type: 'boolean' },
          exclude_path: { type: 'string' },
        },
      },
    ],
  },
  validate: {
    allOf: [
      stepCommon,
      {
        type: 'object',
        required: ['slot', 'rules', 'on_fail_goto'],
        properties: {
          slot: { type: 'string' },
          rules: {
            type: 'array',
            items: {
              type: 'object',
              required: ['type'],
              additionalProperties: true,
              properties: {
                type: {
                  type: 'string',
                  enum: ['positive', 'min', 'max', 'max_path', 'eq_path', 'not_eq_path', 'regex'],
                },
                value: {},
                path: { type: 'string' },
                msg_key: { type: 'string' },
                msg_args: { type: 'array' },
              },
            },
          },
          on_fail_goto: { type: 'string' },
          clear_on_fail: { type: 'boolean' },
          clear_slots_on_fail: { type: 'array', items: { type: 'string' } },
        },
      },
    ],
  },
  tool_call: {
    allOf: [
      stepCommon,
      {
        type: 'object',
        required: ['tool'],
        properties: {
          tool: { type: 'string' },
          input_map: { type: 'object', additionalProperties: true },
          output_key: { type: 'string' },
          output_slot: { type: 'string' },
          compensation: { type: 'string' },
          compensation_input_map: { type: 'object', additionalProperties: true },
          force_failable: { type: 'boolean' },
        },
      },
    ],
  },
  confirm: {
    allOf: [
      stepCommon,
      {
        type: 'object',
        required: ['prompt_key'],
        properties: {
          prompt_key: { type: 'string' },
          prompt_args: { type: 'array' },
          summary_template: stringExpr,
          details: {
            type: 'array',
            items: {
              type: 'object',
              required: ['label', 'value'],
              properties: {
                label: { type: 'string' },
                value: stringExpr,
              },
            },
          },
        },
      },
    ],
  },
  result: {
    allOf: [
      stepCommon,
      {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          success_key: { type: 'string' },
          args: { type: 'array' },
          text_template: stringExpr,
          from_state: { type: 'string' },
          item_template: stringExpr,
          join: { type: 'string' },
        },
      },
    ],
  },
};

export const manifestSchema = {
  $id: 'https://silversuits.dev/schema/action-manifest.json',
  type: 'object',
  required: ['action', 'version', 'params'],
  additionalProperties: true,
  properties: {
    action: { type: 'string', pattern: '^[a-z][a-z0-9_]*$' },
    version: { type: 'string' },
    description: { type: 'string' },
    max_turns: { type: 'integer', minimum: 1, maximum: 50 },

    params: {
      type: 'object',
      additionalProperties: slotDef,
    },

    strings: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        additionalProperties: { type: 'string' },
      },
    },

    steps: {
      type: 'array',
      minItems: 1,
      items: {
        anyOf: [
          stepDefinitions.ask,
          stepDefinitions.default_fill,
          stepDefinitions.lookup,
          stepDefinitions.choose,
          stepDefinitions.validate,
          stepDefinitions.tool_call,
          stepDefinitions.confirm,
          stepDefinitions.result,
          // forward-compat fallback for unknown step types — let runner handle.
          {
            type: 'object',
            required: ['id', 'type'],
            additionalProperties: true,
            properties: { id: { type: 'string' }, type: { type: 'string' } },
          },
        ],
      },
    },

    // legacy fields tolerated:
    dialogue: { type: 'object', additionalProperties: true },
    endpoint: { type: 'object', additionalProperties: true },
  },
};

export const STEP_TYPES = Object.keys(stepDefinitions);
