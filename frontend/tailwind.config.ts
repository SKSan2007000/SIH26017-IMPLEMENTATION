import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#05070a',
        base: '#0a0e15',
        raised: '#0e131c',
        panel: 'rgba(16, 22, 33, 0.82)',
        panel2: 'rgba(20, 27, 40, 0.65)',
        hair: 'rgba(148, 176, 204, 0.10)',
        mid: 'rgba(148, 176, 204, 0.18)',
        cyanline: 'rgba(56, 211, 240, 0.35)',
        txt: {
          primary: '#e7edf5',
          secondary: '#9fb0c3',
          tertiary: '#5c6b80',
        },
        cyan: {
          DEFAULT: '#38d3f0',
          dim: '#1e8ba3',
          glow: 'rgba(56, 211, 240, 0.16)',
        },
        risk: {
          critical: '#ef5b5b',
          high: '#f0a742',
          medium: '#e8d15c',
          low: '#4fbf7c',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      boxShadow: {
        glow: '0 0 14px rgba(56,211,240,0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
