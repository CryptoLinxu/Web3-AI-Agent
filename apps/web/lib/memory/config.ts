import type { MemoryConfig } from './types'

export const defaultMemoryConfig: MemoryConfig = {
  compressThreshold: Number(process.env.NEXT_PUBLIC_MEMORY_COMPRESS_THRESHOLD) || 10,
  keepRecentCount: Number(process.env.NEXT_PUBLIC_MEMORY_KEEP_RECENT) || 5,
  summaryModel: process.env.NEXT_PUBLIC_MEMORY_SUMMARY_MODEL || undefined,
}

export function createMemoryConfig(overrides?: Partial<MemoryConfig>): MemoryConfig {
  return {
    ...defaultMemoryConfig,
    ...overrides,
  }
}
