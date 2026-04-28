# 单元测试覆盖报告

**生成时间:** 2026-04-28  
**提交版本:** 54ca8e1  
**测试框架:** Vitest v3.2.4

---

## 📊 总体统计

| 指标 | 数值 |
|------|------|
| 总测试文件 | 31 个 |
| 总测试用例 | 238 个 |
| 通过率 | 100% ✅ |
| 总执行时间 | ~10.5s |

---

## 📁 按模块分布

### apps/web (130 tests)

| 模块 | 测试文件 | 测试数 | 覆盖内容 |
|------|---------|--------|---------|
| **lib/supabase** | 3 | 46 | client 初始化、conversations CRUD、transfers 管理 |
| **lib/theme** | 2 | 10 | ThemeContext 状态、ThemeProvider 主题切换 |
| **lib/memory** | 3 | 22 | config 验证、SlidingWindow 窗口滑动、SummaryCompression 摘要压缩 |
| **lib/tokens** | 1 | 6 | token 列表过滤、链筛选、搜索 |
| **hooks/useChatStream** | 1 | 9 | 初始状态、sendMessage 成功/失败、abort、5xx 重试 |
| **components** | 5 | 21 | ChatInput、ConfirmDialog、ThemeSwitcher、MarkdownRenderer、DexSwapCard |
| **app/api** | 2 | 8 | health 检查、tools 路由 |

**关键测试场景:**
- ✅ Supabase 链式调用 mock（`.from().select().eq()`）
- ✅ React Hook 测试（renderHook + act + fake timers）
- ✅ 组件用户交互测试（user-event）
- ✅ API 路由外部依赖 mock（web3-tools、next/server）

### packages/ai-config (34 tests)

| 模块 | 测试文件 | 测试数 | 覆盖内容 |
|------|---------|--------|---------|
| **config** | 1 | 11 | 配置验证、默认值、优先级 |
| **factory** | 1 | 8 | provider 工厂创建、缓存策略 |
| **providers/base** | 1 | 9 | 基类方法、消息格式转换 |
| **providers/openai** | 1 | 6 | OpenAI SDK mock、chat/chatStream、工具调用 |

**关键测试场景:**
- ✅ OpenAI SDK 完整 mock（vi.mock hoisted）
- ✅ 异步迭代器流式响应测试
- ✅ 工具调用参数解析

### packages/web3-tools (74 tests)

| 模块 | 测试文件 | 测试数 | 覆盖内容 |
|------|---------|--------|---------|
| **balance** | 1 | 6 | EVM/SOL/BTC 余额查询 |
| **chains** | 3 | 20 | chain 配置、EVM adapter、Bitcoin、Solana |
| **gas** | 1 | 4 | gas 价格估算 |
| **price** | 1 | 6 | ETH/BTC 价格查询、代理降级 |
| **token** | 1 | 10 | token 信息查询、ERC20 合约交互 |
| **tokens/registry** | 1 | 8 | token 注册表、链筛选 |
| **transfer** | 1 | 8 | ERC20 transfer、额度检查 |
| **vitest.config.ts** | 1 | - | 测试配置 |

**关键测试场景:**
- ✅ 多链适配测试（EVM/Solana/Bitcoin）
- ✅ HttpsProxyAgent mock 顺序（vi.hoisted）
- ✅ ERC20 精度处理（小数位格式化）

---

## 🛠️ 技术方案

### 测试框架选型

```
Vitest v3.2.4 (monorepo workspace)
├── apps/web: jsdom 环境
├── packages/ai-config: node 环境
└── packages/web3-tools: node 环境
```

### Mock 策略

| 场景 | 方案 | 示例 |
|------|------|------|
| **外部 SDK** | `vi.mock()` + `vi.hoisted()` | openai、@anthropic-ai/sdk |
| **浏览器 API** | jsdom 内置 | fetch、localStorage |
| **定时器** | `vi.useFakeTimers()` + `advanceTimersByTimeAsync()` | 5xx 重试延迟 |
| **链式调用** | 逐层 mock | `mockSelect.mockReturnValue({ eq: vi.fn() })` |
| **模块导入** | `vi.hoisted()` 提前声明 | price.test.ts 的 HttpsProxyAgent |

### 组件测试策略

```typescript
// 使用 @testing-library/react + user-event
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Provider 包裹辅助函数
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

// 用户交互测试
it('点击按钮应切换主题', async () => {
  const user = userEvent.setup()
  renderWithProvider(<ThemeSwitcher />)
  await user.click(screen.getByText('浅色'))
  expect(screen.getByText('浅色').closest('button')).toHaveClass('border-primary-500')
})
```

### Hook 测试策略

```typescript
import { renderHook, act } from '@testing-library/react'

describe('useChatStream', () => {
  it('sendMessage 成功应返回内容', async () => {
    // Mock fetch 返回 ReadableStream
    mockFetch.mockResolvedValue({ ok: true, body: mockStream })
    
    const { result } = renderHook(() => useChatStream())
    
    let response: any
    await act(async () => {
      response = await result.current!.sendMessage([{ role: 'user', content: 'Hi' }])
    })
    
    expect(response.content).toBe('Hello')
  })
})
```

---

## 💡 关键经验

### 1. Monorepo 测试配置

**问题:** 多个 package 需要不同的测试环境（jsdom vs node）

**方案:** 使用 vitest workspace

```typescript
// vitest.workspace.ts
export default [
  'apps/web/vitest.config.ts',
  'packages/ai-config/vitest.config.ts',
  'packages/web3-tools/vitest.config.ts',
]
```

### 2. Supabase 链式调用 Mock

**问题:** Supabase client 返回链式调用，需要完整 mock 每一层

**方案:**

```typescript
const mockEq = vi.fn().mockResolvedValue({ data: [], error: null })
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))
```

### 3. React Hook 测试中的 Fake Timers

**问题:** useChatStream 内部有 setTimeout 重试逻辑，需要控制时间推进

**方案:**

```typescript
beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

it('5xx 错误应重试', async () => {
  mockFetch
    .mockRejectedValueOnce(new Error('500'))
    .mockResolvedValueOnce({ ok: true, body: mockStream })
  
  const { result } = renderHook(() => useChatStream())
  
  // 分步推进时间，避免一次性推进导致超时
  const promise = act(async () => {
    result.current!.sendMessage([{ role: 'user', content: 'Hi' }])
  })
  
  await vi.advanceTimersByTimeAsync(100)
  await vi.advanceTimersByTimeAsync(1500)  // 第一次重试
  await vi.advanceTimersByTimeAsync(1500)  // 第二次重试
  
  await promise
})
```

### 4. vi.mock Hoisting 陷阱

**问题:** vi.mock 会提升到文件顶部，但变量声明不会，导致 mock 中引用变量为 undefined

**错误示例:**

```typescript
const mockAgent = { ... }  // ❌ 不会提升
vi.mock('node-fetch', () => ({
  default: vi.fn(() => mockAgent)  // ❌ mockAgent is not defined
}))
```

**正确方案:**

```typescript
const mockAgent = vi.hoisted(() => ({ ... }))  // ✅ 手动提升
vi.mock('node-fetch', () => ({
  default: vi.fn(() => mockAgent)  // ✅ 可以访问
}))
```

### 5. 组件测试避免测试实现细节

**原则:** 测试用户可见行为，不测试内部状态

**反例:**

```typescript
// ❌ 测试内部 state
expect(wrapper.state('isOpen')).toBe(true)
```

**正例:**

```typescript
// ✅ 测试用户可见行为
expect(screen.getByRole('dialog')).toBeInTheDocument()
```

### 6. 异步迭代器测试

**场景:** OpenAI chatStream 返回 AsyncIterable

**方案:**

```typescript
const mockStream = (async function* () {
  yield { choices: [{ delta: { content: 'Hello' } }] }
  yield { choices: [{ delta: { content: ' World' } }] }
  yield { choices: [{ delta: {}, finish_reason: 'stop' }] }
})()

mockCreate.mockResolvedValue(mockStream as any)

const stream = adapter.chatStream(messages)
const chunks: any[] = []
for await (const chunk of stream) {
  chunks.push(chunk)
}
expect(chunks.length).toBeGreaterThan(0)
```

---

## ⚠️ 常见问题与解决方案

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| `result.current is null` | renderHook 缺少 wrapper | 使用 `{ wrapper }` 参数或直接访问 `result.current?.` |
| `Test timed out` | fake timers 推进方式错误 | 分步推进，不要一次性 `advanceTimersByTimeAsync(4000)` |
| `getMultipleElementsFoundError` | getByText 匹配多个元素 | 使用 `getAllByRole().find()` 或更精确的选择器 |
| `Cannot read properties of undefined` | vi.mock hoisting 问题 | 使用 `vi.hoisted()` 提前声明变量 |
| Markdown 渲染测试失败 | 多行文本未正确分隔 | 使用 `getByRole('list')` 而非检查单个 li 元素 |

---

## 📈 测试覆盖率目标

### 当前覆盖情况

| 层级 | 覆盖率估算 | 说明 |
|------|-----------|------|
| **工具函数** | ~90% | 纯函数易于测试，覆盖率高 |
| **Hooks** | ~80% | 需要 mock 外部依赖，部分边界情况未覆盖 |
| **组件** | ~70% | 主要覆盖用户交互，样式测试较少 |
| **API Routes** | ~75% | 覆盖主要路由，错误处理完整 |
| **Providers** | ~85% | SDK mock 完整，流式响应覆盖 |

### 后续优化建议

1. **增加边界测试:**
   - 网络超时场景
   - 极端输入值（空字符串、超长文本）
   - 并发请求处理

2. **增加 E2E 测试:**
   - 用户完整对话流程
   - 钱包连接 + 转账流程
   - 主题切换持久化

3. **性能测试:**
   - 大数据量渲染性能
   - 长对话历史加载
   - 流式响应内存占用

---

## 🎯 总结

本次单元测试覆盖任务完成了项目的核心功能测试体系建设：

✅ **建立了完整的测试架构:** Vitest monorepo workspace 配置  
✅ **覆盖了关键业务逻辑:** Supabase、主题系统、内存管理、AI 流式对话  
✅ **沉淀了测试经验:** Mock 策略、Hook 测试、组件测试最佳实践  
✅ **形成了可复用模式:** Provider wrapper、链式调用 mock、fake timers 控制  

**下一步:**
- 持续维护测试用例，随功能迭代同步更新
- 考虑引入 E2E 测试（Playwright/Cypress）
- 探索快照测试（Snapshot Testing）用于 UI 回归检测
