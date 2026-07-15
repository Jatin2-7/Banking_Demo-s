import React from 'react';
import { EmtForexHeader } from '../components/EmtHeader.jsx';
import { EMT } from '../theme.js';
import { CURRENCIES } from './forexJourney.js';

function FloatingActions() {
  return (
    <div className="fixed right-3 top-1/2 z-20 flex flex-col gap-3">
      <button
        type="button"
        className="flex h-11 w-11 items-center justify-center rounded-full shadow-lg press"
        style={{ backgroundColor: EMT.black }}
        aria-label="Call"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.3 0 .7-.2 1L6.6 10.8z" />
        </svg>
      </button>
      <button
        type="button"
        className="flex h-11 w-11 items-center justify-center rounded-full shadow-lg press"
        style={{ backgroundColor: EMT.black }}
        aria-label="WhatsApp"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </button>
    </div>
  );
}

function HeroBanner() {
  return (
    <div
      className="relative mx-3 -mt-1 overflow-hidden rounded-t-2xl"
      style={{
        background: 'linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)',
        minHeight: '8rem',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
      <div className="relative px-4 py-5">
        <p className="text-[16px] font-bold leading-snug text-white">
          Swap your anxiety with Excitement
        </p>
        <p className="mt-1 text-[12px] text-white/90">Money that travels with you...</p>
        <div className="mt-3 flex gap-3">
          {['Forex Card', 'Currency Notes', 'Send Money'].map((label) => (
            <div key={label} className="flex items-center gap-1 rounded bg-white/20 px-2 py-1">
              <span className="text-[8px] text-white">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CurrencyFlag({ code }) {
  const cur = CURRENCIES.find((c) => c.code === code);
  return <span className="text-lg">{cur?.flag || '💱'}</span>;
}

export default function ForexCashScreen({
  form,
  onChange,
  onBack,
  onOrderNow,
  onRegisterToolHandler,
}) {
  const tabs = [
    { id: 'forex_card', label: 'Forex Card' },
    { id: 'currency', label: 'Currency' },
    { id: 'send_money', label: 'Send Money' },
  ];

  const isCard = form.activeTab === 'forex_card';
  const rate = isCard
    ? 96.4144
    : { USD: 97.02, EUR: 89.5, GBP: 103.2, AED: 26.45, SGD: 75.36 }[form.foreignCurrency] || 97.02;

  const toolHandler = React.useCallback(
    (name, args) => {
      if (name === 'set_field' || name === 'select_option') {
        const field = args.field;
        const value = args.value;
        const patch = {};
        const fieldMap = {
          city: 'city',
          foreign_currency: 'foreignCurrency',
          foreign_amount: 'foreignAmount',
          inr_amount: 'inrAmount',
          transaction_type: 'transactionType',
          card_action: 'cardAction',
          active_tab: 'activeTab',
          card_type: 'cardType',
          mobile: 'mobile',
          email: 'email',
          otp: 'otp',
        };
        const key = fieldMap[field] || field;
        patch[key] = value;
        onChange(patch);
      } else if (name === 'click_button') {
        const btn = args.button;
        if (btn === 'order_now') onOrderNow?.();
        else if (btn === 'proceed' || btn === 'confirm_order') onOrderNow?.();
      } else if (name === 'navigate_tab') {
        onChange({ activeTab: args.tab });
      }
    },
    [onChange, onOrderNow],
  );

  React.useEffect(() => {
    onRegisterToolHandler?.(toolHandler);
  }, [toolHandler, onRegisterToolHandler]);

  const updateForeignAmount = (val) => {
    const amt = val.replace(/[^\d.]/g, '');
    const inr = String(Math.round(parseFloat(amt || 0) * rate));
    onChange({ foreignAmount: amt, inrAmount: inr });
  };

  const updateInrAmount = (val) => {
    const amt = val.replace(/[^\d.]/g, '');
    const foreign = String(Math.round((parseFloat(amt || 0) / rate) * 100) / 100);
    onChange({ inrAmount: amt, foreignAmount: foreign });
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-emt-page">
      <EmtForexHeader onBack={onBack} />
      <div className="shrink-0">
        <div className="flex items-center justify-between bg-white px-4 py-2">
          <div className="flex items-center gap-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill={EMT.blue}>
              <path d="M2 12L22 4L14 22L11 13L2 12Z" />
            </svg>
            <span className="text-[11px] font-bold" style={{ color: EMT.blue }}>
              EaseMyTrip
            </span>
          </div>
          <span className="text-[11px] font-bold text-emt-ink">
            GlobalPay <span className="text-[9px] font-normal text-emt-muted">wsfx</span>
          </span>
        </div>
        <HeroBanner />
      </div>

      <div className="mx-3 -mt-2 flex-1 overflow-y-auto rounded-t-2xl bg-white shadow-sm">
        <div className="flex border-b border-emt-borderLight">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange({ activeTab: tab.id })}
              className="flex-1 py-3 text-center text-[12px] font-semibold press"
              style={{
                color: form.activeTab === tab.id ? EMT.ink : EMT.muted,
                borderBottom:
                  form.activeTab === tab.id ? `2px solid ${EMT.black}` : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {form.activeTab === 'send_money' ? (
            <div className="py-12 text-center">
              <p className="text-[14px] font-semibold text-emt-ink">Send Money Abroad</p>
              <p className="mt-2 text-[12px] text-emt-muted">Coming soon in this demo.</p>
            </div>
          ) : form.activeTab === 'forex_card' ? (
            <>
              <div className="mb-4 flex gap-6">
                {['load', 'cashout'].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 press">
                    <input
                      type="radio"
                      checked={form.cardAction === opt}
                      onChange={() => onChange({ cardAction: opt })}
                      className="accent-black"
                    />
                    <span className="text-[13px] font-medium capitalize text-emt-ink">{opt}</span>
                  </label>
                ))}
              </div>
              <label className="mb-4 block">
                <span className="mb-1 block text-[11px] text-emt-muted">Select Card</span>
                <select
                  value={form.cardType}
                  onChange={(e) => onChange({ cardType: e.target.value })}
                  className="w-full rounded-lg border border-emt-border px-3 py-2.5 text-[13px]"
                >
                  <option>GlobalPay Smart Switch Card</option>
                  <option>GlobalPay Multi-Currency Card</option>
                </select>
              </label>
              <p className="mb-1 text-[11px] font-medium text-emt-ink">You Pay</p>
              <div className="mb-3 flex gap-0 overflow-hidden rounded-lg border border-emt-border">
                <div className="flex items-center gap-1 border-r border-emt-border bg-gray-50 px-3 py-2.5">
                  <span>🇮🇳</span>
                  <span className="text-[13px] font-semibold">INR</span>
                </div>
                <input
                  type="text"
                  value={form.inrAmount}
                  onChange={(e) => updateInrAmount(e.target.value)}
                  className="flex-1 px-3 py-2.5 text-[14px] outline-none"
                />
              </div>
              <p className="mb-1 text-[11px] font-medium text-emt-ink">You Load</p>
              <div className="mb-2 flex gap-0 overflow-hidden rounded-lg border border-emt-border">
                <select
                  value={form.foreignCurrency}
                  onChange={(e) => onChange({ foreignCurrency: e.target.value })}
                  className="flex items-center gap-1 border-r border-emt-border bg-gray-50 px-2 py-2.5 text-[13px]"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={form.foreignAmount}
                  onChange={(e) => updateForeignAmount(e.target.value)}
                  className="flex-1 px-3 py-2.5 text-[14px] outline-none"
                />
              </div>
              <p className="mb-4 text-right text-[10px] text-emt-muted">
                Inter Bank Rate: 1 {form.foreignCurrency} = ₹ 96.4144
              </p>
            </>
          ) : (
            <>
              <div className="mb-4 flex gap-6">
                {['buy', 'sell'].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 press">
                    <input
                      type="radio"
                      checked={form.transactionType === opt}
                      onChange={() => onChange({ transactionType: opt })}
                      className="accent-black"
                    />
                    <span className="text-[13px] font-medium capitalize text-emt-ink">{opt}</span>
                  </label>
                ))}
              </div>
              <label className="mb-4 block">
                <span className="mb-1 block text-[11px] text-emt-muted">Select City</span>
                <select
                  value={form.city}
                  onChange={(e) => onChange({ city: e.target.value })}
                  className="w-full rounded-lg border border-emt-border px-3 py-2.5 text-[13px]"
                >
                  {['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <p className="mb-1 text-[11px] font-medium text-emt-ink">You Get</p>
              <div className="mb-1 flex gap-0 overflow-hidden rounded-lg border border-emt-border">
                <select
                  value={form.foreignCurrency}
                  onChange={(e) => onChange({ foreignCurrency: e.target.value })}
                  className="border-r border-emt-border bg-gray-50 px-2 py-2.5 text-[13px]"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={form.foreignAmount}
                  onChange={(e) => updateForeignAmount(e.target.value)}
                  className="flex-1 px-3 py-2.5 text-[14px] outline-none"
                />
              </div>
              <p className="mb-3 text-right text-[10px] text-emt-muted">
                1 {form.foreignCurrency} = ₹ {rate}
              </p>
              <p className="mb-1 text-[11px] font-medium text-emt-ink">You Pay</p>
              <div className="mb-2 flex gap-0 overflow-hidden rounded-lg border border-emt-border">
                <div className="flex items-center gap-1 border-r border-emt-border bg-gray-50 px-3 py-2.5">
                  <span>🇮🇳</span>
                  <span className="text-[13px] font-semibold">INR</span>
                </div>
                <input
                  type="text"
                  value={form.inrAmount}
                  onChange={(e) => updateInrAmount(e.target.value)}
                  className="flex-1 px-3 py-2.5 text-[14px] outline-none"
                />
              </div>
              <p
                className="mb-4 flex items-center justify-end gap-1 text-[10px]"
                style={{ color: EMT.blue }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emt-red" />
                Live Exchange Rates
              </p>
            </>
          )}

          {form.activeTab !== 'send_money' && (
            <>
              <button
                type="button"
                onClick={onOrderNow}
                className="w-full rounded-full py-3.5 text-[14px] font-semibold text-white press"
                style={{ backgroundColor: EMT.black }}
              >
                Order Now
              </button>
              <p className="mt-2 flex items-center justify-center gap-1 text-[9px] text-emt-muted">
                *Plus Government taxes and charges as applicable
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-emt-muted text-[8px]">
                  i
                </span>
              </p>
              {isCard && (
                <p className="mt-3 text-center text-[11px] text-emt-muted">
                  Existing Customer? <span style={{ color: EMT.blue }}>Login</span>
                </p>
              )}
            </>
          )}
        </div>
      </div>
      <FloatingActions />
    </div>
  );
}
