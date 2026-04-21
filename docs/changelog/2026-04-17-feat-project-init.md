# Changelog - 2026-04-17

## 任务信息
- **类型**: FEAT
- **主题**: 项目初始化与全局模型切换支持
- **Pipeline**: FEAT（完整流程，Audit 评分 99/100）
- **完成时间**: 2026-04-17
- **Commit**: 84e5498

## 架构设计

### 目标
建立 Web3 AI Agent 项目基础架构，实现 Monorepo 结构和全局 AI 模型切换能力，支持多 provider 动态切换。

### 模块边界
- `apps/web/` - Next.js Web 应用（聊天界面）
- `packages/ai-config/` - AI 模型配置管理（多 provider 适配器）
- `packages/web3-tools/` - Web3 工具集（价格、余额、Gas 查询）
- `skills/x-ray/` - AI Agent 技能体系（V3 版本）

### 接口契约

```typescript
// AI 模型配置接口
interface AIModelConfig {
  provider: 'openai' | 'anthropic'
  apiKey: string
  model: string
  base_url?: string
}

// Provider 适配器接口
interface LLMProvider {
  chat(messages: Message[]): Promise<ChatResponse>
}

// Web3 工具接口
interface Web3Tool {
  getETHPrice(): Promise<number>
  getWalletBalance(address: string): Promise<number>
  getGasPrice(): Promise<number>
}
```

### 数据流

**模型切换流程**：
用户选择模型 -> 更新 .env 环境变量 -> 服务端读取配置 -> LLMFactory 创建对应 Provider -> 调用 AI API

**聊天流程**：
用户输入 -> Chat API -> 使用配置的 Provider -> 返回 AI 回复

### 风险点
- 环境变量配置错误会导致模型切换失败
- 已添加健康检查 API（`/api/health`）用于诊断

## 变更详情

### 新增

#### 核心架构
- Monorepo 项目结构（pnpm workspace + turbo 2.x）
- Next.js Web 应用基础框架
- AI 模型配置模块（packages/ai-config）
  - OpenAI Provider 适配器
  - Anthropic Provider 适配器
  - LLMFactory 动态工厂
- Web3 工具模块（packages/web3-tools）
  - ETH 价格查询（CoinGecko API）
  - 钱包余额查询
  - Gas 价格查询

#### 技能体系
- x-ray 技能体系 V3（完整 SDLC 自动化）
  - 主技能：origin, pipeline
  - 定义技能：pm, prd, req
  - 设计技能：architect, qa
  - 实现技能：coder, audit
  - 辅助技能：explore, check-in, digest, update-map 等

#### 文档体系
- AI Agent 核心概念学习指南（7 份文档）
- 项目架构文档（ARCHITECTURE.md）
- PRD MVP 文档
- 技能系统设计文档

#### API 端点
- `/api/chat` - 聊天接口
- `/api/tools` - Web3 工具接口
- `/api/health` - 健康检查

### 修改
- 无（项目初始化）

### 删除
- 无（项目初始化）

## 影响范围

- **影响模块**: 全部（项目初始化）
- **破坏性变更**: 否
- **需要迁移**: 否

## 上下文标记

**关键词**: 项目初始化,Monorepo,模型切换,AI配置,Next.js,技能体系,x-ray,Provider适配器
**相关文档**: 
- ARCHITECTURE.md
- docs/Web3-AI-Agent-PRD-MVP.md
- skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md
**后续建议**: 
- 添加更多 AI provider 支持（已预留扩展点）
- 完善 Web3 工具的数据源容错机制
