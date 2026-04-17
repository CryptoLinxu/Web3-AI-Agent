# Web3 AI Agent Skill System Design V3

## 1. V3 的核心变化

V3 相比 V2，做了两类关键修正：

1. 不再把整个系统只理解成 `FEAT / PATCH / REFACTOR`
2. 不再默认让所有任务都走一条长链路

V3 改为两层判断：

1. 先判断任务类型
2. 再对交付型任务选择执行 pipeline

同时，原来的 `learn-gate` 正式更名为 `check-in`。

原因：
- `learn-gate` 听起来像学习阶段专属门禁，和真实开发执行不完全贴合
- `check-in` 更像“实施前对齐点 / 开工前登记点”
- 这个名字更容易扩展到 FEAT、PATCH、REFACTOR，而不显得别扭

---

## 2. V3 的总原则

### 2.1 总体目标

这套 skill 体系的目标不是制造流程，而是：

1. 用最少的步骤，把任务送进正确的路径
2. 对高风险任务增加约束，对低风险任务减少消耗
3. 保留文档沉淀，但不让文档流程压垮交付效率

### 2.2 总体规则

1. 任何任务先经过 `origin`
2. 只有交付型任务才进入 `pipeline`
3. 只有实施型任务才强制进入 `check-in`
4. `pm / prd / req` 是定义工具，不是默认全跑套餐
5. `audit` 默认分轻重，不再一刀切
6. `digest / update-map` 在执行层属于收尾闭环，可合并理解为 `closeout`

---

## 3. V3 的任务分类

V3 不再只使用 3 类场景，而是区分为 7 类任务。

## 3.1 `DISCOVER`

适用场景：
- 熟悉项目
- 查询模块
- 定位代码
- 理解当前架构
- 看当前进度

目标：
- 只读探索，不进入交付链

推荐 skill：
- `origin`
- `explore`

## 3.2 `BOOTSTRAP`

适用场景：
- 新项目初始化
- 首次建立文档系统
- 历史文档迁移
- 项目文档重建

目标：
- 建立初始地图、索引、基础文档网络

推荐 skill：
- `origin`
- `init-docs`
- `update-map`

## 3.3 `DEFINE`

适用场景：
- 目标模糊
- 需求未收敛
- 范围不清
- 暂时还不进入编码

目标：
- 把模糊输入转成可实施对象

推荐 skill：
- `origin`
- `pm / prd / req`
- `check-in`

## 3.4 `DELIVER-FEAT`

适用场景：
- 新功能
- 新页面
- 新模块
- 新工具接入
- 新用户流程

目标：
- 新增能力并完成交付

推荐 skill：
- `pipeline(FEAT)`

## 3.5 `DELIVER-PATCH`

适用场景：
- 修 bug
- 修回归
- 修兼容性问题
- 修配置错误
- 修边界 case

目标：
- 快速恢复正确行为

推荐 skill：
- `pipeline(PATCH)`

## 3.6 `DELIVER-REFACTOR`

适用场景：
- 重构
- 模块拆分
- 状态管理调整
- 性能治理
- 可维护性优化

目标：
- 不改变目标价值，优化结构和实现

推荐 skill：
- `pipeline(REFACTOR)`

## 3.7 `VERIFY / GOVERN`

适用场景：
- 浏览器验收
- 文档冲突解决
- 审计
- 发布前复核
- 阶段性沉淀

目标：
- 验证结果、治理文档、维护知识地图

推荐 skill：
- `qa`
- `audit`
- `browser-verify`
- `resolve-doc-conflicts`
- `digest`
- `update-map`

---

## 4. V3 的 Skill 分层

V3 不再把所有 skill 平铺，而是分成 5 层。

## 4.1 入口层

- `origin`
- `pipeline`

职责：
- 判断任务属于哪一类
- 只有交付型任务才继续进入 FEAT / PATCH / REFACTOR pipeline

## 4.2 定义层

- `pm`
- `prd`
- `req`
- `check-in`

职责：
- 从模糊意图到清晰任务
- 在进入设计和实现前做一次实施对齐

## 4.3 交付层

- `architect`
- `qa`
- `coder`
- `audit`

职责：
- 设计
- 验证
- 实现
- 风险审计

## 4.4 治理层

- `digest`
- `update-map`

职责：
- 沉淀经验
- 更新索引、状态、地图

## 4.5 辅助层

- `explore`
- `init-docs`
- `browser-verify`
- `resolve-doc-conflicts`

职责：
- 为主链路提供只读探索、初始化、浏览器验证、文档治理能力

---

## 5. V3 的核心路由规则

## 5.1 一级判断：任务类型

由 `origin` 先判断属于：

- `DISCOVER`
- `BOOTSTRAP`
- `DEFINE`
- `DELIVER-FEAT`
- `DELIVER-PATCH`
- `DELIVER-REFACTOR`
- `VERIFY / GOVERN`

## 5.2 二级判断：是否进入 pipeline

只有以下 3 类任务进入 `pipeline`：

- `DELIVER-FEAT`
- `DELIVER-PATCH`
- `DELIVER-REFACTOR`

其余任务不进入 pipeline。

## 5.3 `check-in` 的强制范围

必须经过 `check-in` 的任务：
- `DELIVER-FEAT`
- `DELIVER-PATCH`
- `DELIVER-REFACTOR`
- `DEFINE` 中准备继续进入实施的任务

默认不经过 `check-in` 的任务：
- `DISCOVER`
- `BOOTSTRAP`
- 纯 `VERIFY / GOVERN`

这条规则非常重要。

`check-in` 是实施前门禁，不是全局门禁。

---

## 6. V3 的主执行骨架

为了减少主链路的体感长度，V3 把执行抽象成 6 段：

```text
route -> define(按需) -> check-in -> design(按需) -> build -> closeout
```

映射到 skill：

- `route`：`origin + pipeline`
- `define`：`pm / prd / req`
- `check-in`：实施前对齐点
- `design`：`architect / qa`
- `build`：`coder`
- `closeout`：`audit / digest / update-map`

说明：
- `audit` 虽然本质偏验证，但在整体节奏上属于交付收尾
- `browser-verify` 在需要视觉验收时插入 `closeout`

---

## 7. 三类交付 Pipeline

这里保留 `FEAT / PATCH / REFACTOR`，但只把它们用于交付型任务。

## 7.1 FEAT Pipeline

定位：
- `L3 / Full Pipeline`

适用：
- 新功能
- 新能力
- 新模块

流程：

```text
origin
-> pipeline(FEAT)
-> pm(按需)
-> prd(默认)
-> req(默认)
-> check-in
-> architect
-> qa
-> coder
-> audit
-> digest
-> update-map
```

规则：
- `prd` 和 `req` 默认必走
- `pm` 只在目标模糊时插入
- `audit` 默认保留
- `browser-verify` 在前端或可视交互场景下按需插入到 `audit` 后

原因：
- FEAT 最怕方向错和范围漂移

## 7.2 PATCH Pipeline

定位：
- `L1 / Fast Pipeline`

适用：
- bug
- 回归修复
- 小范围行为纠正

流程：

```text
origin
-> pipeline(PATCH)
-> req
-> check-in
-> coder
-> qa
-> digest
-> update-map
```

按需插入：
- `architect`：涉及接口、状态流、模块边界变化时
- `audit`：涉及安全、资金、权限、可信度时
- `browser-verify`：视觉问题、交互问题、浏览器回归时
- `prd`：如果发现根因不是实现错，而是定义错

原因：
- PATCH 目标是恢复正确行为，不是重做产品设计

## 7.3 REFACTOR Pipeline

定位：
- `L2 / Design-first Pipeline`

适用：
- 重构
- 拆模块
- 重组结构
- 优化性能和可维护性

流程：

```text
origin
-> pipeline(REFACTOR)
-> req
-> check-in
-> architect
-> qa
-> coder
-> audit(轻/重可切)
-> digest
-> update-map
```

按需插入：
- `prd`：如果重构影响用户行为或产品边界
- `browser-verify`：前端行为等价性需要肉眼确认时

原因：
- REFACTOR 最怕回归，不怕定义不足

---

## 8. `check-in` 的正式定义

## 8.1 定位

`check-in` 是实施前的对齐点。

它的目标不是学习，而是确认：

1. 这次到底要解决什么
2. 这次明确不解决什么
3. 现在是否已经具备实施条件

## 8.2 强制输出结构

每次进入 `check-in`，都必须输出以下 7 项：

1. 本阶段要解决的问题
2. 本阶段必须掌握的上下文
3. 本阶段采用的方案
4. 本阶段不做什么
5. 本阶段产物
6. 本阶段完成标准
7. 进入下一阶段前要调用的 skill

## 8.3 为什么保留它

虽然改名了，但这个环节必须保留。

因为它能防止：
- 直接上手写代码
- PATCH 只修表象不找根因
- REFACTOR 只谈优雅不谈等价
- FEAT 在边界不清时扩 scope

## 8.4 为什么不让它覆盖所有任务

如果 `DISCOVER` 和 `BOOTSTRAP` 也强制跑 `check-in`，流程会变重。

所以 V3 的原则是：
- 对实施强制
- 对探索和治理不强制

---

## 9. 每个 Skill 在 V3 中的最终定位

## 9.1 `origin`

作用：
- 识别用户意图
- 先做一级分类

解决的问题：
- 当前到底是在探索、定义、交付还是治理

下一跳：
- `explore`
- `init-docs`
- `pm / prd / req`
- `pipeline`
- `qa / audit / browser-verify / resolve-doc-conflicts`

## 9.2 `pipeline`

作用：
- 只服务交付型任务
- 选择 FEAT / PATCH / REFACTOR 的执行深度

解决的问题：
- 这次要走多重的流程
- 哪些 skill 必经
- 哪些 skill 可跳过

## 9.3 `pm`

作用：
- 价值定义

解决的问题：
- 为什么做
- 对谁有价值
- 为什么现在做

## 9.4 `prd`

作用：
- 边界定义

解决的问题：
- 做什么
- 不做什么
- 怎么验收

## 9.5 `req`

作用：
- 可执行拆解

解决的问题：
- 任务最小单元是什么
- 影响哪些部分
- 验收条件是什么

## 9.6 `check-in`

作用：
- 实施前对齐点

解决的问题：
- 是否真的准备好进入设计和编码

## 9.7 `architect`

作用：
- 结构设计

解决的问题：
- 模块边界
- 接口契约
- 状态流和数据流

## 9.8 `qa`

作用：
- 验证设计

解决的问题：
- 主路径怎么验证
- 异常路径怎么验证
- 回归点在哪里

## 9.9 `coder`

作用：
- 实施落地

解决的问题：
- 把定义和设计真正变成代码

## 9.10 `audit`

作用：
- 风险审计

解决的问题：
- 有无越界
- 有无高风险输出
- 是否伪完成

说明：
- V3 中 `audit` 默认分轻重，不再默认全量执行

## 9.11 `digest`

作用：
- 经验沉淀

解决的问题：
- 这轮学到了什么
- 哪些问题还在

## 9.12 `update-map`

作用：
- 状态更新

解决的问题：
- 文档索引
- 当前状态
- 下一步入口

## 9.13 `explore`

作用：
- 只读导航

解决的问题：
- 项目是什么
- 某模块在哪
- 某能力如何组织

## 9.14 `init-docs`

作用：
- 初始化文档体系

解决的问题：
- 没有地图和结构化文档时怎么建立第一版

## 9.15 `browser-verify`

作用：
- 浏览器层验收

解决的问题：
- 改动在真实页面里是否成立
- 是否引入视觉回归和交互回归

## 9.16 `resolve-doc-conflicts`

作用：
- 文档冲突治理

解决的问题：
- docs 合并冲突怎么处理

---

## 10. V3 推荐使用方式

## 10.1 新人了解项目

流程：

```text
origin -> explore
```

不进入 `check-in`
不进入 pipeline

## 10.2 新项目建文档体系

流程：

```text
origin -> init-docs -> update-map
```

## 10.3 新功能但目标还不清

流程：

```text
origin -> pm -> prd -> req -> check-in
```

这一步可以先停，不一定继续编码。

## 10.4 新功能正式开发

流程：

```text
origin -> pipeline(FEAT) -> prd -> req -> check-in -> architect -> qa -> coder -> audit -> digest -> update-map
```

## 10.5 修 bug

流程：

```text
origin -> pipeline(PATCH) -> req -> check-in -> coder -> qa -> digest -> update-map
```

如涉及结构变化，则插入 `architect`。

## 10.6 重构

流程：

```text
origin -> pipeline(REFACTOR) -> req -> check-in -> architect -> qa -> coder -> audit -> digest -> update-map
```

## 10.7 前端页面验收

流程：

```text
origin -> browser-verify
```

## 10.8 文档冲突处理

流程：

```text
origin -> resolve-doc-conflicts
```

---

## 11. V3 的最终建议

正式建议把体系定成下面这套规则：

1. 用 7 类任务，而不是只用 3 类任务描述整个系统。
2. `FEAT / PATCH / REFACTOR` 只保留给交付型任务。
3. `check-in` 取代 `learn-gate`，作为实施前对齐点。
4. `pm / prd / req` 改为按需进入，不再默认串行全跑。
5. `audit` 分轻重，避免小任务过度消耗。
6. `digest + update-map` 在理解上并入 `closeout`，减轻流程割裂感。
7. 辅助 skill 独立成层，不和主交付链混在一起。

V3 的核心思想不是“增加新规则”，而是：

让系统更像一个能分流的操作系统，而不是一条只能从头走到尾的流水线。

---

## 12. 执行硬规则补充

V3 还需要固定以下三条执行级硬规则：

### 12.1 QA 红绿灯规则

1. `FEAT` 默认先由 `qa` 执行 RED。
2. RED 的目标是先证明“当前未通过”，不是直接修复。
3. `PATCH / REFACTOR` 默认不强制走完整 RED，但必须保留验证或回归检查。

### 12.2 Coder 自愈规则

1. `coder` 负责把 QA 的 RED 变成 GREEN。
2. `coder` 采用最多 10 轮自愈循环。
3. 超过 10 轮仍未通过，必须终止，输出 STUCK 结论，并人工介入。

### 12.3 Audit 评分规则

1. `audit` 总分为 100。
2. `>= 80` 才算通过。
3. `60 - 79` 为软拒绝，回退修复。
4. `< 60` 直接拒绝，当前方案视为废弃。
5. 严重安全问题、关键不变量破坏、高风险边界缺失可一票否决。
