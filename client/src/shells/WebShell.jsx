import React from 'react';
import { useCompany } from '../context/CompanyContext.jsx';

/** Web app shell — full-width layout for desktop banking portals. */
export default function WebShell({ children, overlay }) {
  const company = useCompany();

  return (
    <div
      className="flex min-h-screen w-full items-start justify-center py-6"
      style={{
        background: `linear-gradient(160deg, ${company.theme.primary}18 0%, #f8fafc 45%, #f1f5f9 100%)`,
      }}
    >
      <div className="relative flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        {children}
        {overlay}
      </div>
    </div>
  );
}
