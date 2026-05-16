/** Mirrors `App.jsx` — when false, main flows use Web Speech API; when true, `/api/stt` (ElevenLabs). */
export const ELEVENLABS_STT_ENABLED =
  String(import.meta.env?.VITE_USE_ELEVENLABS_STT || '').trim().toLowerCase() === 'true';
