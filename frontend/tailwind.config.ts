import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        // Charte ESCOM : bleu + or, AUCUN noir pur
        escom: {
          blue: {
            50: '#eef4ff',
            100: '#dbe6ff',
            200: '#bfd1ff',
            300: '#93b3ff',
            400: '#608bfb',
            500: '#3a66f5',
            600: '#1d4ed8',  // primary
            700: '#1d3fb0',
            800: '#1e3792',
            900: '#1e3370',
            950: '#172554',
          },
          gold: {
            50: '#fdfaf0',
            100: '#fbf2d3',
            200: '#f7e3a3',
            300: '#f0cb66',
            400: '#e9b53a',
            500: '#d4af37',  // primary gold
            600: '#b8901f',
            700: '#946e1c',
            800: '#7a5a1f',
            900: '#674b1d',
          },
          neutral: {
            50: '#fafafb',
            100: '#f4f4f6',
            200: '#e5e5ea',
            300: '#d2d2d9',
            400: '#a1a1ad',
            500: '#71717f',
            600: '#52525e',
            700: '#3f3f4a',
            800: '#27272f',  // remplace le noir
            900: '#1c1c24',  // gris très foncé, jamais 100% noir
          },
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#1d4ed8',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#d4af37',
          foreground: '#1c1c24',
        },
        muted: {
          DEFAULT: '#f4f4f6',
          foreground: '#52525e',
        },
        accent: {
          DEFAULT: '#fbf2d3',
          foreground: '#7a5a1f',
        },
        destructive: {
          DEFAULT: '#dc2626',
          foreground: '#ffffff',
        },
        border: '#e5e5ea',
        input: '#e5e5ea',
        ring: '#1d4ed8',
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'gradient': 'gradient 8s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backgroundImage: {
        'escom-gradient': 'linear-gradient(135deg, #1d4ed8 0%, #1e3370 100%)',
        'escom-gold-gradient': 'linear-gradient(135deg, #d4af37 0%, #b8901f 100%)',
        'hero-pattern': "linear-gradient(135deg, rgba(29,78,216,0.95) 0%, rgba(30,51,112,0.92) 100%)",
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
