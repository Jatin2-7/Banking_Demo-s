/** EaseMyTrip Forex Cash journey — form state, rates, and agent mapping. */

export const EXCHANGE_RATES = {
  USD: 97.02,
  EUR: 89.5,
  GBP: 103.2,
  AED: 26.45,
  SGD: 75.36,
};

export const CARD_RATE = 96.4144;

export const CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Chennai',
  'Kolkata',
  'Hyderabad',
  'Pune',
  'Ahmedabad',
];

export const CURRENCIES = [
  { code: 'USD', label: 'USD', flag: '🇺🇸', spoken: 'US dollars' },
  { code: 'EUR', label: 'EUR', flag: '🇪🇺', spoken: 'euros' },
  { code: 'GBP', label: 'GBP', flag: '🇬🇧', spoken: 'British pounds' },
  { code: 'AED', label: 'AED', flag: '🇦🇪', spoken: 'UAE dirhams' },
  { code: 'SGD', label: 'SGD', flag: '🇸🇬', spoken: 'Singapore dollars' },
];

export function spokenCurrencyName(code) {
  return CURRENCIES.find((c) => c.code === code)?.spoken || code;
}

export const CARD_OPTIONS = ['GlobalPay Smart Switch Card', 'GlobalPay Multi-Currency Card'];

export const INITIAL_FOREX_FORM = {
  phase: 'form',
  partner: 'globalpay',
  activeTab: 'currency',
  transactionType: 'buy',
  cardAction: 'load',
  city: 'Mumbai',
  foreignCurrency: 'USD',
  foreignAmount: '2000',
  inrAmount: '194040',
  cardType: 'GlobalPay Smart Switch Card',
  mobile: '',
  email: '',
  otp: '',
  consentGiven: false,
  orderRef: '',
};

export function calcInrAmount(foreignAmount, currency, isCard = false) {
  const amt = parseFloat(String(foreignAmount).replace(/,/g, '')) || 0;
  const rate = isCard ? CARD_RATE : EXCHANGE_RATES[currency] || EXCHANGE_RATES.USD;
  return String(Math.round(amt * rate));
}

export function calcForeignAmount(inrAmount, currency, isCard = false) {
  const amt = parseFloat(String(inrAmount).replace(/,/g, '')) || 0;
  const rate = isCard ? CARD_RATE : EXCHANGE_RATES[currency] || EXCHANGE_RATES.USD;
  return String(Math.round((amt / rate) * 100) / 100);
}

/** Recalculate paired amounts after INR, foreign, or currency changes. */
export function recalcForexAmounts(form, patch = {}) {
  const currency = patch.foreignCurrency ?? form.foreignCurrency ?? 'USD';
  const isCard = (patch.activeTab ?? form.activeTab) === 'forex_card';

  if (patch.inrAmount != null) {
    return {
      ...patch,
      foreignAmount: calcForeignAmount(patch.inrAmount, currency, isCard),
    };
  }
  if (patch.foreignAmount != null) {
    return {
      ...patch,
      inrAmount: calcInrAmount(patch.foreignAmount, currency, isCard),
    };
  }
  if (patch.foreignCurrency != null) {
    const inr = form.inrAmount;
    if (inr) {
      return {
        ...patch,
        foreignAmount: calcForeignAmount(inr, currency, isCard),
      };
    }
    const foreign = form.foreignAmount;
    if (foreign) {
      return {
        ...patch,
        inrAmount: calcInrAmount(foreign, currency, isCard),
      };
    }
  }
  return patch;
}

export function getExchangeRate(currency, isCard = false) {
  return isCard ? CARD_RATE : EXCHANGE_RATES[currency] || EXCHANGE_RATES.USD;
}

export function generateOrderRef() {
  return `EMT${Date.now().toString().slice(-8)}`;
}

/** Next voice prompt based on current form phase and filled fields. */
export function getNextForexPrompt(form) {
  if (form.phase === 'success') return null;
  if (!form.city) return 'Which city do you need delivery in?';
  if (!form.foreignCurrency) return 'Which currency — US dollars, Singapore dollars, or euros?';
  if (!form.foreignAmount && !form.inrAmount)
    return 'How much do you need? You can say amount in rupees or foreign currency.';
  return 'Say order now to complete your order.';
}

export function formToAgentState(form) {
  return {
    phase: form.phase,
    partner: form.partner,
    active_tab: form.activeTab,
    transaction_type: form.transactionType,
    card_action: form.cardAction,
    city: form.city,
    foreign_currency: form.foreignCurrency,
    foreign_amount: form.foreignAmount,
    inr_amount: form.inrAmount,
    card_type: form.cardType,
    mobile: form.mobile,
    email: form.email,
    otp: form.otp,
    consent_given: form.consentGiven,
    order_ref: form.orderRef,
    next_prompt: getNextForexPrompt(form) || '',
  };
}

export function agentStateToFormPatch(patch) {
  const map = {
    phase: 'phase',
    partner: 'partner',
    active_tab: 'activeTab',
    transaction_type: 'transactionType',
    card_action: 'cardAction',
    city: 'city',
    foreign_currency: 'foreignCurrency',
    foreign_amount: 'foreignAmount',
    inr_amount: 'inrAmount',
    card_type: 'cardType',
    mobile: 'mobile',
    email: 'email',
    otp: 'otp',
    consent_given: 'consentGiven',
    order_ref: 'orderRef',
  };
  const out = {};
  for (const [k, v] of Object.entries(patch)) {
    const key = map[k] || k;
    if (key === 'consentGiven') out[key] = v === true || v === 'true';
    else out[key] = v;
  }
  if (out.foreignAmount != null || out.foreignCurrency != null || out.inrAmount != null) {
    const merged = recalcForexAmounts(
      {
        foreignCurrency: out.foreignCurrency || patch.foreign_currency,
        activeTab: out.activeTab,
        inrAmount: out.inrAmount ?? patch.inr_amount,
        foreignAmount: out.foreignAmount ?? patch.foreign_amount,
      },
      out,
    );
    Object.assign(out, merged);
  }
  return out;
}
