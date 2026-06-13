/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sky:   { DEFAULT: '#56cffc', dark: '#0c4a6e' },
        em:    { DEFAULT: '#2dd4a0', dark: '#065f46' },
        amber: '#fbbf24',
        bg:    '#040912',
        bg2:   '#070e1d',
        surface: '#0d1929',
        ink:     '#ddeeff',
        dim:    'rgba(196,226,255,.74)',
        faint:  'rgba(155,200,238,.40)',
        line:   'rgba(86,207,252,.12)',
        linehi: 'rgba(86,207,252,.28)',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'Courier New', 'monospace'],
      },
      keyframes: {
        ctaPulse: {
          '0%,100%': { boxShadow: '3px 3px 0 #0c4a6e, 0 0 0 0 rgba(86,207,252,.5)' },
          '50%':     { boxShadow: '3px 3px 0 #0c4a6e, 0 0 0 10px rgba(86,207,252,0)' },
        },
        nodePulse: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(86,207,252,.4)' },
          '50%':     { boxShadow: '0 0 0 6px rgba(86,207,252,0)' },
        },
      },
      animation: {
        ctaPulse: 'ctaPulse 2.4s ease-in-out infinite',
        nodePulse: 'nodePulse 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
