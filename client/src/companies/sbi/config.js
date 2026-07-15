/** SBI YONO — company profile */

export const sbiConfig = {
  id: 'sbi',
  slug: 'sbi',
  name: 'SBI YONO',
  shortName: 'SBI',
  platform: 'mobile',
  status: 'active',
  description: 'SBI YONO mobile banking — home loan application and credit card PIN change demo.',
  theme: {
    primary: '#7B2D8E',
    primaryDark: '#5A1F6B',
    accent: '#E91E8C',
    cream: '#F8F4FA',
    ink: '#2D2D2D',
    phoneShadow: '0 30px 60px rgba(123, 45, 142, 0.22), inset 0 0 0 1.5px rgba(255,255,255,0.06)',
  },
  assets: {
    logo: null,
    banner: null,
  },
  agents: {
    home: 'sbi_home_assistant',
    loanLos: 'sbi_home_loan',
  },
  journeys: ['home', 'loan', 'credit-card'],
  homeVariant: 'sbi',
};
