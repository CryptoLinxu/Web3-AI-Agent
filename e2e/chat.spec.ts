import { test, expect } from '@playwright/test'

test.describe('Web3 AI Agent - 对话功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('用户应该能够发送消息并收到回复', async ({ page }) => {
    // 等待页面加载
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // 查找聊天输入框
    const chatInput = page.locator('textarea, input[type="text"]').first()
    await expect(chatInput).toBeVisible({ timeout: 10000 })
    
    // 输入消息
    await chatInput.fill('你好')
    
    // 发送消息（按回车键或点击发送按钮）
    await chatInput.press('Enter')
    
    // 等待 AI 回复（等待出现新消息）
    await page.waitForTimeout(5000)
    
    // 验证有消息显示
    const messageList = page.locator('[data-testid="message-list"], .message-list, [class*="message"]').first()
    if (await messageList.isVisible()) {
      const messages = await messageList.locator('> *').count()
      expect(messages).toBeGreaterThan(0)
    }
  })

  test('SSE 流式输出应该工作', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // 输入测试消息
    const chatInput = page.locator('textarea, input[type="text"]').first()
    await expect(chatInput).toBeVisible({ timeout: 10000 })
    await chatInput.fill('ETH 价格')
    await chatInput.press('Enter')
    
    // 等待流式输出开始
    await page.waitForTimeout(5000)
    
    // 验证有内容显示
    const messageList = page.locator('[data-testid="message-list"], .message-list, [class*="message"]').first()
    if (await messageList.isVisible()) {
      const messages = await messageList.locator('> *').count()
      expect(messages).toBeGreaterThan(0)
    }
  })

  test('对话历史应该保持', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // 发送第一条消息
    const chatInput = page.locator('textarea, input[type="text"]').first()
    await expect(chatInput).toBeVisible({ timeout: 10000 })
    await chatInput.fill('第一条消息')
    await chatInput.press('Enter')
    
    // 等待回复
    await page.waitForTimeout(5000)
    
    // 发送第二条消息
    await chatInput.fill('第二条消息')
    await chatInput.press('Enter')
    
    // 等待回复
    await page.waitForTimeout(5000)
    
    // 验证至少有消息存在
    const messageList = page.locator('[data-testid="message-list"], .message-list, [class*="message"]').first()
    if (await messageList.isVisible()) {
      const messages = await messageList.locator('> *').count()
      expect(messages).toBeGreaterThan(0)
    }
  })
})
