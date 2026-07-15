/** Indian Bank — original demo company profile. */

export const indianBankConfig = {
  id: 'indian-bank',
  slug: 'indian-bank',
  name: 'Indian Bank',
  shortName: 'Indian Bank',
  platform: 'mobile',
  status: 'active',
  description:
    'Indian Bank voice demo — purple/gold home, UPI, IMPS, deposits, and transaction history.',
  theme: {
    primary: '#003366',
    primaryDark: '#002244',
    accent: '#F5C518',
    cream: '#F0F4F8',
    ink: '#0A0A2E',
    phoneShadow: '0 30px 60px rgba(0, 51, 102, 0.25), inset 0 0 0 1.5px rgba(255,255,255,0.06)',
  },
  assets: {
    logo: null,
    banner: '/indian-bank-banner.png',
  },
  agents: {
    home: 'indian_bank_home_assistant',
    loan: 'indian_bank_loan_los',
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
  homeVariant: 'indian-bank',
};
