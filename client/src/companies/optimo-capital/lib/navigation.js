/** Scroll the EMI calculator into view, leaving room for the fixed voice panel. */
export function scrollToEmiCalculator() {
  const tryScroll = () => {
    const el = document.getElementById('emi-calculator');
    if (!el) return false;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return true;
  };
  tryScroll();
  requestAnimationFrame(() => {
    tryScroll();
    setTimeout(tryScroll, 300);
    setTimeout(tryScroll, 700);
  });
}

/** Detect when the user wants the dashboard EMI calculator. */
export function isEmiCalculatorIntent(text) {
  const t = String(text || '').toLowerCase();
  return (
    /calculate\s+emi/.test(t) ||
    /emi\s+calculat/.test(t) ||
    /monthly\s+instal/.test(t) ||
    /check\s+emi/.test(t) ||
    (/\bemi\b/.test(t) && /calculat|instal|monthly/.test(t)) ||
    /want\s+to\s+calculate/.test(t)
  );
}

/** Map spoken navigation commands to AGUI destinations. */
export function resolveNavigationIntentFromSpeech(text) {
  const t = String(text || '')
    .toLowerCase()
    .trim();
  if (!t) return null;
  if (isEmiCalculatorIntent(text)) return 'emi_calculator';
  if (/check\s+eligibility/.test(t)) return 'check_eligibility';
  if (/balance\s+transfer/.test(t)) return 'lap_balance_transfer';
  if (/top[\s-]?up|additional\s+loan/.test(t)) return 'lap_top_up';
  if (
    /apply\s+(for\s+)?(a\s+)?loan/.test(t) ||
    /loan\s+application/.test(t) ||
    /open\s+(the\s+)?(loan\s+)?application/.test(t) ||
    /start\s+(the\s+)?(loan\s+)?application/.test(t) ||
    /(want|need)\s+(to\s+)?apply/.test(t) ||
    (/(loan\s+against\s+property|business\s+loan|lap\b)/.test(t) &&
      /apply|want|need|open|start/.test(t))
  ) {
    return 'lap_application';
  }
  if (/(go\s+)?(back\s+)?(to\s+)?(home|dashboard|main\s+page)/.test(t)) return 'dashboard';
  return null;
}

/** Recover navigation when the model prints JSON instead of calling navigate_to. */
export function parseNavigationDestinationFromText(text) {
  const raw = String(text || '');
  const jsonMatch = raw.match(
    /\{\s*"destination"\s*:\s*"([^"]+)"\s*(?:,\s*"context"\s*:\s*"[^"]*")?\s*\}/i,
  );
  if (jsonMatch) return jsonMatch[1];
  const fnMatch = raw.match(/navigate_to\s*\(\s*\{[^}]*"destination"\s*:\s*"([^"]+)"/i);
  if (fnMatch) return fnMatch[1];
  return null;
}

/** Map AGUI navigate_to destinations to Optimo views */
export const OPTIMO_DESTINATIONS = {
  dashboard: 'dashboard',
  lap_application: 'lap',
  lap_balance_transfer: 'lap',
  lap_top_up: 'lap',
  check_eligibility: 'emi',
  emi_calculator: 'emi',
};

export function resolveOptimoNavigation(destination, context = '') {
  const dest = String(destination || '').toLowerCase();
  if (dest === 'lap_balance_transfer') return { view: 'lap', product: 'balance_transfer' };
  if (dest === 'lap_top_up') return { view: 'lap', product: 'top_up' };
  if (dest === 'lap_application' || dest === 'loan_application')
    return { view: 'lap', product: 'lap' };
  if (dest === 'check_eligibility' || dest === 'emi_calculator')
    return { view: 'dashboard', scrollTo: 'emi' };
  if (dest === 'dashboard' || dest === 'home') return { view: 'dashboard' };
  return { view: 'lap', product: 'lap' };
}

/** Dashboard EMI calculator state for AGUI sync */
export function emiToAgentState(emi) {
  return {
    screen: 'dashboard',
    loan_amount: emi.loanAmount || '',
    interest_rate: emi.interestRate || '',
    tenure_years: emi.tenureYears || '',
  };
}

const EMI_FIELD_ALIASES = {
  loanamount: 'loan_amount',
  loan_amount: 'loan_amount',
  interestrate: 'interest_rate',
  interest_rate: 'interest_rate',
  tenureyears: 'tenure_years',
  tenure_years: 'tenure_years',
  tenure: 'tenure_years',
};

export function normalizeEmiFieldId(fieldId) {
  const key = String(fieldId || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
  return EMI_FIELD_ALIASES[key] || String(fieldId || '').trim();
}

export function normalizeEmiFieldValue(fieldId, raw) {
  const id = normalizeEmiFieldId(fieldId);
  const s = raw == null ? '' : String(raw).trim();
  if (id === 'interest_rate') return s.replace(/[^\d.]/g, '');
  if (id === 'tenure_years') {
    const m = s.match(/(\d{1,2})/);
    const n = Number(m ? m[1] : s);
    return n >= 1 && n <= 15 ? String(n) : s.replace(/[^\d]/g, '');
  }
  if (id === 'loan_amount') {
    const lower = s.toLowerCase();
    const crore = lower.match(/(\d+(?:\.\d+)?)\s*crore/);
    if (crore) return String(Math.round(Number(crore[1]) * 10000000));
    const lakh = lower.match(/(\d+(?:\.\d+)?)\s*lakh/);
    if (lakh) return String(Math.round(Number(lakh[1]) * 100000));
    return s.replace(/[^\d]/g, '');
  }
  return s;
}

/** Parse spoken EMI values when the user answers by voice (e.g. "18%", "10 years"). */
export function parseEmiFromUserSpeech(text, current = {}) {
  const t = String(text || '').trim();
  const lower = t.toLowerCase();
  const patch = {};

  if (!current.interestRate) {
    const rate =
      lower.match(/(\d+(?:\.\d+)?)\s*(?:%|percent|pa\b|per\s*annum)/)?.[1] ||
      (/\b(rate|interest)\b/i.test(t) && t.match(/(\d+(?:\.\d+)?)/)?.[1]);
    if (rate) patch.interestRate = rate.replace(/[^\d.]/g, '');
  }

  if (!current.tenureYears) {
    const ten =
      lower.match(/(?:for\s+)?(\d{1,2})\s*(?:years?|yrs?)/)?.[1] ||
      lower.match(/\btenure\b.*?(\d{1,2})/)?.[1];
    if (ten) {
      const n = Number(ten);
      if (n >= 1 && n <= 15) patch.tenureYears = String(n);
    }
  }

  if (!current.loanAmount) {
    const crore = lower.match(/(\d+(?:\.\d+)?)\s*crore/);
    const lakh = lower.match(/(\d+(?:\.\d+)?)\s*lakh/);
    if (crore) patch.loanAmount = String(Math.round(Number(crore[1]) * 10000000));
    else if (lakh) patch.loanAmount = String(Math.round(Number(lakh[1]) * 100000));
  }

  return patch;
}

export function agentStateToEmiPatch(values) {
  const patch = {};
  const entries = Object.entries(values || {});
  for (const [rawKey, rawVal] of entries) {
    if (rawVal == null || rawVal === '') continue;
    const fieldId = normalizeEmiFieldId(rawKey);
    const normalized = normalizeEmiFieldValue(fieldId, rawVal);
    if (fieldId === 'loan_amount' && normalized) patch.loanAmount = normalized;
    if (fieldId === 'interest_rate' && normalized) patch.interestRate = normalized;
    if (fieldId === 'tenure_years' && normalized) patch.tenureYears = normalized;
  }
  return patch;
}
