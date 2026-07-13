import AbcdHomeScreen from '../../companies/abcd/HomeScreen.jsx';
import DcbHomeScreen from '../../companies/dcb/HomeScreen.jsx';
import IndianBankHomeScreen from '../../companies/indian-bank/HomeScreen.jsx';
import OptimoHomeScreen from '../../companies/optimo-capital/HomeScreen.jsx';

const HOME_SCREENS = {
  abcd: AbcdHomeScreen,
  dcb: DcbHomeScreen,
  'indian-bank': IndianBankHomeScreen,
  'optimo-capital': OptimoHomeScreen,
};

/** @param {{ homeVariant?: string }} company */
export function resolveHomeScreen(company) {
  return HOME_SCREENS[company?.homeVariant] ?? AbcdHomeScreen;
}
