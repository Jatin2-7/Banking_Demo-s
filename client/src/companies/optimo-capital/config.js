/** Optimo Capital — Loan Against Property web application */

export const optimoCapitalConfig = {
  id: 'optimo-capital',
  slug: 'optimo-capital',
  name: 'Optimo Capital',
  shortName: 'Optimo',
  platform: 'web',
  standalone: true,
  voiceEnabled: true,
  status: 'active',
  description:
    'Optimo Capital — LAP dashboard, EMI calculator, and lead application with voice assistant.',
  theme: {
    primary: '#E85D3B',
    primaryDark: '#D84315',
    accent: '#FF8A65',
    cream: '#FFF5F0',
    ink: '#1B2B4B',
    phoneShadow: 'none',
  },
  assets: {
    logo: null,
    banner: null,
  },
  contact: {
    phone: '8904069302',
    phoneDisplay: '(8904069302)',
  },
  agents: {
    home: 'optimo_home_assistant',
    lap: 'optimo_lap',
    loan: 'optimo_lap',
    imps: 'indian_bank_imps_transfer',
    deposit: 'indian_bank_deposit',
    txnHistory: 'indian_bank_txn_history',
    loanLos: 'optimo_lap',
  },
  journeys: ['dashboard', 'lap-application', 'emi-calculator'],
  homeVariant: 'optimo-capital',
};
