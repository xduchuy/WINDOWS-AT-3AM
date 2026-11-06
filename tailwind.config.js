/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        noir: {
          950: '#04070d',
          900: '#080e18',
          800: '#101a2b',
          700: '#1c2b42',
          amber: '#f5a642',
          tungsten: '#ff9636',
          crimson: '#e0483e',
          teal: '#4fd1a5',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Courier New"', 'monospace'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
