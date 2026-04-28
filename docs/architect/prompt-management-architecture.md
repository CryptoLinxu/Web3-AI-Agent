# 提示词管理功能架构说明

## 目标

设计提示词管理功能的组件架构，包括：
1. 提示词配置文件的数据结构
2. PromptSelector 弹窗组件树
3. 组件间的接口契约和 Props 定义
4. 弹窗动画和响应式布局方案

---

## 模块边界

### 影响范围

```
apps/web/
├── config/                          # 新建目录
│   └── prompts.ts                   # 提示词配置文件
├── components/
│   ├── ChatInput.tsx                # 修改：添加入口按钮和弹窗集成
│   ├── PromptSelector.tsx           # 新建：提示词选择器内容组件
│   └── PromptSelectorModal.tsx      # 新建：弹窗容器组件
└── app/api/chat/
    └── route.ts                     # 修改：引用配置文件
```

### 模块职责

| 模块 | 职责 | 类型 |
|------|------|------|
| `config/prompts.ts` | 提示词数据配置和类型定义 | 配置层 |
| `PromptSelectorModal` | 弹窗容器（遮罩层、动画、关闭逻辑） | UI 层 |
| `PromptSelector` | 提示词列表展示（分类、按钮、滚动） | UI 层 |
| `ChatInput` | 输入框 + 入口按钮 + 状态管理 | UI 层 |
| `route.ts` | 后端 API 引用配置 | API 层 |

### 依赖关系

```
ChatInput
  ├── PromptSelectorModal
  │     └── PromptSelector
  │           └── config/prompts.ts
  └── config/prompts.ts (间接)

route.ts
  └── config/prompts.ts
```

---

## 数据流

### 1. 提示词配置数据流

```typescript
// config/prompts.ts
PROMPT_TEMPLATES: PromptTemplate[]
  ↓
getPromptsByCategory(category) → filtered prompts
  ↓
PromptSelector 组件消费
  ↓
用户点击使用按钮
  ↓
onSelectPrompt(prompt) 回调
  ↓
ChatInput.handlePromptSelect
  ↓
setInput(prompt.content) 填充到输入框
```

### 2. 弹窗状态流

```typescript
ChatInput 组件状态:
  const [isPromptSelectorOpen, setIsPromptSelectorOpen] = useState(false)
  
用户点击入口按钮:
  onClick → setIsPromptSelectorOpen(true)
  
用户选择提示词或关闭:
  onSelectPrompt → setIsPromptSelectorOpen(false)
  onClose → setIsPromptSelectorOpen(false)
  ESC 键 → setIsPromptSelectorOpen(false)
  点击遮罩层 → setIsPromptSelectorOpen(false)
```

### 3. 完整交互流程

```
用户操作流程:
1. 点击 ChatInput 左侧入口按钮
   ↓
2. isPromptSelectorOpen = true
   ↓
3. PromptSelectorModal 显示（淡入 + 缩放动画）
   ↓
4. PromptSelector 渲染提示词列表（按分类分组）
   ↓
5. 用户点击某个提示词的 → 按钮
   ↓
6. onSelectPrompt(prompt) 触发
   ↓
7. ChatInput.handlePromptSelect(prompt)
   ↓
8. setInput(prompt.content) 填充输入框
   ↓
9. textareaRef.current?.focus() 自动聚焦
   ↓
10. isPromptSelectorOpen = false 关闭弹窗
   ↓
11. 用户可修改内容或直接按 Enter 发送
```

---

## 消息流

### 组件通信

```
ChatInput (父组件)
  │
  ├── Props 传递给 PromptSelectorModal:
  │     - isOpen: boolean
  │     - onClose: () => void
  │     - onSelectPrompt: (prompt: PromptTemplate) => void
  │
  └── PromptSelectorModal (子组件)
        │
        ├── Props 传递给 PromptSelector:
        │     - onSelectPrompt: (prompt: PromptTemplate) => void
        │
        └── PromptSelector (孙组件)
              │
              └── 用户点击按钮 → onSelectPrompt(prompt)
                    ↑
              回调链向上传递
                    ↑
              ChatInput.handlePromptSelect 接收
```

---

## 接口契约

### 1. 提示词配置接口

#### 类型定义

```typescript
// apps/web/config/prompts.ts

export type PromptCategory = 
  | 'price'          // 价格查询
  | 'balance'        // 余额查询
  | 'gas'            // Gas 查询
  | 'token'          // Token 查询
  | 'transfer'       // 转账操作
  | 'system'         // 系统提示词

export interface PromptTemplate {
  id: string                    // 唯一标识，如 'price-eth'
  category: PromptCategory      // 分类
  title: string                 // 标题（展示用）
  content: string               // 提示词内容（填充到输入框）
  description?: string          // 描述（可选）
}
```

#### 导出接口

```typescript
// 主数据
export const PROMPT_TEMPLATES: PromptTemplate[]

// 系统提示词
export const SYSTEM_PROMPT_BASE: string

// 辅助函数
export function getPromptsByCategory(category: PromptCategory): PromptTemplate[]
export function getPromptById(id: string): PromptTemplate | undefined
export function getAllCategories(): { category: PromptCategory; icon: string; label: string }[]
```

### 2. PromptSelectorModal 接口

#### Props 定义

```typescript
// apps/web/components/PromptSelectorModal.tsx

interface PromptSelectorModalProps {
  isOpen: boolean                           // 弹窗是否打开
  onClose: () => void                       // 关闭回调
  onSelectPrompt: (prompt: PromptTemplate) => void  // 选择提示词回调
}
```

#### 职责
- 管理弹窗的显示/隐藏状态
- 处理遮罩层点击关闭
- 处理 ESC 键关闭
- 控制动画效果
- 响应式布局（桌面端居中，移动端底部抽屉）

### 3. PromptSelector 接口

#### Props 定义

```typescript
// apps/web/components/PromptSelector.tsx

interface PromptSelectorProps {
  onSelectPrompt: (prompt: PromptTemplate) => void  // 选择提示词回调
}
```

#### 职责
- 从 `config/prompts.ts` 读取提示词数据
- 按分类分组展示
- 渲染每个提示词项（标题 + 描述 + 使用按钮）
- 处理按钮点击事件

#### 内部数据结构

```typescript
interface CategoryGroup {
  category: PromptCategory
  icon: string          // 分类图标（emoji 或 SVG）
  label: string         // 分类名称
  prompts: PromptTemplate[]
}
```

### 4. ChatInput 接口扩展

#### 修改后的 Props

```typescript
// apps/web/components/ChatInput.tsx

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
  // 新增（可选）
  onPromptSelect?: (prompt: PromptTemplate) => void  
}
```

**说明**: `onPromptSelect` 为可选 Props，如果父组件需要监听提示词选择事件可以传入，否则 ChatInput 内部自行处理。

#### 新增状态

```typescript
const [isPromptSelectorOpen, setIsPromptSelectorOpen] = useState(false)
const textareaRef = useRef<HTMLTextAreaElement>(null)
```

#### 新增方法

```typescript
const handlePromptSelect = (prompt: PromptTemplate) => {
  setInput(prompt.content)              // 填充提示词
  setIsPromptSelectorOpen(false)        // 关闭弹窗
  textareaRef.current?.focus()          // 自动聚焦
  
  // 如果父组件传入了 onPromptSelect，也触发
  onPromptSelect?.(prompt)
}
```

---

## 错误处理

### 1. 提示词配置错误

**场景**: 配置文件加载失败或数据格式错误

**处理策略**:
```typescript
try {
  const prompts = getPromptsByCategory('price')
  if (!prompts || prompts.length === 0) {
    console.warn('提示词配置为空')
    // 降级：显示空状态或隐藏该分类
  }
} catch (error) {
  console.error('提示词配置加载失败:', error)
  // 降级：显示错误提示或隐藏入口按钮
}
```

### 2. 弹窗渲染错误

**场景**: 弹窗组件渲染异常

**处理策略**:
- 使用 React Error Boundary 包裹弹窗组件
- 渲染失败时静默降级，不影响主功能

### 3. 输入框填充错误

**场景**: 提示词内容异常（空字符串、超长文本）

**处理策略**:
```typescript
const handlePromptSelect = (prompt: PromptTemplate) => {
  if (!prompt.content || prompt.content.trim().length === 0) {
    console.warn('提示词内容为空')
    return
  }
  
  // 可选：限制最大长度
  if (prompt.content.length > 1000) {
    console.warn('提示词内容过长')
    // 截断或拒绝
  }
  
  setInput(prompt.content)
  // ...
}
```

---

## 动画和响应式方案

### 1. 弹窗动画

#### 打开动画

```tsx
// PromptSelectorModal.tsx

<div className={`
  fixed inset-0 z-50 flex items-center justify-center
  transition-all duration-300 ease-out
  ${isOpen 
    ? 'opacity-100 pointer-events-auto' 
    : 'opacity-0 pointer-events-none'
  }
`}>
  {/* 遮罩层 */}
  <div 
    className="absolute inset-0 bg-black/50"
    onClick={onClose}
  />
  
  {/* 弹窗内容 */}
  <div className={`
    relative z-10 w-full max-w-2xl max-h-[80vh] 
    bg-[rgb(var(--bg-primary))]
    rounded-2xl shadow-2xl
    transition-all duration-300 ease-out
    ${isOpen 
      ? 'scale-100 translate-y-0' 
      : 'scale-95 translate-y-4'
    }
  `}>
    {/* 内容区 */}
  </div>
</div>
```

**动画参数**:
- **持续时间**: 300ms
- **缓动函数**: ease-out
- **效果**: 淡入（opacity 0→1）+ 缩放（scale 0.95→1）+ 位移（translateY 16px→0）

#### 关闭动画

- 反向执行打开动画
- 使用 `pointer-events-none` 防止动画期间误触

### 2. 响应式布局

#### 桌面端（≥768px）

```tsx
// 居中弹窗
className="fixed inset-0 z-50 flex items-center justify-center p-4"

// 弹窗尺寸
className="w-full max-w-2xl max-h-[80vh] rounded-2xl"
```

**特点**:
- 垂直水平居中
- 最大宽度 672px（max-w-2xl）
- 最大高度 80vh
- 圆角 2xl

#### 移动端（<768px）

```tsx
// 底部抽屉
className="fixed inset-x-0 bottom-0 z-50 p-4"

// 弹窗尺寸
className="w-full max-h-[90vh] rounded-t-2xl"
```

**特点**:
- 底部对齐
- 宽度 100%
- 最大高度 90vh
- 顶部圆角

#### 响应式切换

```tsx
className={`
  fixed z-50
  // 桌面端
  md:inset-0 md:flex md:items-center md:justify-center md:p-4
  // 移动端
  inset-x-0 bottom-0 p-4
`}
```

### 3. 提示词列表滚动

```tsx
// 内容区可滚动
<div className="overflow-y-auto max-h-[calc(80vh-60px)] p-6">
  {/* 提示词列表 */}
</div>
```

**特点**:
- 最大高度 = 弹窗高度 - 标题栏高度
- 超出部分垂直滚动
- 平滑滚动（scroll-behavior: smooth）

---

## 组件树结构

```
ChatInput
├── textarea (输入框)
├── button (发送按钮)
├── div (底部提示区)
│   ├── button (提示词入口按钮) ← 新增
│   ├── p (Enter 发送 · Shift+Enter 换行) ← 移到右侧
│   └── p (数据仅供参考)
└── PromptSelectorModal ← 新增
    ├── div (遮罩层)
    └── div (弹窗容器)
        ├── div (标题栏)
        │   ├── h2 (提示词模板)
        │   └── button (关闭按钮 ×)
        └── PromptSelector ← 新增
            ├── div (滚动容器)
            └── CategoryGroup[] (分类组)
                ├── h3 (分类标题 + 图标)
                └── PromptItem[] (提示词项)
                    ├── div (标题 + 描述)
                    └── button (使用按钮 →)
```

---

## 风险点

### 1. 性能风险

**风险**: 提示词配置过多导致首屏加载慢

**缓解方案**:
- 初期预计 < 50 个提示词，无需优化
- 如果超过 100 个，考虑懒加载或虚拟列表
- 配置文件使用静态导入，Next.js 会自动 code-split

### 2. z-index 冲突

**风险**: 弹窗被其他组件遮挡

**缓解方案**:
- 使用 `z-50` (z-index: 50)
- 项目中最高 z-index 检查：
  - ConversationHistory 侧边栏: z-40
  - 移动端菜单按钮: z-50
  - PromptSelectorModal: z-50 ✅（同级，最后渲染的在上层）

### 3. 移动端键盘遮挡

**风险**: 移动端输入框聚焦后，虚拟键盘遮挡弹窗

**缓解方案**:
- 弹窗关闭后再聚焦输入框
- 或使用 `scrollIntoView({ behavior: 'smooth' })` 滚动到可视区域

### 4. 主题兼容性

**风险**: 弹窗样式在亮色/暗色主题下不一致

**缓解方案**:
- 使用 CSS 变量（`rgb(var(--bg-primary))`）
- 跟随系统主题自动切换
- 测试两种主题下的显示效果

### 5. 无障碍访问 (a11y)

**风险**: 键盘用户无法操作弹窗

**缓解方案**:
- ESC 键关闭
- Tab 键遍历提示词按钮
- Enter 键选择提示词
- 添加 `aria-*` 属性（可选，后续优化）

---

## 文件结构总览

```
apps/web/
├── config/
│   └── prompts.ts                    # 提示词配置（新建）
├── components/
│   ├── ChatInput.tsx                 # 输入框组件（修改）
│   ├── PromptSelector.tsx            # 提示词选择器（新建）
│   └── PromptSelectorModal.tsx       # 弹窗容器（新建）
└── app/api/chat/
    └── route.ts                      # 后端 API（修改引用）
```

---

## 下一步

→ **qa**: 制定验收标准和测试用例

或

→ **coder**: 直接开始实施代码（如果验收标准已清晰）
