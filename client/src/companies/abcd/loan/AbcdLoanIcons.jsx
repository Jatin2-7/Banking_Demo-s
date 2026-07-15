import React from 'react';

export function IconInstantDisbursal() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M18 3L8 17h8l-2 12 12-18h-8l2-8z"
        fill="url(#boltGrad)"
        stroke="#E65100"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="boltGrad" x1="8" y1="3" x2="22" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFB74D" />
          <stop offset="1" stopColor="#FF7043" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconNoPaperwork() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M8 6h12l6 6v16a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z"
        fill="#FCE4EC"
        stroke="#C2185B"
        strokeWidth="1.2"
      />
      <path d="M20 6v6h6" stroke="#C2185B" strokeWidth="1.2" strokeLinejoin="round" />
      <path
        d="M10 16h12M10 20h9M10 24h7"
        stroke="#E91E63"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <ellipse cx="22" cy="10" rx="5" ry="3" fill="#F8BBD9" stroke="#C2185B" strokeWidth="0.8" />
    </svg>
  );
}

export function IconRoi() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="11" fill="#FCE4EC" stroke="#C2185B" strokeWidth="1.2" />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fill="#C41E24"
        fontSize="14"
        fontWeight="800"
        fontFamily="Roboto, sans-serif"
      >
        %
      </text>
    </svg>
  );
}

export function IconLoanAmount() {
  return (
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden>
      <circle cx="20" cy="22" r="10" fill="#FFE082" />
      <path d="M14 14c2-4 10-4 12 0" stroke="#8D6E63" strokeWidth="2" fill="none" />
      <text x="20" y="26" textAnchor="middle" fill="#E65100" fontSize="12" fontWeight="800">
        ₹
      </text>
    </svg>
  );
}

export function IconTenure() {
  return (
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect
        x="8"
        y="10"
        width="24"
        height="22"
        rx="3"
        fill="#E3F2FD"
        stroke="#1565C0"
        strokeWidth="1.2"
      />
      <path d="M8 16h24" stroke="#1565C0" strokeWidth="1.2" />
      <rect x="12" y="6" width="4" height="6" rx="1" fill="#1565C0" />
      <rect x="24" y="6" width="4" height="6" rx="1" fill="#1565C0" />
      <circle cx="20" cy="24" r="4" fill="#FF7043" />
    </svg>
  );
}

export function IconRateTag() {
  return (
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden>
      <path d="M8 8h14l10 10v14H8V8z" fill="#FFF3E0" stroke="#EF6C00" strokeWidth="1.2" />
      <circle cx="14" cy="14" r="3" fill="#EF6C00" />
      <text x="26" y="30" textAnchor="middle" fill="#E65100" fontSize="11" fontWeight="800">
        %
      </text>
    </svg>
  );
}

export function IconProcessingFee() {
  return (
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect
        x="10"
        y="8"
        width="20"
        height="26"
        rx="2"
        fill="#ECEFF1"
        stroke="#546E7A"
        strokeWidth="1.2"
      />
      <path
        d="M14 16h12M14 21h12M14 26h8"
        stroke="#78909C"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="28" cy="28" r="6" fill="#FFD54F" stroke="#F9A825" strokeWidth="0.8" />
    </svg>
  );
}

export function IconEmiCalc() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="8" y="10" width="32" height="28" rx="4" fill="#7E57C2" />
      <rect x="12" y="14" width="24" height="8" rx="2" fill="#B39DDB" />
      <rect x="12" y="26" width="6" height="6" rx="1" fill="#FFD54F" />
      <rect x="21" y="26" width="6" height="6" rx="1" fill="#FFD54F" />
      <rect x="30" y="26" width="6" height="6" rx="1" fill="#FF7043" />
      <circle cx="36" cy="12" r="5" fill="#FFD54F" stroke="#F9A825" strokeWidth="0.8" />
    </svg>
  );
}
