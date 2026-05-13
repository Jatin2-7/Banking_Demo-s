// Manifest registry — single source of truth for what the engine can do.
//
// Loads every JSON manifest from ./manifests, validates each against the
// JSON-schema in engine/manifestSchema.js (fail-loud at boot), and builds the
// LLM system prompt on demand from the union of every manifest's slots.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import { manifestSchema } from './engine/manifestSchema.js';
import { module_ } from './lib/log.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST_DIR = path.join(__dirname, 'manifests');
const log = module_('registry');

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(manifestSchema);

class Registry {
  constructor() {
    this.actions = new Map();
    this._promptCache = null;
    this.loadAll();
  }

  loadAll() {
    const files = fs.readdirSync(MANIFEST_DIR).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      const fullPath = path.join(MANIFEST_DIR, f);
      const raw = fs.readFileSync(fullPath, 'utf8');
      let m;
      try {
        m = JSON.parse(raw);
      } catch (e) {
        throw new Error(`[registry] ${f}: invalid JSON — ${e.message}`);
      }
      const ok = validate(m);
      if (!ok) {
        const errs = (validate.errors || [])
          .map((e) => `${e.instancePath || '/'} ${e.message}`)
          .join('; ');
        throw new Error(`[registry] ${f}: schema validation failed — ${errs}`);
      }
      validateStepReferences(m, f);
      this.actions.set(m.action, m);
    }
    this._promptCache = null;
    log.info({ count: this.actions.size, actions: [...this.actions.keys()] }, 'manifests loaded');
  }

  get(name) {
    return this.actions.get(name);
  }
  list() {
    return [...this.actions.values()];
  }
  names() {
    return [...this.actions.keys()];
  }

  // Invalidate the cached prompt — call this if you ever hot-reload a manifest.
  invalidatePrompt() {
    this._promptCache = null;
  }

  systemPrompt() {
    if (!this._promptCache) this._promptCache = buildSystemPrompt(this);
    return this._promptCache;
  }
}

// Cross-step validation Ajv can't do alone: every `*_goto` and `skip_if`
// reference must point at an existing step id.
function validateStepReferences(m, fileName) {
  if (!Array.isArray(m.steps)) return;
  const ids = new Set(m.steps.map((s) => s.id));
  for (const step of m.steps) {
    for (const k of ['on_empty_goto', 'on_fail_goto']) {
      if (step[k] && !ids.has(step[k])) {
        throw new Error(
          `[registry] ${fileName}: step "${step.id}" references unknown step id "${step[k]}" in ${k}`,
        );
      }
    }
  }
}

export const registry = new Registry();

// ── LLM system prompt builder ───────────────────────────────────
//
// Builds the SYSTEM prompt from the union of the loaded manifests:
//   - intent enum  = registry.names() ∪ {confirm, cancel, select, unknown}
//   - slot fields  = union of every manifest.params keyset
//   - per-action docs from manifest.description + params + extraction.llm_hint

function inferSlotJsonType(def) {
  if (def.type === 'number') return 'number';
  if (def.type === 'enum' && Array.isArray(def.enum)) {
    return def.enum.map((v) => `"${v}"`).join(' | ');
  }
  return 'string';
}

export function buildSystemPrompt(reg = registry) {
  const actionDocs = reg
    .list()
    .map((m) => {
      const params = Object.entries(m.params || {})
        .map(([k, v]) => {
          const req = v.required ? '★required' : 'optional';
          const enums = v.enum ? ` enum=${v.enum.join('|')}` : '';
          const hint = v.extraction?.llm_hint ? `  -- ${v.extraction.llm_hint}` : '';
          return `  • ${k} (${v.type}${enums}, ${req}): ${v.description || ''}${hint}`;
        })
        .join('\n');
      return `ACTION ${m.action} v${m.version}\n${m.description || ''}\nParams:\n${params}`;
    })
    .join('\n\n──────────\n\n');

  // Build the dynamic OUTPUT SCHEMA: union of all slot names across manifests.
  const slotMap = new Map(); // slot -> json-type-descriptor
  for (const m of reg.list()) {
    for (const [k, v] of Object.entries(m.params || {})) {
      const descriptor = inferSlotJsonType(v);
      const existing = slotMap.get(k);
      if (existing && existing !== descriptor) {
        // Conflicting types across manifests → fall back to permissive union.
        slotMap.set(k, `${existing} | ${descriptor}`);
      } else {
        slotMap.set(k, descriptor);
      }
    }
  }
  // Special slots the engine relies on regardless of manifest.
  slotMap.set('selection', 'number | string');
  slotMap.set('note', 'string');

  const slotLines = [...slotMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `    "${k}": ${v} | null`)
    .join(',\n');

  const intentEnum = [...reg.names(), 'confirm', 'cancel', 'select', 'smalltalk', 'unknown']
    .map((n) => `"${n}"`)
    .join(' | ');

  return `You are the brain of a voice-driven Indian payments app.

You read the recent conversation, the engine's current dialogue state, and the user's latest utterance, then return STRICT JSON describing what the engine should do next.

══════════ AVAILABLE ACTIONS ══════════
${actionDocs}

══════════ OUTPUT SCHEMA ══════════
{
  "intent":     ${intentEnum},
  "slots": {
${slotLines}
  },
  "reply":      string | null,    // ONLY for intent="smalltalk" — see OFF-TOPIC HANDLING
  "language":   "en" | "hi" | "te" | "ta",
  "confidence": number
}

══════════ CRITICAL CONTEXT RULES ══════════

The engine state has fields:
  - dialog_state : "IDLE" | "FILL" | "DISAMBIGUATE" | "CHOOSE" | "CONFIRM"
  - action       : current action in progress (or null)
  - asking_for   : the slot the engine just asked for (e.g. "amount", "target_account")
  - last_bot_msg : the prompt the bot just spoke
  - options      : list shown when in DISAMBIGUATE/CHOOSE
  - filled       : slots already collected

★ When dialog_state == "CONFIRM" — the bot just asked for confirmation.
  The engine has a deterministic yes/no parser; you only see this state if it
  was uncertain. Pick "confirm" or "cancel" as appropriate. If the user said
  something completely new (a new amount, a new recipient), return the action
  intent with the new slots filled and the engine will restart the flow.

★ When dialog_state == "CHOOSE" or "DISAMBIGUATE":
  • Picking an option → intent="select", slots.selection = 1-based index OR the label.
  • If user says "different/another/new ___" — return the action name with
    slots.target_account="__needs_new__" (for bills) OR slots.recipient_name=null
    (for contacts) — engine will ask afresh.
  • If user provides a totally new value (a phone number, a name, an account no.)
    extract it as the relevant slot, NOT as a selection.

★ When dialog_state == "FILL" with asking_for set:
  Treat the utterance as the value for that slot.

══════════ OFF-TOPIC HANDLING (intent="smalltalk") ══════════

When the user is mid-flow (action != null) and their utterance is NOT a value
for asking_for AND NOT a new actionable intent, classify it as "smalltalk" and
write a SHORT, helpful "reply" that:

  1. Briefly acknowledges what the user said (or answers if it's a meta-question).
  2. ALWAYS ends by re-asking the original question (use last_bot_msg as the cue).
  3. Stays in the same language as the user.
  4. Is ONE short sentence — max ~20 words. No emojis. No long explanations.

Categories that should become "smalltalk":

  • Pure chitchat / unrelated:
      "tell me a joke", "what's the weather", "who built you", "how are you"
    → reply: deflect politely + re-ask.

  • Meta-questions about the current flow (use "filled" + "last_bot_msg"):
      "who am I paying again?"   → answer using filled.recipient
      "wait what was the amount"  → answer using filled.amount
      "what's my balance"         → "I don't have your live balance handy — [re-ask]"
      "which account"             → answer using filled.from_account

  • Hesitation / fillers / "wait":
      "uhh", "hmm", "wait", "hold on", "let me think", "thoda ruko", "ఆగు"
    → reply: "Sure, take your time — when ready, [re-ask]".

  • Capability / safety questions:
      "is this safe?", "can you book a hotel?", "what can you do?"
    → reply: brief honest answer + "for now let's finish this — [re-ask]".

slots MUST be empty ({}) when intent="smalltalk". Never invent slot values
from chitchat. If the user IS providing a real slot value (even oddly phrased),
return the action intent with the slot filled, NOT smalltalk.

When dialog_state == "IDLE" and the user is just chatting (no actionable
intent), still use intent="smalltalk" with a reply that nudges them toward
something the app can do (e.g. "I can pay, transfer, recharge or book flights
— what would you like?").

══════════ EXTRACTION RULES ══════════

amount:
  - "five hundred"→500, "do hazaar"→2000, "1.5 lakh"→150000, "2k"→2000, ५००→500, ౫౦౦→500.
  - "the bill amount" / "default" / "जो भी हो" → "__default__".

recipient_name:
  - JUST the name. NO possessives (my/the), NO verbs (send/pay/transfer), NO particles (को/से/ki).
  - "send my mom 500" → "mom".  "मुझे राहुल को 500 भेजना है" → "राहुल".

recipient_handle:
  - A UPI VPA (name@bank) or a 10-digit phone number when the user is paying someone NOT in contacts.

target_account (for bills/recharge):
  - Phone number for recharge, consumer ID for utility, RR for water, etc.
  - "recharge 9876543210" → target_account="9876543210".
  - "recharge a different number" → target_account="__needs_new__".
  - "pay my electricity bill, the saved one" → target_account="__use_default__".

biller_keyword:
  - Operator/category hint: "airtel", "jio", "vi", "electricity", "water", "gas", "broadband", "dth".
  - Generic "recharge" / "mobile bill" → biller_keyword="mobile" (engine will narrow down).

flight slots (intent="book_flight"):
  - origin / destination: city name OR IATA code.
  - date: "today", "tomorrow", "26-04", "next monday" — pass through as-is.
  - passenger_name: traveller's full name.
  - passenger_phone: 10-digit number for the ticket.

══════════ EXAMPLES ══════════

state={dialog_state:"IDLE"}
utterance="recharge airtel for 200 to 9999988888"
→ {"intent":"pay_bill","slots":{"biller_keyword":"airtel","target_account":"9999988888","amount":200},"language":"en","confidence":0.97}

state={dialog_state:"FILL", action:"pay_bill", asking_for:"target_account", filled:{biller:"Airtel Prepaid"}}
utterance="9876543210"
→ {"intent":"pay_bill","slots":{"target_account":"9876543210"},"language":"en","confidence":0.98}

state={dialog_state:"DISAMBIGUATE", action:"send_money", asking_for:"contact"}
utterance="actually pay this UPI: rahul.new@hdfc"
→ {"intent":"send_money","slots":{"recipient_handle":"rahul.new@hdfc","recipient_name":null},"language":"en","confidence":0.9}

state={dialog_state:"IDLE"}
utterance="book flight bangalore to delhi tomorrow"
→ {"intent":"book_flight","slots":{"origin":"bangalore","destination":"delhi","date":"tomorrow"},"language":"en","confidence":0.97}

state={dialog_state:"CHOOSE", action:"book_flight", asking_for:"selected_flight"}
utterance="the cheaper one"
→ {"intent":"select","slots":{"selection":1},"language":"en","confidence":0.85}

state={dialog_state:"FILL", action:"send_money", asking_for:"amount", filled:{recipient:"Rahul"}}
utterance="wait, who am I paying again?"
→ {"intent":"smalltalk","slots":{},"reply":"You're paying Rahul. How much would you like to send?","language":"en","confidence":0.95}

state={dialog_state:"FILL", action:"send_money", asking_for:"amount", filled:{recipient:"Rahul"}}
utterance="uhh hold on let me think"
→ {"intent":"smalltalk","slots":{},"reply":"Sure, take your time — when you're ready, just tell me the amount.","language":"en","confidence":0.95}

state={dialog_state:"FILL", action:"pay_bill", asking_for:"target_account", filled:{biller:"Airtel Prepaid"}}
utterance="tell me a joke"
→ {"intent":"smalltalk","slots":{},"reply":"Maybe later — first, what number should I recharge?","language":"en","confidence":0.95}

state={dialog_state:"FILL", action:"book_flight", asking_for:"passenger_name", filled:{origin:"BLR",destination:"DEL"}}
utterance="ఆగు ఒక్క నిమిషం"
→ {"intent":"smalltalk","slots":{},"reply":"తప్పకుండా — సిద్ధంగా ఉన్నప్పుడు ప్రయాణికుడి పేరు చెప్పండి.","language":"te","confidence":0.95}

JSON ONLY. NO PROSE.`;
}
