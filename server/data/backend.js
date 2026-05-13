// Pure backend implementations — used both by /api/mock/* REST routes AND by
// the engine's tool registry. No Express coupling, throws typed errors.

import {
  ACCOUNTS,
  PER_TXN_LIMIT,
  getAccountByType,
  getContact,
  getBiller,
  searchContacts,
  searchBillers,
  CONTACTS,
  BILLERS,
} from './mock.js';

// TEST_MODE=1 makes the backend fully deterministic:
//   - no jitter sleeps      (snappy tests, no flaky timeouts)
//   - no random failures    (no flaky 5-7% fail paths)
// Production code (npm run dev) leaves it unset and behaves normally.
const TEST_MODE = process.env.TEST_MODE === '1';

const sleep = (ms) => (TEST_MODE ? Promise.resolve() : new Promise((r) => setTimeout(r, ms)));
const jitter = (a, b) => (TEST_MODE ? 0 : a + Math.floor(Math.random() * (b - a)));
const flaky = (p) => (TEST_MODE ? false : Math.random() < p);
const idem = new Set();

class BackendError extends Error {
  constructor(code, message, { status = 400, retryable = false } = {}) {
    super(message || code);
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

function checkIdem(key) {
  if (key && idem.has(key)) {
    return { success: true, duplicate: true, txnId: 'DUP-' + String(key).slice(0, 8) };
  }
  return null;
}

function applyForceFail(forceFail) {
  if (forceFail === 'bank')
    throw new BackendError('BANK_DECLINED', 'Bank declined the transaction.', {
      status: 402,
      retryable: true,
    });
  if (forceFail === 'network')
    throw new BackendError('NETWORK_ERROR', 'Network timeout. Please retry.', {
      status: 504,
      retryable: true,
    });
}

// ── Catalog ────────────────────────────────────────────────────
async function listContacts() {
  return CONTACTS;
}
async function listBillers() {
  return BILLERS;
}
async function listAccounts() {
  return ACCOUNTS;
}

async function lookupContacts(q) {
  await sleep(jitter(80, 180));
  return searchContacts(q);
}
async function lookupBillers(q) {
  await sleep(jitter(80, 180));
  return searchBillers(q);
}

async function getBalance(hint) {
  await sleep(jitter(80, 180));
  if (!hint) return ACCOUNTS;
  const h = String(hint).toLowerCase();
  const filtered = ACCOUNTS.filter((a) => a.label.toLowerCase().includes(h) || a.type.includes(h));
  return filtered.length ? filtered : ACCOUNTS;
}

// ── Send money (UPI) ───────────────────────────────────────────
async function sendPayment(body, { forceFail } = {}) {
  const dup = checkIdem(body.idempotency_key);
  if (dup) return dup;
  applyForceFail(forceFail);

  const {
    to_contact_id,
    to_vpa_id,
    recipient_handle,
    amount,
    from_account_type,
    note,
    idempotency_key,
  } = body;
  if (!amount || amount <= 0) throw new BackendError('INVALID_AMOUNT', 'Amount must be > 0.');
  if (amount > PER_TXN_LIMIT)
    throw new BackendError('LIMIT_EXCEEDED', `Per-txn limit is ₹${PER_TXN_LIMIT}.`);

  const from = getAccountByType(from_account_type) || ACCOUNTS[0];
  if (!from) throw new BackendError('NO_SOURCE_ACCOUNT', 'No source account.');
  if (from.balance < amount) {
    throw new BackendError(
      'INSUFFICIENT_FUNDS',
      `Only ₹${from.balance} available in ${from.label}.`,
      { status: 402 },
    );
  }

  let recipient;
  if (to_contact_id) {
    const c = getContact(to_contact_id);
    if (!c) throw new BackendError('CONTACT_NOT_FOUND', 'Contact not found.', { status: 404 });
    const v = to_vpa_id ? c.vpas.find((x) => x.id === to_vpa_id) : c.vpas[0];
    if (!v) throw new BackendError('VPA_NOT_FOUND', 'UPI account not found.', { status: 404 });
    recipient = { name: c.name, vpa: v.sublabel, label: v.label };
  } else if (recipient_handle) {
    recipient = { name: recipient_handle, vpa: recipient_handle, label: 'Direct UPI' };
  } else {
    throw new BackendError('MISSING_RECIPIENT', 'No recipient specified.');
  }

  await sleep(jitter(900, 1700));
  if (flaky(0.05)) {
    throw new BackendError('BANK_DECLINED', 'Bank temporarily unavailable.', {
      status: 402,
      retryable: true,
    });
  }

  from.balance -= amount;
  if (idempotency_key) idem.add(idempotency_key);
  return {
    success: true,
    txnId: 'BP' + Date.now().toString().slice(-9),
    amount,
    recipient,
    note: note || null,
    from: { label: from.label, last4: from.last4, balance_after: from.balance },
    timestamp: new Date().toISOString(),
  };
}

// ── Internal transfer ──────────────────────────────────────────
async function internalTransfer(body, { forceFail } = {}) {
  const dup = checkIdem(body.idempotency_key);
  if (dup) return dup;
  applyForceFail(forceFail);

  const { from_account_type, to_account_type, amount, idempotency_key } = body;
  if (!amount || amount <= 0) throw new BackendError('INVALID_AMOUNT', 'Amount must be > 0.');
  if (amount > PER_TXN_LIMIT) throw new BackendError('LIMIT_EXCEEDED');
  const from = getAccountByType(from_account_type);
  const to = getAccountByType(to_account_type);
  if (!from || !to) throw new BackendError('INVALID_ACCOUNTS', 'Invalid accounts.');
  if (from.id === to.id)
    throw new BackendError('SAME_ACCOUNT', 'Source and destination cannot be the same.');
  if (from.balance < amount)
    throw new BackendError('INSUFFICIENT_FUNDS', `Only ₹${from.balance} in ${from.label}.`, {
      status: 402,
    });

  await sleep(jitter(500, 1100));
  from.balance -= amount;
  to.balance += amount;
  if (idempotency_key) idem.add(idempotency_key);
  return {
    success: true,
    txnId: 'TR' + Date.now().toString().slice(-9),
    amount,
    from: { label: from.label, last4: from.last4, balance_after: from.balance },
    to: { label: to.label, last4: to.last4, balance_after: to.balance },
    timestamp: new Date().toISOString(),
  };
}

// ── Bill / recharge ────────────────────────────────────────────
async function payBill(body, { forceFail } = {}) {
  const dup = checkIdem(body.idempotency_key);
  if (dup) return dup;
  applyForceFail(forceFail);

  const { biller_id, target_account, amount, from_account_type, idempotency_key } = body;
  if (!biller_id) throw new BackendError('MISSING_BILLER');
  if (!target_account)
    throw new BackendError('MISSING_TARGET_ACCOUNT', 'Need the mobile/consumer/account number.');
  if (!amount || amount <= 0) throw new BackendError('INVALID_AMOUNT', 'Amount must be > 0.');
  if (amount > PER_TXN_LIMIT) throw new BackendError('LIMIT_EXCEEDED');

  const biller = getBiller(biller_id);
  if (!biller) throw new BackendError('BILLER_NOT_FOUND', 'Biller not found.', { status: 404 });

  const from = getAccountByType(from_account_type) || ACCOUNTS[0];
  if (from.balance < amount)
    throw new BackendError('INSUFFICIENT_FUNDS', `Only ₹${from.balance} in ${from.label}.`, {
      status: 402,
    });

  await sleep(jitter(900, 1700));
  if (biller.category === 'Recharge' && flaky(0.06)) {
    throw new BackendError('OPERATOR_DOWN', `${biller.name} is temporarily unavailable.`, {
      status: 502,
      retryable: true,
    });
  }

  from.balance -= amount;
  if (idempotency_key) idem.add(idempotency_key);
  return {
    success: true,
    txnId: 'BL' + Date.now().toString().slice(-9),
    biller: { id: biller.id, name: biller.name, category: biller.category, icon: biller.icon },
    target_account,
    amount,
    from: { label: from.label, last4: from.last4, balance_after: from.balance },
    timestamp: new Date().toISOString(),
  };
}

// ── Flight saga: search + book ─────────────────────────────────
const AIRPORTS = {
  blr: 'Bengaluru (BLR)',
  del: 'Delhi (DEL)',
  bom: 'Mumbai (BOM)',
  hyd: 'Hyderabad (HYD)',
  maa: 'Chennai (MAA)',
  ccu: 'Kolkata (CCU)',
  goi: 'Goa (GOI)',
  cok: 'Kochi (COK)',
  pnq: 'Pune (PNQ)',
};
const AIRPORT_ALIASES = {
  bangalore: 'blr',
  bengaluru: 'blr',
  bglr: 'blr',
  delhi: 'del',
  newdelhi: 'del',
  dilli: 'del',
  mumbai: 'bom',
  bombay: 'bom',
  hyderabad: 'hyd',
  hyd: 'hyd',
  chennai: 'maa',
  madras: 'maa',
  kolkata: 'ccu',
  calcutta: 'ccu',
  goa: 'goi',
  panaji: 'goi',
  kochi: 'cok',
  cochin: 'cok',
  pune: 'pnq',
  poona: 'pnq',
};
const CARRIERS = ['Indigo', 'Air India', 'Vistara', 'Akasa', 'SpiceJet'];

function airportCode(s) {
  if (!s) return null;
  const t = String(s).toLowerCase().trim().replace(/\s+/g, '');
  if (AIRPORTS[t]) return t;
  if (AIRPORT_ALIASES[t]) return AIRPORT_ALIASES[t];
  for (const [alias, code] of Object.entries(AIRPORT_ALIASES)) {
    if (t.includes(alias) || alias.includes(t)) return code;
  }
  for (const [code, label] of Object.entries(AIRPORTS)) {
    if (label.toLowerCase().includes(t)) return code;
  }
  return null;
}

async function searchFlights({ origin, destination, date }) {
  await sleep(jitter(600, 1200));
  const o = airportCode(origin),
    d = airportCode(destination);
  if (!o || !d)
    throw new BackendError(
      'UNKNOWN_AIRPORT',
      `Couldn't find airport for ${!o ? origin : destination}.`,
    );
  if (o === d) throw new BackendError('SAME_AIRPORT', 'Origin and destination must differ.');
  const seed = (o + d + (date || '')).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const flights = Array.from({ length: 5 })
    .map((_, i) => {
      const carrier = CARRIERS[(seed + i) % CARRIERS.length];
      const number = '6' + (100 + ((seed * 7 + i * 31) % 900));
      const depHour = 6 + ((seed + i * 3) % 14);
      const dur = 90 + ((seed + i * 11) % 180);
      const price = 2900 + ((seed * 13 + i * 71) % 7600);
      return {
        id: `${carrier.slice(0, 2).toUpperCase()}${number}-${i}`,
        carrier,
        number,
        from: AIRPORTS[o],
        to: AIRPORTS[d],
        date: date || 'today',
        depart: `${String(depHour).padStart(2, '0')}:${i % 2 ? '15' : '45'}`,
        arrive: `${String((depHour + Math.floor(dur / 60)) % 24).padStart(2, '0')}:${((i * 7) % 60).toString().padStart(2, '0')}`,
        duration_min: dur,
        price,
      };
    })
    .sort((a, b) => a.price - b.price);
  return flights;
}

async function bookFlight(body, { forceFail } = {}) {
  const dup = checkIdem(body.idempotency_key);
  if (dup) return dup;
  applyForceFail(forceFail);

  const { flight, passenger_name, passenger_phone, from_account_type, idempotency_key } = body;
  if (!flight) throw new BackendError('MISSING_FLIGHT');
  if (!passenger_name) throw new BackendError('MISSING_PASSENGER');
  if (!passenger_phone) throw new BackendError('MISSING_PHONE');
  const amount = flight.price;
  const from = getAccountByType(from_account_type) || ACCOUNTS[0];
  if (from.balance < amount) {
    throw new BackendError('INSUFFICIENT_FUNDS', `Only ₹${from.balance} in ${from.label}.`, {
      status: 402,
    });
  }

  // Saga internal: hold seat → charge → issue ticket. Random failure tests rollback.
  await sleep(jitter(400, 800)); // hold_seat
  await sleep(jitter(700, 1300)); // charge
  if (flaky(0.07)) {
    throw new BackendError(
      'TICKETING_FAILED',
      'Airline ticketing system failed. Refund initiated.',
      { status: 502, retryable: true },
    );
  }
  await sleep(jitter(400, 800)); // issue_ticket

  from.balance -= amount;
  if (idempotency_key) idem.add(idempotency_key);
  const pnr = TEST_MODE
    ? 'TEST' + (idempotency_key ? String(idempotency_key).slice(-4) : '0000')
    : ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'][Math.floor(Math.random() * 10)] +
      Math.random().toString(36).slice(2, 7).toUpperCase();
  return {
    success: true,
    txnId: 'FL' + Date.now().toString().slice(-9),
    pnr,
    flight,
    passenger: { name: passenger_name, phone: passenger_phone },
    amount,
    from: { label: from.label, last4: from.last4, balance_after: from.balance },
    timestamp: new Date().toISOString(),
  };
}

function reset() {
  ACCOUNTS[0].balance = 18500;
  ACCOUNTS[1].balance = 60000;
  ACCOUNTS[2].balance = 2340;
  idem.clear();
}

export const backend = {
  listContacts,
  listBillers,
  listAccounts,
  lookupContacts,
  lookupBillers,
  getBalance,
  sendPayment,
  internalTransfer,
  payBill,
  searchFlights,
  bookFlight,
  reset,
  BackendError,
  AIRPORTS,
  CARRIERS,
};
