import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test-setup.tsx'],
    include: ['lib/**/*.test.ts', 'lib/**/*.test.tsx', 'components/**/*.test.tsx', 'hooks/**/*.test.ts', 'app/api/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@web3-ai-agent/ai-config': path.resolve(__dirname, '../../packages/ai-config/src'),
      '@web3-ai-agent/web3-tools': path.resolve(__dirname, '../../packages/web3-tools/src'),
    },
  },
})
