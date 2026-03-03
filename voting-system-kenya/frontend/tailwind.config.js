/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        kenya: {
          green: '#1D4A2A',
          red: '#B22234',
          black: '#000000',
        },
      },
    },
  },
  plugins: [],
};
