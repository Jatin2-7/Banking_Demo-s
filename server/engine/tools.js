// Tool registry — partners and saga steps reference tools by NAME.
// Adding a new tool = one register() call. The LLM never sees these directly;
// the engine binds them via manifest input_map.

import { backend } from '../data/backend.js';
import { ACCOUNTS, getAccountByType } from '../data/mock.js';

class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }
  register(name, fn, meta = {}) {
    this.tools.set(name, { fn, meta });
  }
  has(name) {
    return this.tools.has(name);
  }
  list() {
    return [...this.tools.entries()].map(([name, t]) => ({ name, ...t.meta }));
  }
  async call(name, input, ctx = {}) {
    const t = this.tools.get(name);
    if (!t) throw new Error(`Tool not registered: ${name}`);
    return t.fn(input || {}, ctx);
  }
}

export const tools = new ToolRegistry();

// ── Lookups (no side effects) ───────────────────────────────────
tools.register('contacts.search', (i) => backend.lookupContacts(i.q), { kind: 'lookup' });
tools.register('billers.search', (i) => backend.lookupBillers(i.q), { kind: 'lookup' });
tools.register('balance.check', (i) => backend.getBalance(i.hint), { kind: 'lookup' });
tools.register('flights.search', (i) => backend.searchFlights(i), { kind: 'lookup' });

// ── Account helpers (no side effects) — replace hardcoded ACCOUNTS[0] ──
tools.register(
  'accounts.list',
  ({ exclude_type, exclude_id, min_balance } = {}) => {
    const minBal = min_balance == null ? null : Number(min_balance);
    return ACCOUNTS.filter(
      (a) =>
        (!exclude_type || a.type !== exclude_type) &&
        (!exclude_id || a.id !== exclude_id) &&
        (minBal == null || !Number.isFinite(minBal) || a.balance >= minBal),
    );
  },
  { kind: 'lookup' },
);

tools.register(
  'accounts.first_savings',
  () => {
    return ACCOUNTS.find((a) => a.type === 'savings') || ACCOUNTS[0] || null;
  },
  { kind: 'lookup' },
);

tools.register(
  'accounts.by_type_or_default',
  ({ type, default_type = 'savings' } = {}) => {
    return (
      (type && getAccountByType(type)) || getAccountByType(default_type) || ACCOUNTS[0] || null
    );
  },
  { kind: 'lookup' },
);

// ── Format helpers — pure presentation, used by `result` steps ──
tools.register(
  'balance.format',
  async ({ hint } = {}) => {
    const accounts = await backend.getBalance(hint);
    const lines = accounts.map(
      (a) =>
        `• ${a.label} ${a.last4 !== 'WAL' ? '••' + a.last4 + ' ' : ''}: ₹${a.balance.toLocaleString('en-IN')}`,
    );
    return { accounts, text: lines.join('\n') };
  },
  { kind: 'lookup' },
);

// ── Writes (need idempotency_key, may be force-failed) ──────────
tools.register(
  'payments.send_upi',
  (i, ctx) => backend.sendPayment(i, { forceFail: ctx.forceFail }),
  { kind: 'write' },
);
tools.register(
  'transfers.internal',
  (i, ctx) => backend.internalTransfer(i, { forceFail: ctx.forceFail }),
  { kind: 'write' },
);
tools.register('bills.pay', (i, ctx) => backend.payBill(i, { forceFail: ctx.forceFail }), {
  kind: 'write',
});
tools.register('flights.book', (i, ctx) => backend.bookFlight(i, { forceFail: ctx.forceFail }), {
  kind: 'write',
});
