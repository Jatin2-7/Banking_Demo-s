/** Parse Indian money amounts (lakh/crore) and yearly → monthly for LAP form fields. */

const LAKH = 100_000;
const CRORE = 10_000_000;

export function isYearlyPeriod(text) {
  const s = String(text || '').toLowerCase();
  return /yearly|annual|per\s*year|each\s*year|\/\s*year|saal|saalana|varsh|वार्षिक|सालाना|साल\s*का|वर्ष/.test(s);
}

export function isMonthlyPeriod(text) {
  const s = String(text || '').toLowerCase();
  return /monthly|per\s*month|each\s*month|\/\s*month|mahina|maasik|मासिक|महीने\s*का/.test(s);
}

/** Parse "50 lakhs", "1.5 crore", "2500000" → rupee integer string. */
export function parseIndianMoneyAmount(text) {
  const s = String(text || '').trim().toLowerCase();
  if (!s) return null;

  const crore = s.match(/(\d+(?:\.\d+)?)\s*(?:crore|cr|करोड़|करोड)/);
  if (crore) return String(Math.round(Number(crore[1]) * CRORE));

  const lakh = s.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|lacs|lakhs|लाख|लाक)/);
  if (lakh) return String(Math.round(Number(lakh[1]) * LAKH));

  const thousand = s.match(/(\d+(?:\.\d+)?)\s*(?:k|thousand)\b/);
  if (thousand) return String(Math.round(Number(thousand[1]) * 1000));

  const digits = s.replace(/[^\d]/g, '');
  return digits || null;
}

/** Fix LLM treating 1 lakh as 1,000,000 instead of 100,000 (10× error). */
export function correctLakhMultiplierError(amount, userContext, { yearly = false } = {}) {
  const ctx = String(userContext || '');
  const lakhMatch = ctx.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|lacs|lakhs|लाख|लाक)/i);
  if (!lakhMatch) return null;

  const n = Number(lakhMatch[1]);
  if (!Number.isFinite(n) || n <= 0) return null;

  const correctBase = Math.round(n * LAKH);
  const wrongBase = Math.round(n * 1_000_000);
  const agent = Number(amount);
  if (!Number.isFinite(agent) || agent <= 0) return null;

  const targets = yearly
    ? [Math.round(correctBase / 12), correctBase]
    : [correctBase, Math.round(correctBase / 12)];
  const wrongTargets = yearly
    ? [Math.round(wrongBase / 12), wrongBase]
    : [wrongBase, Math.round(wrongBase / 12)];

  for (const wrong of wrongTargets) {
    if (Math.abs(agent - wrong) <= Math.max(5000, wrong * 0.02)) {
      const best = targets.reduce((a, b) =>
        Math.abs(agent - a) <= Math.abs(agent - b) ? a : b,
      );
      return String(best);
    }
  }
  return null;
}

const MONTHLY_MONEY_FIELDS = new Set(['business_revenue', 'business_profit']);

/**
 * Normalize a LAP money field from tool value + optional user utterance.
 * business_revenue / business_profit are stored as **monthly** amounts.
 */
export function normalizeLapMoneyField(fieldId, raw, userContext = '') {
  const combined = `${raw || ''} ${userContext || ''}`.trim();
  const fromWords = parseIndianMoneyAmount(combined);
  const fromDigits = String(raw || '').replace(/[^\d]/g, '');
  let amount = fromWords || fromDigits;
  if (!amount) return '';

  const yearly = isYearlyPeriod(combined) && !isMonthlyPeriod(combined);

  if (MONTHLY_MONEY_FIELDS.has(fieldId) && yearly) {
    amount = String(Math.round(Number(amount) / 12));
  }

  const corrected = correctLakhMultiplierError(amount, userContext, { yearly });
  if (corrected) amount = corrected;

  return amount;
}
