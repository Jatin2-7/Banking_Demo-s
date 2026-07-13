import React, { useState } from 'react';
import OptimoLogo from '../OptimoLogo.jsx';
import { OPTIMO, FONTS, DASHBOARD_MAX_W } from '../../theme.js';

const NAV_ITEMS = [
  { label: 'Products', hasMenu: true },
  { label: 'Company', hasMenu: true },
  { label: 'Locations' },
  { label: 'Reseller' },
  { label: 'Resources', hasMenu: true },
];

function ChevronDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function DashboardHeader({ onCheckEligibility, onApplyLoan }) {
  const [openMenu, setOpenMenu] = useState(null);

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-[0_1px_0_#ECEEF2]">
      <div
        className="mx-auto flex items-center justify-between gap-4 px-5 py-4 lg:px-8"
        style={{ maxWidth: DASHBOARD_MAX_W, fontFamily: FONTS.body }}
      >
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="shrink-0">
          <OptimoLogo className="!h-[56px] sm:!h-[64px]" />
        </button>

        <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              className="flex items-center gap-1 text-[15px] font-medium transition hover:text-[#F15A29]"
              style={{ color: OPTIMO.navy }}
              onClick={() => item.hasMenu && setOpenMenu(openMenu === item.label ? null : item.label)}
            >
              {item.label}
              {item.hasMenu && <ChevronDown />}
            </button>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onCheckEligibility}
            className="hidden rounded-full border-2 px-4 py-2 text-[13px] font-semibold transition hover:bg-[#FFF6F2] sm:block sm:px-5 sm:text-[14px]"
            style={{ borderColor: OPTIMO.orange, color: OPTIMO.orange }}
          >
            Check Eligibility
          </button>
          <button
            type="button"
            onClick={onApplyLoan}
            className="flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_4px_14px_rgba(241,90,41,0.35)] transition hover:brightness-105 sm:px-5 sm:text-[14px]"
            style={{ backgroundColor: OPTIMO.orange }}
          >
            <WhatsAppIcon />
            <span className="hidden sm:inline">Apply for Loan *</span>
            <span className="sm:hidden">Apply *</span>
          </button>
        </div>
      </div>
    </header>
  );
}
