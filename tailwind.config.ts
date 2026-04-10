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
        bg: '#FDF6F0',
        surface: '#FFF8F3',
        primary: '#C97D6E',
        'primary-dark': '#A85F52',
        secondary: '#E8C4B0',
        accent: '#8B4A6B',
        text: '#3D2B2B',
        'text-muted': '#8A6A6A',
        border: '#E5D0C5',
        error: '#C0392B',
        success: '#5D8A5E',
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'serif'],
        sans: ['var(--font-dm-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
