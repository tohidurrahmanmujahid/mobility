/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#1b5b40',
          darker: '#0e321e',
          forest: '#0d3a27',
        },
        neutral: {
          beige: '#d2cbb8',
          light: '#ebe7dc',
        },
        accent: {
          gold: '#b39a5b',
          teal: '#4ab7a7',
        }
      },
      fontFamily: {
        rubriker: ['Helvetica Neue', 'Arial', 'sans-serif'],
        underrubriker: ['Open Sans', 'sans-serif'],
        'text-primary': ['Playfair Display', 'serif'],
        'text-secondary': ['Cormorant Garamond', 'serif'],
      },
      fontSize: {
        'rubriker': ['2rem', { lineHeight: '2.5rem', fontWeight: '700' }],
        'rubriker-sm': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        'underrubriker': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '500' }],
        'underrubriker-sm': ['1rem', { lineHeight: '1.5rem', fontWeight: '500' }],
      }
    },
  },
  plugins: [],
}