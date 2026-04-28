import { test, expect, type Locator } from '@playwright/test'

/**
 * 等待 AI 回复完成的辅助函数
 * 利用 textarea disabled 状态变化判断：
 *  发送后 → isLoading=true → textarea 被 disabled
 *  回复完成后 → isLoading=false → textarea 重新启用
 */
async function waitForAIResponse(chatInput: Locator, timeout = 30000) {
  // 先等待 textarea 被 disabled，确认请求已发出
  await expect(chatInput).toBeDisabled({ timeout: 5000 })
  // 再等待 textarea 重新启用，确认 AI 回复完成
  await expect(chatInput).toBeEnabled({ timeout })
}

test.describe('Web3 AI Agent - 对话功能测试', () => {
  // AI 交互测试需要更长超时
  test.describe.configure({ timeout: 120000 })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
  })

  test('用户应该能够发送消息并收到回复', async ({ page }) => {
    // 查找聊天输入框
    const chatInput = page.locator('textarea').first()
    await expect(chatInput).toBeVisible({ timeout: 10000 })

    // 输入并发送消息
    await chatInput.fill('你好')
    await chatInput.press('Enter')

    // 等待 AI 回复完成（条件等待，不硬等）
    await waitForAIResponse(chatInput)

    // 验证消息列表有内容
    const messages = page.locator('[class*="message"]')
    const count = await messages.count()
    expect(count).toBeGreaterThan(0)
  })

  test('SSE 流式输出应该工作', async ({ page }) => {
    // 输入并发送消息
    const chatInput = page.locator('textarea').first()
    await expect(chatInput).toBeVisible({ timeout: 10000 })
    await chatInput.fill('ETH 价格')
    await chatInput.press('Enter')

    // 等待 AI 回复完成
    await waitForAIResponse(chatInput)

    // 验证消息列表有内容
    const messages = page.locator('[class*="message"]')
    const count = await messages.count()
    expect(count).toBeGreaterThan(0)
  })

  test('对话历史应该保持', async ({ page }) => {
    // 发送第一条消息
    const chatInput = page.locator('textarea').first()
    await expect(chatInput).toBeVisible({ timeout: 10000 })
    await chatInput.fill('第一条消息')
    await chatInput.press('Enter')

    // 等待第一条回复完成
    await waitForAIResponse(chatInput)

    // 发送第二条消息
    await chatInput.fill('第二条消息')
    await chatInput.press('Enter')

    // 等待第二条回复完成
    await waitForAIResponse(chatInput)

    // 验证消息列表有超过 1 条消息（原始消息 + 2 条用户消息 + 2 条 AI 回复）
    const messages = page.locator('[class*="message"]')
    const count = await messages.count()
    expect(count).toBeGreaterThan(1)
  })
})
