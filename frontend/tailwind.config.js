/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', 

  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out',
        scaleIn: 'scaleIn 0.2s ease-out',
      }
    },
  },
  plugins: [],
};