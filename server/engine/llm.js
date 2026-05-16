// LLM brain — single, contextual extractor used by every dialogue turn.
// The system prompt is built dynamically from the loaded manifests
// (registry.systemPrompt()), so a new action only needs a new manifest.

import OpenAI from 'openai';
import { registry } from '../manifestRegistry.js';
import { module_ } from '../lib/log.js';

const log = module_('llm');

let _openai = null;
function client() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY?.trim() });
  return _openai;
}

export async function extract({ utterance, state, history }) {
  // Test/dev hook: tests inject a deterministic stub via globalThis to avoid
  // needing an OPENAI_API_KEY in CI. Production never sets this.
  if (typeof globalThis.__LLM_EXTRACT_STUB__ === 'function') {
    return globalThis.__LLM_EXTRACT_STUB__({ utterance, state, history });
  }
  const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const messages = [{ role: 'system', content: registry.systemPrompt() }];
  if (Array.isArray(history)) {
    for (const h of history.slice(-6)) {
      if (!h?.text) continue;
      messages.push({
        role: h.role === 'bot' ? 'assistant' : 'user',
        content: String(h.text),
      });
    }
  }
  messages.push({
    role: 'user',
    content: JSON.stringify({
      engine_state: state || { dialog_state: 'IDLE', action: null, asking_for: null },
      utterance,
    }),
  });

  const t0 = Date.now();
  try {
    const r = await client().chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 350,
      messages,
    });
    const raw = r.choices?.[0]?.message?.content || '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { intent: 'unknown', slots: {}, confidence: 0 };
    }
    if (!parsed.intent && parsed.action) parsed.intent = parsed.action;
    parsed.action = parsed.intent;
    parsed.ms = Date.now() - t0;
    log.debug(
      {
        dialog_state: state?.dialog_state || 'IDLE',
        utterance: String(utterance).slice(0, 70),
        intent: parsed.intent,
        slots: parsed.slots,
        ms: parsed.ms,
      },
      'extract',
    );
    return parsed;
  } catch (e) {
    log.error({ err: e?.message || String(e) }, 'extract failed');
    return {
      intent: 'unknown',
      action: 'unknown',
      slots: {},
      confidence: 0,
      error: 'llm_unavailable',
    };
  }
}
