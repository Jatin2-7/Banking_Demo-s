// REST wrapper around the pure backend. The engine no longer needs these
// (it calls the pure functions directly via the tool registry), but partner
// integrations / external clients can still use them.

import { Router } from 'express';
import { backend } from './data/backend.js';
import { module_ } from './lib/log.js';

const router = Router();
const log = module_('mockApi');

function unwrap(handler) {
  return async (req, res) => {
    try {
      const data = await handler(req);
      res.json(data);
    } catch (e) {
      if (e?.code) {
        return res
          .status(e.status || 400)
          .json({ error: e.code, message: e.message, retryable: e.retryable });
      }
      log.error({ err: e?.message || String(e) }, 'mock route error');
      res.status(500).json({ error: 'INTERNAL', message: String(e?.message || e) });
    }
  };
}

const ff = (req) => req.header('X-Force-Fail') || null;

router.get(
  '/contacts',
  unwrap(async () => ({ contacts: await backend.listContacts() })),
);
router.get(
  '/contacts/search',
  unwrap(async (r) => ({ contacts: await backend.lookupContacts(r.query.q || '') })),
);
router.get(
  '/billers',
  unwrap(async () => ({ billers: await backend.listBillers() })),
);
router.get(
  '/billers/search',
  unwrap(async (r) => ({ billers: await backend.lookupBillers(r.query.q || '') })),
);
router.get(
  '/accounts',
  unwrap(async () => ({ accounts: await backend.listAccounts() })),
);
router.get(
  '/balance',
  unwrap(async (r) => ({ accounts: await backend.getBalance(r.query.account_hint) })),
);
router.get(
  '/airports',
  unwrap(async () => ({ airports: backend.AIRPORTS })),
);

router.post(
  '/payments/send',
  unwrap(async (r) => backend.sendPayment(r.body || {}, { forceFail: ff(r) })),
);
router.post(
  '/transfers/internal',
  unwrap(async (r) => backend.internalTransfer(r.body || {}, { forceFail: ff(r) })),
);
router.post(
  '/bills/pay',
  unwrap(async (r) => backend.payBill(r.body || {}, { forceFail: ff(r) })),
);
router.post(
  '/flights/search',
  unwrap(async (r) => ({ flights: await backend.searchFlights(r.body || {}) })),
);
router.post(
  '/flights/book',
  unwrap(async (r) => backend.bookFlight(r.body || {}, { forceFail: ff(r) })),
);

router.post('/_reset', (_req, res) => {
  backend.reset();
  res.json({ ok: true });
});

export default router;
