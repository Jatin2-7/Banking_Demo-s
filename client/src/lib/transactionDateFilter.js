/** Parse & filter account statement dates (mock format: "16 May 2026"). */

const MONTHS = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const DISPLAY_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const RANGE_SEP = '(?:to|until|till|through|upto|up to|-)';

/** Spoken/written day ordinals → day of month */
const ORDINAL_WORDS = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  sixth: 6,
  seventh: 7,
  eighth: 8,
  ninth: 9,
  tenth: 10,
  eleventh: 11,
  twelfth: 12,
  thirteenth: 13,
  fourteenth: 14,
  fifteenth: 15,
  sixteenth: 16,
  seventeenth: 17,
  eighteenth: 18,
  nineteenth: 19,
  twentieth: 20,
  twentyfirst: 21,
  'twenty-first': 21,
  twentysecond: 22,
  'twenty-second': 22,
  twentythird: 23,
  'twenty-third': 23,
  twentyfourth: 24,
  'twenty-fourth': 24,
  twentyfifth: 25,
  'twenty-fifth': 25,
  twentysixth: 26,
  'twenty-sixth': 26,
  twentyseventh: 27,
  'twenty-seventh': 27,
  twentyeighth: 28,
  'twenty-eighth': 28,
  twentyninth: 29,
  'twenty-ninth': 29,
  thirtieth: 30,
  thirtyfirst: 31,
  'thirty-first': 31,
};

function ordinalWordToDay(word) {
  if (!word) return null;
  const key = String(word).toLowerCase().replace(/-/g, '');
  const day = ORDINAL_WORDS[key];
  return day != null ? day : null;
}

/** @param {string} iso YYYY-MM-DD */
export function isoToDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** @param {Date} d */
export function dateToIso(d) {
  if (!d || Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** @param {string} dateStr e.g. "16 May 2026" or "15/06/2026" */
export function parseStatementDate(dateStr) {
  const s = String(dateStr || '').trim();
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    return new Date(Number(slash[3]), Number(slash[2]) - 1, Number(slash[1]));
  }
  const m = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!m) return null;
  const month = MONTHS[m[2].toLowerCase()];
  if (month == null) return null;
  return new Date(Number(m[3]), month, Number(m[1]));
}

function sanitizeFragment(fragment) {
  return String(fragment || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[,.]/g, '')
    .replace(/\b(date|dates)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b(please|thanks|thank you|transactions|transaction|history|statement|account|show|for|in|of|me|my)\b.*$/i, '')
    .trim();
}

function parseDayMonthFragment(fragment, { defaultYear = 2026, defaultMonth = null } = {}) {
  const cleaned = sanitizeFragment(fragment);
  if (!cleaned) return null;

  const firstOf = cleaned.match(/^(?:the\s+)?first(?:\s+of)?\s+([a-z]+)(?:\s+(\d{4}))?$/i);
  if (firstOf) {
    const month = MONTHS[firstOf[1].toLowerCase()];
    if (month == null) return null;
    const year = firstOf[2] ? Number(firstOf[2]) : defaultYear;
    const d = new Date(year, month, 1);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const wordDayMonth = cleaned.match(/^(?:the\s+)?([a-z-]+)(?:\s+of)?\s+([a-z]+)(?:\s+(\d{4}))?$/i);
  if (wordDayMonth) {
    const day = ordinalWordToDay(wordDayMonth[1]);
    const month = MONTHS[wordDayMonth[2].toLowerCase()];
    if (day != null && month != null) {
      const year = wordDayMonth[3] ? Number(wordDayMonth[3]) : defaultYear;
      const d = new Date(year, month, day);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  const monthFirstWord = cleaned.match(/^([a-z]+)\s+(?:the\s+)?([a-z-]+)(?:\s+(\d{4}))?$/i);
  if (monthFirstWord) {
    const month = MONTHS[monthFirstWord[1].toLowerCase()];
    const day = ordinalWordToDay(monthFirstWord[2]);
    if (month != null && day != null) {
      const year = monthFirstWord[3] ? Number(monthFirstWord[3]) : defaultYear;
      const d = new Date(year, month, day);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  const monthFirst = cleaned.match(/^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?$/i);
  if (monthFirst) {
    const month = MONTHS[monthFirst[1].toLowerCase()];
    if (month == null) return null;
    const year = monthFirst[3] ? Number(monthFirst[3]) : defaultYear;
    const d = new Date(year, month, Number(monthFirst[2]));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const withMonth = cleaned.match(/^(\d{1,2})(?:st|nd|rd|th)?(?:\s+of)?\s+([a-z]+)(?:\s+(\d{4}))?$/i);
  if (withMonth) {
    const month = MONTHS[withMonth[2].toLowerCase()];
    if (month == null) return null;
    const year = withMonth[3] ? Number(withMonth[3]) : defaultYear;
    const day = Number(withMonth[1]);
    const d = new Date(year, month, day);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (defaultMonth != null) {
    const dayOnly = cleaned.match(/^(\d{1,2})(?:st|nd|rd|th)?$/);
    if (dayOnly) {
      const d = new Date(defaultYear, defaultMonth, Number(dayOnly[1]));
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const wordOnly = cleaned.match(/^(?:the\s+)?([a-z-]+)$/);
    if (wordOnly) {
      const day = ordinalWordToDay(wordOnly[1]);
      if (day != null) {
        const d = new Date(defaultYear, defaultMonth, day);
        return Number.isNaN(d.getTime()) ? null : d;
      }
    }
  }

  return null;
}

function tryParseRange(fromFrag, toFrag) {
  const fromDate = parseDayMonthFragment(fromFrag);
  if (!fromDate) return null;

  const toDate = parseDayMonthFragment(toFrag, {
    defaultYear: fromDate.getFullYear(),
    defaultMonth: fromDate.getMonth(),
  });
  if (!toDate) return null;

  let start = fromDate;
  let end = toDate;
  if (start > end) [start, end] = [end, start];

  return { dateFrom: dateToIso(start), dateTo: dateToIso(end) };
}

function extractRangeFragments(q) {
  const patterns = [
    new RegExp(`\\bfrom\\s+(.+?)\\s+${RANGE_SEP}\\s+(.+)$`, 'i'),
    new RegExp(`\\bbetween\\s+(.+?)\\s+and\\s+(.+?)$`, 'i'),
    new RegExp(
      `(?:^|\\b)(?:show(?:\\s+me)?(?:\\s+(?:my\\s+)?(?:account\\s+history|transaction(?:s)?|statement|account\\s+statement))?|filter(?:\\s+(?:to|by))?|set(?:\\s+the)?\\s+date\\s+range(?:\\s+to)?)\\s*(?:from\\s+)?(.+?)\\s+${RANGE_SEP}\\s+(.+?)$`,
      'i',
    ),
    new RegExp(`(.+?)\\s+${RANGE_SEP}\\s+(.+?)$`, 'i'),
  ];

  for (const re of patterns) {
    const m = q.match(re);
    if (m) return { fromFrag: m[1], toFrag: m[2] };
  }
  return null;
}

/**
 * Extract a date window from a voice utterance.
 * @returns {{ dateFrom: string|null, dateTo: string|null } | null}
 */
export function parseDateRangeFromUtterance(text) {
  const q = String(text || '')
    .toLowerCase()
    .replace(/[._,!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!q) return null;

  const extracted = extractRangeFragments(q);
  if (!extracted) return null;

  return tryParseRange(extracted.fromFrag, extracted.toFrag);
}

/** @param {string|null} dateFrom ISO */
/** @param {string|null} dateTo ISO */
export function formatPeriodLabel(dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return 'All transactions';
  const fmt = (iso) => {
    const d = isoToDate(iso);
    if (!d) return iso;
    return `${d.getDate()} ${DISPLAY_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };
  if (dateFrom && dateTo) return `${fmt(dateFrom)} – ${fmt(dateTo)}`;
  if (dateFrom) return `From ${fmt(dateFrom)}`;
  return `Until ${fmt(dateTo)}`;
}

/**
 * @param {Array<{ date: string }>} transactions
 * @param {string|null} dateFrom ISO inclusive
 * @param {string|null} dateTo ISO inclusive
 */
export function filterTransactionsByRange(transactions, dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return transactions;
  const from = dateFrom ? isoToDate(dateFrom) : null;
  const to = dateTo ? isoToDate(dateTo) : null;
  if (to) to.setHours(23, 59, 59, 999);

  return transactions.filter((txn) => {
    const d = parseStatementDate(txn.date);
    if (!d) return false;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
}

/** Quick presets aligned with demo mock statement data. */
export const PERIOD_PRESETS = [
  { id: 'all', label: 'All transactions', dateFrom: null, dateTo: null },
  { id: 'apr-2026', label: '1 Apr – 30 Apr 2026', dateFrom: '2026-04-01', dateTo: '2026-04-30' },
  { id: 'may-1-15', label: '1 May – 15 May 2026', dateFrom: '2026-05-01', dateTo: '2026-05-15' },
  { id: 'may-2026', label: '1 May – 31 May 2026', dateFrom: '2026-05-01', dateTo: '2026-05-31' },
  { id: 'mar-2026', label: '1 Mar – 31 Mar 2026', dateFrom: '2026-03-01', dateTo: '2026-03-31' },
];
