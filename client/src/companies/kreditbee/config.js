/** KreditBee — AI Relationship Manager onboarding journey (mobile demo). */

export const kreditbeeConfig = {
  id: 'kreditbee',
  slug: 'kreditbee',
  name: 'KreditBee',
  shortName: 'KreditBee',
  platform: 'mobile',
  standalone: true,
  voiceEnabled: true,
  status: 'active',
  description:
    'KreditBee mobile app — loan dashboard, progress tracker, and AI Relationship Manager KYC with voice bot.',
  theme: {
    primary: '#FFC107',
    primaryDark: '#F5A623',
    accent: '#FFC107',
    cream: '#FFF8E1',
    ink: '#1A1A1A',
    phoneShadow: '0 30px 60px rgba(0, 0, 0, 0.25), inset 0 0 0 1.5px rgba(255,255,255,0.06)',
  },
  assets: {
    logo: null,
    banner: null,
  },
  agents: {
    home: 'kreditbee_home_assistant',
    loan: 'kreditbee_arm_assistant',
    loanLos: 'kreditbee_arm_assistant',
  },
  journeys: ['home', 'arm-onboarding'],
  homeVariant: 'kreditbee',
};
