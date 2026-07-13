import CompanyDemoApp from './CompanyDemoApp.jsx';
import StandaloneCompanyApp from './StandaloneCompanyApp.jsx';

const APPS = {
  banking: CompanyDemoApp,
  standalone: StandaloneCompanyApp,
};

/** @param {{ standalone?: boolean }} company */
export function resolveCompanyApp(company) {
  if (company?.standalone) return StandaloneCompanyApp;
  return CompanyDemoApp;
}
