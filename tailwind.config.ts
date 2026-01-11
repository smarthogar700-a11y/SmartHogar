import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0B0B0B',
        'dark-card': '#2B2B2B',
        'gold': '#C9A24D',
        'gold-bright': '#E6C87A',
        'text-primary': '#FFFFFF',
        'text-secondary': '#D9D9D9',
        'shadow-warm': '#5A4A2F',
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'btn': '14px',
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(201, 162, 77, 0.3)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
}
export default config
