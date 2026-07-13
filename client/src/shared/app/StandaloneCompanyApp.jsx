import React from 'react';
import { useCompany } from '../../context/CompanyContext.jsx';
import { resolveHomeScreen } from '../home/resolveHomeScreen.js';
import StandaloneWebShell from '../../shells/StandaloneWebShell.jsx';
import OptimoHomeScreen from '../../companies/optimo-capital/HomeScreen.jsx';

/** Lightweight app shell for standalone web company demos. */
export default function StandaloneCompanyApp() {
  const company = useCompany();
  const HomeScreen = company.slug === 'optimo-capital' ? OptimoHomeScreen : resolveHomeScreen(company);

  return (
    <StandaloneWebShell>
      <HomeScreen />
    </StandaloneWebShell>
  );
}
