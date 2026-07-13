import React from 'react';
import { useCompany } from '../../context/CompanyContext.jsx';
import { AbcdAppHeader } from '../../companies/abcd/AbcdHeader.jsx';
import { DcbAppHeader } from '../../companies/dcb/DcbHeader.jsx';
import { IndianBankAppHeader } from '../../companies/indian-bank/IndianBankHeader.jsx';

const APP_HEADERS = {
  abcd: AbcdAppHeader,
  dcb: DcbAppHeader,
  'indian-bank': IndianBankAppHeader,
};

/** Company-branded app header for shared journey screens (deposit, statements, etc.). */
export function CompanyAppHeader(props) {
  const company = useCompany();
  const Header = APP_HEADERS[company.homeVariant] ?? AbcdAppHeader;
  return <Header {...props} />;
}
