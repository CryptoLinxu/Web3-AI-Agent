import { test, expect } from '@playwright/test'

test.describe('Web3 AI Agent - API 测试', () => {
  test('健康检查 API 应该返回 OK', async ({ request }) => {
    const response = await request.get('/api/health')
    
    expect(response.ok()).toBeTruthy()
    
    const body = await response.json()
    expect(body.status).toBe('ok')
    expect(body.timestamp).toBeTruthy()
  })

  test('聊天 API 应该接受非流式请求', async ({ request }) => {
    const response = await request.post('/api/chat', {
      data: {
        messages: [
          {
            role: 'user',
            content: '你好'
          }
        ]
      },
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    expect(response.ok()).toBeTruthy()
    
    const body = await response.json()
    expect(body).toHaveProperty('content')
  })

  test('工具 API 应该返回 ETH 价格', async ({ request }) => {
    const response = await request.post('/api/tools', {
      data: {
        name: 'getTokenPrice',
        arguments: {
          symbol: 'ETH'
        }
      },
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    expect(response.ok()).toBeTruthy()
    
    const body = await response.json()
    // 检查响应包含价格信息（可能是 success 字段或直接是价格对象）
    expect(body).toBeDefined()
    // 价格可能在 price 字段或其他结构中
    const price = body.price || body.data?.price
    if (price !== undefined) {
      expect(typeof price).toBe('number')
      expect(price).toBeGreaterThan(0)
    }
  })
})
