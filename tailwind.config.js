/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/views/**/*.{hbs,html}',
    './src/**/*.{js,ts}',
    './public/js/**/*.{js,ts}',
    './*.{js,ts}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        primary: '#10B981',
        secondary: '#3B82F6',
        accent: '#F59E0B'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}

