import React from 'react';
import IncredLogo from './IncredLogo.jsx';
import { INCRED } from '../theme.js';

/** Unified blue header for loan journey — extends through status bar area. */
export function IncredLoanHeader({ onBack, onHome, showHome = true }) {
  return (
    <div className="-mt-11 shrink-0 pt-11" style={{ backgroundColor: INCRED.blue }}>
      <div className="px-4 py-3">
        <div className="flex items-center">
          <button
            type="button"
            onClick={onBack}
            className="press mr-3 text-white"
            aria-label="Back"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-[15px] font-semibold text-white pr-8">
            InCred Personal Loans
          </h1>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 pb-2.5 pt-0.5">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="press text-white/80" aria-label="Back">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <IncredLogo size="sm" onDark />
        </div>
        {showHome && (
          <button
            type="button"
            onClick={onHome}
            className="press flex items-center gap-1 text-[13px] font-medium"
            style={{ color: INCRED.orange }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={INCRED.orange}>
              <path d="M3 11l9-7 9 7v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" />
            </svg>
            Home
          </button>
        )}
      </div>
    </div>
  );
}

/** @deprecated Use IncredLoanHeader instead. */
export function IncredLoanAppBar({ onBack }) {
  return (
    <div className="shrink-0 px-4 py-3" style={{ backgroundColor: INCRED.blue }}>
      <div className="flex items-center">
        <button type="button" onClick={onBack} className="press mr-3 text-white" aria-label="Back">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="flex-1 text-center text-[15px] font-semibold text-white pr-8">
          InCred Personal Loans
        </h1>
      </div>
    </div>
  );
}

/** White sub-header with logo + home link. */
export function IncredSubHeader({ onBack, onHome, showHome = true, onBlue = false }) {
  if (onBlue) {
    return (
      <div
        className="flex shrink-0 items-center justify-between px-3 py-2.5"
        style={{ backgroundColor: INCRED.blue }}
      >
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="press text-white/80" aria-label="Back">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <IncredLogo size="sm" onDark />
        </div>
        {showHome && (
          <button
            type="button"
            onClick={onHome}
            className="press flex items-center gap-1 text-[13px] font-medium"
            style={{ color: INCRED.orange }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={INCRED.orange}>
              <path d="M3 11l9-7 9 7v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" />
            </svg>
            Home
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center justify-between border-b border-incred-border bg-white px-3 py-2.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="press text-incred-muted"
          aria-label="Back"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <IncredLogo size="sm" />
      </div>
      {showHome && (
        <button
          type="button"
          onClick={onHome}
          className="press flex items-center gap-1 text-[13px] font-medium"
          style={{ color: INCRED.orange }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={INCRED.orange}>
            <path d="M3 11l9-7 9 7v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" />
          </svg>
          Home
        </button>
      )}
    </div>
  );
}

/** Simple header for home dashboard. */
export function IncredHomeHeader() {
  return (
    <div className="shrink-0 border-b border-incred-border bg-white px-4 py-3">
      <IncredLogo />
    </div>
  );
}
