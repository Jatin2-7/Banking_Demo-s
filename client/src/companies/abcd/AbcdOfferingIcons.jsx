import React from 'react';

export function IconDigitalGold() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden>
      <rect x="8" y="22" width="10" height="14" rx="2" fill="#FFD54F" />
      <rect x="19" y="18" width="10" height="18" rx="2" fill="#FFC107" />
      <rect x="30" y="24" width="10" height="12" rx="2" fill="#FFB300" />
      <rect x="10" y="20" width="6" height="2" rx="1" fill="#FFF8E1" opacity="0.8" />
    </svg>
  );
}

export function IconMutualFunds() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden>
      <path
        d="M24 8c-6 0-10 4-10 8 0 3 2 5 5 6l-1 14h12l-1-14c3-1 5-3 5-6 0-4-4-8-10-8z"
        fill="#8D6E63"
      />
      <ellipse cx="24" cy="36" rx="10" ry="3" fill="#A1887F" />
      <path d="M24 14v8M20 18h8" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="12" r="4" fill="#66BB6A" />
    </svg>
  );
}

export function IconPersonalLoan() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden>
      <path d="M14 16c0-4 4-6 10-6s10 2 10 6v18H14V16z" fill="#D7CCC8" />
      <path d="M18 12c2-3 6-4 10-3" stroke="#8D6E63" strokeWidth="2" fill="none" />
      <text x="24" y="30" textAnchor="middle" fontSize="14" fontWeight="700" fill="#795548">
        ₹
      </text>
    </svg>
  );
}

export function IconMotorInsurance() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden>
      <rect x="8" y="22" width="28" height="12" rx="4" fill="#E53935" />
      <rect x="12" y="18" width="20" height="8" rx="3" fill="#EF5350" />
      <circle cx="14" cy="34" r="4" fill="#424242" />
      <circle cx="34" cy="34" r="4" fill="#424242" />
      <path d="M26 14l6 4H20l6-4z" fill="#43A047" />
    </svg>
  );
}

export function IconHealthInsurance() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden>
      <path d="M24 6l14 8v12c0 10-14 16-14 16S10 36 10 26V14l14-8z" fill="#FFCDD2" />
      <path d="M24 18v12M18 24h12" stroke="#C62828" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function IconGoldLoan() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden>
      <rect x="16" y="20" width="16" height="10" rx="2" fill="#FFC107" />
      <path d="M14 30h20l-2 8H16l-2-8z" fill="#FFB300" />
      <rect x="20" y="14" width="8" height="8" rx="1" fill="#FFD54F" />
    </svg>
  );
}

export function IconDigitalSilver() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden>
      <ellipse cx="24" cy="28" rx="14" ry="6" fill="#B0BEC5" />
      <ellipse cx="24" cy="24" rx="14" ry="6" fill="#CFD8DC" />
      <ellipse cx="24" cy="20" rx="14" ry="6" fill="#ECEFF1" />
    </svg>
  );
}

export function IconHomeLoan() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden>
      <path d="M24 8L8 22h4v16h24V22h4L24 8z" fill="#FFCC80" />
      <rect x="20" y="26" width="8" height="12" fill="#8D6E63" />
      <rect x="14" y="22" width="6" height="6" fill="#81D4FA" />
      <rect x="28" y="22" width="6" height="6" fill="#81D4FA" />
    </svg>
  );
}

export function IconGoldCoin() {
  return (
    <svg viewBox="0 0 48 48" width="36" height="36" aria-hidden>
      <circle cx="24" cy="24" r="16" fill="#FFC107" />
      <circle cx="24" cy="24" r="12" fill="#FFD54F" />
      <text x="24" y="29" textAnchor="middle" fontSize="14" fontWeight="700" fill="#F57F17">
        ₹
      </text>
    </svg>
  );
}

const ICON_MAP = {
  digitalGold: IconDigitalGold,
  mutualFunds: IconMutualFunds,
  personalLoan: IconPersonalLoan,
  motorInsurance: IconMotorInsurance,
  healthInsurance: IconHealthInsurance,
  goldLoan: IconGoldLoan,
  digitalSilver: IconDigitalSilver,
  homeLoan: IconHomeLoan,
};

export function AbcdOfferingIcon({ name }) {
  const Cmp = ICON_MAP[name];
  return Cmp ? <Cmp /> : null;
}
