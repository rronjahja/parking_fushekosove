/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Ngjyra semantike te lidhura me variablat CSS (tema Errët/Dritë)
        canvas: 'rgb(var(--c-canvas) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        raised: 'rgb(var(--c-raised) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        faint: 'rgb(var(--c-faint) / <alpha-value>)',
        cyan: { DEFAULT: '#22D3EE', dim: '#0E7490' },
        amber: { DEFAULT: '#FBBF24', deep: '#B45309' },
        mint: { DEFAULT: '#34D399' },
        rose: { DEFAULT: '#FB7185' },
        azure: { DEFAULT: '#3B82F6' },
      },
      boxShadow: {
        glow: '0 0 24px -6px rgb(34 211 238 / 0.45)',
        card: '0 10px 30px -12px rgb(2 8 20 / 0.55)',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.45, transform: 'scale(0.8)' },
        },
        rise: {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        pulseDot: 'pulseDot 1.6s ease-in-out infinite',
        rise: 'rise .28s ease-out both',
      },
    },
  },
  plugins: [],
};
