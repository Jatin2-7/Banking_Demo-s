import React, { createContext, useContext } from 'react';

const CompanyContext = createContext(null);

/** @param {{ company: import('../companies/registry.js').COMPANIES[number], children: React.ReactNode }} props */
export function CompanyProvider({ company, children }) {
  return <CompanyContext.Provider value={company}>{children}</CompanyContext.Provider>;
}

/** Active company config — must be used inside CompanyProvider. */
export function useCompany() {
  const company = useContext(CompanyContext);
  if (!company) {
    throw new Error('useCompany must be used within CompanyProvider');
  }
  return company;
}

/** Optional company config — safe outside a company route (returns null). */
export function useCompanyOptional() {
  return useContext(CompanyContext);
}
