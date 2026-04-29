import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Quantum Cyan - 主色1
        cyan: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // Nexus Violet - 主色2
        violet: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // 兼容保留：primary -> cyan
        primary: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        web3: {
          ethereum: '#627EEA',
          bitcoin: '#F7931A',
          solana: '#9945FF',
          polygon: '#8247E5',
          bsc: '#F3BA2F',
        },
        dark: {
          900: '#0a0a1f',
          800: '#12122e',
          700: '#18183a',
          600: '#1e1e48',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 24px rgba(6,182,212,0.35)',
        'glow-violet': '0 0 24px rgba(139,92,246,0.35)',
        'neon': '0 0 20px rgba(6,182,212,0.25), 0 0 40px rgba(139,92,246,0.2)',
        'neon-strong': '0 0 30px rgba(6,182,212,0.4), 0 0 60px rgba(139,92,246,0.3)',
      },
      animation: {
        'float': 'float 8s ease-in-out infinite',
        'float-slow': 'float-slow 14s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'spin-slow': 'spin-slow 8s linear infinite',
        'shimmer': 'shimmer 2.5s infinite',
        'gradient-flow': 'gradient-flow 6s ease infinite',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, rgb(var(--accent-cyan)), rgb(var(--accent-violet)))',
        'gradient-brand-soft':
          'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.15))',
        'gradient-radial':
          'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}

export default config
