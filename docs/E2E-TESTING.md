# E2E 测试指南

> 使用 Playwright 进行端到端测试

---

## 📋 目录

- [概述](#概述)
- [测试结构](#测试结构)
- [运行测试](#运行测试)
- [测试用例说明](#测试用例说明)
- [编写新测试](#编写新测试)
- [调试测试](#调试测试)
- [CI/CD 集成](#cicd-集成)

---

## 概述

Web3 AI Agent 使用 [Playwright](https://playwright.dev/) 进行端到端（E2E）测试，确保应用在真实浏览器环境中的功能正确性。

### 测试范围

- ✅ 页面加载和渲染
- ✅ AI 对话功能（流式和非流式）
- ✅ Web3 工具调用（价格查询、余额查询等）
- ✅ 主题切换
- ✅ API 端点验证
- ⏳ 钱包连接（待实现）
- ⏳ 转账卡片功能（待实现）

---

## 测试结构

```
e2e/
├── basic.spec.ts       # 基础功能测试（页面加载、主题切换）
├── api.spec.ts         # API 接口测试（健康检查、聊天、工具）
├── chat.spec.ts        # 对话功能测试（消息发送、流式输出）
└── ...
```

### 配置文件

- `playwright.config.ts` - Playwright 主配置
- 测试目录：`e2e/`
- 报告目录：`playwright-report/`

---

## 运行测试

### 基本命令

```bash
# 运行所有 E2E 测试
pnpm test:e2e

# 运行测试并打开 UI 界面
pnpm test:e2e:ui

# 在有头模式下运行测试（显示浏览器）
pnpm test:e2e:headed

# 查看测试报告
pnpm test:e2e:report
```

### 运行特定测试

```bash
# 运行单个测试文件
npx playwright test e2e/basic.spec.ts

# 运行特定测试用例
npx playwright test -g "首页应该正常加载"

# 在特定浏览器中运行
npx playwright test --project=chromium
```

### 调试模式

```bash
# 单步调试测试
npx playwright test --debug

# 显示浏览器并暂停
npx playwright test --headed --timeout=0
```

---

## 测试用例说明

### basic.spec.ts - 基础功能测试

#### 1. 首页应该正常加载

- **目标**: 验证应用能够正常启动并渲染
- **步骤**:
  1. 访问首页 `/`
  2. 检查页面标题包含 "Web3 AI Agent"
  3. 验证主要元素可见

#### 2. 聊天输入框应该可见

- **目标**: 确保用户可以进行交互
- **步骤**:
  1. 访问首页
  2. 查找聊天输入框
  3. 验证输入框可见

#### 3. 主题切换功能应该工作

- **目标**: 验证主题切换功能
- **步骤**:
  1. 访问首页
  2. 查找主题切换按钮
  3. 点击按钮
  4. 验证主题已切换

### api.spec.ts - API 测试

#### 1. 健康检查 API 应该返回 OK

- **目标**: 验证 `/api/health` 端点
- **预期**: 
  - HTTP 状态码 200
  - 响应包含 `status: "ok"`
  - 响应包含 `timestamp`

#### 2. 聊天 API 应该接受非流式请求

- **目标**: 验证 `/api/chat` 端点
- **预期**:
  - HTTP 状态码 200
  - 响应包含 `content` 字段

#### 3. 工具 API 应该返回 ETH 价格

- **目标**: 验证 `/api/tools` 端点的 getTokenPrice 工具
- **预期**:
  - HTTP 状态码 200
  - `success: true`
  - `price > 0`

### chat.spec.ts - 对话功能测试

#### 1. 用户应该能够发送消息并收到回复

- **目标**: 验证完整的对话流程
- **步骤**:
  1. 访问首页
  2. 输入消息
  3. 发送消息
  4. 等待 AI 回复
  5. 验证回复可见

#### 2. SSE 流式输出应该工作

- **目标**: 验证流式输出功能
- **步骤**:
  1. 发送价格查询消息
  2. 等待流式输出
  3. 验证有内容显示

#### 3. 对话历史应该保持

- **目标**: 验证多轮对话功能
- **步骤**:
  1. 发送第一条消息
  2. 等待回复
  3. 发送第二条消息
  4. 验证消息列表包含多条消息

---

## 编写新测试

### 基本模板

```typescript
import { test, expect } from '@playwright/test'

test.describe('功能模块名称', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前的准备工作
    await page.goto('/')
  })

  test('测试用例描述', async ({ page }) => {
    // 测试步骤
    await page.locator('selector').click()
    await page.locator('input').fill('text')
    
    // 验证结果
    await expect(page.locator('element')).toBeVisible()
    expect(await page.locator('element').textContent()).toBe('expected')
  })
})
```

### 常用断言

```typescript
// 元素可见性
await expect(page.locator('selector')).toBeVisible()
await expect(page.locator('selector')).toBeHidden()

// 文本内容
await expect(page.locator('selector')).toHaveText('expected text')
await expect(page.locator('selector')).toContainText('partial text')

// 属性检查
await expect(page.locator('selector')).toHaveAttribute('href', '/path')
await expect(page.locator('selector')).toHaveClass('class-name')

// 计数
expect(await page.locator('selector').count()).toBeGreaterThan(0)

// 页面 URL
await expect(page).toHaveURL('/expected-path')
await expect(page).toHaveTitle(/regex pattern/)
```

### 等待策略

```typescript
// 等待元素出现
await page.waitForSelector('selector', { timeout: 5000 })

// 等待网络空闲
await page.waitForLoadState('networkidle')

// 等待导航完成
await page.waitForURL('/new-path')

// 固定等待（不推荐，仅用于调试）
await page.waitForTimeout(1000)
```

---

## 调试测试

### 使用 UI 模式

```bash
pnpm test:e2e:ui
```

这将打开 Playwright UI，可以：
- 查看所有测试用例
- 逐个运行测试
- 查看测试执行轨迹
- 检查快照和截图

### 使用调试模式

```bash
npx playwright test --debug
```

这将：
- 打开浏览器
- 暂停在每个操作前
- 提供 DevTools 进行调试

### 查看测试报告

```bash
pnpm test:e2e:report
```

报告包含：
- 测试结果概览
- 失败测试的详细信息
- 截图和视频（如果启用）
- 执行轨迹（trace）

### 启用追踪

在 `playwright.config.ts` 中配置：

```typescript
export default defineConfig({
  use: {
    trace: 'on-first-retry',  // 重试时记录追踪
    screenshot: 'only-on-failure',  // 失败时截图
    video: 'retain-on-failure',  // 失败时保留视频
  },
})
```

---

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run Playwright tests
        run: pnpm test:e2e
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Upload test report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### 环境变量

在 CI 环境中，需要配置以下环境变量：

```bash
# AI 模型配置
OPENAI_API_KEY=your_api_key

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# WalletConnect 配置
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

---

## 最佳实践

### 1. 使用数据测试属性

在组件中添加 `data-testid` 属性，使测试更稳定：

```tsx
<button data-testid="send-button">发送</button>
```

```typescript
await page.locator('[data-testid="send-button"]').click()
```

### 2. 避免硬编码等待时间

```typescript
// ❌ 不推荐
await page.waitForTimeout(5000)

// ✅ 推荐
await page.waitForSelector('[data-testid="response"]', { timeout: 10000 })
```

### 3. 使用 Page Object 模式

对于复杂的页面，创建 Page Object：

```typescript
// pages/chat.page.ts
export class ChatPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/')
  }

  async sendMessage(message: string) {
    await this.page.locator('textarea').fill(message)
    await this.page.locator('textarea').press('Enter')
  }

  async getLastMessage() {
    return this.page.locator('[data-role="assistant"]').last()
  }
}

// 测试中使用
test('should send message', async ({ page }) => {
  const chatPage = new ChatPage(page)
  await chatPage.goto()
  await chatPage.sendMessage('Hello')
  await expect(chatPage.getLastMessage()).toBeVisible()
})
```

### 4. 隔离测试数据

每个测试应该独立，不依赖其他测试的状态：

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/')
  // 清理状态
  await page.evaluate(() => localStorage.clear())
})
```

---

## 常见问题

### Q: 测试失败，提示 "Timeout exceeded"

**解决方案**:
- 增加超时时间：`await page.waitForSelector('selector', { timeout: 10000 })`
- 检查元素选择器是否正确
- 确认开发服务器已启动

### Q: 如何在测试中使用真实的钱包？

**解决方案**:
目前测试使用模拟环境。要实现真实钱包测试，需要：
1. 使用 Playwright 的浏览器上下文注入钱包扩展
2. 或使用 Mock 钱包 provider

### Q: 测试通过但实际功能有问题

**解决方案**:
- 检查测试断言是否足够严格
- 添加更多验证点
- 使用 `--headed` 模式观察实际执行

---

## 相关资源

- [Playwright 官方文档](https://playwright.dev/)
- [Playwright API 参考](https://playwright.dev/docs/api/class-playwright)
- [测试最佳实践](https://playwright.dev/docs/best-practices)

---

**测试愉快！** 🧪
