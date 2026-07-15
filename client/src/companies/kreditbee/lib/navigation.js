/** Map AG-UI navigate_to destinations to KreditBee app views. */

const LOAN_DEST_TO_PRODUCT = {
  personal_loan: 'personal',
  business_loan: 'business',
  two_wheeler_loan: 'two_wheeler',
  lap: 'lap',
};

/** Infer destination from user + assistant text when the model forgets navigate_to. */
export function inferKreditbeeDestination(userText = '', assistantText = '') {
  const t = `${userText} ${assistantText}`.toLowerCase();
  if (/personal\s*loan|apply.*personal/.test(t)) return 'personal_loan';
  if (/business\s*loan|apply.*business/.test(t)) return 'business_loan';
  if (/two[\s-]?wheeler|2[\s-]?wheeler/.test(t)) return 'two_wheeler_loan';
  if (/loan against property|\blap\b|property loan/.test(t)) return 'lap';
  if (
    /continue.*(application|kyc)|resume.*(application|kyc)|complete.*kyc|relationship manager|arm_onboarding/.test(
      t,
    )
  ) {
    return 'arm_onboarding';
  }
  if (/\bdocuments\b/.test(t)) return 'documents';
  if (/\bexplore\b/.test(t)) return 'explore';
  if (/\bupi\b/.test(t)) return 'kreditbee_upi';
  if (/go home|back to (home|dashboard)/.test(t)) return 'home';
  if (/redirect.*personal|opening personal/.test(t)) return 'personal_loan';
  if (/redirect.*business|opening business/.test(t)) return 'business_loan';
  if (/redirect.*two[\s-]?wheeler|opening two/.test(t)) return 'two_wheeler_loan';
  return null;
}

/**
 * @param {string} destination
 * @param {string} [context]
 * @returns {{ view: 'dashboard' | 'arm', product?: string, tab?: string }}
 */
export function resolveKreditbeeNavigation(destination, context = '') {
  const dest = String(destination || '').toLowerCase();
  const ctx = String(context || '').toLowerCase();

  if (dest === 'home' || dest === 'dashboard') {
    return { view: 'dashboard', tab: 'home' };
  }

  if (
    dest === 'arm_onboarding' ||
    dest === 'kyc' ||
    dest === 'continue_application' ||
    dest === 'ai_relationship_manager'
  ) {
    const product = ctx.includes('personal')
      ? 'personal'
      : ctx.includes('business')
        ? 'business'
        : ctx.includes('lap')
          ? 'lap'
          : 'two_wheeler';
    return { view: 'arm', product };
  }

  if (LOAN_DEST_TO_PRODUCT[dest]) {
    return { view: 'arm', product: LOAN_DEST_TO_PRODUCT[dest] };
  }

  if (dest === 'kreditbee_upi') {
    return { view: 'dashboard', tab: 'home' };
  }

  if (dest === 'documents') {
    return { view: 'dashboard', tab: 'documents' };
  }

  if (dest === 'explore') {
    return { view: 'dashboard', tab: 'explore' };
  }

  return { view: 'dashboard', tab: 'home' };
}

export const LOAN_PRODUCTS = {
  personal: {
    id: 'personal',
    title: 'Personal Loan',
    amount: 'UP TO ₹10,00,000',
    tenure: '60 months',
    tag: 'Instant transfer',
    accent: '#E3F2FD',
    accentBorder: '#90CAF9',
    icon: 'coin',
  },
  business: {
    id: 'business',
    title: 'Business Loan',
    amount: 'UP TO ₹1 Crore',
    tenure: '84 months',
    tag: 'Business only',
    accent: '#E8F5E9',
    accentBorder: '#A5D6A7',
    icon: 'briefcase',
  },
  two_wheeler: {
    id: 'two_wheeler',
    title: 'Two Wheeler Loan',
    amount: 'UP TO ₹5,00,000',
    tenure: '48 months',
    tag: 'Low interest',
    accent: '#F3E5F5',
    accentBorder: '#CE93D8',
    icon: 'bike',
    inProgress: true,
  },
  lap: {
    id: 'lap',
    title: 'Loan Against Property',
    amount: 'Flexible tenure up to 20 years',
    tenure: '',
    tag: 'Flexible tenure',
    accent: '#E0F2F1',
    accentBorder: '#80CBC4',
    icon: 'home',
  },
};
