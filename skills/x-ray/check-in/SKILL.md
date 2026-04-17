---
name: check-in
description: 实施前对齐点。只有实施型任务强制进入，用来确认问题、边界、方案和完成标准。
---

# Check-In

## 定位

`check-in` 是实施前门禁，不是全局门禁。

## 强制适用场景

- `DELIVER-FEAT`
- `DELIVER-PATCH`
- `DELIVER-REFACTOR`
- `DEFINE` 中准备进入实施的任务

## 默认不强制场景

- `DISCOVER`
- `BOOTSTRAP`
- 纯 `VERIFY/GOVERN`

## 输出模板

```markdown
## 本阶段要解决的问题
## 本阶段必须掌握的上下文
## 本阶段采用的方案
## 本阶段不做什么
## 本阶段产物
## 本阶段完成标准
## 进入下一阶段前要调用的 skill
```

## 作用

防止：
- 直接上手写代码
- PATCH 只修表象
- REFACTOR 只谈结构不谈等价
- FEAT 在边界不清时扩 scope

## 边界

- 不代替 `architect`
- 不代替 `qa`
- 不代替 `coder`

## 硬规则

1. 没有 `check-in`，不进入 `architect / qa / coder`。
2. `check-in` 必须明确“不做什么”。
3. `check-in` 必须明确完成标准，否则视为未完成。
