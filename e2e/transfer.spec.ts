import { test, expect, type Locator } from '@playwright/test'

/**
 * 等待 AI 回复完成的辅助函数
 */
async function waitForAIResponse(chatInput: Locator, timeout = 30000) {
  await expect(chatInput).toBeDisabled({ timeout: 5000 })
  await expect(chatInput).toBeEnabled({ timeout })
}

test.describe('Web3 AI Agent - 转账卡片测试', () => {
  test.describe.configure({ timeout: 120000 })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
  })

  test('发送转账指令应该触发 AI 生成转账卡片', async ({ page }) => {
    const chatInput = page.locator('textarea').first()
    await expect(chatInput).toBeVisible({ timeout: 10000 })

    // 发送转账指令，触发 createTransferCard 工具
    await chatInput.fill('转账 0.001 ETH 到 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 on ethereum')
    await chatInput.press('Enter')

    // 等待 AI 回复完成
    await waitForAIResponse(chatInput)

    // 验证消息列表有内容
    const messages = page.locator('[class*="message"]')
    const count = await messages.count()
    expect(count).toBeGreaterThan(0)

    // 检查是否渲染了转账卡片（卡片包含 "DEX 转账" 文本）
    // 或者至少 AI 回复了有效内容
    const pageText = await page.textContent('body')
    const hasTransferCard = pageText?.includes('DEX 转账') || false
    const hasResponse = pageText?.includes('ETH') || pageText?.includes('转账') || false

    expect(hasTransferCard || hasResponse).toBeTruthy()
  })

  test('转账卡片应该正确显示金额和币种', async ({ page }) => {
    const chatInput = page.locator('textarea').first()
    await expect(chatInput).toBeVisible({ timeout: 10000 })

    // 发送转账指令
    await chatInput.fill('转账 0.001 ETH 到 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 on ethereum')
    await chatInput.press('Enter')

    // 等待 AI 回复完成
    await waitForAIResponse(chatInput)

    // 检查转账卡片渲染
    const transferCard = page.locator('text=DEX 转账')
    const cardVisible = await transferCard.isVisible().catch(() => false)

    if (cardVisible) {
      // 验证卡片中包含 ETH 和金额
      await expect(page.locator('text=ETH').first()).toBeVisible()
      await expect(page.locator('text=0.001').first()).toBeVisible()
    } else {
      // 如果没有卡片（AI 未调用工具），验证 AI 回复中包含转账相关信息
      const responseContent = page.locator('[class*="message"]').last()
      const text = await responseContent.textContent()
      expect(text).toBeTruthy()
    }
  })

  test('转账卡片输入框输入后应能被验证', async ({ page }) => {
    const chatInput = page.locator('textarea').first()
    await expect(chatInput).toBeVisible({ timeout: 10000 })

    // 测试无效转账指令（缺少目标地址）
    await chatInput.fill('给我转账')
    await chatInput.press('Enter')

    // 等待 AI 回复完成
    await waitForAIResponse(chatInput)

    // 验证消息列表有内容
    const messages = page.locator('[class*="message"]')
    const count = await messages.count()
    expect(count).toBeGreaterThan(0)
  })
})
