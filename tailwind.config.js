import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-figtree)", "Figtree", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        neutral: {
          '01': '#F7F7F7',
          '02': '#EBEBEB',
          '03': '#DDDDDD',
          '04': '#D3D3D3',
          '05': '#C2C2C2',
          '06': '#B0B0B0',
          '07': '#717171',
          '08': '#5E5E5E',
        },
        primary: {
          DEFAULT: '#00269F',
          '01': '#E6EDFF',
          '02': '#99AEFF',
          '03': '#4D76E6',
          '04': '#1A4ACC',
          '05': '#00269F',
          '06': '#001F7A',
          '07': '#001856',
          '08': '#001133',
        },
        secondary: {
          DEFAULT: '#33D9B7',
          '01': '#E6FFFA',
          '02': '#ADFCEC',
          '03': '#79F5DC',
          '04': '#50EACB',
          '05': '#33D9B7',
          '06': '#20C0A0',
          '07': '#14A285',
          '08': '#0D8069',
        },
        tertiary: {
          DEFAULT: '#6E33DB',
          '01': '#EEE6FF',
          '02': '#C8ADFC',
          '03': '#A479F5',
          '04': '#8650EB',
          '05': '#6E33DB',
          '06': '#5A20C4',
          '07': '#4814A7',
          '08': '#380E87',
        },
        quaternary: {
          DEFAULT: '#2C4DBA',
          '01': '#E6EBFF',
          '02': '#ABBDF9',
          '03': '#7491ED',
          '04': '#4A6BD8',
          '05': '#2C4DBA',
          '06': '#17338E',
          '07': '#0B1C57',
          '08': '#03081A',
        },
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
}

module.exports = config;