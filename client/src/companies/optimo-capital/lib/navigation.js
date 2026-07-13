/** Map AGUI navigate_to destinations to Optimo views */
export const OPTIMO_DESTINATIONS = {
  dashboard: 'dashboard',
  lap_application: 'lap',
  lap_balance_transfer: 'lap',
  lap_top_up: 'lap',
  check_eligibility: 'emi',
  emi_calculator: 'emi',
};

export function resolveOptimoNavigation(destination, context = '') {
  const dest = String(destination || '').toLowerCase();
  if (dest === 'lap_balance_transfer') return { view: 'lap', product: 'balance_transfer' };
  if (dest === 'lap_top_up') return { view: 'lap', product: 'top_up' };
  if (dest === 'lap_application' || dest === 'loan_application') return { view: 'lap', product: 'lap' };
  if (dest === 'check_eligibility' || dest === 'emi_calculator') return { view: 'dashboard', scrollTo: 'emi' };
  if (dest === 'dashboard' || dest === 'home') return { view: 'dashboard' };
  return { view: 'lap', product: 'lap' };
}

/** Dashboard EMI calculator state for AGUI sync */
export function emiToAgentState(emi) {
  return {
    screen: 'dashboard',
    loan_amount: emi.loanAmount || '',
    interest_rate: emi.interestRate || '',
    tenure_years: emi.tenureYears || '',
  };
}

export function agentStateToEmiPatch(values) {
  const patch = {};
  if (values.loan_amount != null) patch.loanAmount = String(values.loan_amount).replace(/[^\d]/g, '');
  if (values.interest_rate != null) patch.interestRate = String(values.interest_rate).replace(/[^\d.]/g, '');
  if (values.tenure_years != null) patch.tenureYears = String(values.tenure_years);
  return patch;
}
