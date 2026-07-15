/** InCred Finance — personal loan mobile demo with voice bot. */

export const incredConfig = {
  id: 'incred',
  slug: 'incred',
  name: 'InCred Finance',
  shortName: 'InCred',
  platform: 'mobile',
  standalone: true,
  voiceEnabled: true,
  status: 'active',
  description:
    'InCred Finance mobile app — personal loan application with multi-step KYC and AI voice assistant.',
  theme: {
    primary: '#004A99',
    primaryDark: '#003366',
    accent: '#F37021',
    cream: '#FFF5EE',
    ink: '#333333',
    phoneShadow: '0 30px 60px rgba(0, 0, 0, 0.25), inset 0 0 0 1.5px rgba(255,255,255,0.06)',
  },
  assets: { logo: null, banner: null },
  agents: {
    home: 'incred_home_assistant',
    loan: 'incred_personal_loan',
    loanLos: 'incred_personal_loan',
  },
  journeys: ['home', 'personal-loan'],
  homeVariant: 'incred',
};
