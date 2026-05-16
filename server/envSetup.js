/**
 * Must be imported before other server modules that read process.env.
 * ESM hoists static imports, but sibling imports run in source order;
 * keep `import './envSetup.js'` as the first import in index.js.
 */
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Repo root .env (optional shared defaults)
loadEnv({ path: path.resolve(__dirname, '../.env') });
// cwd .env when you start the process from project root or elsewhere
loadEnv();
// server/.env — last so it always wins over root/cwd for the same keys
loadEnv({ path: path.resolve(__dirname, '.env'), override: true });
