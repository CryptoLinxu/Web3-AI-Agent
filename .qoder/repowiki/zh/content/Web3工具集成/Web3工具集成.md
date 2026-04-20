# Web3工具集成

<cite>
**本文引用的文件**
- [Web3-AI-Agent-PRD-MVP.md](file://Web3-AI-Agent-PRD-MVP.md)
- [Web3-AI-Agent-项目里程碑-Checklist.md](file://Web3-AI-Agent-项目里程碑-Checklist.md)
- [WEB3-AI-AGENT-使用教程-V1.md](file://WEB3-AI-AGENT-使用教程-V1.md)
- [packages/web3-tools/src/index.ts](file://packages/web3-tools/src/index.ts)
- [packages/web3-tools/src/types.ts](file://packages/web3-tools/src/types.ts)
- [packages/web3-tools/src/price.ts](file://packages/web3-tools/src/price.ts)
- [packages/web3-tools/src/balance.ts](file://packages/web3-tools/src/balance.ts)
- [packages/web3-tools/src/gas.ts](file://packages/web3-tools/src/gas.ts)
- [apps/web/app/api/tools/route.ts](file://apps/web/app/api/tools/route.ts)
- [apps/web/app/api/chat/route.ts](file://apps/web/app/api/chat/route.ts)
- [apps/web/app/page.tsx](file://apps/web/app/page.tsx)
- [skills/x-ray/SKILL.md](file://skills/x-ray/SKILL.md)
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md)
- [skills/x-ray/MAP-V3.md](file://skills/x-ray/MAP-V3.md)
</cite>

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构总览](#架构总览)
5. [详细组件分析](#详细组件分析)
6. [依赖分析](#依赖分析)
7. [性能考虑](#性能考虑)
8. [故障排查指南](#故障排查指南)
9. [结论](#结论)
10. [附录](#附录)

## 简介
本文件面向Web3开发者，系统化阐述AI-Agent项目的Web3工具集成方案。项目已从概念设计升级为完整实现，包含ETH价格查询、钱包余额查询、Gas价格查询等核心工具，以及完整的工具抽象层设计。围绕"工具抽象层、工具调用接口、数据格式化与错误处理策略"，结合MVP阶段的三大核心工具进行设计与实现指导；并提供扩展机制、API接口文档、性能优化与故障恢复建议，帮助团队在可控风险边界内构建可演进的Web3数据服务能力。

## 项目结构
该项目采用"技能系统（Skill System）+ 工具层 + API层"的分层组织方式：
- 技能系统：通过统一入口路由不同任务类型，按需进入定义、交付、治理等子链路。
- 工具层：封装Web3数据获取逻辑，提供标准化接口与错误处理策略，确保Agent在调用工具前后能获得一致、可解释的结果。
- API层：提供RESTful接口，支持前端调用和工具调用。

```mermaid
graph TB
A["统一入口<br/>origin"] --> B["任务类型判断<br/>DISCOVER/BOOTSTRAP/DEFINE/DELIVER*/VERIFY-GOVERN"]
B --> C["非交付链路<br/>explore/init-docs/..."]
B --> D["交付链路<br/>pipeline(FEAT/PATCH/REFACTOR)"]
D --> E["定义层<br/>pm/prd/req/check-in"]
D --> F["交付层<br/>architect/qa/coder/audit"]
D --> G["治理层<br/>digest/update-map"]
F --> H["工具层<br/>Web3工具抽象与实现"]
H --> I["外部数据源<br/>链上/价格/第三方API"]
I --> J["CoinGecko<br/>价格API"]
I --> K["Ethereum RPC<br/>链上节点"]
I --> L["Alchemy/Infura<br/>索引器"]
```

**图表来源**
- [skills/x-ray/SKILL.md:1-224](file://skills/x-ray/SKILL.md#L1-L224)
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md:1-719](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md#L1-L719)
- [skills/x-ray/MAP-V3.md:1-211](file://skills/x-ray/MAP-V3.md#L1-L211)

**章节来源**
- [skills/x-ray/SKILL.md:1-224](file://skills/x-ray/SKILL.md#L1-L224)
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md:1-719](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md#L1-L719)
- [skills/x-ray/MAP-V3.md:1-211](file://skills/x-ray/MAP-V3.md#L1-L211)

## 核心组件
- 工具抽象层
  - 设计理念：将Web3数据查询抽象为标准化工具，统一输入/输出契约、错误处理与降级策略，保证Agent在不同数据源间平滑切换。
  - 关键属性：工具名称、输入参数、输出结构、错误码、降级策略、数据来源标识。
- 三大核心工具
  - ETH价格查询：面向CoinGecko价格API，返回ETH价格与24小时变化率。
  - 钱包余额查询：校验钱包地址合法性，查询链上ETH余额并标注数据来源。
  - Gas价格查询：检查网络可用性，返回当前Gas价格（基础/优先级/乐观）。
- 错误处理与降级
  - 参数无效、外部API超时、网络不可用、工具失败等场景均需返回可理解的失败说明与保守建议，避免伪造数据。

**章节来源**
- [Web3-AI-Agent-PRD-MVP.md:84-156](file://Web3-AI-Agent-PRD-MVP.md#L84-L156)
- [Web3-AI-Agent-PRD-MVP.md:174-197](file://Web3-AI-Agent-PRD-MVP.md#L174-L197)

## 架构总览
Web3工具集成的总体架构由"技能系统路由 + 工具层 + API层 + 外部数据源"四层组成。技能系统负责任务识别与流程编排，工具层负责数据获取与结果格式化，API层提供统一接口，外部数据源包括链上节点、价格API与第三方Web3数据提供商。

```mermaid
graph TB
subgraph "技能系统"
O["origin<br/>统一入口"] --> P["pipeline<br/>交付型任务分流"]
O --> S["explore/init-docs/...<br/>非交付链路"]
P --> D["定义层(pm/prd/req/check-in)"]
P --> B["交付层(architect/qa/coder/audit)"]
B --> T["工具层(Web3工具)"]
end
subgraph "API层"
T --> API["工具API<br/>/api/tools"]
API --> CHAT["聊天API<br/>/api/chat"]
end
subgraph "工具层"
T --> W1["ETH价格查询<br/>getETHPrice"]
T --> W2["钱包余额查询<br/>getWalletBalance"]
T --> W3["Gas价格查询<br/>getGasPrice"]
end
subgraph "外部数据源"
W1 --> EX1["CoinGecko<br/>价格API"]
W2 --> EX2["Ethereum RPC<br/>链上节点"]
W3 --> EX3["Alchemy/Infura<br/>索引器"]
end
```

**图表来源**
- [apps/web/app/api/tools/route.ts:1-134](file://apps/web/app/api/tools/route.ts#L1-L134)
- [apps/web/app/api/chat/route.ts:1-100](file://apps/web/app/api/chat/route.ts#L1-L100)
- [packages/web3-tools/src/index.ts:1-7](file://packages/web3-tools/src/index.ts#L1-L7)

## 详细组件分析

### 工具抽象层设计
- 输入/输出契约
  - 输入：工具名称、参数集合（如钱包地址、链ID、超时阈值）
  - 输出：结构化结果（含success标志、data、error、timestamp、source）
- 错误处理策略
  - 参数校验失败：返回"参数无效"及可选建议
  - 外部API超时/异常：返回"数据获取失败"并附带降级提示
  - 网络不可用：返回"网络不可用"并建议稍后重试
- 降级与容错
  - 多源备份：同一工具可配置多个数据源，失败时自动切换
  - 缓存命中：优先返回缓存结果，设置TTL与失效策略
  - 保守回复：失败时不输出虚构数据，明确标注"数据来源未知"

**章节来源**
- [Web3-AI-Agent-PRD-MVP.md:174-197](file://Web3-AI-Agent-PRD-MVP.md#L174-L197)

### ETH价格查询工具
- 数据获取机制
  - 使用CoinGecko API获取ETH/USD价格，支持24小时变化率
  - 返回价格数值、24小时变化百分比、货币单位
- 数据格式化
  - 数值保留合理精度，单位统一为USD
  - 结果中明确标注"数据来自CoinGecko"
- 错误处理
  - API不可达：返回"价格数据暂时不可用，建议稍后重试"
  - 解析失败：返回"数据解析异常，无法生成价格结果"

```mermaid
flowchart TD
Start(["开始"]) --> Validate["校验输入参数"]
Validate --> Valid{"参数有效?"}
Valid --> |否| ErrParam["返回参数无效"]
Valid --> |是| Fetch["调用CoinGecko API"]
Fetch --> Ok{"成功?"}
Ok --> |否| ErrAPI["返回API失败并附降级提示"]
Ok --> |是| Format["格式化结果(含来源/时间戳)"]
Format --> Done(["结束"])
ErrParam --> Done
ErrAPI --> Done
```

**图表来源**
- [packages/web3-tools/src/price.ts:8-39](file://packages/web3-tools/src/price.ts#L8-L39)

**章节来源**
- [packages/web3-tools/src/price.ts:8-39](file://packages/web3-tools/src/price.ts#L8-L39)

### 钱包余额查询工具
- 地址验证与余额获取流程
  - 地址校验：使用ethers.js验证钱包地址合法性
  - 余额查询：调用Ethereum RPC节点，获取ETH余额
  - 结果标注：明确数据来源（链上）、查询时间、单位
- 数据格式化
  - 余额数值保留合适精度，单位统一为ETH
  - 结果中包含"data来自链上查询"的说明
- 错误处理
  - 地址无效：返回"地址格式不正确"
  - RPC不可用：返回"链上数据不可用，建议稍后重试"
  - 解析失败：返回"余额解析异常"

```mermaid
flowchart TD
Start(["开始"]) --> CheckAddr["校验钱包地址"]
CheckAddr --> AddrOk{"地址有效?"}
AddrOk --> |否| ErrAddr["返回地址无效"]
AddrOk --> |是| CallRPC["调用Ethereum RPC"]
CallRPC --> RpcOk{"成功?"}
RpcOk --> |否| ErrRpc["返回链上数据不可用"]
RpcOk --> |是| Parse["解析余额(ETH)"]
Parse --> Format["格式化结果(含来源/时间戳)"]
Format --> Done(["结束"])
ErrAddr --> Done
ErrRpc --> Done
```

**图表来源**
- [packages/web3-tools/src/balance.ts:12-53](file://packages/web3-tools/src/balance.ts#L12-L53)

**章节来源**
- [packages/web3-tools/src/balance.ts:12-53](file://packages/web3-tools/src/balance.ts#L12-L53)

### Gas价格查询工具
- 网络状态检查与降级策略
  - 健康检查：先检查RPC连通性与区块高度变化
  - 可用：返回当前Gas价格（基础/优先级/乐观）
  - 不可用：返回"网络不可用"并建议使用历史参考或稍后重试
- 数据格式化
  - 返回结构化Gas价格字段（如gwei），标注来源与时间
- 错误处理
  - 超时：返回"Gas价格查询超时"
  - 解析失败：返回"Gas数据解析异常"

```mermaid
flowchart TD
Start(["开始"]) --> Health["检查网络健康(RPC/区块)"]
Health --> Healthy{"网络健康?"}
Healthy --> |否| Degraded["返回网络不可用并降级提示"]
Healthy --> |是| Fetch["获取Gas价格"]
Fetch --> Ok{"成功?"}
Ok --> |否| ErrGas["返回Gas查询失败"]
Ok --> |是| Format["格式化结果(含来源/时间)"]
Format --> Done(["结束"])
Degraded --> Done
ErrGas --> Done
```

**图表来源**
- [packages/web3-tools/src/gas.ts:11-43](file://packages/web3-tools/src/gas.ts#L11-L43)

**章节来源**
- [packages/web3-tools/src/gas.ts:11-43](file://packages/web3-tools/src/gas.ts#L11-L43)

### 工具系统的扩展机制
- 第三方Web3数据源集成
  - 注册新工具：定义工具名称、输入/输出契约、错误码与降级策略
  - 配置数据源：支持多源并行与故障转移
  - 结果归一化：统一字段与单位，确保Agent侧无需感知底层差异
- 集成流程
  - 在工具层新增适配器，实现统一接口
  - 在技能系统中注册工具，确保Agent可调用
  - 编写测试用例与异常路径验证

**章节来源**
- [Web3-AI-Agent-PRD-MVP.md:143-156](file://Web3-AI-Agent-PRD-MVP.md#L143-L156)

## 依赖分析
- 技能系统与工具层的耦合关系
  - 技能系统负责任务路由与流程编排，工具层提供数据能力
  - 两者通过标准化工具接口耦合，降低相互依赖
- 外部依赖
  - CoinGecko价格API、Ethereum RPC节点、Alchemy/Infura索引器等第三方服务
  - 通过健康检查与降级策略降低外部依赖风险

```mermaid
graph LR
O["origin"] --> P["pipeline"]
P --> T["工具层"]
T --> EX["外部数据源"]
T --> CACHE["缓存层"]
T --> LOG["日志/监控"]
API["API层"] --> T
API --> CHAT["聊天API"]
```

**图表来源**
- [skills/x-ray/SKILL.md:1-224](file://skills/x-ray/SKILL.md#L1-L224)
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md:1-719](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md#L1-L719)

**章节来源**
- [skills/x-ray/SKILL.md:1-224](file://skills/x-ray/SKILL.md#L1-L224)
- [skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md:1-719](file://skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md#L1-L719)

## 性能考虑
- 缓存策略
  - 价格与Gas价格：短期缓存（如60秒），设置TTL与失效策略
  - 钱包余额：按地址维度缓存，结合区块高度或时间戳判断有效性
- 并发与限流
  - 对外部API进行并发限制与重试退避
  - 对链上RPC进行队列化与限流，避免抖动
- 降级与可观测性
  - 失败时返回降级提示，记录失败原因与耗时
  - 健康检查周期化，异常告警与自动恢复

## 故障排查指南
- 常见问题与处理
  - 参数无效：检查输入格式与必填字段
  - API超时：查看外部服务状态与限流情况
  - 网络不可用：检查RPC连通性与区块高度变化
  - 结果为空：确认数据源可用性与工具配置
- 日志与监控
  - 记录工具调用参数、响应时间、错误码与降级原因
  - 设置SLA阈值与告警，保障用户体验

**章节来源**
- [Web3-AI-Agent-PRD-MVP.md:174-197](file://Web3-AI-Agent-PRD-MVP.md#L174-L197)

## 结论
本方案以"技能系统路由 + 工具层抽象 + API层 + 外部数据源"为核心，围绕MVP三大工具构建了可演进的Web3数据服务能力。通过标准化接口、统一错误处理与降级策略，以及可插拔的扩展机制，团队可在可控风险边界内持续迭代，逐步完善多链支持与高级能力。

## 附录

### API接口文档
- ETH价格查询
  - 方法：GET
  - 路径：/api/tools/getETHPrice
  - 请求参数：无
  - 成功响应：包含price、change24h、currency字段
  - 失败响应：包含error字段
- 钱包余额查询
  - 方法：POST
  - 路径：/api/tools/getWalletBalance
  - 请求参数：address（钱包地址）
  - 成功响应：包含address、balance、unit字段
  - 失败响应：包含error字段
- Gas价格查询
  - 方法：GET
  - 路径：/api/tools/getGasPrice
  - 请求参数：无
  - 成功响应：包含gasPrice、maxFeePerGas、maxPriorityFeePerGas、unit字段
  - 失败响应：包含error字段

**章节来源**
- [apps/web/app/api/tools/route.ts:10-97](file://apps/web/app/api/tools/route.ts#L10-L97)

### 工具调用示例
- 前端调用流程
  - 用户输入问题
  - Agent判断是否需要调用工具
  - 调用对应Web3工具API
  - 获取工具结果并回填给模型
  - 生成最终回复并返回给前端

**章节来源**
- [apps/web/app/api/chat/route.ts:76-100](file://apps/web/app/api/chat/route.ts#L76-L100)
- [apps/web/app/page.tsx:42-105](file://apps/web/app/page.tsx#L42-L105)

### 类型定义
- ToolResult：工具调用结果的标准格式
- ETHPriceData：ETH价格数据结构
- WalletBalanceData：钱包余额数据结构
- GasPriceData：Gas价格数据结构

**章节来源**
- [packages/web3-tools/src/types.ts:3-34](file://packages/web3-tools/src/types.ts#L3-L34)