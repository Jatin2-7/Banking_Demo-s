import React, { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { getCompanyBySlug } from '../companies/registry.js';
import { CompanyProvider } from '../context/CompanyContext.jsx';
import { resolveCompanyApp } from '../shared/app/resolveCompanyApp.js';

export default function CompanyRoute() {
  const { companyId } = useParams();
  const company = getCompanyBySlug(companyId);
  const CompanyApp = resolveCompanyApp(company);

  useEffect(() => {
    if (company) {
      document.title = company.standalone
        ? `${company.name} — Loan Application`
        : `${company.name} — Voice Demo`;
    }
  }, [company]);

  if (!company) {
    return <Navigate to="/" replace />;
  }

  return (
    <CompanyProvider company={company}>
      <CompanyApp />
    </CompanyProvider>
  );
}
