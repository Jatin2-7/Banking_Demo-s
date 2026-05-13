import React from 'react';
import { motion } from 'framer-motion';
import { avatarColor, initialsOf } from '../data/mockContacts';

export default function ContactList({ contacts, onSelect }) {
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
        maxHeight: '340px',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.25)',
      }}
    >
      <div className="px-5 pt-3">
        <div className="w-10 h-1 bg-divider rounded-full mx-auto mb-3" />
        <div className="text-[16px] font-bold text-ink">
          Which {contacts[0]?.name?.split(' ')[0] || 'contact'}?
        </div>
        <div className="text-[12px] text-muted mt-0.5">
          Tap a contact, or say "first", "second"…
        </div>
      </div>
      <div className="mt-3 px-2 pb-4 overflow-y-auto no-scrollbar" style={{ maxHeight: '260px' }}>
        {contacts.map((c, idx) => (
          <button
            key={c.id}
            onClick={() => onSelect?.(c)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-page press text-left"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[13px] font-bold"
              style={{ background: avatarColor(c.name) }}
            >
              {c.initials || initialsOf(c.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-ink truncate">{c.name}</div>
              <div className="text-[12px] text-muted truncate">{c.upiHandles[0]}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-semibold text-muted">#{idx + 1}</span>
              {c.lastPaid <= 7 && (
                <span className="text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                  {c.lastPaid}d ago
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
