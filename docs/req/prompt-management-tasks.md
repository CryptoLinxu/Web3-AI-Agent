# 提示词管理功能 - 需求拆解 (REQ)

## 任务拆解概览

将提示词管理功能拆解为 **5 个独立任务卡**，按执行顺序排列：

```
Task 1: 提示词配置文件创建 (FEAT)
    ↓
Task 2: 输入框布局优化 (FEAT)
    ↓
Task 3: 提示词选择器弹窗组件 (FEAT)
    ↓
Task 4: 提示词选择器集成到 ChatInput (FEAT)
    ↓
Task 5: 后端引用提示词配置 (REFACTOR)
```

---

## Task 1: 创建提示词配置文件

### 基本信息
- **类型**: FEAT
- **来源**: PRD - 提示词配置系统
- **优先级**: P0 (基础依赖)
- **预估工作量**: 1-2 小时

### 目标
创建 `apps/web/config/prompts.ts` 文件，集中管理所有提示词模板。

### 影响范围
- **新增文件**: `apps/web/config/prompts.ts`
- **影响文件**: 无（独立配置）

### 任务详情

#### 1.1 定义类型结构
```typescript
export interface PromptTemplate {
  id: string
  category: PromptCategory
  title: string
  content: string
  description?: string
}

export type PromptCategory = 
  | 'price'          // 价格查询
  | 'balance'        // 余额查询
  | 'gas'            // Gas 查询
  | 'token'          // Token 查询
  | 'transfer'       // 转账操作
  | 'system'         // 系统提示词
```

#### 1.2 梳理所有场景提示词

**价格查询类 (price)**:
- `price-eth`: "查询 ETH 当前价格"
- `price-btc`: "查询 BTC 当前价格"
- `price-sol`: "查询 SOL 当前价格"
- `price-matic`: "查询 MATIC 当前价格"
- `price-bnb`: "查询 BNB 当前价格"

**余额查询类 (balance)**:
- `balance-my-eth`: "查询我的 Ethereum 余额"
- `balance-my-polygon`: "查询我的 Polygon 余额"
- `balance-my-bsc`: "查询我的 BSC 余额"
- `balance-address`: "查询指定地址的余额"

**Gas 查询类 (gas)**:
- `gas-eth`: "查询 Ethereum 当前 Gas 价格"
- `gas-polygon`: "查询 Polygon 当前 Gas 价格"
- `gas-bsc`: "查询 BSC 当前 Gas 价格"

**Token 查询类 (token)**:
- `token-info`: "查询 USDT Token 信息"
- `token-balance`: "查询我的 USDT 余额"

**转账操作类 (transfer)**:
- `transfer-eth`: "转账 0.1 ETH 到 0x..."
- `transfer-usdt`: "转账 100 USDT 到 0x..."

**系统提示词 (system)**:
- `system-base`: SYSTEM_PROMPT_BASE（从 route.ts 迁移）

#### 1.3 导出配置
```typescript
export const PROMPT_TEMPLATES: PromptTemplate[] = [...]
export const SYSTEM_PROMPT_BASE: string = "..."

// 按分类导出的辅助函数
export function getPromptsByCategory(category: PromptCategory): PromptTemplate[]
export function getPromptById(id: string): PromptTemplate | undefined
```

### 依赖关系
- **前置依赖**: 无
- **后置依赖**: Task 5 (后端引用)

### 验收标准
- [ ] `apps/web/config/prompts.ts` 文件创建成功
- [ ] 包含所有 6 个分类的提示词模板
- [ ] SYSTEM_PROMPT_BASE 从 route.ts 迁移过来
- [ ] TypeScript 类型定义完整
- [ ] 导出辅助查询函数
- [ ] 提示词内容与实际场景匹配（覆盖率 100%）

### 下一跳
→ Task 2: 输入框布局优化

---

## Task 2: 优化输入框布局

### 基本信息
- **类型**: FEAT
- **来源**: PRD - 输入框布局优化
- **优先级**: P1 (独立改动)
- **预估工作量**: 30 分钟

### 目标
将 ChatInput 组件底部的快捷键提示从左侧移到右侧，靠近发送按钮。

### 影响范围
- **修改文件**: `apps/web/components/ChatInput.tsx` (第 67-70 行)

### 任务详情

#### 2.1 当前布局
```tsx
<div className="flex items-center justify-between mt-2 px-2">
  <p>Enter 发送 · Shift+Enter 换行</p>  // 左侧
  <p>数据仅供参考，不构成投资建议</p>     // 右侧
</div>
```

#### 2.2 目标布局
```tsx
<div className="flex items-center justify-between mt-2 px-2">
  <div className="flex-1">  // 左侧预留空间（给提示词入口按钮）
    {/* 空 */}
  </div>
  <div className="flex items-center gap-3">  // 右侧
    <p>Enter 发送 · Shift+Enter 换行</p>
    <p>数据仅供参考，不构成投资建议</p>
  </div>
</div>
```

#### 2.3 样式要求
- 保持原有字体大小 (`text-[10px]`)
- 保持原有颜色 (`text-[rgb(var(--text-muted))]`)
- 两个提示之间间距 `gap-3`
- 响应式：移动端自动换行

### 依赖关系
- **前置依赖**: 无
- **后置依赖**: Task 4 (需要左侧空间放置入口按钮)

### 验收标准
- [ ] "Enter 发送 · Shift+Enter 换行"显示在右侧
- [ ] 与"数据仅供参考"并列，间距合理
- [ ] 左侧空间留空（为 Task 4 预留）
- [ ] 样式与原设计一致
- [ ] 移动端显示正常

### 下一跳
→ Task 3: 提示词选择器弹窗组件

---

## Task 3: 创建提示词选择器弹窗组件

### 基本信息
- **类型**: FEAT
- **来源**: PRD - 提示词选择器组件
- **优先级**: P0 (核心功能)
- **预估工作量**: 3-4 小时

### 目标
创建独立的 `PromptSelector` 组件，实现提示词弹窗展示和选择功能。

### 影响范围
- **新增文件**: 
  - `apps/web/components/PromptSelector.tsx` (主组件)
  - `apps/web/components/PromptSelectorModal.tsx` (弹窗容器)
- **依赖文件**: `apps/web/config/prompts.ts` (Task 1 产出)

### 任务详情

#### 3.1 PromptSelectorModal 组件（弹窗容器）

**Props**:
```typescript
interface PromptSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPrompt: (prompt: PromptTemplate) => void
}
```

**功能**:
- 固定定位遮罩层 (`fixed inset-0`)
- 居中弹窗或底部抽屉（响应式）
- 点击遮罩层关闭
- ESC 键关闭
- 淡入 + 缩放动画

**动画实现**:
```tsx
// 使用 Tailwind transition 类
className={`
  transition-all duration-300 ease-out
  ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
`}
```

#### 3.2 PromptSelector 组件（内容区）

**布局结构**:
```
┌─────────────────────────────┐
│  提示词模板              [×] │
├─────────────────────────────┤
│  📊 价格查询                 │
│  ┌───────────────────────┐  │
│  │ 查询 ETH 价格      [→] │  │
│  │ 查询 BTC 价格      [→] │  │
│  └───────────────────────┘  │
│                              │
│  💰 余额查询                 │
│  ┌───────────────────────┐  │
│  │ 查询我的 ETH 余额  [→] │  │
│  │ 查询我的 USDT 余额 [→] │  │
│  └───────────────────────┘  │
│                              │
│  ...更多分类                 │
└─────────────────────────────┘
```

**功能**:
- 按分类分组展示
- 每个分类有图标和标题
- 每个提示词项：标题 + 描述（可选）+ 使用按钮
- 使用按钮：圆形，带 → 箭头 icon
- 悬停高亮效果
- 支持滚动
- **点击即填充**：选择提示词后直接填充到输入框，不自动发送，用户可自由修改

**使用按钮样式**:
```tsx
<button className="
  w-8 h-8 rounded-full 
  bg-primary-500/10 hover:bg-primary-500/20
  text-primary-600 hover:text-primary-700
  flex items-center justify-center
  transition-colors duration-200
">
  <svg>→</svg>
</button>
```

#### 3.3 交互逻辑

```typescript
const handleSelectPrompt = (prompt: PromptTemplate) => {
  onSelectPrompt(prompt)  // 回调给父组件，填充到输入框
  onClose()              // 关闭弹窗
}
```

**重要说明**：
- 提示词选择后**仅填充到输入框**，不会自动发送
- 用户可以在输入框中**自由修改**填充的提示词
- 输入框**始终保持可编辑状态**，用户可以随时自定义输入

### 依赖关系
- **前置依赖**: Task 1 (需要提示词配置)
- **后置依赖**: Task 4 (需要集成到 ChatInput)

### 验收标准
- [ ] 弹窗打开/关闭动画流畅
- [ ] 按分类分组展示，结构清晰
- [ ] 每个提示词右侧有圆形箭头按钮
- [ ] 点击按钮触发 onSelectPrompt 回调
- [ ] 点击遮罩层或 ESC 键关闭弹窗
- [ ] 移动端显示为底部抽屉
- [ ] 主题切换正常（亮色/暗色）
- [ ] TypeScript 类型完整

### 下一跳
→ Task 4: 提示词选择器集成到 ChatInput

---

## Task 4: 集成提示词选择器到 ChatInput

### 基本信息
- **类型**: FEAT
- **来源**: PRD - 提示词选择器集成
- **优先级**: P0 (核心功能)
- **预估工作量**: 1-2 小时

### 目标
在 ChatInput 组件中添加入口按钮，并集成 PromptSelector 弹窗。

### 影响范围
- **修改文件**: 
  - `apps/web/components/ChatInput.tsx` (添加入口和状态管理)
- **依赖文件**: 
  - `apps/web/components/PromptSelector.tsx` (Task 3 产出)

### 任务详情

#### 4.1 修改 ChatInput Props

```typescript
interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
  onPromptSelect?: (prompt: string) => void  // 新增
}
```

#### 4.2 添加入口按钮

**位置**: 输入框下方左侧（Task 2 预留的空间）

```tsx
<div className="flex items-center justify-between mt-2 px-2">
  {/* 左侧：提示词入口按钮 */}
  <button
    onClick={() => setIsPromptSelectorOpen(true)}
    className="p-1.5 rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
    title="快捷提示词"
  >
    <svg className="w-4 h-4 text-[rgb(var(--text-muted))]">
      {/* 模板/快捷方式图标 */}
    </svg>
  </button>
  
  {/* 右侧：快捷键提示 */}
  <div className="flex items-center gap-3">
    <p>Enter 发送 · Shift+Enter 换行</p>
    <p>数据仅供参考，不构成投资建议</p>
  </div>
</div>
```

#### 4.3 状态管理和弹窗集成

```typescript
const [isPromptSelectorOpen, setIsPromptSelectorOpen] = useState(false)

const handlePromptSelect = (prompt: PromptTemplate) => {
  // 填充提示词到输入框（覆盖当前内容）
  setInput(prompt.content)
  
  // 可选：聚焦输入框，方便用户立即修改或发送
  textareaRef.current?.focus()
}
```

**交互说明**：
- 选择提示词后**直接填充**到输入框（不弹确认框）
- 用户可以**立即修改**填充的内容
- 输入框**任何时候都可自定义输入**，不受提示词限制
- 填充后自动聚焦，用户可直接按 Enter 发送或继续编辑

#### 4.4 输入框填充逻辑

**设计原则**：
- ✅ 提示词选择后直接填充，**不弹确认框**
- ✅ 用户可以**自由修改**填充的提示词
- ✅ 输入框**任何时候都可自定义**输入任何内容
- ✅ 填充后自动聚焦，方便用户立即操作

```typescript
const handlePromptSelect = (prompt: PromptTemplate) => {
  // 直接填充（覆盖当前内容）
  setInput(prompt.content)
  
  // 关闭弹窗
  setIsPromptSelectorOpen(false)
  
  // 聚焦输入框，方便用户修改或发送
  textareaRef.current?.focus()
}
```

**用户体验**：
1. 用户点击提示词 → 填充到输入框 → 弹窗关闭
2. 用户可以立即按 Enter 发送，或修改后发送
3. 用户也可以忽略提示词，完全自定义输入

### 依赖关系
- **前置依赖**: Task 2, Task 3
- **后置依赖**: 无

### 验收标准
- [ ] 输入框下方左侧显示提示词入口按钮
- [ ] 点击按钮弹出 PromptSelector 弹窗
- [ ] 选择提示词后直接填充到输入框（不弹确认框）
- [ ] 用户可以自由修改填充的提示词
- [ ] 输入框任何时候都可自定义输入
- [ ] 填充后输入框自动聚焦
- [ ] 不影响现有发送功能
- [ ] 主题切换正常

### 下一跳
→ Task 5: 后端引用提示词配置

---

## Task 5: 后端引用提示词配置

### 基本信息
- **类型**: REFACTOR
- **来源**: PRD - SYSTEM_PROMPT_BASE 迁移
- **优先级**: P1 (配置统一)
- **预估工作量**: 30 分钟

### 目标
将 `apps/web/app/api/chat/route.ts` 中的 SYSTEM_PROMPT_BASE 改为从配置文件导入。

### 影响范围
- **修改文件**: `apps/web/app/api/chat/route.ts` (第 160-206 行)
- **依赖文件**: `apps/web/config/prompts.ts` (Task 1 产出)

### 任务详情

#### 5.1 当前代码
```typescript
// apps/web/app/api/chat/route.ts (第 160 行)
const SYSTEM_PROMPT_BASE = `你是 Web3 AI Agent...`
```

#### 5.2 目标代码
```typescript
// apps/web/app/api/chat/route.ts
import { SYSTEM_PROMPT_BASE } from '@/config/prompts'

// 删除原有的 SYSTEM_PROMPT_BASE 定义
```

#### 5.3 验证
- 确保导入路径正确
- 确保 `createSystemPrompt` 函数正常工作
- 测试钱包上下文注入功能

### 依赖关系
- **前置依赖**: Task 1
- **后置依赖**: 无

### 验收标准
- [ ] route.ts 中删除硬编码的 SYSTEM_PROMPT_BASE
- [ ] 从 `@/config/prompts` 导入 SYSTEM_PROMPT_BASE
- [ ] API 功能正常，不影响现有聊天
- [ ] 钱包上下文注入正常
- [ ] TypeScript 编译通过

### 下一跳
→ 进入 check-in 阶段（任务拆解完成）

---

## 执行顺序总结

```
Task 1 (配置) → Task 2 (布局) → Task 3 (弹窗) → Task 4 (集成) → Task 5 (后端)
   P0            P1              P0              P0              P1
   1-2h          0.5h            3-4h            1-2h            0.5h
```

**总预估工作量**: 6-8 小时

**关键路径**: Task 1 → Task 3 → Task 4

**并行可能性**: 
- Task 2 可以与 Task 1 并行（无依赖）
- Task 5 可以与 Task 2/3/4 并行（仅依赖 Task 1）

---

## 下一跳

→ **check-in**: 确认任务拆解方案、边界、完成标准
