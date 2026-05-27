/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fbf9eb',
          100: '#f4eea8',
          200: '#edd863',
          300: '#e5bf1f',
          400: '#c5a013',
          500: '#a4810b',
          600: '#846206',
          700: '#644403',
          800: '#442801',
          900: '#261200',
          DEFAULT: '#d4af37',
        },
        navy: {
          50: '#f0f3fa',
          100: '#dbe2f3',
          200: '#bdcaeb',
          300: '#8ea5df',
          400: '#597ad0',
          500: '#3455be',
          600: '#253f9e',
          700: '#1e3280',
          800: '#1b2c69',
          900: '#10193b',
          950: '#0b1026',
          DEFAULT: '#0b1026',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
