---
name: origin
description: Web3 AI Agent 的统一入口路由 skill。用在所有新任务的第一跳：先识别任务属于 DISCOVER、BOOTSTRAP、DEFINE、DELIVER-FEAT、DELIVER-PATCH、DELIVER-REFACTOR 还是 VERIFY/GOVERN，再决定进入 explore、init-docs、pm/prd/req、pipeline，或 qa/audit/browser-verify 等辅助 skill。
---

# Origin

将任何外部请求先分类，再给出下一跳。

不要直接进入实施链路，也不要跳过任务判断。

## 任务类型

- `DISCOVER`
- `BOOTSTRAP`
- `DEFINE`
- `DELIVER-FEAT`
- `DELIVER-PATCH`
- `DELIVER-REFACTOR`
- `VERIFY/GOVERN`

## 工作方式

1. 先判断用户当前诉求的主目标。
2. 再判断这是不是交付型任务。
3. 如果是交付型任务，再决定是否进入 `pipeline`。
4. 如果是实施前阶段，明确是否必须先走 `check-in`。
5. 输出简洁的任务判断和下一跳，不直接代写后续产物。

## 输出格式

```markdown
## 任务判断
- 类型：
- 原因：
- 下一跳：
- 是否进入 pipeline：
- 是否需要 check-in：
```

## 路由规则

1. 纯了解、定位、盘点模块、阅读现状，路由到 `explore`。
2. 新项目初始化、文档初始化、文档迁移，路由到 `init-docs`，必要时再到 `update-map`。
3. 目标、范围、验收标准不清，路由到 `pm`、`prd` 或 `req`。
4. 新功能、新模块、新工具接入，路由到 `pipeline(FEAT)`。
5. Bug 修复、回归修复、小范围错误修正，路由到 `pipeline(PATCH)`。
6. 结构治理、模块拆分、性能或可维护性优化，路由到 `pipeline(REFACTOR)`。
7. 纯验证、质量审查、浏览器验收、文档冲突处理、总结归档、地图更新，路由到 `qa`、`audit`、`browser-verify`、`resolve-doc-conflicts`、`digest` 或 `update-map`。

## check-in 规则

以下任务默认必须先经过 `check-in`：

- `DELIVER-FEAT`
- `DELIVER-PATCH`
- `DELIVER-REFACTOR`
- 已经准备进入实施的 `DEFINE`

以下任务默认不强制经过 `check-in`：

- `DISCOVER`
- `BOOTSTRAP`
- 纯验证
- 纯治理

## 典型映射

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
origin -> pm / prd / req -> check-in
```

### DELIVER-FEAT

```text
origin -> pipeline(FEAT)
```

### DELIVER-PATCH

```text
origin -> pipeline(PATCH)
```

### DELIVER-REFACTOR

```text
origin -> pipeline(REFACTOR)
```

### VERIFY / GOVERN

```text
origin -> qa / audit / browser-verify / resolve-doc-conflicts / digest / update-map
```

## 边界

- 不跳过任务分类。
- 不直接写需求正文
- 不直接写代码
- 不把自己当作 `pipeline`、`qa`、`coder` 或 `architect`。

## 规则

1. 任何新任务必须先过 `origin`。
2. 如果分类存在明显歧义，先澄清，再路由。
3. 只有交付型任务才进入 `pipeline`。
4. 需要进入实施链路时，先检查是否必须经过 `check-in`。
5. 如果用户以自然语言发起任务，也按 `/origin` 的规则解释。
