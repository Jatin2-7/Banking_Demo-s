/** Client-side Indian money parsing for LAP voice answers (mirrors server logic). */

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

export function parseIndianMoneyAmount(text) {
  const s = String(text || '').trim().toLowerCase();
  if (!s) return null;

  const crore = s.match(/(\d+(?:\.\d+)?)\s*(?:crore|cr|करोड़|करोड)/);
  if (crore) return Math.round(Number(crore[1]) * CRORE);

  const lakh = s.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|lacs|lakhs|लाख|लाक)/);
  if (lakh) return Math.round(Number(lakh[1]) * LAKH);

  const thousand = s.match(/(\d+(?:\.\d+)?)\s*(?:k|thousand)\b/);
  if (thousand) return Math.round(Number(thousand[1]) * 1000);

  const digits = s.replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
}

function toMonthly(amount, text) {
  if (isYearlyPeriod(text) && !isMonthlyPeriod(text)) {
    return Math.round(amount / 12);
  }
  return amount;
}

/** Extract LAP form fields from a spoken answer. */
export function parseLapFromUserSpeech(text, form = {}) {
  const t = String(text || '').trim();
  if (!t) return {};

  const lower = t.toLowerCase();
  const patch = {};
  const amount = parseIndianMoneyAmount(t);

  if (amount != null) {
    if (/\b(profit|munafa|लाभ|मुनाफा)\b/i.test(t) && !form.businessProfit) {
      patch.businessProfit = String(toMonthly(amount, t));
    } else if (/\b(revenue|turnover|sales|income|आय|बिक्री|रेवेन्यू)\b/i.test(t) && !form.businessRevenue) {
      patch.businessRevenue = String(toMonthly(amount, t));
    } else if (/\b(loan|borrow|ऋण)\b/i.test(t) && !form.loanAmount) {
      patch.loanAmount = String(amount);
    } else if (/\b(property|collateral|संपत्ति|प्रॉपर्टी)\b/i.test(t) && !form.propertyValue) {
      patch.propertyValue = String(amount);
    }
  }

  const pin = t.match(/\b(\d{6})\b/);
  if (pin && !form.propertyPincode) patch.propertyPincode = pin[1];

  const mobile = t.replace(/\D/g, '');
  if (/mobile|phone|नंबर|नम्बर/i.test(t) && mobile.length >= 10 && !form.mobile) {
    patch.mobile = mobile.slice(-10);
  }

  return patch;
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

export function normalizeLapMoneyField(fieldId, raw, userContext = '') {
  const combined = `${raw || ''} ${userContext || ''}`.trim();
  const fromWords = parseIndianMoneyAmount(combined);
  const fromDigits = String(raw || '').replace(/[^\d]/g, '');
  let amount = fromWords ?? (fromDigits ? Number(fromDigits) : null);
  if (amount == null) return String(raw || '');

  const yearly = isYearlyPeriod(combined) && !isMonthlyPeriod(combined);
  const monthlyFields = new Set(['business_revenue', 'business_profit']);

  if (monthlyFields.has(fieldId) && yearly) {
    amount = Math.round(amount / 12);
  }

  const corrected = correctLakhMultiplierError(String(amount), userContext, { yearly });
  if (corrected) return corrected;

  return String(amount);
}
