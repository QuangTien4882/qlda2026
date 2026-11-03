/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#090d16',
          surface: '#0f172a',
          card: '#161f36',
          border: '#232f4e',
          hover: '#1e2d4d',
          active: '#273861',
        },
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcdaff',
          300: '#8ec2ff',
          400: '#599eff',
          500: '#327bf7',
          600: '#1d5feb',
          700: '#164ac9',
          800: '#173da2',
          900: '#18367f',
          950: '#11224f',
        },
      },
      fontFamily: {
        'be-vietnam': ['"Be Vietnam Pro"', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

