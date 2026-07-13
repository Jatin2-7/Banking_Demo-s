/**
 * Template — copy this folder to companies/{slug}/ when onboarding a new client.
 *
 * Steps:
 * 1. Copy companies/_template/ → companies/{slug}/
 * 2. Fill in config.js (name, theme, platform, agents)
 * 3. Import in companies/registry.js
 * 4. Build UI components from screenshots in this folder
 */

export const templateConfig = {
  id: 'company-slug',
  slug: 'company-slug',
  name: 'Company Full Name',
  shortName: 'Short',
  platform: 'mobile', // 'mobile' | 'web'
  status: 'wip', // 'active' | 'wip' | 'legacy'
  description: 'One-line description for the demo hub.',
  theme: {
    primary: '#003366',
    primaryDark: '#002244',
    accent: '#F5C518',
    cream: '#F0F4F8',
    ink: '#1A1A1A',
    phoneShadow: '0 30px 60px rgba(0, 51, 102, 0.25), inset 0 0 0 1.5px rgba(255,255,255,0.06)',
  },
  assets: {
    logo: null,
    banner: null,
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
  ],
  homeVariant: 'company-slug',
};
