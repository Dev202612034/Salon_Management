/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#07090e',
          900: '#0d131f',
          850: '#131b2e',
          800: '#1b253f',
          700: '#2b3b61',
          600: '#405485',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Rich Amber
          600: '#d97706', // Warm Amber Bronze
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        bronze: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-gold': 'pulseGold 2s infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'barber-scroll': 'barberScroll 20s linear infinite',
      },
      keyframes: {
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 18px rgba(245, 158, 11, 0.4)' },
          '50%': { boxShadow: '0 0 38px rgba(217, 119, 6, 0.9)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        barberScroll: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '100px 0' },
        },
      },
    },
  },
  plugins: [],
}
