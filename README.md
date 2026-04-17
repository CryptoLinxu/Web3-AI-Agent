# Web3 AI Agent

一个面向 Web3 前端开发者的 AI Agent 项目，实现从需求定义到代码交付的完整 SDLC 自动化流程。

## 项目简介

本项目服务于个人转型目标：从 `Web3 前端工程师` 升级为 `AI 应用工程师 / Agent 工程师`。项目既是学习载体，也是未来可展示的作品集基础。

产品层面，本项目验证的不是"做一个聊天页面"，而是"做一个能够理解用户意图、调用 Web3 工具、返回可信结果，并具备最小风险边界的 AI Agent"。

## 核心能力

- **对话能力**：基础聊天界面，支持流式输出
- **Tool Calling**：调用 Web3 工具获取链上数据
- **Agent Loop**：理解用户意图，自主决策工具调用
- **最小 Memory**：保持会话上下文连续性

## 技术栈

- **前端框架**: Next.js 14 + React + TypeScript
- **样式**: Tailwind CSS
- **AI 能力**: OpenAI API
- **Web3**: ethers.js
- **开发语言**: TypeScript

## 项目结构

```
AI-Agent/
├── apps/                   # 应用代码
│   └── web/               # Next.js Web 应用
├── packages/              # 共享包
│   ├── ui/               # UI 组件库
│   └── web3-tools/       # Web3 工具集
├── docs/                  # 项目文档
├── skills/                # Skill 体系
└── README.md             # 本文件
```

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

```bash
cp apps/web/.env.example apps/web/.env.local
# 编辑 .env.local 填入你的配置
```

### 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

## 文档索引

| 文档 | 说明 |
|------|------|
| [docs/Web3-AI-Agent-PRD-MVP.md](./docs/Web3-AI-Agent-PRD-MVP.md) | 产品需求文档 |
| [docs/Web3-AI-Agent-阶段执行说明-V3.md](./docs/Web3-AI-Agent-阶段执行说明-V3.md) | 阶段执行说明 |
| [docs/Web3-AI-Agent-项目里程碑-Checklist.md](./docs/Web3-AI-Agent-项目里程碑-Checklist.md) | 项目里程碑 Checklist |
| [skills/x-ray/SKILL.md](./skills/x-ray/SKILL.md) | Skill 体系总览 |
| [skills/x-ray/MAP-V3.md](./skills/x-ray/MAP-V3.md) | Skill 地图 V3 |

## 开发规范

本项目采用 Skill 驱动的开发流程：

1. **任何任务从 `origin` 进入** - 使用 `/origin` 命令启动
2. **交付型任务走 pipeline** - `/pipeline feat|patch|refactor`
3. **实施前必须经过 check-in** - 确认问题、边界、方案

## 当前阶段

根据 [项目里程碑 Checklist](./docs/Web3-AI-Agent-项目里程碑-Checklist.md)，当前处于**阶段 1：项目初始化**。

## License

MIT
