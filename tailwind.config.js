/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/views/**/*.{hbs,html}',
    './src/**/*.{js,ts}',
    './public/js/**/*.{js,ts}',
    './*.{js,ts}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        primary: '#10B981',
        secondary: '#3B82F6',
        accent: '#F59E0B'
      }
    },
  },
  plugins: [],
}

