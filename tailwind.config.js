/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brown: {
          400: '#8B4513',
          600: '#654321',
          800: '#3B2506',
        },
      },
    },
  },
  plugins: [],
};