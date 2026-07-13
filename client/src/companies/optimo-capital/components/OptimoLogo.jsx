import React from 'react';

/**
 * Official OPTIMO CAPITAL wordmark — uses the exact brand asset (no SVG recreation).
 * @param {{ className?: string }} props
 */
export default function OptimoLogo({ className = '' }) {
  return (
    <img
      src="/companies/optimo-logo.png"
      alt="Optimo Capital"
      className={`block w-auto object-contain object-left ${className}`}
      style={{
        height: 80,
        width: 'auto',
      }}
      draggable={false}
    />
  );
}
