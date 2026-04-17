# Web3 AI Agent Skill Map V3

> 最后更新：2026-04-17  
> 当前阶段：全局模型切换功能已完成（Audit 99分）→ 可继续其他功能开发或测试验证

## 项目状态速览

| 模块 | 状态 | 说明 |
|------|------|------|
| 项目初始化 | ✅ 完成 | Monorepo + Next.js + Web3 工具 |
| 模型切换功能 | ✅ 完成 | 支持 OpenAI/Anthropic，Audit 99分 |
| Chat UI | ✅ 可用 | 基础对话 + 工具调用 |
| 待测试 | 🔄 待验证 | Anthropic 工具调用需实际测试 |

## 新增能力

- **多模型支持**：通过 `packages/ai-config` 包统一管理
- **配置驱动**：环境变量切换模型，无需改代码
- **统一接口**：`ILLMProvider` 接口屏蔽 SDK 差异
- **工厂模式**：`LLMFactory` 管理模型实例生命周期

## 使用方式

```bash
# 配置环境变量
DEFAULT_MODEL_PROVIDER=openai  # 或 anthropic
OPENAI_API_KEY=your_key

# 启动开发服务器
pnpm dev
```

代码中使用：
```typescript
import { LLMFactory } from '@web3-ai-agent/ai-config'
const provider = LLMFactory.getProvider()
const response = await provider.chat(messages, { tools })
```

## 下一步建议入口

- `/origin` - 新任务入口
- `/browser-verify` - 浏览器验收测试
- `/explore` - 探索项目现状
- `/pipeline feat` - 继续开发新功能（如流式响应）
- `/pipeline patch` - 修复测试中发现的问题

## 0. ASCII 总流程图

```text
+------------------+
|      origin      |
|  一级任务识别入口  |
+---------+--------+
          |
          v
+------------------------------+
| 任务类型判断                  |
| DISCOVER / BOOTSTRAP /       |
| DEFINE / DELIVER-* /         |
| VERIFY-GOVERN                |
+---+------------+-------------+
    |            |
    |            +-----------------------------------------------+
    |                                                            |
    v                                                            v
+-----------+                                           +------------------+
| DISCOVER   |                                           | VERIFY/GOVERN    |
| explore    |                                           | qa / audit /     |
+-----------+                                           | browser-verify / |
                                                        | resolve-doc-...  |
                                                        | digest /         |
                                                        | update-map       |
                                                        +------------------+

    +------------------------------------------------------------+
    |                                                            |
    v                                                            v
+-------------+                                          +------------------+
| BOOTSTRAP   |                                          | DEFINE           |
| init-docs   |                                          | pm / prd / req   |
| ->          |                                          | -> check-in      |
| update-map  |                                          +------------------+
+-------------+

    +-----------------------------------------------------------------------+
    | 只有交付型任务进入 pipeline                                             |
    v
+--------------------------------------------------------------------------+
|                              pipeline                                    |
|                 FEAT / PATCH / REFACTOR 二级执行分流                      |
+-------------------+---------------------------+--------------------------+
                    |                           |
                    |                           |
                    v                           v
      +---------------------------+   +---------------------------+
      |      DELIVER-FEAT         |   |      DELIVER-PATCH        |
      | pm(按需) -> prd -> req    |   | req                       |
      | -> check-in               |   | -> check-in               |
      | -> architect -> qa        |   | -> coder -> qa           |
      | -> coder -> audit         |   | -> digest -> update-map  |
      | -> digest -> update-map   |   |                           |
      +-------------+-------------+   +-------------+-------------+
                    |                               |
                    |                               |
                    v                               v
            +------------------+          +------------------------------+
            | browser-verify   |          | 按需插入                     |
            | 前端/可视交互按需 |          | architect / audit /         |
            | 插入 audit 后     |          | browser-verify / prd        |
            +------------------+          +------------------------------+

                    +--------------------------------------------------+
                    |
                    v
          +-----------------------------+
          |    DELIVER-REFACTOR         |
          | req -> check-in             |
          | -> architect -> qa          |
          | -> coder -> audit           |
          | -> digest -> update-map     |
          +--------------+--------------+
                         |
                         v
              +------------------------------+
              | 按需插入                     |
              | prd / browser-verify         |
              +------------------------------+
```

## 1. 一级路由

```text
origin -> {DISCOVER | BOOTSTRAP | DEFINE | DELIVER-FEAT | DELIVER-PATCH | DELIVER-REFACTOR | VERIFY/GOVERN}
```

## 2. 二级路由

只有交付型任务进入 pipeline：

```text
DELIVER-FEAT -> pipeline(FEAT)
DELIVER-PATCH -> pipeline(PATCH)
DELIVER-REFACTOR -> pipeline(REFACTOR)
```

## 3. 三类交付流程

### FEAT

```text
origin -> pipeline(FEAT) -> pm(按需) -> prd -> req -> check-in -> architect -> qa -> coder -> audit -> digest -> update-map
```

### PATCH

```text
origin -> pipeline(PATCH) -> req -> check-in -> coder -> qa -> digest -> update-map
```

按需插入：
- `architect`
- `audit`
- `browser-verify`
- `prd`

### REFACTOR

```text
origin -> pipeline(REFACTOR) -> req -> check-in -> architect -> qa -> coder -> audit -> digest -> update-map
```

按需插入：
- `prd`
- `browser-verify`

## 4. 非交付任务流程

### DISCOVER

```text
origin -> explore
```

### BOOTSTRAP

```text
origin -> init-docs -> update-map
```

### DEFINE

```text
origin -> pm/prd/req -> check-in
```

### VERIFY / GOVERN

```text
origin -> qa / audit / browser-verify / resolve-doc-conflicts / digest / update-map
```

## 5. 固定规则

1. 没有 `origin` 判断，不直接进入 skill。
2. 没有 `check-in` 输出，不进入 `architect / qa / coder`。
3. `check-in` 只对实施型任务强制。
4. `PATCH` 默认不走 `pm / prd`。
5. `REFACTOR` 默认不走 `pm`。
6. `FEAT` 默认必须有 `prd + req`。
