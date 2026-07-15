import React, { useMemo } from 'react';
import { SBI } from '../theme.js';
import { SBI_ACCOUNT, SBI_TRANSACTIONS, groupTransactionsByMonth } from '../data/transactions.js';
import {
  filterTransactionsByRange,
  formatPeriodLabel,
} from '../../../lib/transactionDateFilter.js';

function formatInr(n) {
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CHANNEL_COLORS = {
  UPI: '#5C2D91',
  NEFT: '#1565C0',
  IMPS: '#00838F',
  ATM: '#455A64',
  BILL: '#E65100',
};

export default function SbiTransactionsScreen({
  onBack,
  initialDateFrom = null,
  initialDateTo = null,
}) {
  const filtered = useMemo(
    () => filterTransactionsByRange(SBI_TRANSACTIONS, initialDateFrom, initialDateTo),
    [initialDateFrom, initialDateTo],
  );
  const groups = useMemo(() => groupTransactionsByMonth(filtered), [filtered]);
  const periodLabel = formatPeriodLabel(initialDateFrom, initialDateTo);
  const hasFilter = Boolean(initialDateFrom || initialDateTo);

  return (
    <div className="flex min-h-full flex-col bg-white">
      <header
        className="flex items-center gap-2 border-b px-3 py-3"
        style={{ borderColor: SBI.border }}
      >
        <button type="button" onClick={onBack} className="press -ml-1 p-1" aria-label="Back">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke={SBI.purple}
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="flex-1 text-[15px] font-bold" style={{ color: SBI.ink }}>
          Transactions
        </h1>
        <button
          type="button"
          className="press p-1"
          style={{ color: SBI.purple }}
          aria-label="Notifications"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
          </svg>
        </button>
        <button
          type="button"
          className="press p-1"
          style={{ color: SBI.purple }}
          aria-label="Support"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M3 11a9 9 0 1018 0" />
            <path d="M12 16v2" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className="flex gap-5 border-b px-4" style={{ borderColor: SBI.border }}>
        {['Transaction Details', 'Spend Analysis'].map((tab, i) => (
          <button
            key={tab}
            type="button"
            className="press pb-2.5 pt-1 text-[11px] font-semibold"
            style={{
              color: i === 0 ? SBI.purple : SBI.muted,
              borderBottom: i === 0 ? `2px solid ${SBI.purple}` : '2px solid transparent',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6">
        <p className="pt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Select Account
        </p>
        <div className="mt-2 rounded-xl border px-3 py-3" style={{ borderColor: SBI.border }}>
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
              style={{ backgroundColor: '#1565C0' }}
            >
              SBI
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-slate-800">{SBI_ACCOUNT.number}</p>
              <p className="text-[10px] text-slate-500">Available Balance</p>
              <p className="text-[14px] font-bold" style={{ color: SBI.purple }}>
                {formatInr(SBI_ACCOUNT.balance)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div
            className="flex flex-1 items-center gap-2 rounded-xl border px-3 py-2.5"
            style={{ borderColor: SBI.border }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
            <span className="text-[11px] text-slate-400">Search here...</span>
          </div>
          <button
            type="button"
            className="press shrink-0 p-2"
            style={{ color: SBI.purple }}
            aria-label="Filter"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M4 6h16M4 12h10M4 18h6" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            className="press shrink-0 p-2"
            style={{ color: SBI.purple }}
            aria-label="Sort"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M7 4v16M4 7h6M4 13h4M17 4v16M14 7h6M14 13h4" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {hasFilter && (
          <div
            className="mt-3 flex items-center justify-between gap-2 rounded-full border px-3 py-1.5"
            style={{ borderColor: SBI.purple, backgroundColor: `${SBI.purple}08` }}
          >
            <span className="text-[10px] font-semibold" style={{ color: SBI.purple }}>
              {periodLabel}
            </span>
            <span className="text-[9px] text-slate-500">
              {filtered.length} transaction{filtered.length === 1 ? '' : 's'}
            </span>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-[10px] font-semibold"
            style={{ borderColor: SBI.border, color: SBI.purple }}
          >
            Recent Transfers
            <span className="text-[8px]">&#9662;</span>
          </button>
          <button
            type="button"
            className="shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold"
            style={{ borderColor: SBI.purple, color: SBI.purple }}
          >
            Request Statement
          </button>
        </div>

        {groups.length === 0 ? (
          <div
            className="mt-8 rounded-xl border px-4 py-8 text-center"
            style={{ borderColor: SBI.border }}
          >
            <p className="text-[12px] font-semibold text-slate-700">No transactions found</p>
            <p className="mt-1 text-[10px] text-slate-500">
              {hasFilter
                ? `Nothing in ${periodLabel}. Try a different date range.`
                : 'Your statement is empty.'}
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mt-4">
              <p className="text-[12px] font-bold text-slate-700">{group.label}</p>
              <div className="mt-1 divide-y" style={{ borderColor: SBI.border }}>
                {group.items.map((txn, i) => {
                  const isCredit = txn.type === 'credit';
                  const badgeColor = CHANNEL_COLORS[txn.channel] || SBI.purple;
                  return (
                    <div key={`${txn.date}-${i}`} className="flex items-start gap-2.5 py-3">
                      <div
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded text-[6px] font-bold leading-none text-white"
                        style={{ backgroundColor: badgeColor }}
                      >
                        {txn.channel}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium text-slate-800">
                          {txn.desc}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-500">{txn.date}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className="flex items-center justify-end gap-0.5 text-[11px] font-bold"
                          style={{ color: isCredit ? SBI.success : SBI.magenta }}
                        >
                          {isCredit ? '+' : ''}
                          {formatInr(txn.amount)}
                          {!isCredit && <span className="text-[9px]">↗</span>}
                          {isCredit && <span className="text-[9px]">↙</span>}
                        </p>
                        <p className="text-[9px] text-slate-500">{formatInr(txn.balance)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
