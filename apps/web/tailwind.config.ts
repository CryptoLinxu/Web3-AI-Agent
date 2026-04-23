import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Web3 主色调（科技蓝）
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Web3 品牌色
        web3: {
          ethereum: '#627EEA',
          bitcoin: '#F7931A',
          solana: '#9945FF',
          polygon: '#8247E5',
          bsc: '#F3BA2F',
        },
        // 深色主题
        dark: {
          900: '#060814',
          800: '#0c1028',
          700: '#151b3d',
          600: '#1e264f',
        },
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'glow': 'glow-pulse 4s ease-in-out infinite',
        'slide-in': 'slide-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
