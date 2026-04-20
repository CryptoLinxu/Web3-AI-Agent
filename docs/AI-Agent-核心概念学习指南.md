# AI Agent 核心概念学习指南

> 本指南专为"使用 AI 开发但不理解原理"的开发者设计，采用**渐进式学习 + 代码对照**的方式。

---

## 📚 学习路径总览

```
第 1 步：LLM API 基础（1-2 天）
    ↓
第 2 步：Chat 与对话管理（1 天）
    ↓
第 3 步：Function Calling 工具调用（2-3 天）⭐ 核心
    ↓
第 4 步：Agent Loop 智能循环（2-3 天）⭐ 核心
    ↓
第 5 步：Memory 与上下文管理（2 天）
    ↓
第 6 步：RAG 检索增强（进阶，3-5 天）
```

---

## 第 1 步：LLM API 基础

### 1.1 什么是 LLM API？

**通俗理解**：LLM API 就像给 AI 打电话的接口，你发消息，AI 回复你。

### 1.2 核心概念

```
用户输入（Prompt） → LLM API → AI 回复（Completion）
```

### 1.3 本项目中的实现

查看代码：`packages/ai-config/src/providers/openai.ts`

```typescript
// 这就是最基础的 LLM API 调用
const response = await this.client.chat.completions.create({
  model: 'qwen-turbo',           // 用哪个 AI 模型
  messages: [                    // 对话历史
    { role: 'system', content: '你是助手' },
    { role: 'user', content: '你好' }
  ],
  temperature: 0.7,              // 创造性程度（0-1）
  max_tokens: 2000               // 最大回复长度
})
```

### 1.4 关键参数解释

| 参数 | 作用 | 类比 |
|------|------|------|
| `model` | 选择 AI 模型 | 选哪个老师回答问题 |
| `messages` | 对话历史 | 聊天记录 |
| `temperature` | 回答的随机性 | 0=严谨，1=creative |
| `max_tokens` | 最大回复长度 | 限制回答字数 |

### 1.5 动手实验

```bash
# 在项目根目录执行，测试 API 调用
curl https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions \
  -H "Authorization: Bearer sk-8b3b8a00277f496baaf7b340f0ccbe49" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen-turbo",
    "messages": [{"role": "user", "content": "用一句话解释什么是 AI Agent"}]
  }'
```

**预期输出**：AI 会返回一段文字解释 AI Agent。

---

## 第 2 步：Chat 与对话管理

### 2.1 什么是 Chat？

**通俗理解**：Chat = 多轮对话，AI 能记住前面说了什么。

### 2.2 消息角色

```typescript
// 查看：apps/web/app/api/chat/route.ts

messages: [
  { role: 'system', content: '你是 Web3 AI 助手' },  // 系统设定人设
  { role: 'user', content: 'ETH 价格多少？' },        // 用户提问
  { role: 'assistant', content: '让我查一下...' },    // AI 回答
  { role: 'user', content: '那 BTC 呢？' }            // 用户追问
]
```

### 2.3 对话流程

```
用户: "ETH 价格多少？"
  ↓
AI: "让我查询一下..."
  ↓
用户: "那 BTC 呢？"（AI 知道你在问价格）
  ↓
AI: "BTC 价格是..."
```

### 2.4 本项目实现

查看代码：`apps/web/app/page.tsx`

```typescript
// 这就是对话管理
const [messages, setMessages] = useState<Message[]>([
  { role: 'assistant', content: '你好！我是 Web3 AI Agent...' }
])

const handleSendMessage = async (content: string) => {
  // 1. 添加用户消息
  setMessages([...messages, { role: 'user', content }])
  
  // 2. 发送给 AI API
  const response = await fetch('/api/chat', {
    body: JSON.stringify({ messages })  // 发送完整对话历史
  })
  
  // 3. 添加 AI 回复
  setMessages([...messages, aiResponse])
}
```

### 2.5 核心理解

**关键点**：每次都要发送**完整的对话历史**，AI 才能记住上下文。

---

## 第 3 步：Function Calling 工具调用 ⭐ 核心

### 3.1 为什么需要 Function Calling？

**问题**：AI 不知道今天的 ETH 价格，因为它训练数据是过去的。

**解决**：让 AI 调用外部工具获取实时数据。

### 3.2 工作流程

```
用户: "ETH 价格多少？"
  ↓
AI 判断: 需要调用工具 getETHPrice
  ↓
AI 返回: { tool_calls: [{ name: 'getETHPrice' }] }
  ↓
代码执行: 调用 getETHPrice() → 返回 $2,284
  ↓
AI 再次回答: "ETH 当前价格是 $2,284"
```

### 3.3 代码实现详解

#### 步骤 1：定义工具

查看：`apps/web/app/api/chat/route.ts`

```typescript
const tools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'getETHPrice',                    // 工具名称
      description: '获取 ETH 当前价格（美元）', // 工具说明
      parameters: {                            // 工具需要的参数
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getWalletBalance',
      description: '查询以太坊钱包地址的 ETH 余额',
      parameters: {
        type: 'object',
        properties: {
          address: {                          // 需要钱包地址参数
            type: 'string',
            description: '以太坊钱包地址',
          },
        },
        required: ['address'],
      },
    },
  }
]
```

#### 步骤 2：第一次调用 - AI 决定是否用工具

```typescript
const response = await provider.chat(messages, { tools })

// AI 可能返回：
// 情况 1：需要工具
{
  content: null,
  toolCalls: [{
    id: 'call_123',
    function: {
      name: 'getETHPrice',
      arguments: '{}'
    }
  }]
}

// 情况 2：不需要工具
{
  content: '你好！有什么可以帮你的？',
  toolCalls: undefined
}
```

#### 步骤 3：执行工具

```typescript
// 执行工具获取结果
const result = await getETHPrice()
// 返回: { price: 2284.32, currency: 'USD' }
```

#### 步骤 4：第二次调用 - AI 生成最终回答

```typescript
// 把工具结果告诉 AI
const messagesWithResults = [
  ...messages,
  { role: 'assistant', content: '', toolCalls: [...] },
  { 
    role: 'tool',                              // 工具结果
    content: JSON.stringify(result),           // "{ price: 2284.32 }"
    tool_call_id: 'call_123'
  }
]

// AI 生成自然语言回答
const finalResponse = await provider.chat(messagesWithResults)
// 返回: "ETH 当前价格是 $2,284.32"
```

### 3.4 完整流程图

```
┌─────────────┐
│  用户提问    │ "ETH 价格？"
└──────┬──────┘
       ↓
┌─────────────────────┐
│  AI 第一次调用       │
│  输入：对话历史 + 工具定义
│  输出：需要调用 getETHPrice
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│  执行工具            │
│  getETHPrice() → $2,284
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│  AI 第二次调用       │
│  输入：对话历史 + 工具结果
│  输出："ETH 价格是 $2,284"
└──────┬──────────────┘
       ↓
┌─────────────┐
│  返回给用户  │
└─────────────┘
```

### 3.5 动手实验

```bash
# 在浏览器中测试
# 1. 访问 http://localhost:3001
# 2. 发送："ETH 价格多少？"
# 3. 打开浏览器开发者工具 → Network
# 4. 查看 /api/chat 请求，你会看到两次调用
```

---

## 第 4 步：Agent Loop 智能循环 ⭐ 核心

### 4.1 什么是 Agent Loop？

**通俗理解**：Agent Loop = AI 可以连续调用多个工具，直到完成任务。

### 4.2 简单 vs 智能

**普通 Chat**：
```
用户: "ETH 价格？"
AI: "$2,284"
结束
```

**Agent Loop**：
```
用户: "ETH 价格？我的钱包值多少钱？"
  ↓
AI 调用 getETHPrice → $2,284
  ↓
AI 调用 getWalletBalance → 1.5 ETH
  ↓
AI 计算: 1.5 × 2284 = $3,426
  ↓
AI: "ETH 价格 $2,284，你的钱包价值 $3,426"
```

### 4.3 本项目实现

查看：`apps/web/app/api/chat/route.ts` 第 96-156 行

```typescript
// Agent Loop 的核心逻辑
if (response.toolCalls && response.toolCalls.length > 0) {
  // 1. 执行所有工具
  for (const toolCall of response.toolCalls) {
    const result = await executeTool(toolCall)
    toolCalls.push({ ...toolCall, result })
  }
  
  // 2. 构建包含工具结果的消息
  const messagesWithToolResults = [
    ...chatMessages,
    ...toolCalls.map(tc => ({
      role: 'tool',
      content: JSON.stringify(tc.result),
      tool_call_id: tc.id
    }))
  ]
  
  // 3. 让 AI 基于工具结果生成最终回答
  const finalResponse = await provider.chat(messagesWithToolResults)
}
```

### 4.4 循环的概念

虽然当前实现是**单次循环**（工具调用 → 回答），但可以扩展为**多次循环**：

```typescript
// 多次循环的伪代码
let maxLoops = 5
for (let i = 0; i < maxLoops; i++) {
  const response = await chat(messages, { tools })
  
  if (response.toolCalls) {
    // 执行工具
    const results = await executeTools(response.toolCalls)
    messages = [...messages, ...results]
    // 继续循环，让 AI 决定是否需要更多工具
  } else {
    // AI 不再需要工具，跳出循环
    break
  }
}
```

### 4.5 核心理解

**Agent = Chat + Tools + Loop**

- Chat：对话能力
- Tools：执行外部操作
- Loop：智能决定何时停止

---

## 第 5 步：Memory 与上下文管理

### 5.1 什么是 Memory？

**通俗理解**：Memory = AI 的记忆力，能记住历史对话。

### 5.2 当前实现

本项目使用**简单 Memory**：发送完整对话历史。

```typescript
// 每次发送所有消息
{
  messages: [
    { role: 'user', content: 'ETH 价格？' },
    { role: 'assistant', content: '$2,284' },
    { role: 'user', content: '那 BTC 呢？' }  // AI 知道你在问价格
  ]
}
```

### 5.3 Memory 的进化

| 级别 | 方式 | 优点 | 缺点 |
|------|------|------|------|
| L1 | 完整历史 | 简单 | Token 消耗大 |
| L2 | 滑动窗口 | 节省 Token | 丢失早期信息 |
| L3 | 摘要压缩 | 高效 | 实现复杂 |
| L4 | 向量数据库 | 长期记忆 | 需要 RAG |

### 5.4 本项目位置

当前：**L1 完整历史**（MVP 够用）

后续优化：当对话超过 20 轮时，压缩早期对话为摘要。

---

## 第 6 步：RAG 检索增强（进阶）

### 6.1 什么是 RAG？

**通俗理解**：RAG = 先检索相关知识，再让 AI 回答。

### 6.2 使用场景

```
场景：用户问"项目架构是什么？"
  ↓
普通 AI：不知道（训练数据中没有你的项目）
  ↓
RAG AI：
  1. 检索项目文档
  2. 找到 ARCHITECTURE.md
  3. 基于文档回答
```

### 6.3 RAG 工作流程

```
用户提问
  ↓
向量检索（找相关文档）
  ↓
检索结果 + 问题 → AI
  ↓
AI 基于文档回答
```

### 6.4 为什么 MVP 不需要？

- ✅ 当前功能：查询实时数据（价格、余额）
- ❌ 不需要：检索历史文档
- 📌 后续迭代：添加项目问答功能时才需要

---

## 🎯 学习检查清单

### 阶段 1：基础理解（1-2 天）

- [ ] 能解释 LLM API 的工作原理
- [ ] 能说明 `messages` 数组的作用
- [ ] 理解 `temperature` 和 `max_tokens` 的影响
- [ ] 能手动调用一次 API 并查看结果

### 阶段 2：工具调用（2-3 天）⭐

- [ ] 能画出 Function Calling 的完整流程图
- [ ] 能解释为什么要调用两次 API
- [ ] 能在代码中找到工具定义和执行位置
- [ ] 能自己添加一个新工具（比如查询 BTC 价格）

### 阶段 3：Agent Loop（2 天）⭐

- [ ] 能区分 Chat 和 Agent 的区别
- [ ] 能解释 Agent Loop 的停止条件
- [ ] 能画出多次循环的执行流程
- [ ] 能说出当前实现是几次循环

### 阶段 4：Memory（1-2 天）

- [ ] 能说明当前 Memory 的实现方式
- [ ] 能指出 Token 限制问题
- [ ] 能设计一个滑动窗口方案

### 阶段 5：RAG（进阶）

- [ ] 能解释 RAG 解决的问题
- [ ] 能画出 RAG 的工作流程
- [ ] 能判断什么场景需要 RAG

---

## 📖 推荐学习资源

### 视频教程
- [AI Agent 开发入门](https://www.bilibili.com/video/BV1xxx) - B 站（搜索最新视频）
- [LangChain 中文教程](https://www.langchain.com.cn/)

### 文档
- [OpenAI Function Calling 官方文档](https://platform.openai.com/docs/guides/function-calling)
- [通义千问 API 文档](https://help.aliyun.com/zh/dashscope/)

### 实践
- 本项目代码就是最好的学习材料！
- 逐行阅读 `apps/web/app/api/chat/route.ts`

---

## 💡 学习建议

1. **先跑通，再理解**：先用项目功能，再看代码
2. **画图理解**：把流程画成图，比看代码更直观
3. **修改实验**：改代码看效果，比如添加调试日志
4. **对照学习**：本文档 ↔ 实际代码对照着看

---

## 🚀 下一步

完成学习后，你可以：

1. **独立完成**：自己添加一个新工具（如查询 BTC 价格）
2. **优化现有**：改进 Memory 实现，添加滑动窗口
3. **深入理解**：阅读 OpenAI SDK 源码，理解底层原理

---

**学习进度追踪**：

- [ ] 第 1 步完成
- [ ] 第 2 步完成
- [ ] 第 3 步完成 ⭐
- [ ] 第 4 步完成 ⭐
- [ ] 第 5 步完成
- [ ] 第 6 步完成

祝你学习顺利！有任何问题随时问我。
