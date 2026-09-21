/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#166534',
          emerald: '#047857',
          mint: '#10b981',
          light: '#dcfce7',
          dark: '#0f172a',
          bg: '#f4fbf7',
        },
        primary: {
          DEFAULT: '#166534',
          hover: '#14532d',
          active: '#052e16',
          container: '#047857',
          'on-container': '#ffffff',
          fixed: '#dcfce7',
        },
        secondary: {
          DEFAULT: '#047857',
          hover: '#065f46',
          container: '#dcfce7',
          'on-container': '#064e3b',
        },
        tertiary: {
          DEFAULT: '#10b981',
          container: '#064e3b',
          'on-container': '#dcfce7',
        },
        surface: {
          DEFAULT: '#f4fbf7',
          dim: '#e2f5ea',
          bright: '#ffffff',
          container: '#dcfce7',
          'container-low': '#f0fdf4',
          'container-lowest': '#ffffff',
          'container-high': '#c7f9d4',
          'container-highest': '#bbf7d0',
        },
        'on-surface': {
          DEFAULT: '#0f172a',
          variant: '#1e293b',
        },
        outline: {
          DEFAULT: '#a7f3d0',
          variant: '#cbd5e1',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
          'on-container': '#93000a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'sm': '0.125rem',
        'DEFAULT': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
      }
    },
  },
  plugins: [],
}
