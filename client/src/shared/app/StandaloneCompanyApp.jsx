import React from 'react';
import { useCompany } from '../../context/CompanyContext.jsx';
import { resolveHomeScreen } from '../home/resolveHomeScreen.js';
import CompanyShell from '../../shells/CompanyShell.jsx';
import StandaloneWebShell from '../../shells/StandaloneWebShell.jsx';
import OptimoHomeScreen from '../../companies/optimo-capital/HomeScreen.jsx';

/** Lightweight app shell for standalone company demos (web full-viewport or mobile phone frame). */
export default function StandaloneCompanyApp() {
  const company = useCompany();
  const HomeScreen =
    company.slug === 'optimo-capital' ? OptimoHomeScreen : resolveHomeScreen(company);

  if (company.platform === 'mobile') {
    return (
      <CompanyShell>
        <HomeScreen />
      </CompanyShell>
    );
  }

  return (
    <StandaloneWebShell>
      <HomeScreen />
    </StandaloneWebShell>
  );
}
