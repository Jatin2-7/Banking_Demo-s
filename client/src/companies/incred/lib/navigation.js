/** InCred navigation — speech + agent destination → UI view. */

export function resolveIncredNavigation(destination, _context = '') {
  const d = String(destination || '').toLowerCase().replace(/-/g, '_');
  if (d === 'personal_loan' || d === 'apply_loan' || d === 'loan_application') {
    return { view: 'loan' };
  }
  if (d === 'my_loans' || d === 'loans') return { view: 'dashboard', tab: 'loans' };
  if (d === 'profile') return { view: 'dashboard', tab: 'profile' };
  if (d === 'home' || d === 'dashboard') return { view: 'dashboard', tab: 'home' };
  return { view: 'dashboard', tab: 'home' };
}

export function inferIncredDestination(text = '') {
  const t = String(text).toLowerCase();
  if (/apply|personal\s*loan|start\s*loan|get\s*loan|loan\s*application/.test(t)) return 'personal_loan';
  if (/my\s*loans|track\s*loan|loan\s*status/.test(t)) return 'my_loans';
  if (/\bprofile\b|my\s*account/.test(t)) return 'profile';
  if (/go\s*home|back\s*home|dashboard/.test(t)) return 'home';
  return null;
}
