import React, { useState } from 'react';
import { motion } from 'framer-motion';
import LoanAguiPanel from './LoanAguiPanel.jsx';
import { TXN_HISTORY_AGUI_AGENT_ID } from '../lib/aguiClient.js';

const MOCK_TRANSACTIONS = [
  { id: 1,  date: '16 May 2026', type: 'DR', amount: 1800,   description: 'UPI/BESCOM ELECTRICITY/bescom@icici/Online Bill Payment',          mode: 'UPI',    balance: 251000 },
  { id: 2,  date: '14 May 2026', type: 'DR', amount: 499,    description: 'UPI/AIRTEL POSTPAID/airtel@axis/Mobile Recharge May 2026',           mode: 'UPI',    balance: 252800 },
  { id: 3,  date: '12 May 2026', type: 'DR', amount: 3250,   description: 'UPI/SWIGGY INSTAMART/swiggy@hdfc/Grocery Order #GR82941',           mode: 'UPI',    balance: 253299 },
  { id: 4,  date: '10 May 2026', type: 'DR', amount: 12000,  description: 'IMPS/TRF TO RAHUL SHARMA/HDFC BANK/A/C XXXXXXXH124/Ref 812934501', mode: 'IMPS',   balance: 256549 },
  { id: 5,  date: '07 May 2026', type: 'DR', amount: 750,    description: 'UPI/ZOMATO/zomato@paytm/Food Order #ZO99234',                        mode: 'UPI',    balance: 268549 },
  { id: 6,  date: '05 May 2026', type: 'DR', amount: 1100,   description: 'UPI/INDANE GAS/indane@okicici/LPG Cylinder Booking',                 mode: 'UPI',    balance: 269299 },
  { id: 7,  date: '03 May 2026', type: 'DR', amount: 45000,  description: 'EMI/HDFC BANK CARLOAN/EMI May 2026/Loan A/C 91028374',              mode: 'NACH',   balance: 270399 },
  { id: 8,  date: '01 May 2026', type: 'CR', amount: 125000, description: 'CREDIT/SALARY MAY 2026/TECHINFRA SOLUTIONS PVT LTD/NEFT/Ref 71823400', mode: 'NEFT', balance: 315399 },
  { id: 9,  date: '29 Apr 2026', type: 'DR', amount: 2200,   description: 'UPI/AMAZON PAY/amazon@apl/Purchase Order #404-8912345-6712340',      mode: 'UPI',    balance: 190399 },
  { id: 10, date: '27 Apr 2026', type: 'DR', amount: 999,    description: 'UPI/AIRTEL BROADBAND/airtel.bb@axis/Broadband Apr 2026',             mode: 'UPI',    balance: 192599 },
  { id: 11, date: '25 Apr 2026', type: 'DR', amount: 580,    description: 'UPI/BWSSB WATER/bwssb@upi/Water Bill Apr 2026',                      mode: 'UPI',    balance: 193598 },
  { id: 12, date: '23 Apr 2026', type: 'DR', amount: 3500,   description: 'UPI/PRIYA NAIR/priya.nair@okicici/Rent Share Apr',                   mode: 'UPI',    balance: 194178 },
  { id: 13, date: '21 Apr 2026', type: 'DR', amount: 12500,  description: 'UPI/LIC OF INDIA/lic@upi/Policy Prem 987654321/Apr 2026',            mode: 'UPI',    balance: 197678 },
  { id: 14, date: '20 Apr 2026', type: 'DR', amount: 850,    description: 'ATM WDL/IB ATM BHOPAL MAIN BRANCH/Card XXXX1762',                   mode: 'ATM',    balance: 210178 },
  { id: 15, date: '18 Apr 2026', type: 'DR', amount: 1450,   description: 'UPI/SWIGGY/swiggy@hdfc/Dining Apr 2026',                             mode: 'UPI',    balance: 211028 },
  { id: 16, date: '16 Apr 2026', type: 'DR', amount: 2100,   description: 'NEFT/TRF TO VIKRAM SINGH/AXIS BANK/Ref 60912837/Personal',          mode: 'NEFT',   balance: 212478 },
  { id: 17, date: '15 Apr 2026', type: 'DR', amount: 45000,  description: 'EMI/HDFC BANK CARLOAN/EMI Apr 2026/Loan A/C 91028374',              mode: 'NACH',   balance: 214578 },
  { id: 18, date: '01 Apr 2026', type: 'CR', amount: 125000, description: 'CREDIT/SALARY APR 2026/TECHINFRA SOLUTIONS PVT LTD/NEFT/Ref 68710200', mode: 'NEFT', balance: 259578 },
  { id: 19, date: '30 Mar 2026', type: 'DR', amount: 4999,   description: 'UPI/MYNTRA/myntra@ybl/Online Shopping Order #MYN2348901',            mode: 'UPI',    balance: 134578 },
  { id: 20, date: '28 Mar 2026', type: 'DR', amount: 1800,   description: 'UPI/BESCOM ELECTRICITY/bescom@icici/Online Bill Payment Mar',        mode: 'UPI',    balance: 139577 },
];

function formatInr(n) {
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function TransactionHistoryScreen({ onClose, onNavigate, lang, aiPrimer }) {
  const [aiOpen, setAiOpen] = useState(true);

  const handleToolCall = (toolName, args) => {
    if (toolName === 'navigate_to') {
      const { destination, context, routingStatus } = args;
      onNavigate?.(destination, context || '', routingStatus || '');
    }
  };

  // Greeting is generic — the AI agent will respond naturally based on what the user asks.
  // If there's a fraud-related context from the home screen, it's passed as primer to the agent.
  const greeting = "Here are your last 30 transactions. How can I help you?";

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
                <p className="text-xs text-slate-500">XXXXXX1762 — Primary</p>
                <p className="text-xs text-slate-500">Last 30 Transactions</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Balance</p>
            <p className="text-sm font-bold text-slate-800">₹2,51,000.00</p>
            <button type="button" className="mt-0.5 text-xs font-semibold text-red-600 hover:underline">
              Report Fraud
            </button>
          </div>
        </div>
      </div>

      {/* Transaction list */}
      <div className="flex-1 overflow-y-auto px-0">
        {MOCK_TRANSACTIONS.map((txn, idx) => (
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
