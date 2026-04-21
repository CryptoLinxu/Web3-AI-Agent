# Changelog - 2026-04-20 (1/3)

## 任务信息
- **类型**: FEAT
- **主题**: 完善 AI 模型配置与 Web3 工具代理支持
- **Pipeline**: FEAT（快速流程）
- **完成时间**: 2026-04-20 10:20
- **Commit**: 602fc02

## 架构设计

### 目标
解决国内网络环境下外部 API 访问问题，添加 HTTP 代理支持，并为 AI 模型配置添加国产模型（DeepSeek、通义千问）支持。

### 模块边界
- 修改 `packages/ai-config/` - 添加新模型配置支持
- 修改 `packages/web3-tools/` - 添加代理支持
- 修改 `apps/web/app/api/tools/` - 集成代理配置

### 接口契约

```typescript
// 扩展的 AI 模型配置
interface AIModelConfig {
  provider: 'openai' | 'anthropic' | 'deepseek' | 'qwen'
  apiKey: string
  model: string
  base_url?: string  // 支持自定义 API 地址
}

// 代理配置
interface ProxyConfig {
  http_proxy?: string
  https_proxy?: string
}
```

### 数据流

**代理请求流程**：
工具调用 -> 读取代理环境变量 -> 创建 HttpsProxyAgent -> 使用 node-fetch 发起请求 -> 返回结果

**多数据源容错**：
ETH 价格查询 -> 尝试 Binance API -> 失败则尝试 Huobi API -> 返回结果或抛出错误

### 风险点
- Node.js 20+ 原生 fetch 不支持 agent 参数
- 已替换为 node-fetch + https-proxy-agent 解决
- DeepSeek base_url 配置需移除 /v1 后缀

## 变更详情

### 新增

#### AI 模型配置
- DeepSeek 模型配置示例（.env.example）
- 通义千问（Qwen）模型配置示例
- 代理配置支持（HTTP_PROXY/HTTPS_PROXY）

#### Web3 工具
- ETH 价格查询多数据源容错机制
  - 主数据源：Binance API
  - 备数据源：Huobi API
  - 移除：CoinGecko API（国内访问不稳定）
- node-fetch 依赖（替代原生 fetch）
- https-proxy-agent 依赖（HTTP 代理支持）

#### 文档
- Monorepo 结构知识文档
- 构建使用流程文档
- 测试规范文档

### 修改

#### AI 配置
- 修复 DeepSeek base_url 配置（移除 /v1 后缀）
- 更新 .env.example 添加国产模型配置

#### Web3 工具
- 重构 price.ts 实现多数据源切换
- 修复类型错误
- 添加代理支持到所有 HTTP 请求

#### 工程配置
- 修复 turbo.json 配置（pipeline 改为 tasks，适配 turbo 2.x）
- 更新依赖包版本

### 删除
- 移除 CoinGecko API 依赖（国内访问不稳定）

## 影响范围

- **影响模块**: packages/ai-config, packages/web3-tools, apps/web
- **破坏性变更**: 否
- **需要迁移**: 否（向后兼容）

## 上下文标记

**关键词**: 代理支持,HTTP代理,国产模型,DeepSeek,通义千问,多数据源,容错,node-fetch,Binance,Huobi
**相关文档**: 
- apps/web/.env.example
- packages/web3-tools/src/price.ts
**后续建议**: 
- 考虑添加更多国产模型支持
- 监控 Binance/Huobi API 稳定性
