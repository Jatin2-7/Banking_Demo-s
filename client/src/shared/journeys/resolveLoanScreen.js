import AbcdPersonalLoanScreen from '../../companies/abcd/loan/AbcdPersonalLoanScreen.jsx';
import LoanApplicationScreen from '../../components/LoanApplicationScreen.jsx';

const LOAN_SCREENS = {
  abcd: AbcdPersonalLoanScreen,
  dcb: LoanApplicationScreen,
  'indian-bank': LoanApplicationScreen,
};

/** @param {{ homeVariant?: string }} company */
export function resolveLoanScreen(company) {
  return LOAN_SCREENS[company?.homeVariant] ?? AbcdPersonalLoanScreen;
}
