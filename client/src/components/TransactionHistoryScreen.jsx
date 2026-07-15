import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import LoanAguiPanel from './LoanAguiPanel.jsx';
import { TXN_HISTORY_AGUI_AGENT_ID } from '../lib/aguiClient.js';
import {
  filterTransactionsByRange,
  formatPeriodLabel,
  parseDateRangeFromUtterance,
} from '../lib/transactionDateFilter.js';
import { CompanyAppHeader } from '../shared/ui/CompanyAppHeader.jsx';

const API_BASE =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:3001');

function formatInr(n) {
  return `₹ ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDisplayDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toInputDate(iso) {
  if (!iso) return '';
  return String(iso).slice(0, 10);
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
  const [appliedFrom, setAppliedFrom] = useState(initialDateFrom || '');
  const [appliedTo, setAppliedTo] = useState(initialDateTo || '');

  useEffect(() => {
    if (initialDateFrom) setDateFrom(initialDateFrom);
    if (initialDateTo) setDateTo(initialDateTo);
    if (initialDateFrom) setAppliedFrom(initialDateFrom);
    if (initialDateTo) setAppliedTo(initialDateTo);
    if (initialDateFrom || initialDateTo) setAiOpen(false);
  }, [initialDateFrom, initialDateTo]);

  useEffect(() => {
    fetch(`${API_BASE}/api/account-statement`)
      .then((r) => r.json())
      .then(({ account: acct, transactions }) => {
        setAccount(acct);
        setAllTransactions(transactions || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const transactions = useMemo(
    () => filterTransactionsByRange(allTransactions, appliedFrom || null, appliedTo || null),
    [allTransactions, appliedFrom, appliedTo],
  );

  const periodLabel = formatPeriodLabel(appliedFrom, appliedTo);

  const applyGo = () => {
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
    onDateRangeChange?.(dateFrom || null, dateTo || null);
  };

  const clearFilter = () => {
    setDateFrom('');
    setDateTo('');
    setAppliedFrom('');
    setAppliedTo('');
    onDateRangeChange?.(null, null);
  };

  const applyDateRange = (nextFrom, nextTo) => {
    if (nextFrom) {
      setDateFrom(nextFrom);
      setAppliedFrom(nextFrom);
    }
    if (nextTo) {
      setDateTo(nextTo);
      setAppliedTo(nextTo);
    }
    onDateRangeChange?.(nextFrom || null, nextTo || null);
  };

  const handleUserMessage = (text) => {
    const t = String(text || '').toLowerCase();
    if (
      /\b(change|reset|update|forgot)\b.{0,24}\b(credit\s*)?(card\s*)?pin\b/.test(t) ||
      /\b(credit\s*)?card\s*pin\b.{0,16}\b(change|reset|update)\b/.test(t) ||
      /\bchange\s+my\s+(credit\s+)?(card\s+)?pin\b/.test(t)
    ) {
      onNavigate?.('credit_card', 'change_pin', 'Opening credit card PIN change.');
      return 'Opening Change Credit Card PIN…';
    }
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

  const acctLabel = account
    ? `SAVING A/c - XXXXXX${account.last4 || '1762'}`
    : 'SAVING A/c - XXXXXX1762';
  const balance = account?.balance ?? 352089.79;

  const displayTxns = transactions;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="absolute inset-0 z-40 flex flex-col bg-[#F5F7FA]"
    >
      <CompanyAppHeader title="Account Summary" onBack={onClose} onHome={onClose} />

      <div className="relative flex-1 overflow-y-auto no-scrollbar pb-20">
        {/* Account carousel card */}
        <div className="mx-3 mt-3 flex items-center gap-1 rounded-xl bg-[#EEF1F6] px-2 py-4">
          <button
            type="button"
            className="px-1 text-[#1565C0] text-lg"
            aria-label="Previous account"
          >
            ‹
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[12px] font-semibold text-[#1565C0]">{acctLabel}</p>
            <p className="mt-1 text-[22px] font-bold tracking-tight text-[#1A237E]">
              {formatInr(balance)}
            </p>
            <div className="mt-2 flex justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1565C0]" />
            </div>
          </div>
          <button type="button" className="px-1 text-[#1565C0] text-lg" aria-label="Next account">
            ›
          </button>
        </div>

        {/* Date filters */}
        <div className="mx-3 mt-4 flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[11px] font-medium text-slate-500">From Date</p>
            <label className="flex items-center gap-1 rounded-lg bg-[#EEF1F6] px-2.5 py-2">
              <input
                type="date"
                value={toInputDate(dateFrom)}
                onChange={(e) => setDateFrom(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[12px] font-semibold text-[#1A237E] outline-none"
              />
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1565C0"
                strokeWidth="2"
              >
                <rect x="4" y="5" width="16" height="15" rx="2" />
                <path d="M8 3v4M16 3v4M4 11h16" strokeLinecap="round" />
              </svg>
            </label>
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[11px] font-medium text-slate-500">To Date</p>
            <label className="flex items-center gap-1 rounded-lg bg-[#EEF1F6] px-2.5 py-2">
              <input
                type="date"
                value={toInputDate(dateTo)}
                onChange={(e) => setDateTo(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[12px] font-semibold text-[#1A237E] outline-none"
              />
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1565C0"
                strokeWidth="2"
              >
                <rect x="4" y="5" width="16" height="15" rx="2" />
                <path d="M8 3v4M16 3v4M4 11h16" strokeLinecap="round" />
              </svg>
            </label>
          </div>
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={clearFilter}
              className="text-[11px] font-semibold text-[#1565C0]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={applyGo}
              className="rounded-lg bg-[#1A237E] px-3.5 py-2 text-[13px] font-bold text-white press"
            >
              Go
            </button>
          </div>
        </div>

        {/* Transaction list */}
        <div className="mt-4 space-y-2.5 px-3">
          {loading && (
            <p className="py-8 text-center text-[13px] text-slate-500">Loading transactions…</p>
          )}
          {!loading && displayTxns.length === 0 && (
            <p className="py-8 text-center text-[13px] text-slate-500">
              No transactions in this period.
            </p>
          )}
          {!loading &&
            displayTxns.map((txn) => {
              const isDebit = txn.type === 'DR' || txn.type === 'debit' || txn.drCr === 'Dr';
              const amt = Math.abs(Number(txn.amount) || 0);
              const desc = txn.description || txn.narration || txn.remark || 'Transaction';
              const dateStr = txn.date || formatDisplayDate(txn.txnDate || txn.valueDate);
              return (
                <div
                  key={txn.id || `${desc}-${dateStr}-${amt}`}
                  className="relative overflow-hidden rounded-xl bg-white py-3 pl-4 pr-3 shadow-[0_2px_10px_rgba(26,35,126,0.07)]"
                >
                  <span
                    className={`absolute bottom-0 left-0 top-0 w-[4px] ${
                      isDebit ? 'bg-[#D32F2F]' : 'bg-[#388E3C]'
                    }`}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-[#1A237E]">{desc}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{dateStr}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[13px] font-bold text-[#1A237E]">{formatInr(amt)}</p>
                      <p
                        className={`mt-1 text-[12px] font-bold ${
                          isDebit ? 'text-[#D32F2F]' : 'text-[#388E3C]'
                        }`}
                      >
                        {isDebit ? 'Dr.' : 'Cr.'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
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
        greeting={
          appliedFrom || appliedTo
            ? `Showing transactions for ${periodLabel}. Adjust the date range above or speak a new window.`
            : 'Here are your account transactions. Pick a date range above or ask by voice.'
        }
        assistTitle="AI Assistant"
        assistHint="Ask for a date range — I'll filter the list"
        primer={aiPrimer || null}
        formValues={{}}
        onToolCall={handleToolCall}
        onUserMessage={handleUserMessage}
        lang={lang}
      />
    </motion.div>
  );
}
