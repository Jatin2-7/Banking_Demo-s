/** Fast local parsing for SBI home loan voice/text — skips LLM round-trip. */

const LOAN_PURPOSE_CATEGORIES = [
  'Realty Loan for purchase of Plot',
  'New/Old Independent House/Villa/Bungalow/Row House',
  'New/Old Flat',
];

const PURPOSE_OPTIONS = [
  'Purchase Of A Plot For Construction Of A House',
  'Purchase Of New House / Flat',
  'Purchase Of Old House / Flat',
  'Construction Of New House / Flat',
  'Extension Of Existing Old House / Flat',
];

const PROPERTY_TYPES = [
  'Builder Tie-Up',
  'No Builder Tie-Up',
  'Preferred Builder',
  'Self-Constructed/ Independent House',
  'Small Project Not Covered Under Rera',
  'Property Not Identified',
];

const PROPERTY_STATUS = ['Construction not started', 'Ready for possession', 'Under Construction'];
const REPAYMENT_MODES = ['Standing Instruction SI', 'NACH'];

const NEXT_FIELD_PROMPTS = [
  { key: 'loanPurposeCategory', label: 'loan purpose category (plot, villa, or flat)' },
  { key: 'purposeOfLoan', label: 'purpose of loan (new flat, old house, construction, etc.)' },
  { key: 'propertyValue', label: 'estimated property value in rupees' },
  { key: 'loanAmount', label: 'loan amount you need' },
  { key: 'propertyType', label: 'property type' },
  { key: 'propertyStatus', label: 'property status' },
  { key: 'repaymentMode', label: 'repayment mode — SI or NACH' },
  { key: 'capitaliseInterest', label: 'whether to capitalise interest during moratorium (yes or no)' },
];

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[.,!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\bflight\b/g, 'flat')
    .replace(/\bflate\b/g, 'flat')
    .replace(/\bflats\b/g, 'flat')
    .replace(/\bplots\b/g, 'plot');
}

function parseIndianAmount(fragment) {
  const s = String(fragment || '').toLowerCase().replace(/[,₹\s]/g, '');
  if (!s) return null;

  const crore = s.match(/(\d+(?:\.\d+)?)\s*crore/);
  if (crore) return String(Math.round(parseFloat(crore[1]) * 10000000));

  const lakh = s.match(/(\d+(?:\.\d+)?)\s*lakh/);
  if (lakh) return String(Math.round(parseFloat(lakh[1]) * 100000));

  const thousand = s.match(/(\d+(?:\.\d+)?)\s*(?:thousand|k)\b/);
  if (thousand) return String(Math.round(parseFloat(thousand[1]) * 1000));

  const digits = s.match(/\d{5,}/);
  if (digits) return digits[0];

  return null;
}

function extractLabeledAmount(text, labels) {
  for (const label of labels) {
    const re = new RegExp(`${label}[^\\d]{0,20}(\\d[\\d.,\\s]*(?:lakh|crore|thousand|k)?)`, 'i');
    const m = text.match(re);
    if (m) {
      const amt = parseIndianAmount(m[1]);
      if (amt) return amt;
    }
  }
  return null;
}

function matchFromList(text, options) {
  const t = normalize(text);
  for (const opt of options) {
    const key = opt.toLowerCase();
    if (t.includes(key) || key.includes(t)) return opt;
  }
  for (const opt of options) {
    const tokens = opt.toLowerCase().split(/[\s/]+/).filter((w) => w.length > 3);
    if (tokens.some((tok) => t.includes(tok))) return opt;
  }
  return null;
}

function matchLoanPurposeCategory(t) {
  if (
    /\bnew\s*\/?\s*old\s+flat\b/.test(t) ||
    /\bnew\s+old\s+flat\b/.test(t) ||
    /\b(flat|apartment|condo)\b/.test(t)
  ) {
    return 'New/Old Flat';
  }
  if (/\b(plot|land)\b/.test(t) && !/\bconstruction\b/.test(t)) {
    return 'Realty Loan for purchase of Plot';
  }
  if (/\b(villa|bungalow|row house|independent house)\b/.test(t)) {
    return 'New/Old Independent House/Villa/Bungalow/Row House';
  }
  if (/\bhouse\b/.test(t) && !/\b(flat|plot)\b/.test(t)) {
    return 'New/Old Independent House/Villa/Bungalow/Row House';
  }
  return matchFromList(t, LOAN_PURPOSE_CATEGORIES);
}

function isCategoryOnlyUtterance(t) {
  return (
    /^new\s*\/?\s*old\s+flat$/.test(t) ||
    /^new\s+old\s+flat$/.test(t) ||
    /^(flat|plot|villa|bungalow|house|apartment)$/.test(t) ||
    LOAN_PURPOSE_CATEGORIES.some((c) => t === c.toLowerCase())
  );
}

function matchPurposeOfLoan(t) {
  if (isCategoryOnlyUtterance(t)) return null;
  if (/\bconstruction\b/.test(t)) return 'Construction Of New House / Flat';
  if (/\bextension\b/.test(t)) return 'Extension Of Existing Old House / Flat';
  if (/\bplot\b/.test(t) && /\b(purchase|buy)\b/.test(t)) {
    return 'Purchase Of A Plot For Construction Of A House';
  }
  if (/\bold\b/.test(t) && /\b(flat|house|property|home)\b/.test(t) && !/\bnew\s*\/?\s*old\b/.test(t)) {
    return 'Purchase Of Old House / Flat';
  }
  if (/\bnew\b/.test(t) && /\b(flat|house|property|home)\b/.test(t)) {
    return 'Purchase Of New House / Flat';
  }
  if (/\b(purchase|buy)\b/.test(t) && /\b(flat|house|property|home)\b/.test(t)) {
    return 'Purchase Of New House / Flat';
  }
  return matchFromList(t, PURPOSE_OPTIONS);
}

function matchPropertyType(t) {
  if (/\bbuilder\s*tie[\s-]?up\b/.test(t) && !/\bno\b/.test(t)) return 'Builder Tie-Up';
  if (/\bno\s+builder\b/.test(t)) return 'No Builder Tie-Up';
  if (/\bpreferred\s+builder\b/.test(t)) return 'Preferred Builder';
  if (/\bself[\s-]?constructed\b/.test(t) || /\bindependent\s+house\b/.test(t)) {
    return 'Self-Constructed/ Independent House';
  }
  if (/\brera\b/.test(t)) return 'Small Project Not Covered Under Rera';
  if (/\bnot\s+identified\b/.test(t)) return 'Property Not Identified';
  return matchFromList(t, PROPERTY_TYPES);
}

function matchPropertyStatus(t) {
  if (/\bready\b/.test(t) || /\bpossession\b/.test(t)) return 'Ready for possession';
  if (/\bunder\s+construction\b/.test(t)) return 'Under Construction';
  if (/\bnot\s+started\b/.test(t) || /\bconstruction\s+not\b/.test(t)) {
    return 'Construction not started';
  }
  return matchFromList(t, PROPERTY_STATUS);
}

function matchRepaymentMode(t) {
  if (/\bnach\b/.test(t)) return 'NACH';
  if (/\bsi\b/.test(t) || /\bstanding\s+instruction\b/.test(t)) return 'Standing Instruction SI';
  return matchFromList(t, REPAYMENT_MODES);
}

function matchYesNo(t) {
  if (/\b(yes|yeah|yep|haan|ha|correct)\b/.test(t)) return 'Yes';
  if (/\b(no|nope|nah|nahi)\b/.test(t)) return 'No';
  return null;
}

function matchEmploymentType(t) {
  if (/\bself[\s-]?employed\b/.test(t)) return 'Self Employed';
  if (/\bsalaried\b/.test(t) || /\bsalary\b/.test(t)) return 'Salaried';
  if (/\bothers?\b/.test(t)) return 'Others';
  return null;
}

function getNextEmptyField(state) {
  return NEXT_FIELD_PROMPTS.find(({ key }) => !String(state[key] || '').trim()) || null;
}

function describeFilled(fields) {
  const labels = {
    loanPurposeCategory: 'loan category',
    purposeOfLoan: 'purpose of loan',
    propertyValue: 'property value',
    loanAmount: 'loan amount',
    propertyType: 'property type',
    propertyStatus: 'property status',
    repaymentMode: 'repayment mode',
    capitaliseInterest: 'capitalise interest',
    employmentType: 'employment type',
    employerName: 'employer name',
    grossIncome: 'gross income',
    netIncome: 'net income',
  };
  return Object.keys(fields).map((k) => labels[k] || k).join(', ');
}

/**
 * @param {string} text
 * @param {Record<string, string>} formState
 * @returns {{ fields: Record<string, string>, reply: string } | null}
 */
export function parseSbiHomeLoanInput(text, formState = {}) {
  const raw = String(text || '').trim();
  if (!raw) return null;

  const t = normalize(raw);
  const fields = {};
  const merged = { ...formState };

  const category = matchLoanPurposeCategory(t);
  if (category && !merged.loanPurposeCategory) {
    fields.loanPurposeCategory = category;
    merged.loanPurposeCategory = category;
  }

  const purpose = matchPurposeOfLoan(t);
  if (purpose && !merged.purposeOfLoan && (merged.loanPurposeCategory || fields.loanPurposeCategory)) {
    fields.purposeOfLoan = purpose;
    merged.purposeOfLoan = purpose;
  }

  const propertyValue =
    extractLabeledAmount(raw, ['property value', 'property worth', 'property cost', 'value of property']) ||
    (/\bproperty\b/.test(t) ? parseIndianAmount(t) : null);
  if (propertyValue && !merged.propertyValue) {
    fields.propertyValue = propertyValue;
    merged.propertyValue = propertyValue;
  }

  const loanAmount =
    extractLabeledAmount(raw, ['loan amount', 'loan of', 'borrow', 'need a loan', 'loan for']) ||
    (() => {
      const m = raw.match(/\bloan\s+(\d[\d.,\s]*(?:lakh|crore|thousand|k)?)/i);
      return m ? parseIndianAmount(m[1]) : null;
    })() ||
    (!/\bproperty\b/.test(t) ? parseIndianAmount(t) : null);
  if (loanAmount && !merged.loanAmount) {
    fields.loanAmount = loanAmount;
    merged.loanAmount = loanAmount;
  }

  const propertyType = matchPropertyType(t);
  if (propertyType && !merged.propertyType && /\b(builder|rera|tie[\s-]?up|self[\s-]?constructed|preferred)\b/.test(t)) {
    fields.propertyType = propertyType;
    merged.propertyType = propertyType;
  }

  const propertyStatus = matchPropertyStatus(t);
  if (propertyStatus && !merged.propertyStatus) {
    fields.propertyStatus = propertyStatus;
    merged.propertyStatus = propertyStatus;
  }

  const repaymentMode = matchRepaymentMode(t);
  if (repaymentMode && !merged.repaymentMode) {
    fields.repaymentMode = repaymentMode;
    merged.repaymentMode = repaymentMode;
  }

  const yesNo = matchYesNo(t);
  if (yesNo && !merged.capitaliseInterest && /\b(capital|moratorium|interest)\b/.test(t)) {
    fields.capitaliseInterest = yesNo;
    merged.capitaliseInterest = yesNo;
  } else if (yesNo && !merged.capitaliseInterest && Object.keys(fields).length === 0) {
    fields.capitaliseInterest = yesNo;
    merged.capitaliseInterest = yesNo;
  }

  const employmentType = matchEmploymentType(t);
  if (employmentType && !merged.employmentType) {
    fields.employmentType = employmentType;
    merged.employmentType = employmentType;
  }

  const incomeMatch = raw.match(/(?:gross|net)\s*(?:monthly\s*)?income[^0-9]{0,12}(\d[\d.,\s]*(?:lakh|crore)?)/i);
  if (incomeMatch) {
    const amt = parseIndianAmount(incomeMatch[1]);
    if (amt) {
      if (/gross/i.test(incomeMatch[0]) && !merged.grossIncome) {
        fields.grossIncome = amt;
        merged.grossIncome = amt;
      }
      if (/net/i.test(incomeMatch[0]) && !merged.netIncome) {
        fields.netIncome = amt;
        merged.netIncome = amt;
      }
    }
  }

  if (Object.keys(fields).length === 0) return null;

  const next = getNextEmptyField(merged);
  const reply = next
    ? `Done — updated ${describeFilled(fields)}. What is your ${next.label}?`
    : `Done — updated ${describeFilled(fields)}. Tap Save & Next when this section looks good.`;

  return { fields, reply };
}

export function getSbiHomeLoanGreetingHint(formState = {}) {
  const next = getNextEmptyField(formState);
  if (!next) return 'All main fields are filled — review and tap Save & Next.';
  return `Tell me your ${next.label} — for example say "flat" or "50 lakh loan".`;
}
