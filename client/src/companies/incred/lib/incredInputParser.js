import {
  GENDER_OPTIONS,
  MARITAL_OPTIONS,
  RESIDENCE_OPTIONS,
  PURPOSE_OPTIONS,
  COMPANY_OPTIONS,
  EMPLOYMENT_TYPES,
} from '../loan/incredJourney.js';

const WORD_TO_DIGIT = {
  zero: '0', oh: '0', o: '0',
  one: '1', two: '2', three: '3', four: '4', five: '5',
  six: '6', seven: '7', eight: '8', nine: '9',
};

function norm(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s@.-]/g, ' ')
    .replace(/\s+/g, ' ');
}

export function cleanSpeechText(text) {
  return String(text || '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordsToDigits(text) {
  let t = String(text || '').toLowerCase();
  for (const [word, digit] of Object.entries(WORD_TO_DIGIT)) {
    t = t.replace(new RegExp(`\\b${word}\\b`, 'gi'), digit);
  }
  return t;
}

/** Parse PAN from speech: "P B L G B one two three four F" → PBLGB1234F */
export function parseSpokenPan(text) {
  const raw = cleanSpeechText(text);
  if (!raw) return null;

  const direct = raw.toUpperCase().match(/\b[A-Z]{5}\d{4}[A-Z]\b/);
  if (direct) return direct[0];

  const compact = wordsToDigits(raw).replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const m = compact.match(/[A-Z]{5}\d{4}[A-Z]/);
  if (m) return m[0];

  return null;
}

function looksLikePan(text) {
  return Boolean(parseSpokenPan(text));
}

function parsePincode(text) {
  const spoken = wordsToDigits(text).replace(/\D/g, '');
  if (spoken.length === 6) return spoken;
  const d = String(text || '').replace(/\D/g, '');
  if (d.length === 6) return d;
  return null;
}

function formatInr(n) {
  return Number(n).toLocaleString('en-IN');
}

/** Parse Indian amounts: "11 lakh 60 thousand", "5.5 lakh", "80 thousand". */
function parseIndianAmount(text) {
  const n = norm(text);

  let m = n.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|lacs)\s+(\d+(?:\.\d+)?)\s*(?:thousand|thousands|k|hazaar|hazar)/);
  if (m) return Math.round(parseFloat(m[1]) * 100000 + parseFloat(m[2]) * 1000);

  m = n.match(/(\d+(?:\.\d+)?)\s*(?:crore|cr)\s+(\d+(?:\.\d+)?)\s*(?:lakh|lac|lacs)/);
  if (m) return Math.round(parseFloat(m[1]) * 10000000 + parseFloat(m[2]) * 100000);

  m = n.match(/(\d+(?:\.\d+)?)\s*(?:crore|cr)/);
  if (m) return Math.round(parseFloat(m[1]) * 10000000);

  m = n.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|lacs)/);
  if (m) return Math.round(parseFloat(m[1]) * 100000);

  m = n.match(/(\d+(?:\.\d+)?)\s*(?:thousand|thousands|k|hazaar|hazar)/);
  if (m) return Math.round(parseFloat(m[1]) * 1000);

  const digits = wordsToDigits(text).replace(/\D/g, '');
  if (digits.length >= 5 && digits.length <= 9) return parseInt(digits, 10);

  if (digits.length >= 4 && digits.length <= 7) return parseInt(digits, 10);

  return null;
}

function isYearlyIncomePhrase(text) {
  const n = norm(text);
  return (
    /year|yearly|annual|annum|per annum|per year|saal|salana|\bctc\b/.test(n) ||
    (/earn|karta|kart|karti|salary|package/i.test(n) && /year|yearly|saal|annual|lakh|crore/i.test(n))
  );
}

function disclaimsMonthlyIncome(text) {
  const n = norm(text);
  return (
    /(?:yaad nahi|don't remember|do not remember|not sure|don't know|dont know|pata nahi)/.test(n) &&
    /month|monthly|mahine|mahina/.test(n)
  );
}

function hasExplicitMonthlyAmount(text) {
  const n = norm(text);
  return (
    /monthly\s+(?:income\s+)?(?:is\s+|of\s+)?\d/.test(n) ||
    /\d[\d,]*\s*(?:per month|a month|monthly|mahine|mahina)/.test(n)
  );
}

function isMonthlyIncomePhrase(text) {
  if (disclaimsMonthlyIncome(text)) return false;
  const n = norm(text);
  return /month|monthly|per month|mahine|mahina|mahane/.test(n);
}

/**
 * Parse income from speech — converts yearly → monthly when needed.
 * @returns {{ monthly: string, yearly?: number, fromYearly: boolean } | null}
 */
function parseIncome(text) {
  const amount = parseIndianAmount(text);
  if (amount == null) return null;

  const yearlyHint = isYearlyIncomePhrase(text) || disclaimsMonthlyIncome(text);
  const monthlyHint = isMonthlyIncomePhrase(text) || hasExplicitMonthlyAmount(text);

  if (yearlyHint && !monthlyHint) {
    const monthly = Math.round(amount / 12);
    return { monthly: String(monthly), yearly: amount, fromYearly: true };
  }

  if (monthlyHint && !yearlyHint) {
    return { monthly: String(amount), fromYearly: false };
  }

  if (yearlyHint && monthlyHint) {
    const monthly = Math.round(amount / 12);
    return { monthly: String(monthly), yearly: amount, fromYearly: true };
  }

  // Amounts ≥ ₹3 lakh with no period stated are usually yearly CTC in India
  if (amount >= 300000) {
    const monthly = Math.round(amount / 12);
    return { monthly: String(monthly), yearly: amount, fromYearly: true };
  }

  return { monthly: String(amount), fromYearly: false };
}

function isValidDobParts(day, month, year) {
  const d = parseInt(String(day), 10);
  const m = parseInt(String(month), 10);
  const y = parseInt(String(year), 10);
  if (!d || !m || !y) return false;
  if (d < 1 || d > 31 || m < 1 || m > 12) return false;
  if (y < 1940 || y > 2010) return false;
  return true;
}

const MONTH_MAP = {
  jan: '01', january: '01', feb: '02', february: '02', mar: '03', march: '03',
  apr: '04', april: '04', may: '05', jun: '06', june: '06', jul: '07', july: '07',
  aug: '08', august: '08', sep: '09', sept: '09', september: '09', oct: '10', october: '10',
  nov: '11', november: '11', dec: '12', december: '12',
};

function expandYear(y) {
  const n = parseInt(String(y), 10);
  if (String(y).length === 4) return String(n);
  if (n < 30) return `20${String(y).padStart(2, '0')}`;
  return `19${String(y).padStart(2, '0')}`;
}

function parseDob(text) {
  const raw = cleanSpeechText(text);
  if (!raw) return null;

  const slash = raw.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (slash) {
    const day = slash[1].padStart(2, '0');
    const month = slash[2].padStart(2, '0');
    const year = expandYear(slash[3]);
    if (isValidDobParts(day, month, year)) {
      return { dobDay: day, dobMonth: month, dobYear: year };
    }
  }

  const verbal = norm(raw);

  for (const [name, num] of Object.entries(MONTH_MAP)) {
    const patterns = [
      new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${name}\\s+(?:of\\s+)?(\\d{2,4})\\b`),
      new RegExp(`${name}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(\\d{2,4})\\b`),
    ];
    for (const re of patterns) {
      const m = verbal.match(re);
      if (!m) continue;
      const day = m[1].padStart(2, '0');
      const year = expandYear(m[2]);
      if (isValidDobParts(day, num, year)) {
        return { dobDay: day, dobMonth: num, dobYear: year };
      }
    }
  }

  const yearMatch = verbal.match(/\b(19\d{2}|20\d{2})\b/);
  const dayMatch = verbal.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (yearMatch && dayMatch) {
    for (const [name, num] of Object.entries(MONTH_MAP)) {
      if (new RegExp(`\\b${name}\\b`).test(verbal)) {
        const day = dayMatch[1].padStart(2, '0');
        const year = yearMatch[1];
        if (isValidDobParts(day, num, year)) {
          return { dobDay: day, dobMonth: num, dobYear: year };
        }
      }
    }
  }

  const digits = wordsToDigits(raw).replace(/\D/g, '');
  if (digits.length === 8) {
    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = digits.slice(4);
    if (isValidDobParts(day, month, year)) {
      return { dobDay: day, dobMonth: month, dobYear: year };
    }
  }

  if (digits.length === 6) {
    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = expandYear(digits.slice(4));
    if (isValidDobParts(day, month, year)) {
      return { dobDay: day, dobMonth: month, dobYear: year };
    }
  }

  return null;
}

function parseName(text) {
  if (looksLikePan(text)) return null;
  const raw = cleanSpeechText(text);
  const patterns = [
    /(?:name\s+is|my\s+name\s+is|i\s+am|call\s+me)\s+([A-Za-z][A-Za-z\s.'-]{1,50})/i,
    /(?:full\s+name)\s+([A-Za-z][A-Za-z\s.'-]{1,50})/i,
  ];
  for (const p of patterns) {
    const m = raw.match(p);
    if (m?.[1] && !looksLikePan(m[1])) return m[1].trim().replace(/\s+/g, ' ');
  }
  if (/^[A-Za-z][A-Za-z\s.'-]{2,50}$/.test(raw) && raw.split(/\s+/).length >= 2 && !looksLikePan(raw)) {
    return raw.replace(/\s+/g, ' ');
  }
  return null;
}

function matchOption(text, options, valueKey = 'id', labelKey = 'label') {
  const n = norm(text);
  for (const opt of options) {
    const id = typeof opt === 'string' ? opt : opt[valueKey];
    const label = norm(typeof opt === 'string' ? opt : opt[labelKey]);
    if (n === label || n.includes(label) || label.includes(n)) return id;
  }
  return null;
}

function parseGender(text) {
  const n = norm(text);
  if (/female|woman|girl/.test(n)) return 'female';
  if (/male|man|boy/.test(n)) return 'male';
  if (/other|third/.test(n)) return 'others';
  return matchOption(text, GENDER_OPTIONS);
}

function parseEmploymentType(text) {
  const n = norm(text);
  if (/business|self|entrepreneur/.test(n)) return 'business';
  if (/salar|job|employed|salary/.test(n)) return 'salaried';
  return matchOption(text, EMPLOYMENT_TYPES);
}

/** Which single field should we collect next? */
export function getNextIncredField(form, phase) {
  if (phase === 'login_info' || phase === 'basic_details') {
    if (!form.pan) return 'pan';
    if (!form.fullName) return 'fullName';
    if (!form.dobDay || !form.dobMonth || !form.dobYear) return 'dob';
    if (!form.gender) return 'gender';
    if (!form.pincode) return 'pincode';
    return null;
  }
  if (phase === 'employment') {
    if (!form.employmentType) return 'employmentType';
    if (!form.netMonthlyIncome) return 'netMonthlyIncome';
    if (!form.companyName) return 'companyName';
    return null;
  }
  if (phase === 'eligibility') {
    if (!form.maritalStatus) return 'maritalStatus';
    if (!form.residenceType) return 'residenceType';
    if (!form.email) return 'email';
    if (!form.purpose) return 'purpose';
    return null;
  }
  return null;
}

function replyForField(field, value, form, phase) {
  switch (field) {
    case 'pan':
      return `Thank you. I have your PAN as ${value}. What is your full name as per your PAN card?`;
    case 'fullName':
      return `Thank you, ${value}. What is your date of birth?`;
    case 'dob': {
      const d = form.dobDay || '';
      const m = form.dobMonth || '';
      const y = form.dobYear || '';
      if (d && m && y) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const mi = parseInt(m, 10) - 1;
        const label = months[mi] ? `${parseInt(d, 10)} ${months[mi]} ${y}` : `${d}/${m}/${y}`;
        return `Got it — ${label}. What is your gender?`;
      }
      return 'Thank you. Could you share your complete date of birth — day, month, and year?';
    }
    case 'gender':
      return `Thank you. What is your pincode?`;
    case 'pincode':
      return phase === 'login_info'
        ? 'Thank you. I have all your basic details. Shall I continue?'
        : 'Thank you. Shall I continue with your application?';
    case 'employmentType':
      return 'Thank you. What is your net monthly income?';
    case 'netMonthlyIncome':
      return `Thank you. Which company do you work for?`;
    case 'companyName':
      return 'Thank you. Shall I continue?';
    case 'maritalStatus':
      return 'Thank you. What is your current residence type — owned, rented, or other?';
    case 'residenceType':
      return 'Thank you. What is your email address?';
    case 'email':
      return 'Thank you. What is the purpose of this loan?';
    case 'purpose':
      return 'Thank you. I will submit your application now.';
    default:
      return 'Thank you.';
  }
}

function parseForField(field, text, form) {
  switch (field) {
    case 'pan': {
      const pan = parseSpokenPan(text);
      return pan ? { pan } : null;
    }
    case 'fullName': {
      const name = parseName(text);
      return name ? { fullName: name } : null;
    }
    case 'dob': {
      const dob = parseDob(text);
      if (dob) return dob;
      if (/\d|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|birth|born/i.test(text)) {
        return { __invalid: true };
      }
      return null;
    }
    case 'gender': {
      const gender = parseGender(text);
      return gender ? { gender } : null;
    }
    case 'pincode': {
      const pincode = parsePincode(text);
      return pincode ? { pincode } : null;
    }
    case 'employmentType': {
      const employmentType = parseEmploymentType(text);
      return employmentType ? { employmentType } : null;
    }
    case 'netMonthlyIncome': {
      const result = parseIncome(text);
      if (!result) return null;
      const patch = { netMonthlyIncome: result.monthly };
      if (result.fromYearly && result.yearly) {
        patch.__reply =
          `No problem. Based on your yearly income of ₹${formatInr(result.yearly)}, ` +
          `your monthly income works out to about ₹${formatInr(result.monthly)}. Which company do you work for?`;
      }
      return patch;
    }
    case 'companyName': {
      const company = matchOption(text, COMPANY_OPTIONS.map((c) => ({ id: c, label: c })));
      return company ? { companyName: company } : null;
    }
    case 'maritalStatus': {
      const maritalStatus = matchOption(text, MARITAL_OPTIONS);
      return maritalStatus ? { maritalStatus } : null;
    }
    case 'residenceType': {
      const residenceType = matchOption(text, RESIDENCE_OPTIONS);
      return residenceType ? { residenceType } : null;
    }
    case 'email': {
      const emailMatch = cleanSpeechText(text).match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
      return emailMatch ? { email: emailMatch[0] } : null;
    }
    case 'purpose': {
      const purpose = matchOption(text, PURPOSE_OPTIONS);
      return purpose ? { purpose } : null;
    }
    default:
      return null;
  }
}

/**
 * Parse voice for exactly ONE field — the next empty field in the journey.
 * @returns {{ handled: boolean, patch?: object, reply?: string, field?: string }}
 */
export function parseIncredVoiceInput(phase, text, form = {}) {
  const raw = cleanSpeechText(text);
  if (!raw) return { handled: false };

  const n = norm(raw);
  if (/^(yes|yeah|yep|haan|ha|ok|okay|sure|proceed|continue|confirm|theek)/.test(n)) {
    return { handled: false };
  }

  const field = getNextIncredField(form, phase);
  if (!field) return { handled: false };

  const patch = parseForField(field, raw, form);
  if (!patch) return { handled: false };

  if (patch.__invalid) {
    return {
      handled: true,
      patch: {},
      reply: 'Sorry, I didn\'t catch your date of birth clearly. Could you say it again, for example 27 March 2007?',
    };
  }

  const merged = { ...form, ...patch };
  const customReply = patch.__reply;
  const cleanPatch = { ...patch };
  delete cleanPatch.__reply;
  delete cleanPatch.__invalid;

  const displayValue =
    cleanPatch.pan ||
    cleanPatch.fullName ||
    cleanPatch.pincode ||
    cleanPatch.gender ||
    cleanPatch.companyName ||
    cleanPatch.email ||
    (cleanPatch.netMonthlyIncome ? `₹${formatInr(cleanPatch.netMonthlyIncome)}` : null) ||
    cleanPatch.maritalStatus ||
    cleanPatch.residenceType ||
    cleanPatch.purpose ||
    cleanPatch.employmentType ||
    (cleanPatch.dobDay ? `${cleanPatch.dobDay}/${cleanPatch.dobMonth}/${cleanPatch.dobYear}` : null);

  return {
    handled: true,
    patch: cleanPatch,
    field,
    reply: customReply || replyForField(field, displayValue, { ...merged, ...cleanPatch }, phase),
  };
}

export { parseSpokenPan as parsePan };
