/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        kidpro: {
          forest: '#275A4E',
          deep: '#1E4D40',
          gold: '#E5A93C',
          mint: '#78C2AD',
        },
        forest: {
          DEFAULT: '#275A4E',
          deep: '#1E4D40',
          light: '#367566',
          soft: '#EAF4F1',
        },
        gold: {
          DEFAULT: '#E5A93C',
          light: '#FDF6E9',
          dark: '#CF9127',
        },
        mint: {
          DEFAULT: '#78C2AD',
          light: '#EBF7F4',
          dark: '#5AA792',
        },
        brand: {
          50: '#eef2ff',
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
      },
    },
  },
  plugins: [],
}
