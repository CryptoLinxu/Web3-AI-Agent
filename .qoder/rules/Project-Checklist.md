---
trigger: model_decision
description: 当用户询问项目现状、项目进度、后续规划、更新 checklist、执行 /project-checklist 命令，或提到项目完成情况、下一步计划等关键词时触发此规则，引导 AI 使用 project-checklist 技能查看或更新 docs/checklist/PROJECT-CHECKLIST.md 文档。
---

# Project Checklist 规则

## 触发场景

当对话中出现以下关键词或意图时，自动触发项目清单更新：

### 关键词触发
- 更新 checklist
- 项目现状
- 项目进度
- 后续规划
- 未来计划
- 已完成哪些
- 未完成哪些
- 下一步做什么

### 命令触发
- `/project-checklist`
- `/checklist`

### 上下文触发
- 交付型任务完成后（FEAT/PATCH/REFACTOR）
- 用户询问"目前项目进展如何"
- 用户询问"接下来应该做什么"

## 执行流程

1. **识别意图**：判断用户是否想了解或更新项目清单
2. **调用技能**：使用 `/project-checklist` 技能
3. **收集信息**：
   - 查看 git 历史
   - 查看 PRD 文档
   - 查看 ARCHITECTURE
   - 查看最近的 changelog
4. **更新文档**：更新 `docs/checklist/PROJECT-CHECKLIST.md`
5. **输出摘要**：向用户展示更新摘要和关键指标

## 输出要求

每次更新后必须向用户展示：

```markdown
## Checklist 更新摘要

- **最后更新**：{日期}
- **当前版本**：v{版本号}
- **MVP 完成率**：{百分比}
- **新增完成**：{数量} 项
- **新增规划**：{数量} 项

### 关键指标
| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| 功能完成率 | X% | 100% |
| 测试覆盖率 | X% | 80% |

### 下一步建议
1. 立即执行：{P0 任务}
2. 本周完成：{P1 任务}
3. 本月完成：{P2 任务}

详细清单请查看：[docs/checklist/PROJECT-CHECKLIST.md](/docs/checklist/PROJECT-CHECKLIST.md)
```

## 文档位置

- **主文档**：`docs/checklist/PROJECT-CHECKLIST.md`
- **技能定义**：`.qoder/skills/project-checklist/SKILL.md`
- **触发规则**：`.qoder/rules/Project-Checklist.md`

## 维护原则

1. **基于事实**：必须基于实际代码状态，不虚构完成情况
2. **定期更新**：交付型任务完成后自动更新
3. **优先级明确**：P0/P1/P2 分级清晰
4. **可执行性**：下一步建议必须具体可执行
5. **技术债务透明**：明确记录待重构和优化项
6. **历史可追溯**：保留更新历史记录

## 与其他规则的关系

- **不替代 `/update-map`**：
  - checklist 关注功能清单和未来规划
  - update-map 关注项目状态和技能地图
  
- **不替代 `/digest`**：
  - checklist 关注"做了什么"和"要做什么"
  - digest 关注"学到了什么"和"经验教训"

- **参考 PRD**：
  - MVP 范围以 PRD 为准
  - 不随意扩大或缩小范围

## 注意事项

1. 首次使用需要完整梳理项目状态
2. 后续更新只需增量修改
3. 保持文档结构稳定
4. 关键指标必须准确计算
5. 优先级评估需考虑价值和成本
