# Web3 AI Agent API 参考文档

> 版本：v1.0  
> 最后更新：2026-04-28  
> 基础 URL：`http://localhost:3000/api`（开发环境）

---

## 📋 目录

- [API 概览](#api-概览)
- [/api/chat - 聊天接口](#apichat---聊天接口)
- [/api/tools - 工具接口](#apitools---工具接口)
- [/api/health - 健康检查](#apihealth---健康检查)
- [错误码说明](#错误码说明)
- [SSE 流式协议](#sse-流式协议)

---

## API 概览

Web3 AI Agent 提供以下 RESTful API 端点：

| 端点 | 方法 | 描述 | 认证 |
|------|------|------|------|
| `/api/chat` | POST | AI 对话接口（支持流式） | 无 |
| `/api/tools` | POST | Web3 工具调用接口 | 无 |
| `/api/health` | GET | 服务健康检查 | 无 |

**Base URL**: `http://localhost:3000/api`（开发环境）

---

## /api/chat - 聊天接口

与 AI Agent 进行对话，支持工具调用和流式输出。

### 端点

```
POST /api/chat
```

### 请求头

| 头部 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `Content-Type` | string | 是 | `application/json` |
| `Accept` | string | 否 | 设置为 `text/event-stream` 启用 SSE 流式输出 |

### 请求体

```typescript
interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  walletAddress?: string  // 可选：用户钱包地址
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `messages` | array | 是 | 对话消息历史 |
| `messages[].role` | string | 是 | 角色：`user`、`assistant` 或 `system` |
| `messages[].content` | string | 是 | 消息内容 |
| `walletAddress` | string | 否 | 用户钱包地址（用于余额查询等上下文） |

### 响应

#### 非流式响应（JSON）

**状态码**: `200 OK`

```json
{
  "content": "ETH 当前价格为 $3,500.00",
  "toolCalls": [
    {
      "id": "call_123",
      "name": "getTokenPrice",
      "arguments": { "symbol": "ETH" },
      "result": { "success": true, "price": 3500.00 }
    }
  ],
  "transferData": null
}
```

**转账卡片响应示例**:

```json
{
  "content": "",
  "toolCalls": [
    {
      "id": "call_456",
      "name": "createTransferCard",
      "arguments": {
        "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f5eE2B",
        "tokenSymbol": "ETH",
        "amount": "0.5",
        "chain": "ethereum"
      },
      "result": {
        "success": true,
        "transferData": {
          "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f5eE2B",
          "tokenSymbol": "ETH",
          "amount": "0.5",
          "chain": "ethereum",
          "from": "0x1234567890abcdef1234567890abcdef12345678"
        }
      }
    }
  ],
  "transferData": {
    "id": "card-1714300000000",
    "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f5eE2B",
    "tokenSymbol": "ETH",
    "amount": "0.5",
    "chain": "ethereum",
    "from": "0x1234567890abcdef1234567890abcdef12345678",
    "status": "pending"
  }
}
```

#### 流式响应（SSE）

**状态码**: `200 OK`  
**Content-Type**: `text/event-stream`

```
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
```

### StreamChunk 类型定义

```typescript
interface StreamChunk {
  type: 'content' | 'tool_call' | 'transfer_data' | 'error'
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

### 可用工具

AI Agent 支持以下工具调用：

#### 1. getTokenPrice

获取加密货币价格。

```json
{
  "name": "getTokenPrice",
  "arguments": {
    "symbol": "ETH"  // ETH, BTC, SOL, MATIC, BNB
  }
}
```

#### 2. getBalance

查询钱包余额。

```json
{
  "name": "getBalance",
  "arguments": {
    "chain": "ethereum",  // ethereum, polygon, bsc, bitcoin, solana
    "address": "0x..."
  }
}
```

#### 3. getGasPrice

查询 Gas 价格。

```json
{
  "name": "getGasPrice",
  "arguments": {
    "chain": "ethereum"  // ethereum, polygon, bsc
  }
}
```

#### 4. getTokenInfo

查询 Token 元数据。

```json
{
  "name": "getTokenInfo",
  "arguments": {
    "chain": "ethereum",
    "symbol": "USDT"  // 或合约地址
  }
}
```

#### 5. getTokenBalance

查询 ERC20 Token 余额。

```json
{
  "name": "getTokenBalance",
  "arguments": {
    "chain": "ethereum",
    "address": "0x...",
    "tokenSymbol": "USDT"
  }
}
```

#### 6. createTransferCard

生成转账卡片。

```json
{
  "name": "createTransferCard",
  "arguments": {
    "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f5eE2B",
    "tokenSymbol": "ETH",
    "amount": "0.5",
    "chain": "ethereum"
  }
}
```

### 错误响应

#### 非流式错误

```json
{
  "error": true,
  "content": "模型配置错误: 未配置 OPENAI_API_KEY。请联系管理员检查环境变量配置。"
}
```

#### 流式错误

```
event: chunk
data: {"type":"error","error":"抱歉，处理您的请求时出现了错误。请稍后重试。"}
```

---

## /api/tools - 工具接口

直接调用 Web3 工具函数（独立于聊天接口）。

### 端点

```
POST /api/tools
```

### 请求头

```
Content-Type: application/json
```

### 请求体

```typescript
interface ToolRequest {
  name: string
  arguments: Record<string, unknown>
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `name` | string | 是 | 工具名称 |
| `arguments` | object | 是 | 工具参数 |

### 请求示例

#### 查询 ETH 价格

```json
{
  "name": "getTokenPrice",
  "arguments": {
    "symbol": "ETH"
  }
}
```

#### 查询钱包余额

```json
{
  "name": "getBalance",
  "arguments": {
    "chain": "ethereum",
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f5eE2B"
  }
}
```

#### 查询 Gas 价格

```json
{
  "name": "getGasPrice",
  "arguments": {
    "chain": "ethereum"
  }
}
```

#### 查询 Token 余额

```json
{
  "name": "getTokenBalance",
  "arguments": {
    "chain": "ethereum",
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f5eE2B",
    "tokenSymbol": "USDT"
  }
}
```

### 响应

**状态码**: `200 OK`

#### 成功响应

```json
{
  "success": true,
  "price": 3500.00,
  "timestamp": "2026-04-28T12:00:00.000Z",
  "source": "Binance"
}
```

#### 余额查询响应

```json
{
  "success": true,
  "balance": "1.234567",
  "symbol": "ETH",
  "chain": "ethereum",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f5eE2B"
}
```

#### 错误响应

**状态码**: `500 Internal Server Error`

```json
{
  "error": true,
  "message": "工具执行失败: 网络错误"
}
```

### 支持的工具列表

| 工具名称 | 描述 | 参数 |
|---------|------|------|
| `getTokenPrice` | 获取 Token 价格 | `symbol` (ETH, BTC, SOL, MATIC, BNB) |
| `getBalance` | 查询钱包余额 | `chain`, `address` |
| `getGasPrice` | 查询 Gas 价格 | `chain` (ethereum, polygon, bsc) |
| `getTokenBalance` | 查询 ERC20 余额 | `chain`, `address`, `tokenSymbol` |
| `getETHPrice` | 获取 ETH 价格（向后兼容） | 无 |
| `getBTCPrice` | 获取 BTC 价格（向后兼容） | 无 |
| `getWalletBalance` | 查询 ETH 余额（向后兼容） | `address` |

---

## /api/health - 健康检查

检查服务运行状态。

### 端点

```
GET /api/health
```

### 请求

无需请求体。

### 响应

**状态码**: `200 OK`

```json
{
  "status": "ok",
  "timestamp": "2026-04-28T12:00:00.000Z",
  "version": "0.2.0"
}
```

### 使用示例

```bash
curl http://localhost:3000/api/health
```

---

## 错误码说明

| HTTP 状态码 | 描述 | 常见原因 |
|------------|------|---------|
| `200` | 成功 | - |
| `400` | 请求错误 | 请求体格式错误、缺少必填参数 |
| `500` | 服务器错误 | 工具调用失败、未知错误 |
| `503` | 服务不可用 | AI 模型未配置（缺少 API Key） |

### 常见错误信息

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `未配置 OPENAI_API_KEY` | 环境变量缺失 | 检查 `.env.local` 配置 |
| `工具调用失败: 网络错误` | 外部 API 不可达 | 检查网络连接或代理配置 |
| `未知工具: xxx` | 工具名称错误 | 检查工具名称拼写 |
| `抱歉，处理您的请求时出现了错误` | 未知服务器错误 | 查看服务器日志 |

---

## SSE 流式协议

### 协议说明

Server-Sent Events (SSE) 是一种服务器向客户端推送实时数据的技术。

### 格式

```
event: chunk
data: {JSON}

```

每个事件由以下部分组成：
- `event:` 事件类型（固定为 `chunk`）
- `data:` JSON 格式的数据
- 空行表示事件结束

### 事件类型

#### 1. content

AI 生成的文本内容片段。

```json
{
  "type": "content",
  "content": "ETH 当前价格"
}
```

#### 2. tool_call

工具调用信息。

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

#### 3. transfer_data

转账卡片数据。

```json
{
  "type": "transfer_data",
  "transferData": {
    "id": "card-1714300000000",
    "to": "0x...",
    "tokenSymbol": "ETH",
    "amount": "0.5",
    "chain": "ethereum",
    "from": "0x...",
    "status": "pending"
  }
}
```

#### 4. error

错误信息。

```json
{
  "type": "error",
  "error": "处理请求时出现错误"
}
```

### 客户端示例

#### JavaScript (Fetch API)

```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream'
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'ETH 当前价格是多少？' }]
  })
})

const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  
  const chunk = decoder.decode(value)
  // 解析 SSE 数据
  const lines = chunk.split('\n')
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6))
      console.log(data)
    }
  }
}
```

#### 使用 EventSource（仅 GET 请求）

```javascript
// 注意：EventSource 只支持 GET 请求
// 对于 POST 请求，请使用 Fetch API + ReadableStream
const eventSource = new EventSource('/api/health')

eventSource.onmessage = (event) => {
  console.log(JSON.parse(event.data))
}
```

---

## 最佳实践

### 1. 错误处理

始终检查响应的 `error` 字段：

```javascript
const response = await fetch('/api/chat', { ... })
const data = await response.json()

if (data.error) {
  console.error('API 错误:', data.content)
  return
}
```

### 2. 流式输出节流

处理 SSE 流时，使用节流避免频繁更新 UI：

```javascript
let lastUpdate = 0
const throttleInterval = 100 // 100ms

if (Date.now() - lastUpdate > throttleInterval) {
  updateUI(content)
  lastUpdate = Date.now()
}
```

### 3. 钱包地址验证

在发送钱包地址前进行格式验证：

```javascript
const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(walletAddress)
if (!isValidAddress) {
  throw new Error('无效的钱包地址格式')
}
```

### 4. 超时设置

为 API 请求设置合理的超时时间：

```javascript
const controller = new AbortController()
setTimeout(() => controller.abort(), 30000) // 30 秒超时

const response = await fetch('/api/chat', {
  signal: controller.signal,
  ...
})
```

---

## 更新日志

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-04-28 | 初始版本，包含所有核心 API 文档 |

---

## 相关文档

- [部署指南](./DEPLOYMENT.md)
- [架构设计](../ARCHITECTURE.md)
- [项目检查清单](./checklist/PROJECT-CHECKLIST.md)

---

**文档结束** 📚

如有问题，请查看项目文档或提交 Issue。
