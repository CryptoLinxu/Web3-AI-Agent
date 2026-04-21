# Changelog - 2026-04-20 (2/3)

## 任务信息
- **类型**: FEAT
- **主题**: Web3 工具模块重构与直接调用优化
- **Pipeline**: FEAT（快速流程）
- **完成时间**: 2026-04-20 15:34
- **Commit**: 82a61e5

## 架构设计

### 目标
将 Web3 工具从 API 路由层迁移至独立包直接调用，简化架构并提升性能，同时强化代理支持解决国内网络访问问题。

### 模块边界
- `packages/web3-tools/` - 从库升级为直接调用模块
- `apps/web/app/api/chat/` - 集成工具直接调用
- `apps/web/app/api/tools/` - 大幅简化（移除冗余逻辑）

### 数据流

**重构前**：
用户请求 -> `/api/tools` -> 工具路由 -> 调用外部 API -> 返回结果

**重构后**：
用户请求 -> Chat API -> 直接调用 packages/web3-tools -> 返回结果

### 接口契约

```typescript
// Web3 工具函数签名（保持不变）
function getETHPrice(): Promise<number>
function getWalletBalance(address: string): Promise<number>
function getGasPrice(): Promise<number>
```

### 关键变化
- 工具函数从 API 路由迁移至包级别导出
- Chat API 直接 import 工具函数，不再通过 HTTP 调用
- 数据源完全替换为国内可访问的 API

## 变更详情

### 新增

#### 数据源
- Binance CN API（主数据源）
- Huobi API（备用数据源）
- 完全移除 CoinGecko（国内访问不稳定）

#### 配置
- 环境变量支持自定义 RPC URL
- 环境变量支持配置代理地址

### 修改

#### 架构重构
- 将 Web3 工具从 API 路由迁移至独立包直接调用
  - 减少 HTTP 开销
  - 简化调用链路
  - 提升响应速度
- Chat API（route.ts）直接 import 工具函数
  - 从 133 行简化至 35 行改动
  - 移除冗余的 HTTP 调用逻辑

#### 工具实现
- 更新 price.ts（60 行改动）
  - 替换数据源为 Binance CN 和 Huobi
  - 强化代理支持
  - 优化错误处理
- 更新 balance.ts（4 行改动）
  - 添加代理支持
- 更新 gas.ts（4 行改动）
  - 添加代理支持

#### 文档
- 更新工具指令文档（479 行新增）
- 更新技能地图（MAP-V3.md）
- 更新知识图谱

### 删除

#### API 路由
- 移除 `/api/tools` 中的冗余工具实现逻辑
- 简化路由层职责（仅保留代理转发）

## 影响范围

- **影响模块**: packages/web3-tools, apps/web/app/api
- **破坏性变更**: 否（接口保持不变）
- **需要迁移**: 否

## 上下文标记

**关键词**: web3-tools,架构重构,直接调用,Binance,Huobi,性能优化,代理支持,数据源替换
**相关文档**: 
- packages/web3-tools/src/price.ts
- apps/web/app/api/chat/route.ts
- skills/x-ray/MAP-V3.md
**后续建议**: 
- 监控新数据源的稳定性和响应时间
- 考虑添加工具调用的缓存机制
