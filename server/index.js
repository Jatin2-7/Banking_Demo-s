// Server entrypoint — Express app exposing the engine turn API and mock REST.
//
// The dialogue state machine lives in server/engine/*. This file is just the
// HTTP edge: route a turn, call processInput, return the SessionView.

import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import cors from 'cors';

import mockApi from './mockApi.js';
import { registry } from './manifestRegistry.js';
import { processInput } from './engine/engine.js';
import { sessions, createSession } from './engine/session.js';
import { log, sessionLog } from './lib/log.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '../.env') });
loadEnv();

const app = express();
const PORT = process.env.PORT || 3001;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const STT_MODEL = process.env.ELEVENLABS_STT_MODEL || 'scribe_v1';
const STT_ENDPOINT = 'https://api.elevenlabs.io/v1/speech-to-text';

app.use(cors());
app.use(express.json({ limit: '256kb' }));

app.get('/api/health', (_req, res) => {
  const k = process.env.OPENAI_API_KEY;
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
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'elevenlabs_not_configured' });
    if (!req.body || !req.body.length) return res.status(400).json({ error: 'audio_required' });

    const contentType = req.get('content-type') || 'audio/webm';
    const lang = String(req.query.lang || '')
      .slice(0, 8)
      .toLowerCase();
    const ext = contentType.includes('mp4')
      ? 'm4a'
      : contentType.includes('wav')
        ? 'wav'
        : contentType.includes('ogg')
          ? 'ogg'
          : 'webm';

    try {
      const fd = new FormData();
      fd.append('file', new Blob([req.body], { type: contentType }), `audio.${ext}`);
      fd.append('model_id', STT_MODEL);
      if (lang) fd.append('language_code', lang);

      const t0 = Date.now();
      const r = await fetch(STT_ENDPOINT, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: fd,
      });
      const ms = Date.now() - t0;

      if (!r.ok) {
        const detail = (await r.text().catch(() => '')).slice(0, 600);
        log.error({ status: r.status, ms, detail }, 'elevenlabs stt failed');
        return res.status(502).json({ error: 'stt_failed', status: r.status, detail });
      }

      const data = await r.json().catch(() => ({}));
      const text = String(data?.text || '').trim();
      log.info(
        { ms, model: STT_MODEL, lang: lang || null, bytes: req.body.length, chars: text.length },
        'stt ok',
      );
      res.json({ ok: true, text, model: STT_MODEL, language: data?.language_code || lang || null });
    } catch (err) {
      log.error({ err: err?.message || String(err) }, 'stt handler error');
      res.status(500).json({ error: 'stt_error', message: String(err?.message || err) });
    }
  },
);

app.get('/api/manifests', (_req, res) => res.json({ manifests: registry.list() }));

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
