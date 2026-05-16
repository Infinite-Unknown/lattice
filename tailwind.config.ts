import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Bold Typography palette. Tokens are the single source of truth —
        // every page should reach for these, never raw hex.
        background:        '#0A0A0A',
        foreground:        '#FAFAFA',
        muted:             '#1A1A1A',
        'muted-foreground':'#737373',
        accent:            '#FF3D00',
        'accent-foreground':'#0A0A0A',
        border:            '#262626',
        input:             '#1A1A1A',
        card:              '#0F0F0F',
        'card-foreground': '#FAFAFA',
        ring:              '#FF3D00',
        'border-hover':    '#404040',
      },
      fontFamily: {
        sans:    ['"Inter Tight"', '"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      fontSize: {
        xs:    ['0.75rem',  { lineHeight: '1.5' }],
        sm:    ['0.875rem', { lineHeight: '1.5' }],
        base:  ['1rem',     { lineHeight: '1.6' }],
        lg:    ['1.125rem', { lineHeight: '1.6' }],
        xl:    ['1.25rem',  { lineHeight: '1.4' }],
        '2xl': ['1.5rem',   { lineHeight: '1.3' }],
        '3xl': ['2rem',     { lineHeight: '1.2' }],
        '4xl': ['2.5rem',   { lineHeight: '1.1' }],
        '5xl': ['3.5rem',   { lineHeight: '1.05' }],
        '6xl': ['4.5rem',   { lineHeight: '1.02' }],
        '7xl': ['6rem',     { lineHeight: '1' }],
        '8xl': ['8rem',     { lineHeight: '0.95' }],
        '9xl': ['10rem',    { lineHeight: '0.9' }],
      },
      letterSpacing: {
        tighter: '-0.06em',
        tight:   '-0.04em',
        normal:  '-0.01em',
        wide:    '0.05em',
        wider:   '0.1em',
        widest:  '0.2em',
      },
      lineHeight: {
        none:    '1',
        tight:   '1.1',
        snug:    '1.25',
        normal:  '1.6',
        relaxed: '1.75',
      },
      borderRadius: {
        // Sharp edges everywhere. Existing rounded-* classes resolve to 0.
        none: '0',
        sm:   '0',
        DEFAULT: '0',
        md:   '0',
        lg:   '0',
        xl:   '0',
        '2xl':'0',
        '3xl':'0',
        full: '9999px',   // kept for circular dots, badges, persona chip
      },
      transitionTimingFunction: {
        crisp: 'cubic-bezier(0.25, 0, 0, 1)',
      },
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
        underlineGrow: {
          '0%':   { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      animation: {
        // Tighter than before — Bold Typography prefers crisp motion.
        'fade-in-up':     'fadeInUp 350ms cubic-bezier(0.25, 0, 0, 1) both',
        'fade-in':        'fadeIn 200ms cubic-bezier(0.25, 0, 0, 1) both',
        'scale-in':       'scaleIn 200ms cubic-bezier(0.25, 0, 0, 1) both',
        'pulse-dot':      'pulseDot 1.4s ease-in-out infinite',
        'draw-line':      'drawLine 1.8s ease-in-out infinite',
        'shimmer':        'shimmer 2s linear infinite',
        'gradient-drift': 'gradientDrift 18s ease-in-out infinite',
        'underline-grow': 'underlineGrow 200ms cubic-bezier(0.25, 0, 0, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
