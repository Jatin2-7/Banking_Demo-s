/**
 * Prefer the server-side ElevenLabs STT route for stable demos. Chrome's Web
 * Speech API depends on an external browser service and intermittently emits
 * `network`, even while the app and backend are healthy.
 *
 * Set VITE_USE_ELEVENLABS_STT=false only when browser speech is explicitly
 * desired.
 */
const configuredValue = String(import.meta.env?.VITE_USE_ELEVENLABS_STT || '')
  .trim()
  .toLowerCase();

export const ELEVENLABS_STT_ENABLED = configuredValue !== 'false';
