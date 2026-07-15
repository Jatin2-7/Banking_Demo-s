import React from 'react';
import { INCRED } from '../theme.js';

export default function IncredLogo({ size = 'md', onDark = false }) {
  const textSize = size === 'sm' ? 'text-[15px]' : 'text-[18px]';
  return (
    <span className={`inline-flex items-baseline font-bold ${textSize}`}>
      <span style={{ color: INCRED.orange }}>InCred</span>
      <span className="text-[0.55em] font-normal" style={{ color: onDark ? 'rgba(255,255,255,0.85)' : INCRED.blue }}>
        finance
      </span>
    </span>
  );
}
