/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1A237E',
          dark: '#0D1642',
          light: '#3949AB',
        },
        bank: {
          purple: '#1A237E',
          purpleMid: '#283593',
          purpleDeep: '#0D1642',
          panel: '#E8EAF6',
          gold: '#FFD600',
          goldDark: '#F9A825',
          nav: '#1A237E',
        },
        dcb: {
          navy: '#1A237E',
          header: '#B3D4FC',
          yellow: '#FFD600',
          pink: '#F8E8E0',
          voice: '#7C4DFF',
          debit: '#D32F2F',
          credit: '#388E3C',
          page: '#F5F7FA',
        },
        accent: '#FFD600',
        success: '#388E3C',
        page: '#F5F7FA',
        ink: '#1A237E',
        muted: '#757575',
        divider: '#E5E7EB',
      },
      boxShadow: {
        card: '0 6px 18px rgba(14, 36, 84, 0.08)',
        bankCard: '0 8px 24px rgba(0, 0, 0, 0.35)',
        goldGlow: '0 0 0 1px rgba(245, 197, 24, 0.45), 0 12px 32px rgba(0, 0, 0, 0.4)',
      },
      fontFamily: {
        sans: [
          'Roboto',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
