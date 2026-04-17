---
name: pipeline
description: 只服务交付型任务，负责在 FEAT / PATCH / REFACTOR 之间选择执行深度。
---

# Pipeline

## 作用

为交付型任务选择最合适的执行深度，而不是默认跑完整长链路。

## 允许输入

- `DELIVER-FEAT`
- `DELIVER-PATCH`
- `DELIVER-REFACTOR`

## 输出格式

```markdown
## Pipeline 选择
- 类型：
- 级别：
- 必经 skill：
- 可跳过 skill：
- 按需插入：
```

## 路由规则

### FEAT

```text
pm(按需) -> prd -> req -> check-in -> architect -> qa -> coder -> audit -> digest -> update-map
```

### PATCH

```text
req -> check-in -> coder -> qa -> digest -> update-map
```

按需插入：
- `architect`
- `audit`
- `browser-verify`
- `prd`

### REFACTOR

```text
req -> check-in -> architect -> qa -> coder -> audit -> digest -> update-map
```

按需插入：
- `prd`
- `browser-verify`

## 判定规则

### FEAT

适用：
- 新功能
- 新模块
- 新工具接入

### PATCH

适用：
- bug 修复
- 回归修复
- 小范围错误修正

### REFACTOR

适用：
- 结构治理
- 模块拆分
- 性能或可维护性优化

## 硬规则

1. 没有 `check-in`，不允许进入 `architect / qa / coder`。
2. `PATCH` 默认不走 `pm / prd`。
3. `REFACTOR` 默认不走 `pm`。
4. `FEAT` 默认必须有 `prd + req`。
5. 小任务优先短链路，不为了完整而完整。
