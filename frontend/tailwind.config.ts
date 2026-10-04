import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — resolve to CSS variables so one class works in both
        // themes (bg-surface, border-line, text-ink, text-muted, text-gold-ink…).
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        'surface-3': 'rgb(var(--surface-3) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        gold: 'rgb(var(--gold) / <alpha-value>)',
        'gold-ink': 'rgb(var(--gold-ink) / <alpha-value>)',
        brand: {
          obsidian: '#0F172A',
          twilight: '#0B0F17',
          gold: '#D4AF37',
          'gold-hover': '#B89428',
          teal: '#0D9488',
          bg: '#F8FAFC',
          surface: '#FFFFFF',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 60px -12px rgba(212, 175, 55, 0.45)',
        'gold-sm': '0 0 28px -8px rgba(212, 175, 55, 0.35)',
        soft: '0 18px 50px -24px rgba(15, 23, 42, 0.25)',
      },
      backgroundImage: {
        'vesper-glow':
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212, 175, 55, 0.18), transparent 55%)',
        'obsidian-wash':
          'linear-gradient(165deg, #0F172A 0%, #1a2744 48%, #0F172A 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
