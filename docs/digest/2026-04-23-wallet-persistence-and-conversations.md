# 钱包连接持久化与对话历史管理 复盘

## 本轮完成了什么

### 核心功能交付
1. **钱包连接跨页面刷新持久化**：用户连接钱包后刷新页面，连接状态自动恢复，无需重新连接
2. **对话历史侧边栏**：显示用户的历史对话列表，支持切换、删除、新建对话
3. **对话标题自动生成**：根据用户第一条消息自动提取前 30 字符作为对话标题
4. **Supabase 云端同步**：对话和消息持久化到云端，支持多设备访问
5. **列表增量更新优化**：新建对话时只添加新项，不重新加载整个列表，避免闪屏

### 技术架构
- wagmi v2 + RainbowKit v2 钱包集成
- cookieStorage + cookieToInitialState SSR 持久化方案
- Supabase PostgreSQL 云端数据库
- CustomEvent 跨组件通信机制

## 遇到了什么问题

### 问题 1：钱包刷新后连接丢失（核心难点）

**现象**：连接钱包 → 刷新页面 → 需要重新连接

**尝试的失败方案（3 次迭代）**：

#### 方案 A：useMemo + 环境检测 ❌
```typescript
const config = useMemo(() => {
  if (typeof window === 'undefined') {
    return createConfig({ /* SSR config */ })
  }
  return createConfig({ /* Full config */ })
}, [])
```
**失败原因**：SSR 和客户端创建了**不同的 config 对象**，wagmi 内部状态无法对应，导致连接丢失。

#### 方案 B：dynamic import ssr:false ❌
```typescript
const Providers = dynamic(() => import('./providers'), { ssr: false })
```
**失败原因**：Next.js 14 App Router 中 `ssr: false` 会导致每次渲染都**重新加载模块**，wagmi 的 localStorage 状态无法恢复。

#### 方案 C：cookieStorage 但 walletConnect 在 SSR 初始化 ❌
```typescript
export function getConfig() {
  return createConfig({
    ssr: true,
    connectors: [walletConnect({ ... }), injected()], // ❌ walletConnect 在 SSR 访问 indexedDB
    storage: createStorage({ storage: cookieStorage }),
  })
}
```
**失败原因**：walletConnect connector 在 SSR 阶段初始化时会访问 `indexedDB`（浏览器专属 API），导致 `ReferenceError: indexedDB is not defined`。

**最终成功方案**：双配置策略 + cookieToInitialState ✅
```typescript
// config.ts - SSR 只用 injected
export function getConfig() {
  return createConfig({
    ssr: true,
    connectors: [injected({ shimDisconnect: true })], // ✅ 不触发 indexedDB
    storage: createStorage({ storage: cookieStorage }),
  })
}

// providers.tsx - 客户端添加 walletConnect
export function Providers({ initialState }) {
  const [config] = useState(() => getFullConfig()) // ✅ 包含 walletConnect
  return <WagmiProvider config={config} initialState={initialState} />
}

// layout.tsx - 提取 cookie 状态
const initialState = cookieToInitialState(getConfig(), headers().get('cookie'))
```

**关键洞察**：
- wagmi v2 的连接状态存储在 cookie 中（通过 cookieStorage）
- SSR 阶段通过 `cookieToInitialState` 从请求 header 提取状态
- 传递给 WagmiProvider 的 `initialState` prop 实现状态恢复
- walletConnect connector **必须**在客户端初始化，不能在 SSR 阶段

### 问题 2：对话标题都是"新对话"

**原因**：创建对话时固定 `title: '新对话'`，没有根据内容更新

**解决方案**：
```typescript
export function generateConversationTitle(message: string): string {
  const cleanMessage = message
    .replace(/\*\*/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/\n/g, ' ')
    .trim()
  return cleanMessage.length <= 30 
    ? cleanMessage 
    : cleanMessage.substring(0, 30) + '...'
}
```

### 问题 3：新建对话时列表刷新闪屏

**原因**：使用 `conversation-updated` 事件触发整个列表重新加载（调用 API）

**解决方案**：改为增量更新
```typescript
// 新建对话时传递完整数据
window.dispatchEvent(new CustomEvent('conversation-created', {
  detail: { id, title, updated_at, message_count }
}))

// 侧边栏直接添加到数组头部
setConversations((prev) => [newConv, ...prev])
```

### 问题 4：TypeScript 类型错误

**错误**：`Type '"announced"' is not assignable to type...`

**原因**：wagmi v2 的 injected connector 不支持 `target: 'announced'` 配置

**解决**：改用 `injected()` 默认配置，wagmi v2 原生支持 EIP-6963 自动发现

## 学到了什么

### 1. wagmi v2 SSR 持久化三要素（核心经验）

```
✅ ssr: true
✅ cookieStorage + createStorage
✅ cookieToInitialState + initialState
```

这三个必须**同时配置**，缺一不可：
- `ssr: true`：防止 hydration 错误
- `cookieStorage`：将状态写入 cookie（而非 localStorage）
- `cookieToInitialState`：SSR 阶段从 cookie 提取状态

### 2. Next.js App Router 的 SSR 陷阱

- **Server Component 中不能调用客户端 API**：indexedDB、window、localStorage 等
- **dynamic import ssr:false 的副作用**：会重新加载模块，导致状态丢失
- **正确做法**：使用 `ssr: true` + cookieStorage，让 wagmi 处理 hydration

### 3. walletConnect 的 SSR 兼容性

- walletConnect SDK 在初始化时会访问 indexedDB
- **不能在 SSR 阶段初始化 walletConnect connector**
- 解决方案：双配置策略（SSR 基础配置 + 客户端完整配置）

### 4. wagmi v2 vs v1 的关键差异

| 特性 | wagmi v1 | wagmi v2 |
|------|----------|----------|
| 自动连接 | `autoConnect: true` | React 自动管理 |
| 持久化 | 内置 localStorage | 需配置 cookieStorage |
| SSR 支持 | 不支持 | 需要 ssr: true + cookieToInitialState |

### 5. 增量更新 vs 全量重新加载

**全量重新加载**（旧方案）：
```typescript
window.dispatchEvent(new CustomEvent('conversation-updated'))
// 侧边栏：loadConversations(address) // ❌ 调用 API，重新渲染整个列表
```

**增量更新**（新方案）：
```typescript
window.dispatchEvent(new CustomEvent('conversation-created', {
  detail: { /* 完整数据 */ }
}))
// 侧边栏：setConversations((prev) => [newConv, ...prev]) // ✅ 只添加新项
```

**性能差异**：
- 全量：API 调用 + 整个列表重新渲染 → 闪屏
- 增量：无 API 调用 + 单节点插入 → 平滑

### 6. CustomEvent 跨组件通信

当侧边栏和主页面是**独立的组件树**时，使用 CustomEvent 比状态提升或 Context 更简洁：

```typescript
// 发送方（page.tsx）
window.dispatchEvent(new CustomEvent('conversation-created', { detail }))

// 接收方（ConversationHistory.tsx）
useEffect(() => {
  const handler = (e: Event) => { /* ... */ }
  window.addEventListener('conversation-created', handler)
  return () => window.removeEventListener('conversation-created', handler)
}, [])
```

## 仍未解决的问题

### 1. walletConnect 扫码连接不可用

**原因**：walletConnect connector 在 SSR 阶段会报错，当前只配置了 injected connector

**影响**：用户无法通过扫码连接手机钱包（如 MetaMask Mobile、Trust Wallet）

**解决思路**：
- 方案 A：将 Providers 改为客户端组件（`dynamic ssr:false`），但会影响 SEO
- 方案 B：等待 walletConnect SDK 修复 SSR 兼容性
- 方案 C：使用条件渲染，SSR 阶段跳过 walletConnect

**优先级**：P2（当前 injected 已覆盖大部分桌面用户）

### 2. Supabase 失败时无降级策略

**现状**：Supabase 请求失败时只打印错误，没有降级到 localStorage

**风险**：网络不稳定时消息可能丢失

**解决思路**：
```typescript
try {
  await supabase.from('messages').insert(...)
} catch (error) {
  // 降级到 localStorage
  localStorage.setItem(`messages-${conversationId}`, JSON.stringify(messages))
}
```

**优先级**：P1（影响数据可靠性）

### 3. 对话标题生成过于简单

**现状**：只取前 30 字符，可能截断关键信息

**改进方向**：
- 接入 AI 模型生成智能摘要（如 "ETH 价格查询对话"）
- 提取关键词而非简单截断
- 支持用户手动修改标题

**优先级**：P3（体验优化，非功能缺陷）

## 下一步建议

### 立即执行（P0-P1）
1. ✅ **推送代码到远程仓库**：`git push origin main`
2. 🔧 **实现 Supabase 降级策略**：localStorage 兜底
3. 🧪 **进入 /audit 阶段**：对钱包连接和 Supabase 集成做安全审计

### 短期优化（P2）
4. 📱 **支持 walletConnect 扫码连接**：解决 SSR 兼容性问题
5. 🔍 **添加对话搜索功能**：按标题或内容搜索历史对话
6. 📊 **添加对话统计信息**：消息数量、最后活跃时间

### 长期规划（P3）
7. 🤖 **AI 智能摘要**：对话标题自动生成
8. 📤 **对话导出/导入**：支持 JSON/Markdown 格式
9. 🔄 **多设备同步优化**：WebSocket 实时更新

### 知识沉淀
10. 📝 **更新学习笔记**：将 wagmi v2 SSR 持久化三要素添加到学习笔记
11. 📚 **创建最佳实践文档**：Next.js + wagmi v2 + RainbowKit 集成指南
