# API参考文档

<cite>
**本文引用的文件**
- [docs/API-REFERENCE.md](file://docs/API-REFERENCE.md)
- [apps/web/app/api/chat/route.ts](file://apps/web/app/api/chat/route.ts)
- [apps/web/app/api/tools/route.ts](file://apps/web/app/api/tools/route.ts)
- [apps/web/app/api/health/route.ts](file://apps/web/app/api/health/route.ts)
- [apps/web/types/chat.ts](file://apps/web/types/chat.ts)
- [apps/web/types/stream.ts](file://apps/web/types/stream.ts)
- [apps/web/hooks/useChatStream.ts](file://apps/web/hooks/useChatStream.ts)
- [skills/x-ray/SKILL.md](file://skills/x-ray/SKILL.md)
- [skills/x-ray/COMMANDS.md](file://skills/x-ray/COMMANDS.md)
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md)
- [skills/x-ray/MAP-V3.md](file://skills/x-ray/MAP-V3.md)
</cite>

## 更新摘要
**所做更改**
- 新增完整的API参考文档，包含详细的REST端点规范、TypeScript接口定义、使用示例和错误处理文档
- 更新技能系统架构，反映V3设计的七类任务分类和五层分层结构
- 新增SSE流式聊天API章节，详细说明流式响应格式和StreamChunk接口
- 新增useChatStream Hook前端集成指南，包含流式状态管理和错误处理
- 更新工具API章节，增加转账卡片功能和完整的工具调用支持
- 新增流式工具调用协议，说明工具执行过程的实时展示
- 更新架构总览，反映SSE流式处理的两阶段对话流程
- 新增流式调试功能，包含详细的流式过程日志记录

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构总览](#架构总览)
5. [详细组件分析](#详细组件分析)
6. [API参考](#api参考)
7. [依赖关系分析](#依赖关系分析)
8. [性能考量](#性能考量)
9. [故障排查指南](#故障排查指南)
10. [结论](#结论)
11. [附录](#附录)

## 简介
本文件为Web3 AI Agent技能系统的全面API参考，面向API使用者与集成开发者，聚焦以下目标：
- 明确技能调用接口与斜杠命令约定
- 说明各技能的输入、输出与执行规则
- 提供技能间通信协议（输入输出格式、数据传递机制）
- 给出请求/响应示例、错误码与异常处理策略
- 解释版本管理与向后兼容性
- 提供客户端集成指南与SDK使用建议
- **新增**：完整的REST API端点规范和TypeScript接口定义
- **新增**：SSE流式聊天API和StreamChunk接口的详细说明
- **新增**：useChatStream Hook前端集成指南
- **新增**：流式工具调用协议和实时展示机制
- **新增**：流式调试功能和详细的流式过程日志记录

## 项目结构
技能系统以"主入口 + 分层路由 + 交付流水线 + 治理闭环"的方式组织，核心文件如下：
- 主入口与命令约定：SKILL.md、COMMANDS.md
- 系统设计（V3）：SKILL-SYSTEM-DESIGN-V3.md
- 技能定义：architect、pm、pipeline、qa、coder、check-in、digest、update-map 等 SKILL.md
- **新增**：Web应用API层，包含聊天API、工具API和健康检查API
- **新增**：前端流式处理Hook，支持SSE流式输出和实时状态管理
- **新增**：完整的API参考文档，包含详细的端点规范和使用示例

```mermaid
graph TB
subgraph "入口与命令"
ORG["origin<br/>入口"]
PIPE["pipeline<br/>交付管线"]
CMDS["COMMANDS.md<br/>斜杠命令约定"]
END
subgraph "定义层"
PM["pm"]
PRD["prd"]
REQ["req"]
CI["check-in"]
END
subgraph "交付层"
ARCH["architect"]
QA["qa"]
CODER["coder"]
AUDIT["audit"]
END
subgraph "治理层"
DIGEST["digest"]
UMAP["update-map"]
END
subgraph "辅助层"
EXP["explore"]
INIT["init-docs"]
BVER["browser-verify"]
RES["resolve-doc-conflicts"]
END
subgraph "Web应用API层"
CHAT["/api/chat<br/>聊天API"]
TOOLS["/api/tools<br/>工具API"]
HEALTH["/api/health<br/>健康检查API"]
END
subgraph "前端集成层"
HOOK["useChatStream Hook<br/>流式状态管理"]
COMP["消息组件<br/>实时展示"]
END
ORG --> PIPE
ORG --> PM
ORG --> PRD
ORG --> REQ
ORG --> CI
ORG --> EXP
ORG --> INIT
ORG --> BVER
ORG --> RES
PIPE --> PM
PIPE --> PRD
PIPE --> REQ
PIPE --> CI
PIPE --> ARCH
PIPE --> QA
PIPE --> CODER
PIPE --> AUDIT
PIPE --> DIGEST
PIPE --> UMAP
CHAT --> TOOLS
CHAT --> HEALTH
TOOLS --> HOOK
HEALTH --> HOOK
HOOK --> COMP
```

**图表来源**
- [skills/x-ray/SKILL.md](file://skills/x-ray/SKILL.md)
- [skills/x-ray/COMMANDS.md](file://skills/x-ray/COMMANDS.md)
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md)
- [apps/web/app/api/chat/route.ts](file://apps/web/app/api/chat/route.ts)
- [apps/web/app/api/tools/route.ts](file://apps/web/app/api/tools/route.ts)
- [apps/web/app/api/health/route.ts](file://apps/web/app/api/health/route.ts)

## 核心组件
- 主入口 web3-ai-agent：统一接收外部请求，先经 origin 判断任务类型，再路由到相应技能或 pipeline。
- 斜杠命令：/origin、/pipeline feat/patch/refactor、/pm、/prd、/req、/check-in、/architect、/qa、/coder、/audit、/digest、/update-map、/explore、/init-docs、/browser-verify、/resolve-doc-conflicts。
- 交付管线 pipeline：根据任务类型（FEAT/PATCH/REFACTOR）选择执行深度与必经/可跳过技能。
- 实施前门禁 check-in：强制对交付型任务与准备进入实施的 DEFINE 任务进行对齐，明确问题、边界、方案、完成标准与下一跳。
- **新增**：SSE流式聊天API，支持实时流式输出和工具调用展示。
- **新增**：StreamChunk接口，定义统一的流式输出数据块格式。
- **新增**：useChatStream Hook，提供完整的流式状态管理和错误处理。
- **新增**：流式工具调用协议，支持工具执行过程的实时展示和状态更新。
- **新增**：转账卡片功能，支持ETH原生转账和ERC20 Token转账的完整流程。

**章节来源**
- [skills/x-ray/SKILL.md](file://skills/x-ray/SKILL.md)
- [skills/x-ray/COMMANDS.md](file://skills/x-ray/COMMANDS.md)
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md)
- [apps/web/app/api/chat/route.ts](file://apps/web/app/api/chat/route.ts)
- [apps/web/app/api/tools/route.ts](file://apps/web/app/api/tools/route.ts)
- [apps/web/app/api/health/route.ts](file://apps/web/app/api/health/route.ts)
- [apps/web/types/stream.ts](file://apps/web/types/stream.ts)
- [apps/web/hooks/useChatStream.ts](file://apps/web/hooks/useChatStream.ts)

## 架构总览
系统采用"入口路由 → 任务分类 → 交付管线（可选）→ 实施对齐 → 设计/验证/实现 → 风险审计 → 经验沉淀 → 地图更新"的闭环，**新增**SSE流式处理支持的两阶段对话流程。

```mermaid
sequenceDiagram
participant U as "用户"
participant W as "web3-ai-agent"
participant O as "origin"
participant P as "pipeline"
participant D as "定义层/交付层/治理层"
participant M as "map(更新)"
participant CHAT as "聊天API"
participant STREAM as "SSE流式处理"
participant HOOK as "useChatStream Hook"
U->>W : "自然语言/斜杠命令"
W->>O : "转交入口"
O->>O : "识别任务类型"
alt 交付型任务
O->>P : "进入 pipeline"
P->>D : "按类型选择必经/可跳过技能"
else 非交付型任务
O->>D : "直接进入对应技能"
end
D->>M : "digest + update-map 更新地图"
M-->>U : "返回结果/下一步建议"
Note over CHAT,STREAM : SSE流式处理
U->>CHAT : "发送消息 (Accept : text/event-stream)"
CHAT->>STREAM : "创建ReadableStream"
alt 需要工具
STREAM->>STREAM : "发送tool_call流式块"
STREAM->>HOOK : "实时展示工具调用"
STREAM->>STREAM : "发送content流式块"
else 不需要工具
STREAM->>HOOK : "实时展示回复内容"
end
HOOK-->>U : "流式更新UI状态"
```

**图表来源**
- [skills/x-ray/SKILL.md](file://skills/x-ray/SKILL.md)
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md)
- [apps/web/app/api/chat/route.ts](file://apps/web/app/api/chat/route.ts)
- [apps/web/app/api/tools/route.ts](file://apps/web/app/api/tools/route.ts)
- [apps/web/types/stream.ts](file://apps/web/types/stream.ts)
- [apps/web/hooks/useChatStream.ts](file://apps/web/hooks/useChatStream.ts)

## 详细组件分析

### 主入口 web3-ai-agent 与斜杠命令
- 主入口职责：统一入口、自动分流、避免手工直进主链。
- 斜杠命令推荐：
  - /origin + 任务描述
  - /pipeline feat/patch/refactor + 任务描述
  - /pm、/prd、/req、/check-in、/architect、/qa、/coder、/audit、/digest、/update-map、/explore、/init-docs、/browser-verify、/resolve-doc-conflicts

**章节来源**
- [skills/x-ray/SKILL.md](file://skills/x-ray/SKILL.md)
- [skills/x-ray/COMMANDS.md](file://skills/x-ray/COMMANDS.md)

### 交付管线 pipeline
- 作用：为交付型任务选择执行深度，避免默认跑完整长链路。
- 允许输入：DELIVER-FEAT、DELIVER-PATCH、DELIVER-REFACTOR。
- 输出格式：包含"类型、级别、必经技能、可跳过技能、按需插入"等字段。
- 路由规则：
  - FEAT：pm(按需) → prd → req → check-in → architect → qa → coder → audit → digest → update-map
  - PATCH：req → check-in → coder → qa → digest → update-map（可按需插入 pm/prd/architect/audit/browser-verify）
  - REFACTOR：req → check-in → architect → qa → coder → audit → digest → update-map（可按需插入 prd/browser-verify）

**章节来源**
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md)

### 实施前门禁 check-in
- 定位：实施前对齐点，非全局门禁。
- 强制适用场景：DELIVER-FEAT、DELIVER-PATCH、DELIVER-REFACTOR、准备进入实施的 DEFINE。
- 输出模板：必须包含"要解决的问题、必须掌握的上下文、采用的方案、不做什么、产物、完成标准、下一跳技能"。
- 硬规则：无 check-in 不得进入 architect/qa/coder；必须明确"不做什么"和完成标准。

**章节来源**
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md)

### 设计 architect
- 适用场景：涉及接口、状态流、模块边界或结构性重构。
- 输入：check-in、任务卡。
- 输出：主题架构说明（目标、模块边界、数据流、消息流、接口契约、错误处理、风险点）。
- 规则：若仅为局部修补且无结构变化，可跳过；若发现需求边界变化，应回退 prd/req。

**章节来源**
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md)

### 验证 qa
- 定位：定义并执行验证策略，FEAT 走 RED 模式，PATCH/REFACTOR 走轻量验证或回归验证。
- 输入：check-in、架构说明、任务卡。
- 输出：测试清单、红灯结果或验证结果、回归检查点。
- 红绿灯规则：FEAT 先红后绿；coder 负责把 RED 全部变为 GREEN；若 RED 直接通过，说明测试可能过弱，需修正。

**章节来源**
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md)

### 实现 coder
- 定位：在边界清楚的前提下实施代码，最多 10 轮自愈循环将 QA 红灯变为绿灯。
- 输入：check-in、架构说明、QA 输出。
- 自愈循环：最多 10 轮，超限输出 STUCK 报告并请求人工介入。
- 规则：发现范围扩大应回退 req/check-in/architect；优先跑相关验证，不默认全量重跑。

**章节来源**
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md)

### 风险审计 audit
- 定位：风险审计，V3 默认分轻重，不再一刀切。
- 规则：总分 100 分，>=80 通过；60-79 软拒绝回退修复；<60 直接拒绝；严重安全问题可一票否决。

**章节来源**
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md)

### 经验沉淀 digest 与地图更新 update-map
- digest：阶段沉淀，记录完成项、问题、经验与后续建议。
- update-map：更新项目状态、索引、下一步入口与技能地图信息。
- 两者共同构成 closeout 阶段，确保交付闭环。

**章节来源**
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md)

### 辅助技能
- explore：只读导航，帮助理解项目模块与能力。
- init-docs：初始化文档体系，建立第一版地图与结构化文档。
- browser-verify：浏览器层验收，验证改动在真实页面中的表现。
- resolve-doc-conflicts：文档冲突治理，处理合并冲突。

**章节来源**
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md)
- [skills/x-ray/MAP-V3.md](file://skills/x-ray/MAP-V3.md)

## API参考

### SSE流式聊天API（/api/chat）
**概述**
SSE流式聊天API，支持实时流式输出和工具调用展示。通过设置`Accept: text/event-stream`请求头启用流式响应，使用`ReadableStream`实现流式数据推送，支持两阶段对话流程的完整流式体验。

**请求格式**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "ETH当前价格是多少？"
    }
  ],
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f5eE2B"
}
```

**SSE流式响应格式**
```json
event: chunk
data: {"type":"tool_call","toolCall":{"id":"call_123","type":"function","function":{"name":"getTokenPrice","arguments":"{\"symbol\":\"ETH\"}"}}}

event: chunk
data: {"type":"content","content":"ETH"}

event: chunk
data: {"type":"content","content":" 当前价格为 "}

event: chunk
data: {"type":"content","content":"$3,500.00"}

event: chunk
data: {"type":"transfer_data","transferData":{"id":"card-1714300000000","to":"0x...","tokenSymbol":"ETH","amount":"0.5","chain":"ethereum","from":"0x...","status":"pending"}}

event: chunk
data: {"type":"done"}
```

**StreamChunk接口定义**
```typescript
interface StreamChunk {
  type: 'content' | 'tool_call' | 'transfer_data' | 'error' | 'done'
  content?: string
  toolCall?: {
    id: string
    type: 'function'
    function: {
      name: string
      arguments: string
    }
  }
  transferData?: TransferData
  error?: string
}
```

**流式工具调用UI状态**
```typescript
interface ToolCallUIState {
  id: string
  name: string
  arguments: Record<string, unknown>
  status: 'pending' | 'running' | 'done' | 'error'
  result?: unknown
}
```

**流式状态管理Hook**
```typescript
interface UseChatStreamReturn {
  isStreaming: boolean
  content: string
  error: string | null
  toolCalls: ToolCallUIState[]
  transferData?: TransferData
  sendMessage: (messages: Array<{ role: string; content: string }>, walletAddress?: string) => Promise<{ content: string; toolCalls: ToolCallUIState[]; transferData?: TransferData }>
  abort: () => void
}
```

**前端集成示例**
```javascript
// 使用useChatStream Hook
const { isStreaming, content, toolCalls, transferData, sendMessage, abort } = useChatStream()

// 发送流式消息
const handleSendMessage = async (content, walletAddress) => {
  const result = await sendMessage([
    { role: 'user', content },
    { role: 'assistant', content: '正在处理...' }
  ], walletAddress)
  
  // result包含最终content、toolCalls和transferData
  return result
}

// 中止流式请求
abort()
```

**错误处理**
- 配置错误：返回503状态码，提示检查环境变量配置
- 流式中断：支持AbortController中止流式输出
- 超时处理：30秒超时自动中止
- 自动重试：最多2次重试机制

**流式调试日志**
SSE流式聊天API包含详细的流式过程日志记录：
- **流式请求日志**：记录SSE连接建立、事件接收、状态更新
- **工具调用日志**：记录工具执行状态、结果展示、错误信息
- **性能监控**：记录流式传输耗时、内容更新频率
- **错误追踪**：详细的错误堆栈和调试信息

**章节来源**
- [apps/web/app/api/chat/route.ts](file://apps/web/app/api/chat/route.ts)
- [apps/web/types/stream.ts](file://apps/web/types/stream.ts)
- [apps/web/hooks/useChatStream.ts](file://apps/web/hooks/useChatStream.ts)

### 工具API（/api/tools）
**概述**
本地工具执行API，支持多种Web3相关工具函数的调用。**新增**流式工具调用支持，可在SSE流式聊天中实时展示工具执行状态。

**可用工具**
1. `getTokenPrice` - 获取指定加密货币的当前价格（美元）
   - 参数：symbol（ETH、BTC、SOL、MATIC、BNB）
   - 返回：价格、时间戳、数据源

2. `getBalance` - 查询指定链上钱包地址的余额
   - 参数：chain（ethereum、polygon、bsc、bitcoin、solana）、address（钱包地址）
   - 返回：余额、符号、链名、地址

3. `getGasPrice` - 获取指定EVM链的当前Gas价格
   - 参数：chain（ethereum、polygon、bsc）
   - 返回：基础费用、最大费用、优先费用、单位、数据源、时间戳

4. `getTokenInfo` - 查询Token的元数据信息（名称、合约地址、精度等）
   - 参数：chain（ethereum、polygon、bsc）、symbol（Token符号或合约地址）
   - 返回：名称、符号、合约地址、精度、链名

5. `getTokenBalance` - 查询指定钱包地址的ERC20 Token余额
   - 参数：chain（ethereum、polygon、bsc）、address（钱包地址）、tokenSymbol（Token符号或合约地址）
   - 返回：余额、符号、链名、地址、精度

6. `createTransferCard` - 生成转账卡片数据
   - 参数：to（接收地址）、tokenSymbol（Token符号）、amount（转账金额）、chain（链名称）
   - 返回：success标志、transferData（转账数据）

**请求格式**
```json
{
  "name": "getTokenPrice",
  "arguments": {
    "symbol": "ETH"
  }
}
```

**响应格式**
```json
{
  "success": true,
  "price": 3500.00,
  "timestamp": "2026-04-28T12:00:00.000Z",
  "source": "Binance"
}
```

**流式工具调用协议**
在SSE流式聊天中，工具调用会通过`tool_call`类型的StreamChunk实时展示：
```json
{
  "type": "tool_call",
  "toolCall": {
    "id": "call_123",
    "type": "function",
    "function": {
      "name": "getTokenPrice",
      "arguments": "{\"symbol\":\"ETH\"}"
    }
  }
}
```

**错误处理**
- 地址格式错误：返回错误信息，状态码400
- RPC调用失败：返回错误信息，状态码500
- 工具不存在：返回错误信息，状态码200

**章节来源**
- [apps/web/app/api/tools/route.ts](file://apps/web/app/api/tools/route.ts)

### 健康检查API（/api/health）
**概述**
健康检查API，用于检查服务运行状态和版本信息。

**请求格式**
```bash
GET /api/health
```

**响应格式**
```json
{
  "status": "ok",
  "timestamp": "2026-04-28T12:00:00.000Z",
  "version": "0.2.0"
}
```

**使用示例**
```bash
curl http://localhost:3000/api/health
```

**章节来源**
- [apps/web/app/api/health/route.ts](file://apps/web/app/api/health/route.ts)

### Web应用集成API
**概述**
Web应用提供完整的聊天界面，包含消息列表、输入框和工具调用展示。**新增**SSE流式处理支持，实现实时内容更新和工具调用展示。

**消息类型定义**
```typescript
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  toolCalls?: ToolCall[]
  isError?: boolean
  transferData?: TransferData
}

interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
  result?: unknown
}
```

**流式UI状态**
```typescript
interface StreamUIState {
  isStreaming: boolean
  content: string
  error: string | null
  toolCalls: ToolCallUIState[]
}
```

**客户端集成示例**
```javascript
// 发送消息到流式聊天API
const sendMessage = async (messages, walletAddress) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    },
    body: JSON.stringify({ messages, walletAddress })
  })
  
  // 使用ReadableStream消费流式响应
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split('\n\n')
    buffer = events.pop() || ''
    
    for (const eventText of events) {
      if (eventText.startsWith('data:')) {
        const chunk = JSON.parse(eventText.substring(5).trim())
        handleStreamChunk(chunk)
      }
    }
  }
  
  return finalResult
}
```

**流式消息组件**
```typescript
// MessageList组件支持流式内容
<MessageList 
  messages={messages} 
  isLoading={isLoading}
  streamingMessageId={streamingMessageId}
  isStreaming={isStreaming}
  streamingToolCalls={streamingToolCalls}
  transferData={transferData}
/>

// MessageItem组件展示工具调用状态
<MessageItem 
  message={message}
  isStreaming={isStreaming}
  toolCalls={streamingToolCalls}
  transferData={transferData}
/>
```

**章节来源**
- [apps/web/types/chat.ts](file://apps/web/types/chat.ts)
- [apps/web/types/stream.ts](file://apps/web/types/stream.ts)
- [apps/web/hooks/useChatStream.ts](file://apps/web/hooks/useChatStream.ts)

## 依赖关系分析
- 入口层：origin、pipeline
- 定义层：pm、prd、req、check-in
- 交付层：architect、qa、coder、audit
- 治理层：digest、update-map
- 辅助层：explore、init-docs、browser-verify、resolve-doc-conflicts
- **新增**：Web应用API层：chat API、tools API、health API
- **新增**：前端集成层：useChatStream Hook、消息组件

```mermaid
graph LR
ORG["origin"] --> PIPE["pipeline"]
ORG --> PM["pm"]
ORG --> PRD["prd"]
ORG --> REQ["req"]
ORG --> CI["check-in"]
ORG --> EXP["explore"]
ORG --> INIT["init-docs"]
ORG --> BVER["browser-verify"]
ORG --> RES["resolve-doc-conflicts"]
PIPE --> PM
PIPE --> PRD
PIPE --> REQ
PIPE --> CI
PIPE --> ARCH["architect"]
PIPE --> QA["qa"]
PIPE --> CODER["coder"]
PIPE --> AUDIT["audit"]
PIPE --> DIGEST["digest"]
PIPE --> UMAP["update-map"]
CHAT["/api/chat"] --> TOOLS["/api/tools"]
CHAT --> HEALTH["/api/health"]
TOOLS --> PM
TOOLS --> PRD
TOOLS --> REQ
TOOLS --> CI
HOOK["useChatStream Hook"] --> CHAT
HOOK --> STREAM["SSE流式处理"]
COMP["消息组件"] --> HOOK
```

**图表来源**
- [skills/x-ray/SKILL.md](file://skills/x-ray/SKILL.md)
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md)
- [apps/web/app/api/chat/route.ts](file://apps/web/app/api/chat/route.ts)
- [apps/web/app/api/tools/route.ts](file://apps/web/app/api/tools/route.ts)
- [apps/web/app/api/health/route.ts](file://apps/web/app/api/health/route.ts)
- [apps/web/types/stream.ts](file://apps/web/types/stream.ts)
- [apps/web/hooks/useChatStream.ts](file://apps/web/hooks/useChatStream.ts)

**章节来源**
- [skills/x-ray/SKILL.md](file://skills/x-ray/SKILL.md)
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md)
- [apps/web/app/api/chat/route.ts](file://apps/web/app/api/chat/route.ts)
- [apps/web/app/api/tools/route.ts](file://apps/web/app/api/tools/route.ts)
- [apps/web/app/api/health/route.ts](file://apps/web/app/api/health/route.ts)
- [apps/web/types/stream.ts](file://apps/web/types/stream.ts)
- [apps/web/hooks/useChatStream.ts](file://apps/web/hooks/useChatStream.ts)

## 性能考量
- 任务分流：通过 origin 与 pipeline 降低无效链路长度，提高交付效率。
- 短链路优先：PATCH 默认不走 pm/prd，REFACTOR 默认不走 pm，小任务优先短链路。
- 自愈上限：coder 最多 10 轮自愈，避免长时间卡顿与资源浪费。
- 轻重审计：audit 分轻重，避免小任务过度消耗。
- **新增**：SSE流式优化：使用ReadableStream实现高效流式传输，支持背压控制。
- **新增**：流式节流：50ms节流更新减少React重渲染，提升UI流畅度。
- **新增**：流式状态管理：useChatStream Hook提供完整的流式状态跟踪和错误处理。
- **新增**：工具调用流式展示：实时展示工具执行状态，提升用户体验。
- **新增**：转账卡片优化：避免重复显示内容，提升转账场景的用户体验。
- **新增**：流式调试优化：详细的流式过程日志记录，便于性能分析和问题诊断。

**章节来源**
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md)
- [apps/web/app/api/chat/route.ts](file://apps/web/app/api/chat/route.ts)
- [apps/web/hooks/useChatStream.ts](file://apps/web/hooks/useChatStream.ts)

## 故障排查指南
- 缺少 check-in
  - 症状：无法进入 architect/qa/coder。
  - 处理：先执行 check-in，明确"要解决的问题、上下文、方案、不做什么、产物、完成标准、下一跳"。
- coder 卡住
  - 症状：连续多次失败，超过 10 轮。
  - 处理：输出 STUCK 报告，包含卡住原因、已尝试方案、当前阻塞点、建议人工介入方向。
- audit 未通过
  - 症状：<60 分或存在严重问题。
  - 处理：按软拒绝回退修复或直接拒绝，必要时一票否决。
- RED 直接通过
  - 症状：测试过弱导致意外通过。
  - 处理：修正测试，确保 RED 能有效证明"当前未通过"。
- **新增**：SSE流式聊天错误
  - **流式连接失败**：检查网络连接和CORS配置，确认Accept头设置为'text/event-stream'
  - **流式中断**：使用AbortController中止请求，检查超时设置（30秒）
  - **流式解析错误**：检查SSE事件格式，确保正确的event和data格式
  - **工具调用流式展示失败**：检查工具调用状态更新逻辑
  - **流式状态不同步**：检查节流更新机制和状态同步逻辑
  - **转账卡片显示异常**：检查transfer_data事件处理和状态更新
- **新增**：流式调试日志分析
  - **流式请求失败**：检查SSE连接建立和事件接收日志
  - **工具调用流式展示异常**：查看tool_call事件处理和状态更新
  - **流式性能问题**：分析流式传输耗时和内容更新频率
  - **错误追踪**：利用详细的流式错误日志进行问题定位

**章节来源**
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md)
- [apps/web/app/api/chat/route.ts](file://apps/web/app/api/chat/route.ts)
- [apps/web/app/api/tools/route.ts](file://apps/web/app/api/tools/route.ts)
- [apps/web/hooks/useChatStream.ts](file://apps/web/hooks/useChatStream.ts)

## 结论
本参考文档梳理了Web3 AI Agent技能系统的入口、命令、分层与流水线规则，明确了各技能的输入输出与衔接关系，并提供了故障排查与性能优化建议。**新增**的完整的API参考文档为系统提供了全面的技术规范，包含详细的REST端点规范、TypeScript接口定义、使用示例和错误处理文档。**新增**的SSE流式聊天API为系统增加了强大的实时交互能力，支持两阶段对话流程的完整流式体验。**新增**的StreamChunk接口和useChatStream Hook提供了统一的流式处理协议和完整的前端集成方案。**新增**的流式工具调用协议和实时展示机制显著提升了用户体验，让用户能够实时看到AI的思考过程和工具执行状态。**新增**的转账卡片功能进一步完善了Web3应用场景的用户体验。**新增**的流式调试功能增强了系统的可观测性和可维护性，详细的流式过程日志记录为问题诊断和性能优化提供了有力支持。建议集成方遵循斜杠命令约定与 check-in 强制规则，结合 pipeline 的短链路策略，充分利用SSE流式处理能力和完整的API规范提升交付效率与质量。

## 附录

### 斜杠命令使用示例
- 新功能：/origin + 任务描述
- 修 bug：/origin + 任务描述
- 重构：/origin + 任务描述
- 探索项目：/explore + 任务描述
- 直接进入交付：/pipeline feat/patch/refactor + 任务描述

**章节来源**
- [skills/x-ray/COMMANDS.md](file://skills/x-ray/COMMANDS.md)

### 技能间通信协议与数据传递
- 输入输出格式标准化
  - check-in：强制输出"问题、上下文、方案、不做什么、产物、完成标准、下一跳"。
  - architect：输出"主题架构说明"（目标、模块边界、数据流、消息流、接口契约、错误处理、风险点）。
  - qa：输出"测试清单、红灯结果/验证结果、回归检查点"。
  - coder：输出"代码修改、验证结果"，若失败输出 STUCK 报告。
  - digest：输出"复盘总结"（完成项、问题、学到的经验、未解决问题、下一步建议）。
  - update-map：输出"地图更新"（当前状态、影响模块/能力、新增文档、需要关注的后续入口）。
- **新增**：流式通信协议
  - StreamChunk接口：统一的流式输出数据块格式，支持content、tool_call、transfer_data、error、done五种类型
  - 流式状态管理：useChatStream Hook提供完整的流式状态跟踪和错误处理
  - 工具调用流式展示：实时展示工具执行状态和结果
  - 节流更新机制：50ms节流减少UI重渲染，提升性能
  - 转账卡片流式展示：实时展示转账卡片数据和状态
- **新增**：调试日志协议
  - 流式日志级别：INFO、DEBUG、ERROR
  - 流式日志格式：JSON格式，包含时间戳、调用阶段、消息内容
  - 调试信息：流式连接、事件接收、状态更新、错误详情
- 数据传递机制
  - 以"任务卡/上下文/产物"为载体，在相邻技能间传递。
  - pipeline 根据任务类型动态选择必经/可跳过技能，减少冗余。
  - **新增**：流式消息携带工具调用信息，支持实时工具调用展示。
  - **新增**：转账卡片数据通过transfer_data事件实时传递。

**章节来源**
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md)
- [apps/web/types/chat.ts](file://apps/web/types/chat.ts)
- [apps/web/types/stream.ts](file://apps/web/types/stream.ts)
- [apps/web/hooks/useChatStream.ts](file://apps/web/hooks/useChatStream.ts)

### 版本管理与向后兼容
- V3 核心变化
  - 任务分类从 3 类扩展为 7 类（DISCOVER/BOOTSTRAP/DEFINE/DELIVER-FEAT/DELIVER-PATCH/DELIVER-REFACTOR/VERIFY/GOVERN）。
  - pipeline 仅服务于交付型任务，非交付型任务不进入 pipeline。
  - learn-gate 更名为 check-in，强调"实施前对齐点"。
  - pm/prd/req 改为按需进入，不再默认全跑。
  - audit 分轻重，避免小任务过度消耗。
  - digest+update-map 理解为 closeout，减轻流程割裂感。
- **新增**：API版本演进
  - V1：基础技能系统
  - V2：引入Web应用API层
  - V3：两阶段对话流程和工具API
  - **新增**：V4：SSE流式聊天API和实时工具调用展示
  - **新增**：V5：增强流式调试功能和日志记录
  - **新增**：V6：完整的API参考文档和TypeScript接口定义
- 向后兼容建议
  - 旧流程可逐步迁移到 V3 的 7 类任务与按需进入策略。
  - 保持斜杠命令与主入口不变，内部路由逻辑平滑过渡。
  - **新增**：API版本控制，保持向后兼容性
  - **新增**：流式API向后兼容，支持传统JSON响应
  - **新增**：调试日志格式标准化，确保历史版本兼容
  - **新增**：工具API向后兼容，支持getETHPrice/getBTCPrice/getWalletBalance

**章节来源**
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md)
- [skills/x-ray/MAP-V3.md](file://skills/x-ray/MAP-V3.md)

### 客户端集成指南与 SDK 使用建议
- 建议流程
  - 优先使用斜杠命令：/origin + 任务描述，或 /pipeline feat/patch/refactor + 任务描述。
  - 对于支持显式点名的宿主，推荐直接调用 web3-ai-agent 主入口，由 origin 自动分流。
  - **新增**：Web应用集成：使用内置聊天界面或自定义UI组件
  - **新增**：流式集成：使用useChatStream Hook实现SSE流式处理
  - **新增**：转账卡片集成：支持ETH原生转账和ERC20 Token转账的完整流程
- SDK 使用建议
  - 将"命令 + 描述"封装为统一输入格式，便于宿主产品下拉提示与自动补全。
  - 在 coder 卡住时，解析 STUCK 报告并触发人工介入流程。
  - 在 audit 未达 80 分时，按软拒绝回退修复策略处理。
  - **新增**：流式工具调用集成：支持异步工具执行和实时结果处理
  - **新增**：流式状态管理：使用useChatStream Hook处理流式状态和错误
  - **新增**：流式调试集成：收集和分析流式过程日志
  - **新增**：转账卡片集成：支持实时转账状态展示和数据持久化
- 错误码与异常处理
  - 缺少 check-in：禁止进入 architect/qa/coder，需先完成 check-in。
  - coder 超限：输出 STUCK 报告并终止，请求人工介入。
  - audit 未达标：按 60-79 软拒绝或 <60 直接拒绝处理。
  - RED 异常通过：修正测试，确保 RED 能有效证明"当前未通过"。
  - **新增**：SSE流式错误：区分流式连接错误和运行时错误，提供针对性处理
  - **新增**：流式工具调用错误：地址格式验证、RPC连接检查、工具参数校验
  - **新增**：流式调试错误：提供详细的流式过程日志，便于问题诊断
  - **新增**：转账卡片错误：地址格式验证、链ID验证、金额格式验证
- **新增**：流式API集成最佳实践
  - 设置正确的Accept头：'text/event-stream'
  - 实现流式状态管理：使用useChatStream Hook
  - 处理流式中断：使用AbortController和超时机制
  - 优化流式性能：合理使用节流更新和状态同步
  - 错误恢复：实现自动重试和错误提示
  - 转账卡片处理：避免重复显示内容，实时更新状态

**章节来源**
- [skills/x-ray/COMMANDS.md](file://skills/x-ray/COMMANDS.md)
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md)
- [apps/web/app/api/chat/route.ts](file://apps/web/app/api/chat/route.ts)
- [apps/web/app/api/tools/route.ts](file://apps/web/app/api/tools/route.ts)
- [apps/web/hooks/useChatStream.ts](file://apps/web/hooks/useChatStream.ts)

### Web应用组件集成
**消息组件**
- MessageList：自动滚动到最新消息，支持加载状态显示和流式内容更新
- MessageItem：支持用户消息、助手消息和错误消息的不同样式，实时展示工具调用状态
- ChatInput：支持多行输入、快捷键发送、加载状态禁用

**流式组件集成示例**
```typescript
// 使用MessageList组件支持流式内容
<MessageList 
  messages={messages} 
  isLoading={isLoading}
  streamingMessageId={streamingMessageId}
  isStreaming={isStreaming}
  streamingToolCalls={streamingToolCalls}
  transferData={transferData}
/>

// 使用ChatInput组件
<ChatInput onSend={handleSendMessage} isLoading={isLoading} />

// 使用useChatStream Hook
const {
  isStreaming,
  content,
  error,
  toolCalls,
  transferData,
  sendMessage,
  abort
} = useChatStream()
```

**章节来源**
- [apps/web/types/chat.ts](file://apps/web/types/chat.ts)
- [apps/web/types/stream.ts](file://apps/web/types/stream.ts)
- [apps/web/hooks/useChatStream.ts](file://apps/web/hooks/useChatStream.ts)

### 流式调试功能使用指南
**SSE流式调试**
- **启用调试**：SSE流式聊天API自动记录详细的流式过程日志
- **日志内容**：
  - 流式连接建立：记录SSE连接状态和事件监听
  - 事件接收：记录每个StreamChunk的接收和解析
  - 状态更新：记录流式状态变化和UI更新
  - 错误处理：记录流式过程中的错误和异常
- **日志格式**：JSON格式，包含时间戳、调用阶段、消息内容
- **日志位置**：服务器控制台输出，便于开发和生产环境监控

**流式调试最佳实践**
- 开发环境：启用详细日志，便于问题诊断
- 生产环境：控制日志级别，避免性能影响
- 性能监控：分析流式传输耗时、内容更新频率
- 错误追踪：利用日志中的错误信息快速定位问题
- **新增**：流式状态监控：实时监控流式状态变化和性能指标
- **新增**：转账卡片调试：监控转账卡片事件和状态更新

**章节来源**
- [apps/web/app/api/chat/route.ts](file://apps/web/app/api/chat/route.ts)
- [apps/web/hooks/useChatStream.ts](file://apps/web/hooks/useChatStream.ts)

### API参考文档使用指南
**文档结构**
- API概览：提供所有端点的基本信息和认证要求
- 端点详情：每个API的完整规范，包括请求头、请求体、响应格式
- 类型定义：TypeScript接口定义，确保类型安全
- 使用示例：完整的客户端集成示例
- 错误处理：详细的错误码说明和处理策略
- SSE协议：流式通信的详细规范

**使用建议**
- 从API概览开始，了解系统提供的所有功能
- 根据业务需求选择合适的端点
- 仔细阅读类型定义，确保正确使用
- 参考使用示例，快速集成到项目中
- 重点关注错误处理和异常情况
- 利用SSE协议实现实时交互功能

**章节来源**
- [docs/API-REFERENCE.md](file://docs/API-REFERENCE.md)