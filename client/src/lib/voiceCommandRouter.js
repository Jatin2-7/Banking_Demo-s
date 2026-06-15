// Voice-to-Command router — a deliberately self-contained, deterministic mapper
// from a spoken/typed utterance to a single navigation destination.
//
// This powers the "Voice-to-Command" demo mode. It is intentionally kept
// SEPARATE from the conversational engine (server/engine + simEngine.js): there
// is no dialogue, no slot-filling and no back-and-forth. The goal is pure screen
// navigation — "show me my transaction history" → open the statement screen —
// so demos can showcase fast, hands-free navigation across the app.
//
// Destinations mirror the `navigate_to` targets already handled by
// App.jsx#handleNavigate, plus a "home" target to return to the dashboard.

/**
 * @typedef {'transaction_history'|'fund_transfer'|'loan_application'|'create_deposit'|'upi_payment'|'hotel_booking'|'flight_booking'|'debit_card'|'credit_card'|'home'} Destination
 * @typedef {{ destination: Destination, label: string, routingStatus: string, subFlow?: string | null }} CommandMatch
 */

// Order matters: the first command whose pattern matches wins, so list the more
// specific intents before broader ones (e.g. "fund transfer" before "pay").
const COMMANDS = [
  {
    destination: 'transaction_history',
    label: 'Transaction history',
    routingStatus: 'Opening your account statement.',
    patterns: [
      /\b(transaction|account|payment)s?\s+(history|statement)\b/,
      /\b(mini\s*)?statement\b/,
      /\bpass\s*book\b/,
      /\b(transaction|txn)s?\b/,
      /\b(account|spending)\s+history\b/,
      /(लेन[- ]?देन|विवरण|स्टेटमेंट|पासबुक)/,
    ],
  },
  {
    destination: 'fund_transfer',
    label: 'Fund transfer',
    routingStatus: 'Opening fund transfer.',
    patterns: [
      /\bfund\s+transfer\b/,
      /\btransfer\s+(money|funds|amount)\b/,
      /\b(imps|neft|rtgs)\b/,
      /\btransfer\s+to\s+(an?\s+)?account\b/,
      /(पैसे?\s*(भेज|ट्रांसफर)|फंड\s*ट्रांसफर)/,
    ],
  },
  {
    destination: 'loan_application',
    label: 'Loan application',
    routingStatus: 'Opening loan application.',
    patterns: [
      /\b(apply\s+for\s+a?\s*)?loan\b/,
      /\b(personal|home|car|gold)\s+loan\b/,
      /\bborrow\b/,
      /(लोन|कर्ज|ऋण)/,
    ],
  },
  {
    destination: 'create_deposit',
    label: 'Create deposit',
    routingStatus: 'Opening Create a Deposit.',
    patterns: [
      /\b(create|open|start|make)\s+(a\s+)?(fixed\s+|recurring\s+)?deposit\b/,
      /\b(fixed|recurring)\s+deposit\b/,
      /\b(open|start)\s+(an?\s+)?(fd|rd)\b/,
      /\bdeposit\b/,
      /(डिपॉज़िट|एफ\.?डी|जमा)/,
    ],
  },
  {
    destination: 'upi_payment',
    label: 'UPI payment',
    routingStatus: 'Opening UPI payment.',
    patterns: [
      /\bupi\b/,
      /\b(make|start)\s+(a\s+)?payment\b/,
      /\b(send|pay)\s+(money|someone|to)\b/,
      /\bscan\s+(and\s+pay|qr)\b/,
      /\b(send|pay)\b/,
      /(यू\.?पी\.?आई|भुगतान|पैसे?\s*(दो|भेज))/,
    ],
  },
  {
    destination: 'hotel_booking',
    label: 'Hotel booking',
    routingStatus: 'Opening hotel booking.',
    patterns: [
      /\b(book|reserve|find|search|open)\s+(a\s+)?hotel\b/,
      /\bhotel\s+(booking|reservation|stay|room|rooms|search)\b/,
      /\b(book|reserve|find|search)\s+(a\s+)?(room|stay)\b/,
      /\bhotels?\b/,
      /(होटल|कमरा|रूम)\s*(बुक|ढूंढ|खोज)?/,
    ],
  },
  {
    destination: 'flight_booking',
    label: 'Flight booking',
    routingStatus: 'Opening flight booking.',
    patterns: [
      /\b(book|reserve|find|search|open)\s+(a\s+)?flight\b/,
      /\bflight\s+(booking|reservation|ticket|tickets|search)\b/,
      /\b(book|reserve|find|search)\s+(a\s+)?(ticket|airline|air\s*ticket)\b/,
      /\bflights?\b/,
      /(फ्लाइट|उड़ान|टिकट)\s*(बुक|ढूंढ|खोज)?/,
    ],
  },
  {
    destination: 'credit_card',
    subFlow: 'card_statement',
    label: 'Credit card statement',
    routingStatus: 'Opening your credit card statement.',
    patterns: [
      /\b(get|show|open|view|see|download)\s+(me\s+)?(my\s+)?credit\s+card\s+(statement|bill)\b/,
      /\b(get|give)\s+me\s+(my\s+)?credit\s+card\s+(statement|bill)\b/,
      /\bcredit\s+card\s+(statement|billing\s+statement|bill)\b/,
      /\bmy\s+credit\s+card\s+statement\b/,
      /(क्रेडिट\s*कार्ड\s*स्टेटमेंट|क्रेडिट\s*कार्ड\s*बिल)/,
    ],
  },
  {
    destination: 'credit_card',
    label: 'Credit card dashboard',
    routingStatus: 'Opening credit card dashboard.',
    patterns: [
      /\b(open|show|go\s+to)\s+(my\s+)?credit\s+card\b/,
      /\bcredit\s+card\s+(dashboard|details|management)\b/,
      /\bmy\s+credit\s+card\b/,
      /\bcredit\s+card\b/,
    ],
  },
  {
    destination: 'debit_card',
    subFlow: 'disable_international',
    label: 'Disable international transactions',
    routingStatus: 'Opening debit card settings to disable international transactions.',
    patterns: [
      /\bdisable\s+international\s+(transactions?|usage|payments?)\b/,
      /\bturn\s+off\s+international\s+(transactions?|usage|payments?)\b/,
      /\bblock\s+international\s+(transactions?|card\s+usage)\b/,
      /\bstop\s+international\s+(transactions?|payments?)\b/,
    ],
  },
  {
    destination: 'debit_card',
    subFlow: 'reset_pin',
    label: 'Reset debit card PIN',
    routingStatus: 'Opening debit card PIN reset.',
    patterns: [
      /\b(reset|change|set)\s+(my\s+)?(debit\s+)?card\s+pin\b/,
      /\breset\s+(debit\s+)?card\s+pin\b/,
      /\b(debit\s+)?card\s+pin\s+(reset|change)\b/,
      /(डेबिट\s*कार्ड\s*पिन|कार्ड\s*पिन)\s*(रीसेट|बदल)/,
    ],
  },
  {
    destination: 'debit_card',
    label: 'Debit card dashboard',
    routingStatus: 'Opening debit card dashboard.',
    patterns: [
      /\b(open|show|go\s+to)\s+(my\s+)?debit\s+card\b/,
      /\bdebit\s+card\s+(dashboard|settings|management)\b/,
      /\bmy\s+debit\s+card\b/,
      /\bdebit\s+card\b/,
    ],
  },
  {
    destination: 'home',
    label: 'Home',
    routingStatus: 'Going back to the home screen.',
    patterns: [
      /\b(go\s+)?(back\s+)?(to\s+)?home\b/,
      /\b(main\s+)?(menu|dashboard)\b/,
      /\bclose\b/,
      /(होम|मुख्य\s*पृष्ठ|वापस)/,
    ],
  },
];

/** Normalise an utterance for matching: lowercase + collapse whitespace. */
function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[._,!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Map an utterance to a single navigation destination.
 * @param {string} text
 * @returns {CommandMatch | null} the matched command, or null if nothing matched.
 */
export function routeVoiceCommand(text) {
  const q = normalize(text);
  if (!q) return null;
  for (const cmd of COMMANDS) {
    if (cmd.patterns.some((re) => re.test(q))) {
      return {
        destination: cmd.destination,
        label: cmd.label,
        routingStatus: cmd.routingStatus,
        subFlow: cmd.subFlow || null,
      };
    }
  }
  return null;
}

/** Example commands surfaced in the demo panel (label = what to say). */
export const VOICE_COMMAND_EXAMPLES = [
  { label: 'Show me my transaction history', text: 'show me my account transaction history' },
  { label: 'Open fund transfer', text: 'open fund transfer' },
  { label: 'Apply for a loan', text: 'apply for a loan' },
  { label: 'Create a deposit', text: 'create a fixed deposit' },
  { label: 'Make a UPI payment', text: 'make a upi payment' },
  { label: 'Book a hotel', text: 'I want to book a hotel' },
  { label: 'Book a flight', text: 'I want to book a flight' },
  { label: 'Disable international transactions', text: 'disable international transactions on my debit card' },
  { label: 'Reset debit card PIN', text: 'reset my debit card pin' },
  { label: 'Open debit card dashboard', text: 'open my debit card dashboard' },
  { label: 'Get credit card statement', text: 'get me my credit card statement' },
  { label: 'Go back home', text: 'go back home' },
];
