/**
 * Shared journey catalogue — same flows across all company demos.
 * Company folders provide UI skins; journeys provide behaviour + AGUI wiring.
 */
export const JOURNEYS = {
  home: {
    id: 'home',
    label: 'Home',
    description: 'Main dashboard with quick actions and AI concierge.',
  },
  loan: {
    id: 'loan',
    label: 'Personal Loan',
    description: 'Loan application and EMI calculators.',
  },
  deposit: {
    id: 'deposit',
    label: 'Create Deposit',
    description: 'Fixed deposit and recurring deposit flows.',
  },
  'fund-transfer': {
    id: 'fund-transfer',
    label: 'Fund Transfer',
    description: 'IMPS / NEFT fund transfer with voice assist.',
  },
  'txn-history': {
    id: 'txn-history',
    label: 'Transaction History',
    description: 'Account statement and transaction filters.',
  },
  upi: {
    id: 'upi',
    label: 'UPI Payment',
    description: 'Voice-powered UPI payment saga.',
  },
  hotel: {
    id: 'hotel',
    label: 'Hotel Booking',
    description: 'Travel — hotel search and booking demo.',
  },
  flight: {
    id: 'flight',
    label: 'Flight Booking',
    description: 'Travel — flight search and booking demo.',
  },
  'debit-card': {
    id: 'debit-card',
    label: 'Debit Card',
    description: 'Debit card dashboard and controls.',
  },
  'credit-card': {
    id: 'credit-card',
    label: 'Credit Card',
    description: 'Credit card dashboard and controls.',
  },
};

/** @param {string} journeyId */
export function getJourney(journeyId) {
  return JOURNEYS[journeyId] ?? null;
}
