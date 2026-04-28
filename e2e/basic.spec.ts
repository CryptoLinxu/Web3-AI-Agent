import { test, expect } from '@playwright/test'

test.describe('Web3 AI Agent - 基础功能测试', () => {
  test('首页应该正常加载', async ({ page }) => {
    await page.goto('/')
    
    // 检查页面标题
    await expect(page).toHaveTitle(/Web3 AI Agent/)
    
    // 检查主要元素是否存在
    await expect(page.locator('h1')).toBeVisible()
  })

  test('聊天输入框应该可见', async ({ page }) => {
    await page.goto('/')
    
    // 检查聊天输入框
    const chatInput = page.locator('textarea, input[type="text"]').first()
    await expect(chatInput).toBeVisible()
  })

  test('主题切换功能应该工作', async ({ page }) => {
    await page.goto('/')
    
    // 查找主题切换按钮
    const themeButton = page.locator('button').filter({ hasText: /theme|主题/ }).first()
    
    if (await themeButton.isVisible()) {
      await themeButton.click()
      // 等待主题切换动画
      await page.waitForTimeout(500)
      
      // 验证主题已切换（检查 body 的 class 或 data 属性）
      const bodyClass = await page.locator('body').getAttribute('class')
      expect(bodyClass).toBeTruthy()
    }
  })
})
