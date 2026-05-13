import React from 'react';
import { motion } from 'framer-motion';

function bankFromHandle(handle) {
  const after = handle.split('@')[1] || '';
  const map = {
    indianbk: { label: 'Indian Bank', color: '#0E2454' },
    okindianbk: { label: 'Indian Bank', color: '#0E2454' },
    indianbank: { label: 'Indian Bank', color: '#0E2454' },
    hdfcbank: { label: 'HDFC Bank', color: '#004C8F' },
    okhdfcbank: { label: 'HDFC Bank', color: '#004C8F' },
    okaxis: { label: 'Axis Bank', color: '#97144D' },
    ybl: { label: 'Yes Bank', color: '#0033A1' },
    paytm: { label: 'Paytm', color: '#00BAF2' },
    okicici: { label: 'ICICI Bank', color: '#B02A30' },
    upi: { label: 'UPI', color: '#0E2454' },
  };
  return map[after] || { label: after.toUpperCase() || 'UPI', color: '#0E2454' };
}

export default function AccountPicker({ accounts, contactName = 'this contact', onSelect }) {
  return (
    <motion.div
      initial={{ y: 360, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 360, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="absolute left-0 right-0 bottom-0 bg-white z-[60]"
      style={{
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        maxHeight: '320px',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.25)',
      }}
    >
      <div className="px-5 pt-3">
        <div className="w-10 h-1 bg-divider rounded-full mx-auto mb-3" />
        <div className="text-[16px] font-bold text-ink">Which account for {contactName}?</div>
        <div className="text-[12px] text-muted mt-0.5">Tap one, or say the bank name.</div>
      </div>
      <div className="mt-3 px-2 pb-4 overflow-y-auto no-scrollbar" style={{ maxHeight: '240px' }}>
        {accounts.map((acct, idx) => {
          const bank = bankFromHandle(acct);
          return (
            <button
              key={acct}
              onClick={() => onSelect?.(acct)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-page press text-left"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-[13px] font-bold"
                style={{ background: bank.color }}
              >
                {bank.label[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-ink truncate">{bank.label}</div>
                <div className="text-[12px] text-muted truncate">{acct}</div>
              </div>
              {idx === 0 && (
                <span className="text-[10px] font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                  Last used
                </span>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
