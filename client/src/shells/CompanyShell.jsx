import React from 'react';
import { useCompany } from '../context/CompanyContext.jsx';
import MobileShell from './MobileShell.jsx';
import WebShell from './WebShell.jsx';

/** Picks mobile or web shell based on the active company config. */
export default function CompanyShell({ children, overlay }) {
  const company = useCompany();
  const Shell = company.platform === 'web' ? WebShell : MobileShell;
  return <Shell overlay={overlay}>{children}</Shell>;
}
