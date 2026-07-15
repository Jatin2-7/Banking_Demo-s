import {
  calcForeignAmount,
  calcInrAmount,
  getNextForexPrompt,
  recalcForexAmounts,
  spokenCurrencyName,
} from '../forex/forexJourney.js';

const CITY_ALIASES = {
  mumbai: 'Mumbai',
  bombay: 'Mumbai',
  delhi: 'Delhi',
  'new delhi': 'Delhi',
  bangalore: 'Bangalore',
  bengaluru: 'Bangalore',
  chennai: 'Chennai',
  madras: 'Chennai',
  kolkata: 'Kolkata',
  calcutta: 'Kolkata',
  hyderabad: 'Hyderabad',
  pune: 'Pune',
  ahmedabad: 'Ahmedabad',
};

/** Spoken currency phrases → ISO code (longer phrases first). */
const CURRENCY_PHRASES = [
  ['singapore dollar', 'SGD'],
  ['singapore dollars', 'SGD'],
  ['us dollar', 'USD'],
  ['us dollars', 'USD'],
  ['american dollar', 'USD'],
  ['american dollars', 'USD'],
  ['british pound', 'GBP'],
  ['british pounds', 'GBP'],
  ['uk pound', 'GBP'],
  ['uae dirham', 'AED'],
  ['uae dirhams', 'AED'],
  ['dubai dirham', 'AED'],
  ['euro', 'EUR'],
  ['euros', 'EUR'],
  ['dollar', 'USD'],
  ['dollars', 'USD'],
  ['pound', 'GBP'],
  ['pounds', 'GBP'],
  ['dirham', 'AED'],
  ['dirhams', 'AED'],
];

const COUNTRY_CURRENCY = [
  ['singapore', 'SGD'],
  ['dubai', 'AED'],
  ['uae', 'AED'],
  ['america', 'USD'],
  ['usa', 'USD'],
  ['united states', 'USD'],
  ['uk', 'GBP'],
  ['britain', 'GBP'],
  ['europe', 'EUR'],
  ['thailand', 'USD'],
];

function extractNumber(text) {
  const m = String(text).match(/(\d[\d,]*(?:\.\d+)?)/);
  return m ? m[1].replace(/,/g, '') : null;
}

function detectCity(text) {
  const t = String(text).toLowerCase();
  for (const [alias, city] of Object.entries(CITY_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`).test(t)) return city;
  }
  return null;
}

function detectCurrency(text) {
  const t = String(text).toLowerCase();
  for (const [phrase, code] of CURRENCY_PHRASES) {
    if (t.includes(phrase)) return code;
  }
  for (const [country, code] of COUNTRY_CURRENCY) {
    if (
      new RegExp(`\\b${country}\\b`).test(t) &&
      /forex|currency|cash|dollar|money|chahiye/.test(t)
    ) {
      return code;
    }
  }
  return null;
}

function parseIndianRupeeAmount(text) {
  const t = String(text).toLowerCase();

  const crore = t.match(/(\d+(?:\.\d+)?)\s*(?:crore|cr|करोड़|करोड)/);
  if (crore) return String(Math.round(Number(crore[1]) * 10_000_000));

  const lakh = t.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|lacs|lakhs|लाख|लाक)/);
  if (lakh) return String(Math.round(Number(lakh[1]) * 100_000));

  const thousand = t.match(/(\d+(?:\.\d+)?)\s*(?:k|thousand)\b/);
  if (thousand) return String(Math.round(Number(thousand[1]) * 1000));

  const m =
    t.match(/(\d[\d,]*)\s*(?:inr|rupees?|rs|₹)/) ||
    t.match(/(?:inr|rupees?|rs|₹)\s*(\d[\d,]*)/) ||
    (/\bchahiye\b|\bforex\s*cash\b/.test(t) && t.match(/(\d[\d,]*)\s*(?:ka|ke|ki)?/));
  return m ? m[1].replace(/,/g, '') : null;
}

function parseInrAmount(text) {
  return parseIndianRupeeAmount(text);
}

function appendNextPrompt(reply, form, patch = {}) {
  const merged = { ...form, ...patch };
  const next = getNextForexPrompt(merged);
  if (!next) return reply;
  if (reply && reply.includes(next)) return reply;
  return reply ? `${reply} ${next}` : next;
}

function currencyReply(code) {
  return spokenCurrencyName(code);
}

/**
 * Full forex intent from dashboard / landing — opens GlobalPay form directly.
 * e.g. "10,000 INR ka forex cash chahiye", "forex cash for Singapore"
 */
export function parseForexIntent(text) {
  const t = String(text).toLowerCase().trim();
  const isForex =
    /forex|foreign\s*currency|currency\s*exchange|forex\s*cash|global\s*pay|money\s*transfer/.test(
      t,
    ) ||
    /\b(?:lakh|lac|lacs|lakhs|लाख|लाक|crore|करोड़|करोड)\b/.test(t) ||
    (/\b(inr|rupees?|rs|₹|chahiye|mujhe)\b/.test(t) && /\d/.test(t)) ||
    /singapore\s*dollar|us\s*dollar|british\s*pound|uae\s*dirham/.test(t);

  if (!isForex) return null;

  const patch = { partner: 'globalpay', activeTab: 'currency', phase: 'form' };
  const city = detectCity(text);
  const currency = detectCurrency(text);
  const inrAmt = parseInrAmount(text);
  const foreignAmt = extractNumber(t);

  if (city) patch.city = city;
  if (currency) patch.foreignCurrency = currency;

  if (inrAmt) {
    patch.inrAmount = inrAmt;
    patch.foreignAmount = calcForeignAmount(inrAmt, patch.foreignCurrency || 'USD', false);
  } else if (foreignAmt && !inrAmt && parseInt(foreignAmt, 10) >= 100) {
    patch.foreignAmount = foreignAmt;
    patch.inrAmount = calcInrAmount(foreignAmt, patch.foreignCurrency || 'USD', false);
  }

  let reply = 'Opening your forex order.';
  if (inrAmt) {
    reply = `Set ₹${Number(inrAmt).toLocaleString('en-IN')} forex cash`;
    if (currency) reply += ` in ${currencyReply(currency)}`;
    reply += '.';
  } else if (currency) {
    reply = `Opening forex for ${currencyReply(currency)}.`;
  }

  return {
    handled: true,
    action: 'open_form',
    partner: 'globalpay',
    patch,
    reply: appendNextPrompt(reply, { phase: 'form', ...patch }),
  };
}

/** Parse voice input on the forex form. */
export function parseForexVoiceInput(phase, text, form) {
  const t = String(text).toLowerCase().trim();

  if (
    /^(order\s*now|place\s*order|book\s*order|confirm|submit|complete)$/.test(t) ||
    /\b(order\s*now|place\s*(my\s*)?order|complete\s*order)\b/.test(t)
  ) {
    return {
      handled: true,
      action: 'complete_order',
      reply: 'Your forex order is complete.',
    };
  }

  const intent = parseForexIntent(text);
  if (intent?.patch && Object.keys(intent.patch).length > 1) {
    return { handled: true, patch: intent.patch, reply: intent.reply };
  }

  for (const [alias, city] of Object.entries(CITY_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`).test(t)) {
      return {
        handled: true,
        patch: { city },
        reply: appendNextPrompt(`Delivery city set to ${city}.`, { ...form, city }),
      };
    }
  }

  const currency = detectCurrency(text);
  if (currency) {
    const patch = recalcForexAmounts(form, { foreignCurrency: currency });
    return {
      handled: true,
      patch,
      reply: appendNextPrompt(`Currency set to ${currencyReply(currency)}.`, { ...form, ...patch }),
    };
  }

  const inrAmt = parseInrAmount(text);
  if (inrAmt) {
    const cur = form.foreignCurrency || 'USD';
    const foreignAmount = calcForeignAmount(inrAmt, cur, false);
    return {
      handled: true,
      patch: { inrAmount: inrAmt, foreignAmount },
      reply: appendNextPrompt(
        `Set ₹${Number(inrAmt).toLocaleString('en-IN')} worth of ${currencyReply(cur)}.`,
        { ...form, inrAmount: inrAmt, foreignAmount },
      ),
    };
  }

  const amountMatch = t.match(/(?:amount|get|buy|need|want|order)\s*(?:of\s*)?(\d[\d,]*)/);
  if (amountMatch) {
    const amt = amountMatch[1].replace(/,/g, '');
    const cur = form.foreignCurrency || 'USD';
    return {
      handled: true,
      patch: { foreignAmount: amt, inrAmount: calcInrAmount(amt, cur, false) },
      reply: appendNextPrompt(`Amount set to ${amt} ${currencyReply(cur)}.`, {
        ...form,
        foreignAmount: amt,
      }),
    };
  }

  const num = extractNumber(t);
  if (num && /^\d+$/.test(num) && num.length >= 3 && num.length !== 10) {
    const cur = form.foreignCurrency || 'USD';
    return {
      handled: true,
      patch: { foreignAmount: num, inrAmount: calcInrAmount(num, cur, false) },
      reply: appendNextPrompt(`Amount set to ${num}.`, { ...form, foreignAmount: num }),
    };
  }

  if (/\bforex\s*card\b/.test(t)) {
    return { handled: true, patch: { activeTab: 'forex_card' }, reply: 'Switched to Forex Card.' };
  }
  if (/\bcurrency\s*(notes?|tab)?\b/.test(t)) {
    return {
      handled: true,
      patch: { activeTab: 'currency' },
      reply: 'Switched to Currency notes.',
    };
  }

  if (/^(fill|demo|sample)/.test(t)) {
    return {
      handled: true,
      patch: { city: 'Mumbai', foreignCurrency: 'USD', foreignAmount: '2000', inrAmount: '194040' },
      reply: 'Demo details filled. Say order now to complete.',
    };
  }

  return { handled: false };
}

/** Landing page — always skip to GlobalPay form. */
export function parseForexLandingVoice(text) {
  const intent = parseForexIntent(text);
  if (intent) return intent;

  if (/forex|currency|cash|global\s*pay|book/.test(String(text).toLowerCase())) {
    return {
      handled: true,
      action: 'open_form',
      partner: 'globalpay',
      patch: {},
      reply: 'Opening your forex order. Tell me city, currency, and amount — or say order now.',
    };
  }

  const formParsed = parseForexVoiceInput('form', text, { phase: 'form' });
  if (formParsed.handled) {
    return {
      handled: true,
      action: 'open_form',
      partner: 'globalpay',
      patch: formParsed.patch || {},
      formAction: formParsed.action,
      reply: formParsed.reply,
    };
  }

  return { handled: false };
}
