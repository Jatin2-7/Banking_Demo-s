/** EaseMyTrip — Bharat ka Travel App demo with voice concierge. */

export const easemytripConfig = {
  id: 'easemytrip',
  slug: 'easemytrip',
  name: 'EaseMyTrip',
  shortName: 'EMT',
  platform: 'mobile',
  standalone: true,
  voiceEnabled: true,
  status: 'active',
  description:
    'EaseMyTrip mobile app — flights, hotels, forex cash & cards with AI voice concierge for hands-free booking.',
  theme: {
    primary: '#0A8FDC',
    primaryDark: '#0968B3',
    accent: '#E8751A',
    cream: '#F5F7FA',
    ink: '#1A1A1A',
    phoneShadow: '0 30px 60px rgba(10, 143, 220, 0.25), inset 0 0 0 1.5px rgba(255,255,255,0.06)',
  },
  assets: { logo: null, banner: null },
  agents: {
    home: 'easemytrip_home_assistant',
    forex: 'easemytrip_forex_assistant',
    visa: 'easemytrip_visa_assistant',
    airport: 'easemytrip_airport_assistant',
    loanLos: 'easemytrip_forex_assistant',
  },
  journeys: ['home', 'forex-cash', 'visa', 'airport-services', 'flights', 'hotels'],
  homeVariant: 'easemytrip',
};
