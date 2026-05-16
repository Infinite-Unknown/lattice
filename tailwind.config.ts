import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseDot: {
          '0%, 80%, 100%': { opacity: '0.35', transform: 'scale(0.85)' },
          '40%':           { opacity: '1',    transform: 'scale(1.1)'  },
        },
        drawLine: {
          '0%':   { strokeDashoffset: '40' },
          '60%':  { strokeDashoffset: '0'  },
          '100%': { strokeDashoffset: '0'  },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0'  },
        },
        gradientDrift: {
          '0%, 100%': { backgroundPosition: '0% 50%'   },
          '50%':      { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'fade-in-up':     'fadeInUp 500ms ease-out both',
        'fade-in':        'fadeIn 400ms ease-out both',
        'scale-in':       'scaleIn 200ms ease-out both',
        'pulse-dot':      'pulseDot 1.4s ease-in-out infinite',
        'draw-line':      'drawLine 1.8s ease-in-out infinite',
        'shimmer':        'shimmer 2s linear infinite',
        'gradient-drift': 'gradientDrift 18s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
