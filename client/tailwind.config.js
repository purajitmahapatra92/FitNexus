/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        gray: {
          150: '#eceef2',
          750: '#2d3040',
          850: '#1c1c24',
          950: '#0c0c0f',
        },
      },
      fontFamily: {
        sans: ['Inter','system-ui','sans-serif'],
      },
      boxShadow: {
        card:      '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-md': '0 4px 12px 0 rgb(0 0 0 / 0.08)',
        'card-lg': '0 8px 24px 0 rgb(0 0 0 / 0.1)',
        'brand':   '0 4px 12px 0 rgb(99 102 241 / 0.3)',
        'inner':   'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      transitionTimingFunction: {
        'bounce-sm': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out both',
        'slide-up':   'slideUp 0.25s ease-out both',
        'slide-down': 'slideDown 0.2s ease-out both',
        'scale-in':   'scaleIn 0.15s ease-out both',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
};