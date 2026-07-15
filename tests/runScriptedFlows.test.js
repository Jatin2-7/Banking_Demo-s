// Scripted-flow test runner.
//
// Each fixture under ./scripted-flows/*.json defines a sequence of inputs and
// expected outcomes. We boot the engine in-process, stub the LLM (so tests
// don't need a real API key), and assert state transitions + emitted events.
//
// Fixture shape:
//   {
//     "name": "...",
//     "lang": "en",
//     "steps": [
//       { "input": { "type": "INIT" },                  "expect": { "state": "IDLE" } },
//       { "input": { "type": "START_ACTION", "action": "send_money" } },
//       { "input": { "type": "TRANSCRIPT", "text": "...",
//                    "intent": { "intent":"send_money", "slots":{...}} },
//         "expect": { "state": "FILL", "asking_for": "amount" } }
//     ]
//   }
//
// `intent` on a TRANSCRIPT input is what the stubbed LLM returns for that turn.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Stub the LLM via a global hook honoured by server/engine/llm.js. Tests set
// up an intent queue that the engine consumes one-per-TRANSCRIPT.
const intentQueue = [];
globalThis.__LLM_EXTRACT_STUB__ = async () =>
  intentQueue.shift() || { intent: 'unknown', slots: {} };

// Quiet pino during tests + force the backend into deterministic mode (no
// jitter sleeps, no random failure paths). MUST be set before importing the
// engine modules below.
process.env.LOG_LEVEL = 'silent';
process.env.TEST_MODE = '1';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIX_DIR = path.join(__dirname, 'scripted-flows');

const { processInput } = await import('../server/engine/engine.js');
const { createSession } = await import('../server/engine/session.js');
const { backend } = await import('../server/data/backend.js');

function loadFixtures() {
  if (!fs.existsSync(FIX_DIR)) return [];
  return fs
    .readdirSync(FIX_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({ file: f, data: JSON.parse(fs.readFileSync(path.join(FIX_DIR, f), 'utf8')) }));
}

function checkExpect(session, expect, label) {
  if (!expect) return;
  if (expect.state) {
    assert.equal(session.state, expect.state, `${label}: state`);
  }
  if (expect.asking_for) {
    assert.equal(session.pending?.slot, expect.asking_for, `${label}: asking_for`);
  }
  if (expect.pending_kind) {
    assert.equal(session.pending?.kind, expect.pending_kind, `${label}: pending_kind`);
  }
  if (expect.action) {
    assert.equal(session.action, expect.action, `${label}: action`);
  }
  if (expect.result_success === true) {
    assert.equal(session.result?.success, true, `${label}: result.success true`);
  }
  if (expect.result_success === false) {
    assert.equal(session.result?.success, false, `${label}: result.success false`);
  }
  if (expect.history_includes) {
    const hits = session.history.some((h) => h.text?.includes(expect.history_includes));
    assert.ok(hits, `${label}: history includes "${expect.history_includes}"`);
  }
  if (expect.bot_last_includes) {
    const last = [...session.history].reverse().find((h) => h.role === 'bot');
    assert.ok(
      last?.text?.includes(expect.bot_last_includes),
      `${label}: bot last "${last?.text}" includes "${expect.bot_last_includes}"`,
    );
  }
  if (expect.options_count != null) {
    assert.equal(session.pending?.options?.length, expect.options_count, `${label}: options_count`);
  }
  if (expect.params) {
    for (const [k, v] of Object.entries(expect.params)) {
      // simple deep value equality on dotted path: "contact.name"
      const parts = k.split('.');
      let cur = session.params;
      for (const p of parts) cur = cur?.[p];
      assert.deepEqual(cur, v, `${label}: params.${k}`);
    }
  }
}

const fixtures = loadFixtures();

if (fixtures.length === 0) {
  test('scripted-flows directory has at least one fixture', () => {
    assert.fail(`no fixtures in ${FIX_DIR}`);
  });
}

for (const { file, data } of fixtures) {
  test(`${file} — ${data.name || 'unnamed'}`, async () => {
    backend.reset();
    const session = createSession({ lang: data.lang || 'en' });
    intentQueue.length = 0;

    for (let i = 0; i < data.steps.length; i++) {
      const step = data.steps[i];
      const label = `step ${i + 1} (${step.input.type})`;

      if (step.input.type === 'TRANSCRIPT' && step.input.intent) {
        intentQueue.push(step.input.intent);
      }

      const input = { ...step.input };
      delete input.intent;

      // SELECTION sugar: optionIndex → optionId from current pending options.
      if (input.type === 'SELECTION' && input.optionId == null && input.optionIndex != null) {
        const opts = session.pending?.options || [];
        const picked = opts[input.optionIndex];
        assert.ok(
          picked,
          `${label}: optionIndex ${input.optionIndex} out of range (have ${opts.length})`,
        );
        input.optionId = picked.id;
        delete input.optionIndex;
      }

      await processInput(session, input);
      checkExpect(session, step.expect, label);
    }
  });
}
