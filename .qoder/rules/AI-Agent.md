---
trigger: always_on
---

# Web3 AI Agent 项目全局规则

## 1. 项目定位

本项目是一个面向 Web3 前端开发者的 AI Agent 技能体系，目标是通过系统化的 Skill 编排，实现从需求定义到代码交付的完整 SDLC 自动化流程。

## 2. 核心原则

### 2.1 统一入口原则
- **任何任务必须从 `origin` 进入**，不允许跳过 origin 直接调用子 skill
- 由 `origin` 负责任务分类，再路由到对应链路

### 2.2 分层执行原则
```
route -> define(按需) -> check-in -> design(按需) -> build -> closeout
```

### 2.3 强制门禁原则
- `check-in` 是实施前对齐点，以下任务**必须**经过 check-in：
  - DELIVER-FEAT（新功能开发）
  - DELIVER-PATCH（Bug 修复）
  - DELIVER-REFACTOR（重构）
  - DEFINE 中准备进入实施的任务

## 3. 任务类型与路由

| 任务类型 | 适用场景 | 推荐链路 |
|---------|---------|---------|
| DISCOVER | 熟悉项目、查询模块、定位代码 | origin -> explore |
| BOOTSTRAP | 新项目初始化、建立文档体系 | origin -> init-docs -> update-map |
| DEFINE | 目标模糊、需求未收敛 | origin -> pm/prd/req -> check-in |
| DELIVER-FEAT | 新功能、新模块 | origin -> pipeline(FEAT) |
| DELIVER-PATCH | Bug 修复、回归修复 | origin -> pipeline(PATCH) |
| DELIVER-REFACTOR | 重构、模块拆分 | origin -> pipeline(REFACTOR) |
| VERIFY/GOVERN | 验收、审计、文档治理 | origin -> qa/audit/browser-verify |

## 4. 交付 Pipeline 规范

### 4.1 FEAT Pipeline（完整流程）
```
origin -> pipeline(FEAT) -> pm(按需) -> prd -> req -> check-in -> architect -> qa -> coder -> audit -> digest -> changelog -> update-map
```

### 4.2 PATCH Pipeline（快速流程）
```
origin -> pipeline(PATCH) -> req -> check-in -> coder -> qa -> digest -> changelog -> update-map
```
- 按需插入：architect（涉及结构变化）、audit（涉及安全/资金）

### 4.3 REFACTOR Pipeline（设计优先）
```
origin -> pipeline(REFACTOR) -> req -> check-in -> architect -> qa -> coder -> audit(轻/重) -> digest -> changelog -> update-map
```

## 5. 执行硬规则

### 5.1 QA 红绿灯规则
- FEAT 默认先由 QA 执行 RED（先证明"当前未通过"）
- PATCH/REFACTOR 保留验证或回归检查

### 5.2 Coder 自愈规则
- Coder 负责将 QA 的 RED 变为 GREEN
- **最多 10 轮自愈循环**，超过必须终止并人工介入

### 5.3 Audit 评分规则
- 总分 100 分
- `>= 80` 通过
- `60-79` 软拒绝，回退修复
- `< 60` 直接拒绝，方案废弃
- 严重安全问题可一票否决

## 6. 推荐斜杠命令

```
/origin          - 任务入口
/pipeline feat   - 新功能开发
/pipeline patch  - Bug 修复
/pipeline refactor - 重构
/pm /prd /req    - 需求定义
/check-in        - 实施前对齐
/architect       - 结构设计
/qa /coder /audit - 交付执行
/digest /changelog /update-map - 收尾闭环
/explore         - 只读探索
/init-docs       - 初始化文档
/browser-verify  - 浏览器验收
```

## 7. 沟通规范

### 7.1 用户背景
- 用户是 Web3 前端开发工程师，正在向 AI Agent 方向转型
- 采用"边学边做、边做边学"的学习方式

### 7.2 响应原则
- 优先使用 Skill 体系完成任务
- 保持流程清晰，明确当前所处阶段
- 交付物需符合 check-in 7 项输出结构（问题、上下文、方案、不做项、产物、完成标准、下一 skill）

## 8. 文档索引

| 文档 | 说明 |
|-----|------|
| [SKILL.md](/skills/x-ray/SKILL.md) | 项目总入口说明（描述整体架构） |
| [origin/SKILL.md](/skills/x-ray/origin/SKILL.md) | 路由 Skill（实际执行入口） |
| [SKILL-SYSTEM-DESIGN-V3.md](/skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md) | 系统设计 V3 |
| [COMMANDS.md](/skills/x-ray/COMMANDS.md) | 命令参考 |
| [TEMPLATES-V3.md](/skills/x-ray/TEMPLATES-V3.md) | 模板库 |
| [MAP-V3.md](/skills/x-ray/MAP-V3.md) | 技能地图 |
| [docs/changelog/](/docs/changelog/README.md) | 变更历史记录（AI 上下文） |

> **注意**：虽然 web3-ai-agent 是项目总入口概念，但实际执行时必须使用 `/origin` 命令进入路由，不允许直接调用子 skill。
