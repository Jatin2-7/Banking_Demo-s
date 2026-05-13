// Structured logging — pino with tenant_id + session_id baked into every line.
// Phase 2 will swap `tenant_id` for the real tenant from the API key.

import { pino } from 'pino';

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const pretty = process.env.LOG_PRETTY !== 'false' && process.env.NODE_ENV !== 'production';

const transport = pretty
  ? {
      target: 'pino/file',
      options: { destination: 1 },
    }
  : undefined;

const baseLogger = pino({
  level,
  base: { tenant_id: process.env.TENANT_ID || 'default' },
  redact: {
    paths: ['*.password', '*.token', '*.api_key', 'req.headers.authorization'],
    censor: '[REDACTED]',
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  transport,
});

export const log = baseLogger;

// Per-session child logger — call once per request/turn.
export function sessionLog(session, extra = {}) {
  return baseLogger.child({
    session_id: session?.id || null,
    action: session?.action || null,
    ...extra,
  });
}

// Tagged module logger — use at module top with a stable name.
export function module_(name) {
  return baseLogger.child({ module: name });
}
