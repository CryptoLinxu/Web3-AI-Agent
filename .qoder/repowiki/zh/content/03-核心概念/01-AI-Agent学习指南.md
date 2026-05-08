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

**深入理解**：
- LLM = Large Language Model（大语言模型）
- API = Application Programming Interface（应用程序编程接口）
- LLM API = 通过 HTTP 请求调用云端 AI 模型的标准化接口

**核心原理**：
```
你的代码 → HTTP 请求 → 云端 AI 模型 → HTTP 响应 → 你的代码
          (JSON 格式)    (神经网络推理)   (JSON 格式)
```

### 1.2 核心概念

#### 1.2.1 Token（词元）

**什么是 Token？**
- AI 不直接理解文字，而是将文字拆分成 Token
- 1 个 Token ≈ 0.75 个英文单词 ≈ 1.5 个中文字
- 例子："你好世界" → ["你", "好", "世", "界"] (4 个 Token)

#### 1.2.2 Temperature（温度）

- 控制 AI 输出的随机性
- `temperature = 0`：确定性输出，适合代码生成
- `temperature = 1`：创造性输出，适合创意写作

#### 1.2.3 Max Tokens（最大 Token 数）

- 限制 AI 输出的最大长度
- 用于控制成本和避免过长响应

---

## 第 2 步：Chat 与对话管理

### 2.1 消息角色

Chat API 支持三种消息角色：

| 角色 | 说明 | 示例 |
|------|------|------|
| `system` | 系统提示，设定 AI 行为 | "你是一个专业的编程助手" |
| `user` | 用户输入 | "如何用 Python 读取文件？" |
| `assistant` | AI 回复 | "你可以使用 open() 函数..." |

### 2.2 对话历史

AI 本身**没有记忆**，每次调用都是独立的。要实现对话连续性，需要：

```typescript
// 每次调用时发送完整的对话历史
const messages = [
  { role: "user", content: "你好" },
  { role: "assistant", content: "你好！有什么可以帮助你的？" },
  { role: "user", content: "我今天心情不好" }  // 最新一条消息
]

// AI 基于完整历史生成回复
const response = await chat(messages)
```

**关键点**：
- 对话历史越长，Token 消耗越多
- 需要实现上下文窗口管理（见第 5 步 Memory）

---

## 第 3 步：Function Calling 工具调用 ⭐

### 3.1 为什么需要 Function Calling？

AI 的训练数据是**静态的**，无法获取实时信息。例如：
- ❌ AI 不知道今天的 ETH 价格
- ❌ AI 无法查询你的钱包余额
- ❌ AI 不能执行数据库查询

**解决方案**：让 AI 告诉你"需要调用什么工具"，然后你的代码执行工具并返回结果。

### 3.2 两次 API 调用机制

这是 Function Calling 的**核心理解点**：

```
第 1 次调用：AI 决定"用什么工具"
    ↓
你的代码执行工具，获取结果
    ↓
第 2 次调用：AI 基于工具结果"生成回答"
```

**详细流程**：

| 步骤 | 输入 | 输出 | 目的 |
|------|------|------|------|
| **第 1 次 API 调用** | 对话历史 + 工具定义 | 工具调用请求 `{name: 'getETHPrice'}` | 让 AI 决定是否需要工具 |
| **执行工具** | - | 工具结果 `{price: 2284}` | 你的代码执行实际查询 |
| **第 2 次 API 调用** | 对话历史 + 工具结果 | 自然语言回答 "ETH 当前价格是 $2,284" | 让 AI 生成最终回答 |

### 3.3 代码示例

```typescript
// 第 1 次调用：AI 决定用什么工具
const response = await provider.chat(messages, { tools })

// AI 返回：{ toolCalls: [{name: 'getETHPrice', args: {}}] }

// 执行工具
const result = await getETHPrice()  // → {price: 2284}

// 将工具结果添加到消息历史
messages.push({
  role: "assistant",
  toolCalls: response.toolCalls
})
messages.push({
  role: "tool",
  toolResults: [{name: 'getETHPrice', result: {price: 2284}}]
})

// 第 2 次调用：AI 基于工具结果生成回答
const finalResponse = await provider.chat(messages)
// AI 返回："ETH 当前价格是 $2,284"
```

### 3.4 工具定义格式

工具需要按照标准格式定义，AI 才能理解：

```typescript
const tools = [
  {
    name: "getETHPrice",
    description: "获取当前 ETH 价格（美元）",
    parameters: {
      type: "object",
      properties: {},  // 此工具无需参数
      required: []
    }
  }
]
```

---

## 第 4 步：Agent Loop 智能循环 ⭐

### 4.1 什么是 Agent Loop？

Agent Loop 是**自动化工具调用循环**，让 AI 可以连续调用多个工具，直到完成任务。

**传统流程**（手动）：
```
用户输入 → AI 决定工具 → 执行工具 → AI 生成回答 → 结束
```

**Agent Loop**（自动）：
```
用户输入 → AI 决定工具 → 执行工具 → AI 再次决定工具 → 执行工具 → ... → AI 生成回答 → 结束
```

### 4.2 Agent Loop 实现

```typescript
async function agentLoop(messages, tools, maxIterations = 5) {
  for (let i = 0; i < maxIterations; i++) {
    // 调用 AI
    const response = await provider.chat(messages, { tools })
    
    // 如果 AI 没有调用工具，循环结束
    if (!response.toolCalls || response.toolCalls.length === 0) {
      return response  // 返回最终回答
    }
    
    // 执行工具
    const toolResults = await executeTools(response.toolCalls)
    
    // 将结果添加到消息历史
    messages.push({ role: "assistant", toolCalls: response.toolCalls })
    messages.push({ role: "tool", toolResults })
    
    // 继续循环，AI 可能再次调用工具
  }
  
  throw new Error("Agent loop exceeded maximum iterations")
}
```

### 4.3 关键理解点

1. **循环终止条件**：AI 不再调用工具时，循环结束
2. **最大迭代次数**：防止无限循环（通常设为 5-10）
3. **工具结果累积**：每次工具结果都添加到消息历史，AI 可以看到所有之前的结果

---

## 第 5 步：Memory 与上下文管理

### 5.1 为什么需要 Memory？

- AI 本身**没有记忆**，每次调用都是独立的
- 对话历史会不断增长，但 AI 的上下文窗口有限（如 4096 tokens）
- 需要智能管理上下文，保留重要信息，丢弃无用信息

### 5.2 Memory 策略

#### 策略 1：滑动窗口（Sliding Window）

只保留最近的 N 条消息：

```typescript
const maxMessages = 10
const recentMessages = messages.slice(-maxMessages)
```

**优点**：简单直接
**缺点**：可能丢失早期重要信息

#### 策略 2：摘要压缩（Summary Compression）

将早期对话压缩成摘要：

```typescript
// 当对话历史超过阈值时
if (totalTokens > compressThreshold) {
  // 使用 AI 生成摘要
  const summary = await provider.chat([
    { role: "system", content: "请总结以下对话的关键信息" },
    ...oldMessages
  ])
  
  // 用摘要替换旧消息
  messages = [
    { role: "system", content: `对话摘要：${summary.content}` },
    ...recentMessages
  ]
}
```

**优点**：保留关键信息，减少 Token 消耗
**缺点**：实现复杂，需要额外的 AI 调用

### 5.3 本项目实现

本项目实现了两种 Memory 管理器：

1. **SlidingWindowMemory**：滑动窗口管理
2. **SummaryCompressionMemory**：摘要压缩管理

配置示例：

```typescript
const memoryConfig: MemoryConfig = {
  strategy: 'summary',           // 使用摘要压缩
  compressThreshold: 3000,       // 超过 3000 tokens 时压缩
  keepRecentCount: 5,            // 保留最近 5 条消息
  summaryModel: 'gpt-3.5-turbo'  // 使用 cheaper model 生成摘要
}
```

---

## 第 6 步：RAG 检索增强（进阶）

### 6.1 什么是 RAG？

RAG = Retrieval-Augmented Generation（检索增强生成）

**核心思想**：在 AI 生成回答前，先从知识库中检索相关信息，然后将检索结果作为上下文提供给 AI。

### 6.2 RAG 流程

```
用户问题 → 向量化 → 检索相似文档 → 将检索结果作为上下文 → AI 生成回答
```

### 6.3 应用场景

- 基于私有文档的问答（如产品手册、技术文档）
- 需要引用准确来源的回答
- 避免 AI 编造信息（幻觉）

---

## 🎯 核心概念检查清单

使用本指南学习后，你应该能够回答以下问题：

### ✅ 1. 我能解释为什么要调用两次 API 吗？

**答案**：第一次让 AI 决定"用什么工具"，第二次让 AI 基于工具结果"生成回答"。AI 本身无法执行工具，需要你的代码来执行。

### ✅ 2. 我能解释 Agent Loop 的工作原理吗？

**答案**：Agent Loop 是一个循环，每次循环中 AI 可能调用工具，工具结果被添加到消息历史，然后 AI 再次决策。当 AI 不再调用工具时，循环结束。

### ✅ 3. 我能解释为什么需要 Memory 吗？

**答案**：AI 本身没有记忆，每次调用都是独立的。Memory 用于管理对话历史，在上下文窗口限制下保留重要信息。

### ✅ 4. 我能解释 Function Calling 的完整流程吗？

**答案**：
1. 定义工具（名称、描述、参数）
2. 第 1 次 API 调用：AI 决定调用哪个工具
3. 执行工具（你的代码）
4. 将工具结果添加到消息历史
5. 第 2 次 API 调用：AI 基于工具结果生成回答

---

## 📖 相关文档

- [技能系统架构](../04-技能系统/00-技能系统架构.md)
- [SSE 流式聊天](../06-UI组件与特性/01-SSE流式聊天.md)
- [内存管理系统](../06-UI组件与特性/03-内存管理系统.md)
- [Web3 工具集成](../05-Web3工具集成/00-工具集成概述.md)

---

**最后更新**：2026-05-08  
**文档版本**：v1.0  
**适用项目**：Web3 AI Agent V3
