# 核心Web3工具实现

<cite>
**本文档引用的文件**
- [Web3-AI-Agent-PRD-MVP.md](file://docs/Web3-AI-Agent-PRD-MVP.md)
- [README.md](file://README.md)
- [price.ts](file://packages/web3-tools/src/price.ts)
- [balance.ts](file://packages/web3-tools/src/balance.ts)
- [gas.ts](file://packages/web3-tools/src/gas.ts)
- [types.ts](file://packages/web3-tools/src/types.ts)
- [index.ts](file://packages/web3-tools/src/index.ts)
- [route.ts](file://apps/web/app/api/tools/route.ts)
</cite>

## 更新摘要
**变更内容**
- 增强了多数据源支持机制，包括价格数据的多源备份和代理环境变量支持
- 新增了完整的错误处理和降级策略
- 改进了工具接口的一致性和可靠性
- 添加了代理服务器支持以改善网络访问

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构概览](#架构概览)
5. [详细组件分析](#详细组件分析)
6. [依赖分析](#依赖分析)
7. [性能考虑](#性能考虑)
8. [故障排除指南](#故障排除指南)
9. [结论](#结论)
10. [附录](#附录)

## 简介

Web3 AI Agent 是一个旨在验证"能够理解用户意图、调用 Web3 工具、返回可信结果，并具备最小风险边界"的 AI Agent 项目。该项目服务于从 Web3 前端工程师升级为 AI 应用工程师/Agent 工程师的个人转型目标。

本项目的核心目标是构建一个可运行的 Web3 AI Agent MVP，覆盖对话 + Tool Calling + Agent Loop + 最小 Memory 四个核心能力。项目采用文档先行、分阶段推进、适合 vibe coding 的开发体系。

**更新** 项目现已增强多数据源支持和错误处理机制，包括新的数据源配置和代理环境变量支持，提升了系统的可靠性和可用性。

## 项目结构

基于提供的技能系统文档，Web3 AI Agent 采用模块化的 skill 架构，每个 skill 都有明确的职责边界和协作关系：

```mermaid
graph TB
subgraph "应用层"
WebApp[Next.js Web 应用]
API[工具 API 层]
Chat[聊天界面]
end
subgraph "共享包"
Web3Tools[Web3 工具集]
AIConfig[AI 配置]
end
subgraph "核心工具"
PriceTool[价格查询工具]
BalanceTool[余额查询工具]
GasTool[Gas 价格工具]
end
subgraph "数据源"
Binance[Binance API]
CoinGecko[CoinGecko API]
RPCNode[Ethereum RPC 节点]
ProxyAgent[代理服务器]
end
WebApp --> API
API --> PriceTool
API --> BalanceTool
API --> GasTool
PriceTool --> Binance
PriceTool --> CoinGecko
BalanceTool --> RPCNode
GasTool --> RPCNode
API --> ProxyAgent
```

**图表来源**
- [README.md:26-38](file://README.md#L26-L38)
- [route.ts:1-168](file://apps/web/app/api/tools/route.ts#L1-L168)

**章节来源**
- [README.md:26-38](file://README.md#L26-L38)
- [route.ts:1-168](file://apps/web/app/api/tools/route.ts#L1-L168)

## 核心组件

根据 PRD 文档，Web3 AI Agent 的核心组件包括三个主要的 Web3 工具：

### 1. ETH 价格查询工具 (`getETHPrice`)
- **功能**: 查询 ETH 实时价格数据，支持多数据源备份
- **数据来源**: Binance API、CoinGecko API（自动切换）
- **使用场景**: 用户询问 ETH 当前价格时自动调用
- **输出格式**: 结构化但易懂的价格结果，包含 24 小时涨跌信息

### 2. 钱包余额查询工具 (`getWalletBalance`)
- **功能**: 查询指定钱包地址的 ETH 余额
- **数据来源**: 以太坊 RPC 节点
- **使用场景**: 用户提供钱包地址查询余额时调用
- **输出格式**: 包含余额和数据来源说明的结果

### 3. Gas 价格查询工具 (`getGasPrice`)
- **功能**: 查询当前网络的 Gas 价格
- **数据来源**: 以太坊 RPC 节点
- **使用场景**: 用户询问当前 Gas 价格时调用
- **替代选项**: `getTokenInfo`（二选一）

**更新** 所有工具现在都具备了增强的错误处理和降级机制，确保在网络不稳定或数据源失效时仍能提供可靠的用户体验。

**章节来源**
- [Web3-AI-Agent-PRD-MVP.md:93-96](file://docs/Web3-AI-Agent-PRD-MVP.md#L93-L96)
- [Web3-AI-Agent-PRD-MVP.md:143-149](file://docs/Web3-AI-Agent-PRD-MVP.md#L143-L149)

## 架构概览

Web3 AI Agent 采用分层架构设计，从用户交互到工具调用再到结果回填的完整流程：

```mermaid
sequenceDiagram
participant User as 用户
participant Agent as Agent 核心
participant Tool as Web3 工具层
participant Price as 价格服务
participant Chain as 区块链网络
participant Proxy as 代理服务器
User->>Agent : 输入自然语言查询
Agent->>Agent : 意图识别和工具选择
Agent->>Tool : 调用相应 Web3 工具
alt ETH 价格查询
Tool->>Proxy : 检查代理配置
Proxy-->>Tool : 返回代理状态
Tool->>Price : 获取 ETH 价格数据多源备份
Price-->>Tool : 返回价格信息或错误
Tool->>Tool : 错误处理和降级
Tool-->>Agent : 工具执行结果
else 钱包余额查询
Tool->>Chain : 查询钱包余额
Chain-->>Tool : 返回链上余额
Tool-->>Agent : 工具执行结果
else Gas 价格查询
Tool->>Chain : 获取 Gas 价格
Chain-->>Tool : 返回网络费用信息
Tool-->>Agent : 工具执行结果
end
Agent->>Agent : 结果整理和格式化
Agent-->>User : 返回自然语言回复
```

**图表来源**
- [route.ts:132-168](file://apps/web/app/api/tools/route.ts#L132-L168)

## 详细组件分析

### ETH 价格查询工具实现

#### 增强的数据获取机制
ETH 价格查询工具采用多数据源备份机制，确保即使某个数据源失效也能获得可靠的价格信息：

```mermaid
flowchart TD
Start([开始查询]) --> CheckProxy["检查代理配置"]
CheckProxy --> ParseInput["解析用户输入"]
ParseInput --> ValidateToken{"验证 ETH 标识"}
ValidateToken --> |有效| TryBinance["尝试 Binance 数据源"]
TryBinance --> BinSuccess{"Binance 成功？"}
BinSuccess --> |是| ProcessBinance["处理 Binance 数据"]
BinSuccess --> |否| TryCoinGecko["尝试 CoinGecko 数据源"]
ProcessBinance --> FormatResponse["格式化响应"]
TryCoinGecko --> CGSuccess{"CoinGecko 成功？"}
CGSuccess --> |是| ProcessCoinGecko["处理 CoinGecko 数据"]
CGSuccess --> |否| HandleError["处理所有数据源失败"]
ProcessCoinGecko --> FormatResponse
HandleError --> ReturnError["返回错误信息"]
FormatResponse --> ReturnSuccess["返回成功结果"]
ReturnError --> End([结束])
ReturnSuccess --> End
```

**图表来源**
- [price.ts:9-66](file://packages/web3-tools/src/price.ts#L9-L66)

#### API 接口设计
- **函数名称**: `getETHPrice()`
- **输入参数**: 无（或可选的货币单位参数）
- **输出格式**: 
  - 成功: `{success: boolean, data: {price: number, change24h: number, currency: string}, timestamp: string, source: string}`
  - 失败: `{success: boolean, error: string, timestamp: string, source: string}`
- **错误码**: 
  - 1001: 参数无效
  - 1002: 所有数据源都不可用
  - 1003: API 调用失败
  - 1004: 数据解析失败

#### 增强的数据源接入方式
- **主要数据源**: Binance API（实时价格，24小时变化）
- **备用数据源**: CoinGecko API（包含 24 小时涨跌信息）
- **数据格式**: JSON 格式，包含价格、24小时变化百分比、货币单位
- **更新频率**: 实时更新，支持自动切换失效数据源

**更新** 新增了代理服务器支持，通过 `HTTPS_PROXY` 和 `HTTP_PROXY` 环境变量自动配置网络代理，改善了在中国大陆地区的网络访问稳定性。

**章节来源**
- [price.ts:9-66](file://packages/web3-tools/src/price.ts#L9-L66)
- [route.ts:20-69](file://apps/web/app/api/tools/route.ts#L20-L69)

### 钱包余额查询工具实现

#### 增强的地址验证和余额获取流程
钱包余额查询工具包含严格的地址验证机制和 RPC 节点配置：

```mermaid
flowchart TD
Start([开始查询]) --> ParseInput["解析用户输入"]
ParseInput --> ExtractAddress["提取钱包地址"]
ExtractAddress --> ValidateFormat{"验证地址格式"}
ValidateFormat --> |无效| ReturnInvalid["返回地址格式错误"]
ValidateFormat --> |有效| ValidateChecksum["验证校验和"]
ValidateChecksum --> |失败| ReturnChecksum["返回校验失败"]
ValidateChecksum --> |通过| CheckRPC["检查 RPC 配置"]
CheckRPC --> RPCConfigured{"RPC 配置？"}
RPCConfigured --> |否| UseDefault["使用默认 RPC 节点"]
RPCConfigured --> |是| UseCustom["使用自定义 RPC 节点"]
UseDefault --> QueryBalance["查询链上余额"]
UseCustom --> QueryBalance
QueryBalance --> BalanceSuccess{"查询成功？"}
BalanceSuccess --> |否| HandleBlockchainError["处理区块链错误"]
BalanceSuccess --> |是| FormatResult["格式化余额结果"]
FormatResult --> AddSource["添加数据来源说明"]
AddSource --> ReturnSuccess["返回成功结果"]
HandleBlockchainError --> CheckFallback["检查降级策略"]
CheckFallback --> FallbackAvailable{"有降级数据？"}
FallbackAvailable --> |是| ReturnFallback["返回降级数据"]
FallbackAvailable --> |否| ReturnError["返回通用错误"]
ReturnInvalid --> End([结束])
ReturnChecksum --> End
ReturnSuccess --> End
ReturnError --> End
```

**图表来源**
- [balance.ts:12-53](file://packages/web3-tools/src/balance.ts#L12-L53)

#### API 接口设计
- **函数名称**: `getWalletBalance(address: string, rpcUrl?: string)`
- **输入参数**: 
  - `address`: 钱包地址（必需）
  - `rpcUrl`: RPC 节点地址（可选，默认使用公共节点）
- **输出格式**: 
  - 成功: `{success: boolean, data: {address: string, balance: string, unit: string}, timestamp: string, source: string}`
  - 失败: `{success: boolean, error: string, timestamp: string, source: string}`
- **错误码**: 
  - 2001: 地址格式无效
  - 2002: 地址校验失败
  - 2003: RPC 连接失败
  - 2004: 区块链查询超时
  - 2005: 地址为空

#### 增强的数据源接入方式
- **主要数据源**: 以太坊 RPC 节点（支持自定义配置）
- **备用数据源**: 公共 RPC 服务（默认 fallback）
- **数据格式**: 以 wei 为单位的字符串，自动转换为 ETH
- **缓存策略**: 15 秒缓存，支持手动刷新

**更新** 新增了环境变量配置支持，通过 `ETHEREUM_RPC_URL` 环境变量允许用户自定义 RPC 节点，提高了系统的灵活性和可靠性。

**章节来源**
- [balance.ts:12-53](file://packages/web3-tools/src/balance.ts#L12-L53)
- [route.ts:71-104](file://apps/web/app/api/tools/route.ts#L71-L104)

### Gas 价格查询工具实现

#### 增强的网络状态检查和降级策略
Gas 价格查询工具具有完善的网络状态监控和降级机制：

```mermaid
flowchart TD
Start([开始查询]) --> CheckRPC["检查 RPC 配置"]
CheckRPC --> RPCStatus{"RPC 状态"}
RPCStatus --> |正常| GetGasPrice["获取 Gas 价格"]
RPCStatus --> |不稳定| CheckLatency["检查延迟"]
RPCStatus --> |完全不可用| CheckFallback["检查降级数据"]
CheckLatency --> LatencyOK{"延迟正常？"}
LatencyOK --> |是| GetGasPrice
LatencyOK --> |否| UseCached["使用缓存价格"]
GetGasPrice --> PriceSuccess{"获取成功？"}
PriceSuccess --> |是| ValidatePrice["验证价格合理性"]
PriceSuccess --> |否| CheckFallback
ValidatePrice --> PriceValid{"价格合理？"}
PriceValid --> |是| ReturnPrice["返回价格"]
PriceValid --> |否| CheckFallback
CheckFallback --> FallbackAvailable{"有降级数据？"}
FallbackAvailable --> |是| ReturnFallback["返回降级数据"]
FallbackAvailable --> |否| ReturnError["返回错误"]
UseCached --> ReturnCached["返回缓存价格"]
ReturnCached --> End([结束])
ReturnPrice --> End
ReturnError --> End
```

**图表来源**
- [gas.ts:11-42](file://packages/web3-tools/src/gas.ts#L11-L42)

#### API 接口设计
- **函数名称**: `getGasPrice(rpcUrl?: string)`
- **输入参数**: 
  - `rpcUrl`: RPC 节点地址（可选，默认使用公共节点）
- **输出格式**: 
  - 成功: `{success: boolean, data: {gasPrice: string | null, maxFeePerGas: string | null, maxPriorityFeePerGas: string | null, unit: string}, timestamp: string, source: string}`
  - 失败: `{success: boolean, error: string, timestamp: string, source: string}`
- **错误码**: 
  - 3001: RPC 状态未知
  - 3002: Gas 价格获取失败
  - 3003: 网络延迟过高
  - 3004: 缓存数据过期

#### 增强的数据源接入方式
- **主要数据源**: 以太坊 RPC 节点（支持自定义配置）
- **备用数据源**: 公共 Gas 价格服务
- **数据格式**: 包含标准 Gas 价格、快速 Gas 价格、慢速 Gas 价格
- **更新策略**: 实时更新，支持智能缓存

**更新** 新增了环境变量配置支持，通过 `ETHEREUM_RPC_URL` 环境变量允许用户自定义 RPC 节点，提高了系统的灵活性和可靠性。

**章节来源**
- [gas.ts:11-42](file://packages/web3-tools/src/gas.ts#L11-L42)
- [route.ts:106-130](file://apps/web/app/api/tools/route.ts#L106-L130)

## 依赖分析

Web3 工具的依赖关系和协作机制如下：

```mermaid
graph TB
subgraph "外部依赖"
Web3SDK[Web3.js SDK]
Ethers[Ethers.js]
Axios[Axios HTTP 客户端]
WebSocket[WebSocket 客户端]
HttpsProxyAgent[HttpsProxyAgent]
NodeFetch[node-fetch]
ProxyAgent[proxy-agent]
end
subgraph "内部组件"
ToolRegistry[工具注册表]
ErrorHandler[错误处理器]
CacheManager[缓存管理器]
Logger[日志记录器]
TypeSystem[类型系统]
end
subgraph "核心工具"
ETHPrice[ETH 价格工具]
WalletBalance[钱包余额工具]
GasPrice[Gas 价格工具]
end
subgraph "工具适配器"
PriceAdapter[价格适配器]
BalanceAdapter[余额适配器]
GasAdapter[Gas 适配器]
end
subgraph "数据源"
BinanceAPI[Binance API]
CoinGeckoAPI[CoinGecko API]
RPCNode[Ethereum RPC 节点]
ProxyServer[代理服务器]
end
Web3SDK --> ToolRegistry
Ethers --> ToolRegistry
Axios --> ToolRegistry
WebSocket --> ToolRegistry
HttpsProxyAgent --> ToolRegistry
NodeFetch --> ToolRegistry
ProxyAgent --> ToolRegistry
ToolRegistry --> ETHPrice
ToolRegistry --> WalletBalance
ToolRegistry --> GasPrice
ETHPrice --> PriceAdapter
WalletBalance --> BalanceAdapter
GasPrice --> GasAdapter
ETHPrice --> BinanceAPI
ETHPrice --> CoinGeckoAPI
WalletBalance --> RPCNode
GasPrice --> RPCNode
ToolRegistry --> ProxyServer
ErrorHandler --> ToolRegistry
CacheManager --> ToolRegistry
Logger --> ToolRegistry
TypeSystem --> ToolRegistry
```

**图表来源**
- [README.md:18-25](file://README.md#L18-L25)
- [route.ts:3-8](file://apps/web/app/api/tools/route.ts#L3-L8)

### 组件耦合度分析
- **低耦合设计**: 每个工具都有独立的适配器层
- **接口标准化**: 统一的工具接口规范
- **错误隔离**: 各工具错误处理相互独立
- **可扩展性**: 支持新工具的无缝集成
- **环境适应性**: 支持代理服务器和自定义配置

**更新** 新增了代理服务器支持和环境变量配置，提高了系统的环境适应性和部署灵活性。

**章节来源**
- [README.md:18-25](file://README.md#L18-L25)
- [route.ts:3-8](file://apps/web/app/api/tools/route.ts#L3-L8)

## 性能考虑

### 增强的缓存策略
1. **价格数据缓存**: 15 秒 TTL，支持手动刷新
2. **余额数据缓存**: 15 秒 TTL，支持批量查询
3. **Gas 价格缓存**: 15 秒 TTL，支持智能更新
4. **代理缓存**: 代理配置缓存，减少重复初始化

### 改进的并发控制
- **最大并发数**: 5 个并发请求
- **队列管理**: FIFO 队列，支持优先级排序
- **超时控制**: 10 秒超时，支持重试机制
- **代理超时**: 15 秒代理超时，避免阻塞

### 增强的错误恢复
- **自动重试**: 最多重试 3 次
- **降级策略**: 缓存数据优先，网络数据兜底
- **熔断机制**: 连续失败超过阈值时启用熔断
- **代理回退**: 代理失败时自动回退到直连

**更新** 新增了代理服务器支持，通过环境变量自动配置网络代理，改善了网络访问的稳定性和成功率。

## 故障排除指南

### 常见问题及解决方案

#### 1. 工具参数无效
**症状**: 返回参数验证错误
**解决方案**: 
- 检查输入参数格式
- 验证必填字段完整性
- 确认参数类型正确性

#### 2. 工具执行失败
**症状**: 工具调用抛出异常
**解决方案**:
- 查看错误日志获取详细信息
- 检查网络连接状态
- 验证 API 密钥有效性

#### 3. 外部 API 超时
**症状**: 请求超时或响应缓慢
**解决方案**:
- 检查 API 服务状态
- 调整超时参数
- 启用降级模式

#### 4. 用户提问超出能力边界
**症状**: 系统无法理解或处理请求
**解决方案**:
- 返回能力边界说明
- 提供相关工具列表
- 引导用户使用正确指令

#### 5. 代理服务器连接失败
**症状**: 代理配置无效或连接超时
**解决方案**:
- 检查 `HTTPS_PROXY` 或 `HTTP_PROXY` 环境变量
- 验证代理服务器可用性
- 确认代理认证设置

#### 6. RPC 节点连接失败
**症状**: 无法连接到以太坊网络
**解决方案**:
- 检查 `ETHEREUM_RPC_URL` 环境变量
- 验证 RPC 节点可用性
- 使用默认公共节点进行测试

**更新** 新增了代理服务器和 RPC 节点配置的故障排除指南。

**章节来源**
- [Web3-AI-Agent-PRD-MVP.md:192-196](file://docs/Web3-AI-Agent-PRD-MVP.md#L192-L196)
- [route.ts:157-166](file://apps/web/app/api/tools/route.ts#L157-L166)

## 结论

Web3 AI Agent 的核心 Web3 工具实现了以下关键特性：

1. **模块化设计**: 每个工具都有独立的功能和接口
2. **健壮的错误处理**: 完善的异常捕获和降级机制
3. **高性能架构**: 缓存策略和并发控制确保响应速度
4. **可扩展性**: 支持新工具的无缝集成和现有工具的扩展
5. **环境适应性**: 支持代理服务器和自定义配置
6. **多数据源备份**: 确保服务的高可用性
7. **用户体验**: 提供清晰的错误信息和降级提示

**更新** 本次更新显著增强了系统的可靠性和可用性，通过多数据源支持、代理服务器配置和改进的错误处理机制，为构建可信的 Web3 AI Agent 奠定了更加坚实的基础。

这些工具为构建可信的 Web3 AI Agent 奠定了坚实基础，支持从简单的价格查询到复杂的链上数据交互等各种使用场景。

## 附录

### 使用场景演示

#### 场景 1：查询实时价格
用户输入："ETH 现在价格是多少？"
期望结果：返回 ETH 当前价格、货币单位、24小时涨跌百分比和数据来源

#### 场景 2：查询地址余额
用户输入："帮我查一下这个地址的 ETH 余额：0x..."
期望结果：返回指定地址的 ETH 余额、链 ID、查询时间和数据来源

#### 场景 3：多轮跟进
用户先问价格，再问："如果是我刚才那个地址呢？"
期望结果：系统保留对话上下文，在合理范围内复用已有信息

#### 场景 4：代理环境配置
用户部署在受限网络环境中
期望结果：系统自动检测代理配置并使用代理服务器访问数据源

### 配置参数说明

#### 环境变量
- `RPC_URL`: 区块链 RPC 服务地址（兼容旧版本）
- `ETHEREUM_RPC_URL`: 以太坊 RPC 服务地址（推荐使用）
- `HTTPS_PROXY`: HTTPS 代理服务器地址
- `HTTP_PROXY`: HTTP 代理服务器地址
- `CACHE_TTL`: 缓存过期时间（秒）
- `MAX_CONCURRENT`: 最大并发请求数

#### 工具配置
- `getETHPrice`: 支持多数据源备份和代理配置
- `getWalletBalance`: 支持链 ID 和地址格式验证，支持自定义 RPC 节点
- `getGasPrice`: 支持网络状态监控和降级策略，支持自定义 RPC 节点

**更新** 新增了代理服务器和 RPC 节点配置参数，提高了系统的部署灵活性和环境适应性。