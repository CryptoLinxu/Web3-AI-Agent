import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/health/route'
import { NextResponse } from 'next/server'

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data) => ({
      status: 200,
      json: async () => data,
    })),
  },
}))

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应返回 status: ok', async () => {
    const response = await GET()
    const data = await response.json()
    
    expect(data.status).toBe('ok')
  })

  it('应返回 timestamp', async () => {
    const response = await GET()
    const data = await response.json()
    
    expect(data.timestamp).toBeDefined()
    // 验证是有效的 ISO 字符串
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp)
  })

  it('应返回 version', async () => {
    const response = await GET()
    const data = await response.json()
    
    expect(data.version).toBeDefined()
    // 如果环境变量未设置，应使用默认值
    expect(['0.1.0', process.env.APP_VERSION]).toContain(data.version)
  })
})
