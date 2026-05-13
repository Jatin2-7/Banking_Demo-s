/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0E2454',
          dark: '#06173B',
          light: '#1F4FA8',
        },
        accent: '#E2231A',
        success: '#00875A',
        page: '#F5F6FA',
        ink: '#1A1A2E',
        muted: '#6B7280',
        divider: '#E5E7EB',
      },
      boxShadow: {
        card: '0 6px 18px rgba(14, 36, 84, 0.08)',
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
