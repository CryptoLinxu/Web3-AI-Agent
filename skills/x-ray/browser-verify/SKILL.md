---
name: browser-verify
description: 用浏览器层做可视化和交互验收，主要用于前端、交互和页面回归验证。
---

# Browser-Verify

## 适用场景

- 前端页面验收
- 交互流程验证
- 可视回归检查
- PATCH 的浏览器级复验

## 输入

- 目标页面或入口
- 修复/改动说明
- 验证步骤

## 输出

```markdown
## Browser Verify
- 页面/入口：
- 验证步骤：
- 结果：PASS / PARTIAL / FAIL
- 发现的问题：
```

## 流程

1. 进入目标页面
2. 执行验证步骤
3. 记录关键结果
4. 检查可视和交互回归

## 边界

- 不直接改代码
- 不代替单元/集成测试

## 衔接

- 通过：回到 `audit` 或 `closeout`
- 失败：回退 `coder`

## 规则

1. 当前端行为需要肉眼确认时优先使用。
2. 可用于 `FEAT / PATCH / REFACTOR`，但不是每次强制。
