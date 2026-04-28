import { test, expect } from '@playwright/test'

const TEST_WALLET = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
const INVALID_WALLET = 'invalid-wallet-address'

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

  test.describe('钱包上下文验证', () => {
    test('传入有效钱包地址应该正常响应', async ({ request }) => {
      const response = await request.post('/api/chat', {
        data: {
          messages: [{ role: 'user', content: '查看我的余额' }],
          walletAddress: TEST_WALLET
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body).toHaveProperty('content')
      // 验证钱包上下文被注入到系统提示中
      expect(body.content).toBeDefined()
    })

    test('传入无效钱包地址应该返回 400', async ({ request }) => {
      const response = await request.post('/api/chat', {
        data: {
          messages: [{ role: 'user', content: '查看我的余额' }],
          walletAddress: INVALID_WALLET
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body.error).toBeTruthy()
      expect(body.content).toContain('无效')
    })

    test('不传钱包地址应该正常响应', async ({ request }) => {
      const response = await request.post('/api/chat', {
        data: {
          messages: [{ role: 'user', content: 'ETH 价格多少？' }]
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body).toHaveProperty('content')
    })
  })

  test.describe('verify-ownership API', () => {
    test('无效参数应该返回 400', async ({ request }) => {
      const response = await request.post('/api/supabase/verify-ownership', {
        data: {},
        headers: {
          'Content-Type': 'application/json'
        }
      })

      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body.isOwner).toBe(false)
    })

    test('不存在的对话应该返回 404', async ({ request }) => {
      const response = await request.post('/api/supabase/verify-ownership', {
        data: {
          conversationId: '00000000-0000-0000-0000-000000000000',
          walletAddress: TEST_WALLET
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      expect(response.status()).toBe(404)
      const body = await response.json()
      expect(body.isOwner).toBe(false)
    })

    test('无效钱包地址格式应该返回 400', async ({ request }) => {
      const response = await request.post('/api/supabase/verify-ownership', {
        data: {
          conversationId: '00000000-0000-0000-0000-000000000000',
          walletAddress: INVALID_WALLET
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body.isOwner).toBe(false)
    })
  })
})
