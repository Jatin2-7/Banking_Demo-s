import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const AUTO_STATEMENT_MS = 1800;

const CARDS = [
  {
    number: '4185 XXXX XXXX 0059',
    name: 'SANDEEP P S',
    product: 'PLATINUM STAFF PRDCT',
    lastBilled: '₹ 0.00',
    minDue: '₹ 0.00',
    billDate: '20 June 2024',
    dueDate: 'N/A',
    lastPayment: '₹ 0.00',
    lastPaymentDate: 'N/A',
    outstanding: '-₹ 491.50',
    cashLimit: '₹ 40,000.00',
    cardLimit: '₹ 1,00,491.50',
    maxCredit: '₹ 1,00,000.00',
    cashWithdrawal: '₹ 40,000.00',
  },
];

function HomeButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 shrink-0 flex-col items-center justify-center rounded-md bg-bank-gold px-2 py-0.5 text-bank-purpleDeep shadow-sm"
      aria-label="Home"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
      <span className="text-[7px] font-bold uppercase leading-none">Home</span>
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

function CreditCardVisual({ card, showNumber }) {
  return (
    <div className="mx-4 overflow-hidden rounded-xl border border-violet-400/40 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4 text-white shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold text-bank-gold">Indian Bank</p>
          <p className="text-[8px] text-white/70">Credit Card</p>
        </div>
        <span className="text-lg opacity-80">🔓</span>
      </div>
      <div className="mt-4 h-8 w-10 rounded bg-gradient-to-br from-amber-300 to-amber-500" />
      <div className="mt-4 flex items-center justify-between">
        <p className="font-mono text-sm tracking-widest">
          {showNumber ? card.number.replace(/X/g, '•') : card.number}
        </p>
        <button type="button" className="text-white/80" aria-label="Toggle card number">
          👁
        </button>
      </div>
      <div className="mt-3 flex items-end justify-between text-[9px] text-white/70">
        <div>
          <p>VALID THRU XX / YY</p>
          <p className="mt-1 text-xs font-bold text-white">{card.name}</p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-xs text-slate-600">{label}</span>
      <span className={`text-xs ${bold ? 'font-bold text-slate-900' : 'text-slate-800'}`}>{value}</span>
    </div>
  );
}

export default function CreditCardDashboardScreen({ onClose, initialSubFlow = null }) {
  const [cardIndex, setCardIndex] = useState(0);
  const [flow, setFlow] = useState('dashboard');
  const [tab, setTab] = useState('utilisation');
  const [payAmount, setPayAmount] = useState('0.00');
  const [showNumber, setShowNumber] = useState(false);
  const [highlightStatement, setHighlightStatement] = useState(false);
  const autoNavRef = useRef(null);

  const card = CARDS[cardIndex];
  const autoStatement = initialSubFlow === 'card_statement';

  useEffect(() => {
    if (!autoStatement) return undefined;

    setHighlightStatement(true);
    autoNavRef.current = setTimeout(() => {
      setHighlightStatement(false);
      setFlow('statement');
    }, AUTO_STATEMENT_MS);

    return () => {
      if (autoNavRef.current) clearTimeout(autoNavRef.current);
    };
  }, [autoStatement]);

  const openStatement = () => {
    if (autoNavRef.current) clearTimeout(autoNavRef.current);
    setHighlightStatement(false);
    setFlow('statement');
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="absolute inset-0 z-40 flex flex-col bg-slate-100"
    >
      <ScreenHeader
        title="Credit Card"
        onBack={flow === 'statement' ? () => setFlow('dashboard') : onClose}
        onHome={onClose}
      />

      <AnimatePresence mode="wait" initial={false}>
        {flow === 'dashboard' ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 1, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="flex-1 overflow-y-auto pb-6"
          >
            {autoStatement && (
              <div className="mx-4 mt-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-center text-[11px] font-medium text-sky-800">
                Opening card statement…
              </div>
            )}

            <div className="mx-4 mt-3 flex items-center justify-between rounded-lg bg-sky-100 px-3 py-2">
              <span className="text-xs font-semibold text-slate-700">Next / Prev Card</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCardIndex((i) => (i - 1 + CARDS.length) % CARDS.length)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600"
                  aria-label="Previous card"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setCardIndex((i) => (i + 1) % CARDS.length)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600"
                  aria-label="Next card"
                >
                  ›
                </button>
              </div>
            </div>

            <div onClick={() => setShowNumber((v) => !v)} role="presentation">
              <CreditCardVisual card={card} showNumber={showNumber} />
            </div>

            <div className="mx-4 mt-4 rounded-lg border border-slate-200 bg-white px-4 py-1 shadow-sm">
              <DetailRow label="Last Billed Amount" value={card.lastBilled} bold />
              <DetailRow label="Minimum Due" value={card.minDue} bold />
              <DetailRow label="Bill Date" value={card.billDate} />
              <DetailRow label="Bill Due Date" value={card.dueDate} />
              <div className="my-1 border-t border-slate-200" />
              <DetailRow label="Last Payment Amount" value={card.lastPayment} />
              <DetailRow label="Last Payment Date" value={card.lastPaymentDate} />
            </div>

            <div className="mx-4 mt-4 flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-medium text-slate-500">Enter Amount to Pay</label>
                <input
                  type="text"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value.replace(/[^\d.]/g, ''))}
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-[#003D7C]"
                />
              </div>
              <button
                type="button"
                disabled={!payAmount || payAmount === '0' || payAmount === '0.00'}
                className="mt-4 rounded-lg bg-slate-300 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                PAY
              </button>
            </div>

            <div className="mx-4 mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="bg-[#003D7C] px-3 py-2 text-center text-xs font-bold text-white">Card Actions</div>
              <div className="flex justify-center p-4">
                <button
                  type="button"
                  onClick={openStatement}
                  className={`flex flex-col items-center gap-1.5 rounded-xl px-3 py-1 transition ${
                    highlightStatement ? 'animate-pulse ring-2 ring-sky-400 ring-offset-2' : ''
                  }`}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#003D7C]/10 text-xl text-[#003D7C]">
                    📄
                  </span>
                  <span className="text-[10px] font-semibold text-slate-700">Card Statement</span>
                </button>
              </div>
            </div>

            <div className="mx-4 mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex border-b border-slate-200">
                {[
                  { id: 'utilisation', label: 'Card utilisation' },
                  { id: 'unbilled', label: 'UN-BILLED STATEMENT' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={`flex-1 py-2.5 text-[10px] font-bold ${
                      tab === id ? 'border-b-2 border-[#003D7C] text-[#003D7C]' : 'text-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tab === 'utilisation' ? (
                <div className="space-y-0 px-4 py-1">
                  <DetailRow label="Total Outstanding Amount" value={card.outstanding} bold />
                  <DetailRow label="Available Cash Limit" value={card.cashLimit} />
                  <DetailRow label="Available Card Limit" value={card.cardLimit} />
                  <p className="py-2 text-xs font-bold text-slate-800">Card Limits</p>
                  <DetailRow label="Max Credit Limit" value={card.maxCredit} />
                  <DetailRow label="Cash Withdrawal Limit" value={card.cashWithdrawal} />
                </div>
              ) : (
                <div className="flex flex-col items-center px-6 py-10">
                  <div className="text-4xl opacity-40">📭</div>
                  <p className="mt-3 text-sm font-semibold text-slate-600">No Records Found</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="statement"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 32 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="flex flex-1 flex-col overflow-y-auto pb-4"
          >
            <div className="mx-4 mt-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3">
              <p className="text-xs font-bold text-slate-800">{card.product}</p>
              <p className="mt-0.5 font-mono text-sm text-slate-700">{card.number}</p>
            </div>

            <div className="mx-4 mt-4 flex flex-1 flex-col items-center justify-center rounded-lg bg-white px-6 py-10 shadow-sm">
              <div className="text-5xl opacity-40">📭</div>
              <p className="mt-4 text-sm font-semibold text-slate-600">No Records Found</p>
              <p className="mt-2 text-center text-xs text-slate-400">
                No billed transactions are available for this card right now.
              </p>
            </div>

            <div className="mx-4 mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Statement summary</p>
              <DetailRow label="Bill Date" value={card.billDate} />
              <DetailRow label="Last Billed Amount" value={card.lastBilled} bold />
              <DetailRow label="Minimum Due" value={card.minDue} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
