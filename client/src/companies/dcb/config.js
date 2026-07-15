/** DCB Bank — company profile */

export const dcbConfig = {
  id: 'dcb',
  slug: 'dcb',
  name: 'DCB Bank',
  shortName: 'DCB',
  platform: 'mobile',
  status: 'active',
  description:
    'DCB mobile banking — navy/light-blue home, service grid, voice concierge, and shared journeys.',
  theme: {
    primary: '#1A237E',
    primaryDark: '#0D1642',
    accent: '#B3D4FC',
    cream: '#F5F8FF',
    ink: '#1A237E',
    phoneShadow: '0 30px 60px rgba(26, 35, 126, 0.22), inset 0 0 0 1.5px rgba(255,255,255,0.06)',
  },
  assets: {
    logo: null,
    banner: null,
  },
  agents: {
    home: 'indian_bank_home_assistant',
    loan: 'dcb_gold_loan',
    imps: 'indian_bank_imps_transfer',
    deposit: 'indian_bank_deposit',
    txnHistory: 'indian_bank_txn_history',
    loanLos: 'dcb_gold_loan',
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
  homeVariant: 'dcb',
};
