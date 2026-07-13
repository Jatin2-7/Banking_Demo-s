/** Aditya Birla Capital (ABCD) — company profile for the demo platform. */

export const abcdConfig = {
  id: 'abcd',
  slug: 'abcd',
  name: 'Aditya Birla Capital',
  shortName: 'ABCD',
  platform: 'mobile',
  status: 'active',
  description: 'ABCD mobile app — home, loans, deposits, fund transfer, and voice concierge.',
  theme: {
    primary: '#C41E24',
    primaryDark: '#A8181E',
    accent: '#F5C518',
    cream: '#F7F0E8',
    ink: '#1A1A1A',
    phoneShadow: '0 30px 60px rgba(120, 20, 24, 0.28), inset 0 0 0 1.5px rgba(255,255,255,0.06)',
  },
  assets: {
    logo: null,
    banner: null,
  },
  agents: {
    home: 'indian_bank_home_assistant',
    loan: 'abcd_personal_loan',
    imps: 'indian_bank_imps_transfer',
    deposit: 'indian_bank_deposit',
    txnHistory: 'indian_bank_txn_history',
    loanLos: 'indian_bank_loan_los',
  },
  journeys: [
    'home',
    'loan',
    'deposit',
    'fund-transfer',
    'txn-history',
    'upi',
    'hotel',
    'flight',
    'debit-card',
    'credit-card',
  ],
  homeVariant: 'abcd',
};
