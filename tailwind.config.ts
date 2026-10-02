import type { Config } from 'tailwindcss';

// Couleurs pilotées par des variables CSS (canaux "R G B") définies dans
// globals.css, ce qui permet la bascule clair/sombre sans variantes `dark:`
// dans le markup : les tokens sémantiques se résolvent différemment selon
// `:root[data-theme="dark"]`.
const withAlpha = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: withAlpha('--accent'),
          soft: withAlpha('--accent-soft'),
          ink: withAlpha('--accent-ink'),
        },
        ink: {
          DEFAULT: withAlpha('--ink'),
          soft: withAlpha('--ink-soft'),
          faint: withAlpha('--ink-faint'),
        },
        paper: withAlpha('--paper'),
        surface: withAlpha('--surface'),
        'surface-2': withAlpha('--surface-2'),
        line: {
          DEFAULT: withAlpha('--line'),
          soft: withAlpha('--line-soft'),
        },
        success: { DEFAULT: withAlpha('--success'), soft: withAlpha('--success-soft') },
        warning: { DEFAULT: withAlpha('--warning'), soft: withAlpha('--warning-soft') },
        danger: { DEFAULT: withAlpha('--danger'), soft: withAlpha('--danger-soft') },
        chart: {
          1: withAlpha('--chart-1'),
          2: withAlpha('--chart-2'),
          3: withAlpha('--chart-3'),
          grid: withAlpha('--chart-grid'),
          axis: withAlpha('--chart-axis'),
        },
      },
      boxShadow: {
        subtle: 'var(--shadow-subtle)',
        card: 'var(--shadow-card)',
        pop: 'var(--shadow-pop)',
      },
      borderRadius: {
        lg: '10px',
        xl: '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'rise': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'draw': { from: { strokeDashoffset: '1' }, to: { strokeDashoffset: '0' } },
      },
      animation: {
        'fade-in': 'fade-in .4s ease both',
        rise: 'rise .5s cubic-bezier(.22,1,.36,1) both',
      },
    },
  },
  plugins: [],
};
export default config;
