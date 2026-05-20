import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import LoanAguiPanel from './LoanAguiPanel.jsx';
import { TXN_HISTORY_AGUI_AGENT_ID } from '../lib/aguiClient.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function formatInr(n) {
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function TransactionHistoryScreen({ onClose, onNavigate, lang, aiPrimer }) {
  const [aiOpen, setAiOpen] = useState(true);
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/account-statement`)
      .then((r) => r.json())
      .then(({ account, transactions }) => {
        setAccount(account);
        setTransactions(transactions);
      })
      .catch(() => {/* silently ignore — UI will show empty state */})
      .finally(() => setLoading(false));
  }, []);

  const handleToolCall = (toolName, args) => {
    if (toolName === 'navigate_to') {
      const { destination, context, routingStatus } = args;
      onNavigate?.(destination, context || '', routingStatus || '');
    }
  };

  const greeting = 'Here are your recent transactions. How can I help you?';

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="absolute inset-0 z-40 flex flex-col bg-white"
    >
      {/* Header */}
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

      {/* Account info card */}
      <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-800">Chosen Account</span>
              <button type="button" className="text-xs font-semibold text-[#003D7C] hover:underline">Change Period</button>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bank-gold font-bold text-sm text-bank-purpleDeep shadow">
                SB
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">My Savings</p>
                <p className="text-xs text-slate-500">
                  XXXXXX{account?.last4 ?? '…'} — Primary
                </p>
                <p className="text-xs text-slate-500">Recent Transactions</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Balance</p>
            <p className="text-sm font-bold text-slate-800">
              {account ? formatInr(account.balance) : '—'}
            </p>
            <button type="button" className="mt-0.5 text-xs font-semibold text-red-600 hover:underline">
              Report Fraud
            </button>
          </div>
        </div>
      </div>

      {/* Transaction list */}
      <div className="flex-1 overflow-y-auto px-0">
        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
            Loading transactions…
          </div>
        )}
        {!loading && transactions.length === 0 && (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
            No transactions found.
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

      {/* AI FAB — only when panel is closed */}
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

      {/* AI Overlay */}
      <LoanAguiPanel
        agentId={TXN_HISTORY_AGUI_AGENT_ID}
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        greeting={greeting}
        assistTitle="Account Assistant"
        assistHint="Ask about your transactions"
        primer={aiPrimer || null}
        onToolCall={handleToolCall}
        lang={lang}
      />
    </motion.div>
  );
}
