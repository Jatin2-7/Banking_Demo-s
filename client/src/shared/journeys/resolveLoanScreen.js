import AbcdPersonalLoanScreen from '../../companies/abcd/loan/AbcdPersonalLoanScreen.jsx';
import DcbGoldLoanScreen from '../../companies/dcb/loan/DcbGoldLoanScreen.jsx';
import LoanApplicationScreen from '../../components/LoanApplicationScreen.jsx';
import SbiHomeLoanScreen from '../../companies/sbi/loan/SbiHomeLoanScreen.jsx';

const LOAN_SCREENS = {
  abcd: AbcdPersonalLoanScreen,
  dcb: DcbGoldLoanScreen,
  'indian-bank': LoanApplicationScreen,
  sbi: SbiHomeLoanScreen,
};

/** @param {{ homeVariant?: string }} company */
export function resolveLoanScreen(company) {
  return LOAN_SCREENS[company?.homeVariant] ?? AbcdPersonalLoanScreen;
}
