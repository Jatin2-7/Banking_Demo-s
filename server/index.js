// Server entrypoint — Express app exposing the engine turn API and mock REST.
//
// The dialogue state machine lives in server/engine/*. This file is just the
// HTTP edge: route a turn, call processInput, return the SessionView.

import './envSetup.js';
import express from 'express';
import cors from 'cors';

import mockApi from './mockApi.js';
import { registry } from './manifestRegistry.js';
import { processInput } from './engine/engine.js';
import { sessions, createSession } from './engine/session.js';
import { log, sessionLog } from './lib/log.js';
import { handleLoanAguiPost } from './agui/loanAguiRoute.js';

const app = express();
const PORT = process.env.PORT || 3001;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const STT_MODEL = process.env.ELEVENLABS_STT_MODEL || 'scribe_v1';
const STT_ENDPOINT = 'https://api.elevenlabs.io/v1/speech-to-text';

app.use(cors());
app.use(express.json({ limit: '256kb' }));

app.get('/api/health', (_req, res) => {
  const k = process.env.OPENAI_API_KEY?.trim();
  const sk = process.env.ELEVENLABS_API_KEY;
  res.json({
    ok: true,
    model: MODEL,
    hasOpenAIKey: Boolean(k && !k.startsWith('your_') && k.length > 20),
    stt: {
      provider: 'elevenlabs',
      model: STT_MODEL,
      hasKey: Boolean(sk && sk.length > 20),
    },
    actions: registry.list().map((m) => m.action),
    agui: { loanAgent: 'indian_bank_loan_los' },
  });
});

// ── ElevenLabs Speech-to-Text proxy ────────────────────────────────
//
// The browser POSTs raw audio bytes (e.g. webm/opus from MediaRecorder)
// here; we forward them as multipart/form-data to ElevenLabs and return
// the transcript. Keeping this server-side means the API key never
// reaches the client bundle.
//
//   POST /api/stt?lang=en        body: <audio bytes>
//                                content-type: audio/webm | audio/mp4 | …
//   →    { ok, text, model }
app.post(
  '/api/stt',
  express.raw({ type: ['audio/*', 'application/octet-stream'], limit: '25mb' }),
  async (req, res) => {
    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
    if (!apiKey) return res.status(503).json({ error: 'elevenlabs_not_configured' });
    if (!req.body || !req.body.length) return res.status(400).json({ error: 'audio_required' });

    const contentType = req.get('content-type') || 'audio/webm';
    // ElevenLabs expects ISO 639-1 (e.g. "en"); "en-IN" from BCP-47 can cause API errors → 502.
    const langPrimary = String(req.query.lang || '')
      .toLowerCase()
      .split(/[-_]/)[0]
      .replace(/[^a-z]/g, '')
      .slice(0, 2);
    const ext = contentType.includes('mp4')
      ? 'm4a'
      : contentType.includes('wav')
        ? 'wav'
        : contentType.includes('ogg')
          ? 'ogg'
          : 'webm';

    // Helper: call ElevenLabs STT with a specific language_code (or none).
    const callElevenLabs = async (forceLang) => {
      const fd = new FormData();
      fd.append('file', new Blob([req.body], { type: contentType }), `audio.${ext}`);
      fd.append('model_id', STT_MODEL);
      const lang = forceLang || langPrimary;
      if (lang && lang.length === 2) fd.append('language_code', lang);
      const r = await fetch(STT_ENDPOINT, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: fd,
      });
      return r;
    };

    try {
      const t0 = Date.now();
      let r = await callElevenLabs(null);
      let ms = Date.now() - t0;

      if (!r.ok) {
        const detail = (await r.text().catch(() => '')).slice(0, 600);
        log.error({ status: r.status, ms, detail }, 'elevenlabs stt failed');
        return res.status(502).json({ error: 'stt_failed', status: r.status, detail });
      }

      let data = await r.json().catch(() => ({}));

      // ElevenLabs auto-detects Hindi audio as Urdu (same spoken language, different script).
      // If we get Urdu back and the caller didn't explicitly request Urdu, re-request forcing
      // Hindi (Devanagari) so the transcript is in a script the user expects.
      if (data?.language_code === 'ur' && langPrimary !== 'ur') {
        log.info({ detected: 'ur', retrying: 'hi' }, 'stt ur→hi retry');
        const t1 = Date.now();
        const r2 = await callElevenLabs('hi');
        if (r2.ok) {
          const data2 = await r2.json().catch(() => ({}));
          if (data2?.text) {
            data = data2;
            ms += Date.now() - t1;
          }
        }
      }

      const text = String(data?.text || '').trim();
      log.info(
        { ms, model: STT_MODEL, lang: data?.language_code || langPrimary || null, bytes: req.body.length, chars: text.length },
        'stt ok',
      );
      res.json({
        ok: true,
        text,
        model: STT_MODEL,
        language: data?.language_code || langPrimary || null,
      });
    } catch (err) {
      log.error({ err: err?.message || String(err) }, 'stt handler error');
      res.status(500).json({ error: 'stt_error', message: String(err?.message || err) });
    }
  },
);

// ── Cartesia Text-to-Speech proxy ──────────────────────────────────
//
//   POST /api/tts   { text: string, lang?: "en" | "hi" }
//   →  audio/mpeg bytes
//
// Uses Cartesia sonic-3. Add CARTESIA_API_KEY to .env to activate.
// Set CARTESIA_VOICE_ID to any voice from https://play.cartesia.ai/voices
// (recommended Indian voices: Ishan for Hinglish, Ayush / Amit for Hindi).
// Returns 503 (client falls back to browser TTS) if key not configured.
const CARTESIA_TTS_ENDPOINT = 'https://api.cartesia.ai/tts/bytes';
const CARTESIA_VERSION = '2026-03-01';

// Detect language: any Devanagari fraction → "hi", else "en"
function detectTtsLang(text, hint) {
  const devanagari = (text.match(/[\u0900-\u097F]/g) || []).length;
  if (devanagari / (text.replace(/\s/g, '').length || 1) > 0.05) return 'hi';
  if (hint === 'hi' || hint === 'en') return hint;
  return 'en';
}

// Strip punctuation/emojis that TTS engines read aloud literally
function cleanForTts(text) {
  return text
    .replace(/\p{Emoji_Presentation}/gu, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[✦•·★☆©®™°]/g, '')
    .replace(/[*_`#~|]/g, '')                   // markdown
    .replace(/[!？！]/g, '.')                   // exclamations → pause
    .replace(/[?]/g, '')                         // question marks → remove (voice handles tone)
    .replace(/:{1,}/g, ',')                      // colons → brief pause
    .replace(/\.{2,}/g, '.')                     // ellipsis → single period
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

app.post('/api/tts', express.json({ limit: '32kb' }), async (req, res) => {
  const cartesiaKey = process.env.CARTESIA_API_KEY?.trim();
  if (!cartesiaKey || cartesiaKey === 'your_cartesia_api_key_here') {
    return res.status(503).json({ error: 'cartesia_not_configured', hint: 'Set CARTESIA_API_KEY in .env' });
  }

  const raw = String(req.body?.text || '').trim();
  if (!raw) return res.status(400).json({ error: 'text_required' });

  // Clean server-side as a safety net (client also cleans, but belt-and-suspenders)
  const text = cleanForTts(raw);
  if (!text) return res.status(400).json({ error: 'text_empty_after_clean' });

  const lang = detectTtsLang(text, String(req.body?.lang || ''));
  const modelId = process.env.CARTESIA_MODEL || 'sonic-3';

  // Single consistent voice for all languages: Ishan "Ally"
  // Designed for Hinglish customer support — handles both English and Hindi naturally
  const voiceId = process.env.CARTESIA_VOICE_ID || 'fd2ada67-c2d9-4afe-b474-6386b87d8fc3';

  const body = {
    model_id: modelId,
    transcript: text,
    voice: { mode: 'id', id: voiceId },
    language: lang,
    output_format: { container: 'mp3', sample_rate: 44100, bit_rate: 128000 },
    // sonic-3 generation_config: calm, natural banking pace
    generation_config: { speed: 0.9, emotion: 'calm' },
  };

  try {
    const t0 = Date.now();
    const cRes = await fetch(CARTESIA_TTS_ENDPOINT, {
      method: 'POST',
      headers: {
        'X-API-Key': cartesiaKey,
        'Cartesia-Version': CARTESIA_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!cRes.ok) {
      const detail = await cRes.text().catch(() => '');
      log.error({ status: cRes.status, detail: detail.slice(0, 300) }, 'cartesia tts failed');
      return res.status(502).json({ error: 'tts_failed', status: cRes.status, detail: detail.slice(0, 300) });
    }

    const buf = await cRes.arrayBuffer();
    log.info({ ms: Date.now() - t0, lang, model: modelId, chars: text.length, bytes: buf.byteLength }, 'tts ok');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.send(Buffer.from(buf));
  } catch (err) {
    log.error({ err: err?.message || String(err) }, 'tts handler error');
    res.status(500).json({ error: 'tts_error', message: String(err?.message || err) });
  }
});

app.get('/api/manifests', (_req, res) => res.json({ manifests: registry.list() }));

app.post('/api/agui/:agentId', handleLoanAguiPost);

app.use('/api/mock', mockApi);

// ── Engine: single source of truth for dialogue state ──────────
//
//   POST /api/engine/turn  { sessionId?, lang?, input: { type, ... } }
//   →    { ok, sessionId, session }
app.post('/api/engine/turn', async (req, res) => {
  try {
    const { sessionId, lang, forceFail, input } = req.body || {};
    let session = sessionId ? sessions.get(sessionId) : null;
    if (!session) {
      session = createSession({ lang: lang || 'en' });
      sessions.put(session);
    }
    if (lang && lang !== session.lang) session.lang = lang;
    if (forceFail !== undefined) session.forceFail = forceFail;
    if (!input || !input.type) return res.status(400).json({ error: 'input_required' });

    await processInput(session, input);
    sessions.put(session);
    res.json({ ok: true, sessionId: session.id, session });
  } catch (err) {
    sessionLog({ id: req.body?.sessionId }).error(
      { err: err?.message || String(err), stack: err?.stack },
      'turn handler error',
    );
    res.status(500).json({ error: 'engine_error', message: String(err?.message || err) });
  }
});

app.get('/api/engine/session/:id', (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s) return res.status(404).json({ error: 'not_found' });
  res.json({ ok: true, sessionId: s.id, session: s });
});

app.use((err, _req, res, _next) => {
  log.error({ err: err?.message || String(err), stack: err?.stack }, 'unhandled');
  res.status(500).json({ error: 'internal_error' });
});

app.listen(PORT, () => {
  log.info(
    {
      port: PORT,
      model: MODEL,
      actions: registry.list().map((m) => m.action),
    },
    'engine listening',
  );
});
