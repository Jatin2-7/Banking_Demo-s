import React from 'react';
import { ACCOUNTS as FALLBACK_ACCOUNTS, CONTACTS, avatarColor, initialsOf } from '../data/mock.js';
import { t, STRINGS } from '../i18n/strings.js';

function ActionTile({ icon, label, sublabel, onClick, color = '#1A237E' }) {
  return (
    <button
      onClick={onClick}
      className="press flex flex-col items-center justify-center gap-1 py-3 px-2 bg-white rounded-2xl shadow-card border border-divider/60 hover:border-brand/30 transition"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg"
        style={{ background: color }}
      >
        {icon}
      </div>
      <div className="text-[12px] font-semibold text-ink leading-tight">{label}</div>
      {sublabel && <div className="text-[10px] text-muted leading-tight">{sublabel}</div>}
    </button>
  );
}

export default function HomeScreen({ lang, onMicTap, onQuickAction, accounts }) {
  const L = STRINGS[lang] || STRINGS.en;
  // Server is the source of truth for balances; fall back to static mock data
  // only on the first paint before /api/mock/accounts resolves.
  const liveAccounts = accounts && accounts.length ? accounts : FALLBACK_ACCOUNTS;
  const totalBalance = liveAccounts.reduce((s, a) => s + a.balance, 0);
  const recents = CONTACTS.slice(0, 6);

  return (
    <div className="px-4 pt-3 pb-28 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center font-bold text-[11px] tracking-tight">
            IB
          </div>
          <div>
            <div className="text-[15px] font-bold text-ink leading-none">{L.appName}</div>
            <div className="text-[11px] text-muted">{L.appTagline}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted">
          <button className="w-8 h-8 rounded-full bg-white border border-divider flex items-center justify-center text-xs">
            🔔
          </button>
          <button className="w-8 h-8 rounded-full bg-white border border-divider flex items-center justify-center text-xs">
            👤
          </button>
        </div>
      </div>

      {/* Balance card */}
      <div
        className="rounded-2xl p-4 text-white shadow-card relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0E2454 0%,#16367E 60%,#1F4FA8 100%)' }}
      >
        <div className="text-[11px] uppercase tracking-wider opacity-80">Total balance</div>
        <div className="text-[26px] font-bold mt-1">₹{totalBalance.toLocaleString('en-IN')}</div>
        <div className="mt-2 flex gap-2 text-[11px] opacity-90">
          {liveAccounts.map((a) => (
            <span key={a.id} className="px-2 py-0.5 rounded-full bg-white/15">
              {a.label}: ₹{a.balance.toLocaleString('en-IN')}
            </span>
          ))}
        </div>
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/5"></div>
      </div>

      {/* Quick actions */}
      <div>
        <div className="text-[11px] uppercase tracking-wider text-muted font-semibold mb-2">
          {L.quickActions}
        </div>
        <div className="grid grid-cols-5 gap-2">
          <ActionTile
            icon="↗"
            label={L.pay}
            color="#0E2454"
            onClick={() => onQuickAction('send_money')}
          />
          <ActionTile
            icon="⇄"
            label={L.transfer}
            color="#1F4FA8"
            onClick={() => onQuickAction('internal_transfer')}
          />
          <ActionTile
            icon="⚡"
            label={L.bills}
            color="#E2231A"
            onClick={() => onQuickAction('pay_bill')}
          />
          <ActionTile
            icon="✈"
            label="Flight"
            color="#0077B6"
            onClick={() => onQuickAction('book_flight')}
          />
          <ActionTile
            icon="📊"
            label="Balance"
            color="#00875A"
            onClick={() => onQuickAction('check_balance')}
          />
        </div>
      </div>

      {/* Recents */}
      <div>
        <div className="text-[11px] uppercase tracking-wider text-muted font-semibold mb-2">
          Recents
        </div>
        <div className="grid grid-cols-4 gap-3">
          {recents.map((c) => (
            <div key={c.id} className="flex flex-col items-center gap-1">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[13px] font-semibold"
                style={{ background: avatarColor(c.name) }}
              >
                {initialsOf(c.name)}
              </div>
              <div className="text-[10px] text-ink text-center leading-tight truncate w-full">
                {c.name.split(' ')[0]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sample utterances strip */}
      <div className="mt-1">
        <div className="text-[11px] uppercase tracking-wider text-muted font-semibold mb-2">
          Try saying
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {L.samples.map((s) => (
            <span
              key={s}
              className="shrink-0 text-[11px] px-3 py-1.5 rounded-full bg-white border border-divider text-muted"
            >
              "{s}"
            </span>
          ))}
        </div>
      </div>

      {/* Mic CTA */}
      <button
        onClick={onMicTap}
        className="press mt-2 mx-auto flex items-center gap-2 px-5 py-3 rounded-full text-white"
        style={{
          background: 'linear-gradient(135deg,#E2231A,#F25C55)',
          boxShadow: '0 10px 30px rgba(226,35,26,0.4)',
        }}
      >
        <span className="text-lg">🎙</span>
        <span className="text-[13px] font-semibold">{L.micCta}</span>
      </button>
    </div>
  );
}
