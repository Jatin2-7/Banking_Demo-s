import React from 'react';
import { motion } from 'framer-motion';
import { STRINGS } from '../i18n/strings.js';
import { avatarColor, initialsOf } from '../data/mock.js';

// Pulls a labeled row out of the pending.details array (case-insensitive,
// substring-match so multi-lingual labels still work). Returns the value or ''.
function pluck(details, ...needles) {
  for (const n of needles) {
    const re = new RegExp(n, 'i');
    const hit = details.find((d) => re.test(d.label || ''));
    if (hit) return hit.value;
  }
  return '';
}

export default function ConfirmCard({ session, onConfirm, onCancel, lang }) {
  if (!session || session.state !== 'CONFIRM' || !session.pending) return null;
  const L = STRINGS[lang] || STRINGS.en;
  const { details = [] } = session.pending;

  const action = session.action;
  const accent = {
    send_money: '#3D2666',
    internal_transfer: '#5B3D8A',
    pay_bill: '#C9A227',
    book_flight: '#0288D1',
  }[action] || '#3D2666';

  // Pull out the primary fields so we can render them as hero rows. Anything
  // left over is shown as a subtle "more details" list at the bottom.
  const amount = pluck(details, '^amount', 'राशि', 'మొత్తం', 'தொகை');
  const to = pluck(details, '^to$', '^biller', '^recipient', 'किसे', 'ఎవరికి', 'யாருக்கு');
  const upi = pluck(details, '^upi', '^vpa', '^handle');
  const from = pluck(details, '^from', 'खाता', 'ఖాతా', 'கணக்கு');

  const usedLabels = new Set();
  for (const [needles, found] of [
    [['amount', 'राशि', 'మొత్తం', 'தொகை'], amount],
    [['^to$', '^biller', '^recipient', 'किसे', 'ఎవరికి', 'யாருக்கு'], to],
    [['^upi', '^vpa', '^handle'], upi],
    [['^from', 'खाता', 'ఖాతా', 'கணக்கு'], from],
  ]) {
    if (!found) continue;
    for (const d of details) {
      if (needles.some((n) => new RegExp(n, 'i').test(d.label || ''))) usedLabels.add(d.label);
    }
  }
  const extras = details.filter((d) => !usedLabels.has(d.label));

  const recipientName = to || '';
  const initials = recipientName ? initialsOf(recipientName) : '₹';
  const avatar = recipientName ? avatarColor(recipientName) : accent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
      className="rounded-2xl bg-white/90 backdrop-blur-xl ring-2 ring-bank-gold/25 shadow-xl overflow-hidden"
    >
      {/* Header: tinted banner + tiny label */}
      <div
        className="px-4 pt-3 pb-2"
        style={{ background: `linear-gradient(135deg, ${accent}1A 0%, ${accent}08 100%)` }}
      >
        <div
          className="text-[10px] uppercase tracking-[0.12em] font-bold"
          style={{ color: accent }}
        >
          {L.confirmTitle}
        </div>
      </div>

      {/* Hero amount */}
      {amount && (
        <div className="px-4 pt-3 pb-1 text-center">
          <div className="text-[28px] leading-none font-extrabold text-ink tracking-tight">
            {amount}
          </div>
        </div>
      )}

      {/* Recipient row */}
      {recipientName && (
        <div className="px-4 pt-3 pb-3 flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[14px] font-bold shrink-0 shadow-sm"
            style={{ background: avatar }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-ink truncate">{recipientName}</div>
            {upi && <div className="text-[11px] text-muted truncate">{upi}</div>}
          </div>
        </div>
      )}

      {/* From account + any extras */}
      {(from || extras.length > 0) && (
        <div className="mx-4 mb-3 rounded-xl bg-page/70 border border-divider/60 px-3 py-2 flex flex-col gap-1.5">
          {from && (
            <div className="flex items-start justify-between gap-3 text-[12px]">
              <div className="text-muted">From</div>
              <div className="text-ink font-medium text-right truncate max-w-[60%]">{from}</div>
            </div>
          )}
          {extras.map((d, i) => (
            <div key={i} className="flex items-start justify-between gap-3 text-[12px]">
              <div className="text-muted">{d.label}</div>
              <div className="text-ink font-medium text-right truncate max-w-[60%]">{d.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="px-3 pb-3 pt-1 flex gap-2">
        <button
          onClick={onCancel}
          className="press flex-1 py-3 rounded-xl bg-page border border-divider text-ink text-[13px] font-semibold"
        >
          {L.cancel}
        </button>
        <button
          onClick={onConfirm}
          className="press flex-[1.4] py-3 rounded-xl text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 shadow-sm"
          style={{ background: accent }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          {L.confirm}
        </button>
      </div>
    </motion.div>
  );
}
