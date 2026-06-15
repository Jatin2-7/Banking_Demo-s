import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const CARD_NUMBER = '6080 XXXX XXXX 8049';
const LINKED_ACCOUNT = 'Savings | 68255XXXXXX9';

const TXN_TYPES = [
  { id: 'atm', label: 'ATM Withdrawals' },
  { id: 'ecom', label: 'E-Commerce' },
  { id: 'pos', label: 'Point of Sales (POS)' },
  { id: 'nfc', label: 'Contactless Purchase-NFC' },
  { id: 'cashpos', label: 'Cash@POS' },
];

function HomeButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 shrink-0 items-center gap-1 rounded-md bg-bank-gold px-2 text-[10px] font-bold uppercase text-bank-purpleDeep shadow-sm"
      aria-label="Home"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
      Home
    </button>
  );
}

function ScreenHeader({ title, onBack, onHome }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden px-3 pb-3 pt-2 text-white"
      style={{ background: 'linear-gradient(135deg, #003D7C 0%, #0055B3 55%, #f5c518 140%)' }}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          aria-label="Back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="min-w-0 flex-1 text-base font-bold">{title}</h1>
        <HomeButton onClick={onHome} />
      </div>
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition ${on ? 'bg-[#003D7C]' : 'bg-slate-300'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  );
}

function ActionTile({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 px-1 py-2 text-center"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#003D7C]/10 text-lg text-[#003D7C]">
        {icon}
      </span>
      <span className="text-[9px] font-semibold leading-tight text-slate-700">{label}</span>
    </button>
  );
}

function CardVisual() {
  return (
    <div className="mx-4 mt-3 overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4 text-white shadow-lg">
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-bold tracking-wide text-bank-gold">Indian Bank</span>
        <span className="text-[8px] text-white/70">Global ATM/Debit Card</span>
      </div>
      <div className="mt-6 flex items-end justify-between">
        <div>
          <p className="font-mono text-sm tracking-widest">{CARD_NUMBER}</p>
          <p className="mt-2 text-[9px] text-white/60">VALID THRU 12/28</p>
        </div>
        <span className="text-2xl opacity-80">📶</span>
      </div>
    </div>
  );
}

function PinKeypad({ pin, onDigit, onBack, maxLen = 6 }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  return (
    <div className="mt-6 px-6">
      <div className="mb-6 flex justify-center gap-3">
        {Array.from({ length: maxLen }, (_, i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full border-2 ${i < pin.length ? 'border-[#003D7C] bg-[#003D7C]' : 'border-slate-300'}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {keys.map((k, i) => (
          <button
            key={i}
            type="button"
            disabled={!k}
            onClick={() => (k === '⌫' ? onBack() : k && onDigit(k))}
            className={`flex h-12 items-center justify-center rounded-lg text-xl font-semibold ${
              k ? 'bg-slate-100 text-slate-800 active:bg-slate-200' : 'invisible'
            }`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DebitCardDashboardScreen({ onClose, initialSubFlow = null }) {
  const [flow, setFlow] = useState('dashboard');
  const [txnScope, setTxnScope] = useState('domestic');
  const [txnToggles, setTxnToggles] = useState({
    domestic: { atm: true, ecom: true, pos: true, nfc: true, cashpos: true },
    international: { atm: true, ecom: true, pos: true, nfc: true, cashpos: true },
  });
  const [savedTxnToggles, setSavedTxnToggles] = useState(txnToggles);
  const [newPin, setNewPin] = useState('');
  const [rePin, setRePin] = useState('');
  const [authPin, setAuthPin] = useState('');
  const [refNo] = useState(() => `IB${Date.now().toString().slice(-8)}`);

  useEffect(() => {
    if (initialSubFlow === 'disable_international') {
      setTxnScope('international');
      setFlow('txn_settings');
    } else if (initialSubFlow === 'reset_pin') {
      setFlow('reset_pin_form');
    }
  }, [initialSubFlow]);

  const currentToggles = txnToggles[txnScope];
  const savedScopeToggles = savedTxnToggles[txnScope];
  const txnChanged = useMemo(
    () => TXN_TYPES.some(({ id }) => currentToggles[id] !== savedScopeToggles[id]),
    [currentToggles, savedScopeToggles],
  );

  const disabledTxnLabels = useMemo(() => {
    const t = txnToggles.international;
    return TXN_TYPES.filter(({ id }) => !t[id]).map(({ label }) => label);
  }, [txnToggles.international]);

  const setToggle = (id, value) => {
    setTxnToggles((prev) => ({
      ...prev,
      [txnScope]: { ...prev[txnScope], [id]: value },
    }));
  };

  const disableAll = () => {
    setTxnToggles((prev) => ({
      ...prev,
      [txnScope]: Object.fromEntries(TXN_TYPES.map(({ id }) => [id, false])),
    }));
  };

  const goDashboard = () => {
    setFlow('dashboard');
    setNewPin('');
    setRePin('');
    setAuthPin('');
  };

  const pinFormValid = newPin.length >= 4 && newPin === rePin;

  if (flow === 'pin_auth') {
    return (
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="absolute inset-0 z-40 flex flex-col bg-white"
      >
        <ScreenHeader title="Authentication" onBack={() => setFlow('reset_pin_form')} onHome={onClose} />
        <div className="flex-1 pt-8 text-center">
          <h2 className="text-lg font-bold text-slate-800">Transaction PIN</h2>
          <PinKeypad
            pin={authPin}
            maxLen={6}
            onDigit={(d) => {
              if (authPin.length < 6) {
                const next = authPin + d;
                setAuthPin(next);
                if (next.length === 6) setTimeout(() => setFlow('pin_success'), 400);
              }
            }}
            onBack={() => setAuthPin((p) => p.slice(0, -1))}
          />
          <button
            type="button"
            onClick={goDashboard}
            className="mt-4 text-xs font-bold uppercase tracking-wide text-[#003D7C]"
          >
            Cancel Transaction
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="absolute inset-0 z-40 flex flex-col bg-slate-100"
    >
      <ScreenHeader
        title="Debit Card"
        onBack={flow === 'dashboard' ? onClose : goDashboard}
        onHome={onClose}
      />

      <div className="flex-1 overflow-y-auto pb-24">
        <CardVisual />

        <div className="mx-4 mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
          <p className="text-[10px] font-medium text-slate-500">Linked Account</p>
          <button type="button" className="mt-0.5 flex w-full items-center justify-between text-sm font-semibold text-slate-800">
            {LINKED_ACCOUNT}
            <span className="text-slate-400">⌄</span>
          </button>
        </div>

        <div className="mx-4 mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="bg-[#003D7C] px-3 py-2 text-center text-xs font-bold text-white">Card Actions</div>
          <div className="grid grid-cols-3 gap-1 p-2">
            <ActionTile icon="⚙" label="Manage Limits" onClick={() => {}} />
            <ActionTile icon="🚫" label="Hotlist Card" onClick={() => {}} />
            <ActionTile icon="✏" label="Change Card PIN" onClick={() => setFlow('change_pin_form')} />
            <ActionTile icon="🔑" label="Set/Reset Card PIN" onClick={() => setFlow('reset_pin_form')} />
            <ActionTile icon="⇄" label="Enable/Disable Transactions" onClick={() => setFlow('txn_settings')} />
            <ActionTile icon="➕" label="Request for Add On Card" onClick={() => {}} />
          </div>
        </div>

        <div className="mx-4 mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
          <span className="text-sm font-semibold text-slate-700">Lock / Unlock</span>
          <Toggle on={false} onChange={() => {}} />
        </div>
      </div>

      <AnimatePresence>
        {flow === 'txn_settings' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-end bg-black/40"
            onClick={goDashboard}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[88%] w-full overflow-y-auto rounded-t-2xl bg-white"
            >
              <div className="flex items-center justify-between bg-[#003D7C] px-4 py-3 text-white">
                <h3 className="text-sm font-bold">Enable/ Disable Transactions</h3>
                <button type="button" onClick={disableAll} className="text-[10px] font-bold uppercase">
                  Disable All
                </button>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs font-semibold text-slate-600">Transaction Type</p>
                <div className="mt-2 flex gap-2">
                  {['domestic', 'international'].map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => setTxnScope(scope)}
                      className={`flex-1 rounded-full py-2 text-xs font-bold capitalize ${
                        txnScope === scope ? 'bg-[#003D7C] text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {scope}
                    </button>
                  ))}
                </div>
                <div className="mt-4 space-y-3">
                  {TXN_TYPES.map(({ id, label }) => (
                    <div key={id} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{label}</span>
                      <Toggle on={currentToggles[id]} onChange={(v) => setToggle(id, v)} />
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex gap-2 pb-4">
                  <button
                    type="button"
                    disabled={!txnChanged}
                    onClick={() => setFlow('txn_review')}
                    className={`flex-1 rounded-lg py-3 text-sm font-bold ${
                      txnChanged ? 'bg-[#003D7C] text-white' : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={goDashboard}
                    className="flex-1 rounded-lg border border-slate-300 py-3 text-sm font-bold text-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {flow === 'txn_review' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
            onClick={() => setFlow('txn_settings')}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl"
            >
              <div className="flex items-center justify-between bg-[#003D7C] px-4 py-3 text-white">
                <h3 className="text-sm font-bold">Review and confirm</h3>
                <button type="button" onClick={() => setFlow('txn_settings')} className="text-lg">×</button>
              </div>
              <div className="space-y-3 px-4 py-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Debit Card Number</p>
                  <p className="font-semibold">{CARD_NUMBER}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Summary</p>
                  {TXN_TYPES.filter(({ id }) => currentToggles[id] !== savedScopeToggles[id]).map(({ id, label }) => (
                    <p key={id} className="text-slate-700">
                      {label}: {currentToggles[id] ? 'Enabled' : 'Disabled'}
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 px-4 pb-4">
                <button
                  type="button"
                  onClick={() => {
                    setSavedTxnToggles({ ...txnToggles });
                    setFlow('txn_success');
                  }}
                  className="flex-1 rounded-lg bg-[#003D7C] py-2.5 text-sm font-bold text-white"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setFlow('txn_settings')}
                  className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-bold text-slate-600"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {flow === 'txn_success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
          >
            <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl">
              <div className="bg-[#003D7C] px-4 py-3 text-sm font-bold text-white">Success</div>
              <div className="px-4 py-5 text-center">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-2xl text-white">✓</span>
                <p className="mt-3 text-sm font-semibold text-slate-800">Transaction access setting Updated Successfully</p>
                <p className="mt-1 text-xs text-slate-500">Reference No. {refNo}</p>
                {disabledTxnLabels.length > 0 && (
                  <div className="mt-3 text-left text-xs text-slate-600">
                    {disabledTxnLabels.map((l) => (
                      <p key={l}>{l}: Disabled</p>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-4 pb-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-lg bg-[#003D7C] py-2.5 text-sm font-bold text-white"
                >
                  Home
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {(flow === 'reset_pin_form' || flow === 'change_pin_form') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={goDashboard}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl"
            >
              <div className="bg-[#003D7C] px-4 py-3 text-sm font-bold text-white">
                {flow === 'change_pin_form' ? 'Change Card PIN' : 'Set/Reset Card PIN'}
              </div>
              <div className="space-y-3 px-4 py-4">
                {flow === 'change_pin_form' && (
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600">Existing PIN *</span>
                    <input
                      type="password"
                      placeholder="Please Type Here..."
                      className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#003D7C]"
                    />
                  </label>
                )}
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">New PIN *</span>
                  <input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Please Type Here..."
                    className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#003D7C]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Re-enter PIN *</span>
                  <input
                    type="password"
                    value={rePin}
                    onChange={(e) => setRePin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Please Type Here..."
                    className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#003D7C]"
                  />
                </label>
              </div>
              <div className="flex gap-2 px-4 pb-4">
                <button
                  type="button"
                  disabled={!pinFormValid}
                  onClick={() => setFlow('pin_auth')}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-bold ${
                    pinFormValid ? 'bg-[#003D7C] text-white' : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={goDashboard}
                  className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-bold text-slate-600"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {flow === 'pin_success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
          >
            <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl">
              <div className="bg-[#003D7C] px-4 py-3 text-sm font-bold text-white">Success</div>
              <div className="flex items-center gap-3 px-4 py-5">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xl text-white">✓</span>
                <p className="text-sm font-semibold text-slate-800">Card PIN changed successfully</p>
              </div>
              <div className="px-4 pb-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-lg bg-[#003D7C] py-2.5 text-sm font-bold text-white"
                >
                  Ok
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
