import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import LoanAguiPanel from './LoanAguiPanel.jsx';
import { TXN_HISTORY_AGUI_AGENT_ID } from '../lib/aguiClient.js';
import {
  PERIOD_PRESETS,
  filterTransactionsByRange,
  formatPeriodLabel,
  parseDateRangeFromUtterance,
} from '../lib/transactionDateFilter.js';

const API_BASE =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:3001');

function formatInr(n) {
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function TransactionHistoryScreen({
  onClose,
  onNavigate,
  onDateRangeChange,
  lang,
  aiPrimer,
  initialDateFrom = null,
  initialDateTo = null,
  voiceCommandMode = false,
}) {
  const hasInitialFilter = Boolean(initialDateFrom || initialDateTo);
  const [aiOpen, setAiOpen] = useState(() => !hasInitialFilter && !voiceCommandMode);
  const [account, setAccount] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(initialDateFrom || '');
  const [dateTo, setDateTo] = useState(initialDateTo || '');

  useEffect(() => {
    setDateFrom(initialDateFrom || '');
    setDateTo(initialDateTo || '');
    if (initialDateFrom || initialDateTo) setAiOpen(false);
  }, [initialDateFrom, initialDateTo]);

  useEffect(() => {
    fetch(`${API_BASE}/api/account-statement`)
      .then((r) => r.json())
      .then(({ account, transactions }) => {
        setAccount(account);
        setAllTransactions(transactions || []);
      })
      .catch(() => {/* silently ignore — UI will show empty state */})
      .finally(() => setLoading(false));
  }, []);

  const fromIso = dateFrom || null;
  const toIso = dateTo || null;

  const transactions = useMemo(
    () => filterTransactionsByRange(allTransactions, fromIso, toIso),
    [allTransactions, fromIso, toIso],
  );

  const periodLabel = formatPeriodLabel(fromIso, toIso);
  const isFiltered = Boolean(fromIso || toIso);

  const applyPreset = (preset) => {
    setDateFrom(preset.dateFrom || '');
    setDateTo(preset.dateTo || '');
    onDateRangeChange?.(preset.dateFrom || null, preset.dateTo || null);
  };

  const clearFilter = () => {
    setDateFrom('');
    setDateTo('');
    onDateRangeChange?.(null, null);
  };

  const applyDateRange = (nextFrom, nextTo) => {
    if (nextFrom) setDateFrom(nextFrom);
    if (nextTo) setDateTo(nextTo);
    onDateRangeChange?.(nextFrom || null, nextTo || null);
  };

  const applyDateRangeFromUtterance = (text) => {
    const range = parseDateRangeFromUtterance(text);
    if (!range?.dateFrom || !range?.dateTo) return false;
    applyDateRange(range.dateFrom, range.dateTo);
    return true;
  };

  const handleUserMessage = (text) => {
    const range = parseDateRangeFromUtterance(text);
    if (!range?.dateFrom || !range?.dateTo) return false;
    applyDateRange(range.dateFrom, range.dateTo);
    return formatPeriodLabel(range.dateFrom, range.dateTo);
  };

  const handleToolCall = (toolName, args) => {
    if (toolName === 'apply_date_filter') {
      const { dateFrom: from, dateTo: to } = args;
      if (from || to) applyDateRange(from || '', to || '');
      return;
    }
    if (toolName === 'navigate_to') {
      const { destination, context, routingStatus } = args;
      onNavigate?.(destination, context || '', routingStatus || '');
    }
  };

  const greeting = isFiltered
    ? `Showing transactions for ${periodLabel}. Adjust the date range above or speak a new window.`
    : 'Here are all your transactions. Pick a date range above or ask by voice.';

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="absolute inset-0 z-40 flex flex-col bg-white"
    >
      <div className="shrink-0 bg-gradient-to-r from-[#003D7C] to-[#0055B3]">
        <div className="flex items-center gap-3 px-3 pt-2 pb-1.5">
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="flex-1 text-base font-bold text-white">Account Statement</h1>
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bank-gold text-bank-purpleDeep hover:opacity-90"
            aria-label="Home"
            onClick={onClose}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800">Chosen Account</p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bank-gold font-bold text-sm text-bank-purpleDeep shadow">
                SB
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">My Savings</p>
                <p className="text-xs text-slate-500 truncate">
                  XXXXXX{account?.last4 ?? '…'} — Primary
                </p>
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-slate-500">Balance</p>
            <p className="text-sm font-bold text-slate-800">
              {account ? formatInr(account.balance) : '—'}
            </p>
          </div>
        </div>

        {/* Inline date-range filter — same screen, no modal */}
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Period</p>
            {isFiltered && (
              <button
                type="button"
                onClick={clearFilter}
                className="text-[10px] font-semibold text-[#003D7C] hover:underline"
              >
                Show all
              </button>
            )}
          </div>
          <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="From date"
              className="min-w-0 rounded border border-slate-300 px-1.5 py-1.5 text-[11px] outline-none focus:border-[#003D7C] focus:ring-1 focus:ring-[#003D7C]/30"
            />
            <span className="text-[10px] font-medium text-slate-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="To date"
              className="min-w-0 rounded border border-slate-300 px-1.5 py-1.5 text-[11px] outline-none focus:border-[#003D7C] focus:ring-1 focus:ring-[#003D7C]/30"
            />
          </div>
          <div className="mt-2 flex gap-1 overflow-x-auto no-scrollbar pb-0.5">
            {PERIOD_PRESETS.map((preset) => {
              const active =
                (preset.dateFrom || '') === dateFrom && (preset.dateTo || '') === dateTo;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold press ${
                    active
                      ? 'bg-[#003D7C] text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  {preset.id === 'all' ? 'All' : preset.label.replace(' 2026', '').replace(' transactions', '')}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            <span className="font-semibold text-slate-700">{periodLabel}</span>
            {!loading && (
              <span className="text-slate-400"> · {transactions.length} transaction{transactions.length === 1 ? '' : 's'}</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-0">
        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
            Loading transactions…
          </div>
        )}
        {!loading && transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-slate-500 text-sm">No transactions in this period.</p>
            {isFiltered && (
              <button
                type="button"
                onClick={clearFilter}
                className="mt-3 text-xs font-semibold text-[#003D7C] hover:underline"
              >
                Show all transactions
              </button>
            )}
          </div>
        )}
        {transactions.map((txn, idx) => (
          <div key={txn.id} className={`border-b border-slate-100 px-4 py-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500">{txn.date}</p>
                <p className="mt-0.5 text-[11px] leading-[1.35] text-slate-600 break-all line-clamp-3">{txn.description}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className={`text-sm font-bold ${txn.type === 'CR' ? 'text-green-600' : 'text-red-500'}`}>
                  {txn.type === 'DR' ? '-' : '+'}{formatInr(txn.amount)}
                </p>
                <p className="text-[10px] font-medium text-slate-400">{txn.type}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">Bal: {formatInr(txn.balance)}</p>
              </div>
            </div>
          </div>
        ))}
        <div className="h-44" />
      </div>

      {!aiOpen && (
        <button
          type="button"
          onClick={() => setAiOpen(true)}
          className="absolute bottom-6 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-200/80 bg-white text-xl shadow-lg"
          aria-label="Open AI Assistant"
        >
          🧑‍💼
        </button>
      )}

      <LoanAguiPanel
        agentId={TXN_HISTORY_AGUI_AGENT_ID}
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        greeting={greeting}
        assistTitle="Account Assistant"
        assistHint="Ask about your transactions"
        primer={aiPrimer || null}
        onUserMessage={handleUserMessage}
        onToolCall={handleToolCall}
        lang={lang}
      />
    </motion.div>
  );
}
