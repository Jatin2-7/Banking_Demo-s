/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#3D2666',
          dark: '#1E1035',
          light: '#5B3D8A',
        },
        bank: {
          purple: '#2D1B4E',
          purpleMid: '#3D2666',
          purpleDeep: '#1a0f2e',
          panel: '#241538',
          gold: '#F5C518',
          goldDark: '#C9A227',
          nav: '#0d0d12',
        },
        accent: '#F5C518',
        success: '#00875A',
        page: '#F5F6FA',
        ink: '#1A1A2E',
        muted: '#6B7280',
        divider: '#E5E7EB',
      },
      boxShadow: {
        card: '0 6px 18px rgba(14, 36, 84, 0.08)',
        bankCard: '0 8px 24px rgba(0, 0, 0, 0.35)',
        goldGlow: '0 0 0 1px rgba(245, 197, 24, 0.45), 0 12px 32px rgba(0, 0, 0, 0.4)',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
