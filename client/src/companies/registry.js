import { abcdConfig } from './abcd/config.js';
import { dcbConfig } from './dcb/config.js';
import { indianBankConfig } from './indian-bank/config.js';
import { optimoCapitalConfig } from './optimo-capital/config.js';
import { kreditbeeConfig } from './kreditbee/config.js';
import { sbiConfig } from './sbi/config.js';
import { incredConfig } from './incred/config.js';
import { easemytripConfig } from './easemytrip/config.js';

/** All registered company demos — add a config + import here for each new client. */
export const COMPANIES = [abcdConfig, optimoCapitalConfig, dcbConfig, indianBankConfig, kreditbeeConfig, sbiConfig, incredConfig, easemytripConfig];

/** @param {string} slug */
export function getCompanyBySlug(slug) {
  return COMPANIES.find((c) => c.slug === slug) ?? null;
}

/** Companies sorted for the demo hub: active first, then wip, then legacy. */
const STATUS_ORDER = { active: 0, wip: 1, legacy: 2 };

export function getCompaniesForHub() {
  return [...COMPANIES].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9),
  );
}
