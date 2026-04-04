/** @type {import('tailwindcss').Config} */
/** Aero-Lab tactical UI tokens (aligned with Google Stitch exports in docs/stitch-aerolab). */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
        headline: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        label: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        aero: '0px',
      },
      colors: {
        surface: '#f7f9fc',
        surfaceRaised: '#eceef1',
        surfaceContainer: '#ffffff',
        surfaceContainerLow: '#f2f4f7',
        surfaceDim: '#e6e8eb',
        border: '#c2c6d4',
        accent: '#00478d',
        accentMuted: '#a9c7ff',
        accentGreen: '#1b5e20',
        accentSecondary: '#ab3600',
        figmaBg: '#f7f9fc',
        figmaAccent: '#00478d',
        onSurface: '#191c1e',
        muted: '#424752',
        mutedLight: '#727783',
      },
    },
  },
  plugins: [],
};
