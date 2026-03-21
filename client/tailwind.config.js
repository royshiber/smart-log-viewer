/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0d1117',
        surfaceRaised: '#161b22',
        border: '#30363d',
        accent: '#58a6ff',
        accentGreen: '#3fb950',
        figmaBg: '#0b0e14',
        figmaAccent: '#3b82f6',
      },
    },
  },
  plugins: [],
};
