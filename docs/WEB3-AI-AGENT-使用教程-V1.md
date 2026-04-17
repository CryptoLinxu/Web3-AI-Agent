# Web3 AI Agent Skill 使用教程

## 1. 怎么理解这套 skill

你可以把它理解成一套“开发操作系统”。

你不需要先记住所有子 skill 的名字。
实际使用时，最重要的原则只有一个：

```text
先从 origin 进入
让系统判断你这次到底是在：
看项目 / 定义需求 / 做功能 / 修 bug / 重构 / 验收 / 治理
```

也就是说，正常情况下你不需要一上来就手工说：

- 先跑 pm
- 再跑 prd
- 再跑 req

更好的方式是直接说你的自然语言目标，让主入口去路由。

---

## 2. 我在聊天框里应该怎么说

最简单的说法有两种。

### 方式 A：直接说任务

例如：

- “帮我看看这个 Web3 AI Agent 项目现在有哪些模块和能力”
- “我想给 Web3 AI Agent 增加 gas price 查询功能”
- “帮我修复钱包切换后聊天窗口没有刷新的 bug”
- “我想把 tool 调用层重构成 registry + adapter”
- “帮我在浏览器里验证一下这个前端修复”

这种说法最自然。

### 方式 B：显式要求走主入口

例如：

- "请使用 x-ray skill，从 origin 开始帮我分析这次任务"
- "请走 x-ray 主入口，判断这次应该是 FEAT、PATCH 还是 REFACTOR"
- "请用 x-ray 的 V3 流程来推进这次需求"

这种说法更稳定，适合你想强制使用这套体系时。

---

## 3. 实际触发示例

下面用“我要开发 Web3 AI Agent 项目”为例。

## 3.1 场景一：我还在了解项目

你可以说：

```text
请使用 x-ray skill，从 origin 进入。
我现在在做一个 Web3 AI Agent 项目，你先帮我看看当前项目有哪些模块、能力边界和下一步建议。
```

预期路由：

```text
origin -> explore
```

这时候系统应该做的是：
- 帮你理解现状
- 帮你梳理模块
- 帮你找入口

而不是直接进入开发链路。

## 3.2 场景二：我有一个模糊想法，还没收敛

你可以说：

```text
请使用 x-ray skill，从 origin 开始。
我想做一个 Web3 AI Agent，但还没想清楚 MVP 先做什么。
请先帮我收敛目标、用户场景和 MVP 范围，不要直接写代码。
```

预期路由：

```text
origin -> pm -> prd -> req -> check-in
```

这时候系统应该：
- 先帮你想清楚做什么
- 明确不做什么
- 给出需求卡

## 3.3 场景三：我要加新功能

比如你要给 Web3 AI Agent 增加 `gas price` 查询能力。

你可以说：

```text
请使用 x-ray skill，从 origin 进入。
我要给 Web3 AI Agent 增加 gas price 查询功能。
请按 V3 流程推进，并在实施前完成 check-in。
```

预期路由：

```text
origin -> pipeline(FEAT)
-> prd
-> req
-> check-in
-> architect
-> qa(先 RED)
-> coder(把 RED 变 GREEN)
-> audit
-> digest
-> update-map
```

这里你会明显看到：
- `qa` 先红灯
- `coder` 再把红灯变绿灯
- `audit` 最后评分放行

## 3.4 场景四：我要修 bug

比如钱包切换后页面没刷新。

你可以说：

```text
请使用 x-ray skill，从 origin 进入。
帮我修复一个 bug：钱包切换后，聊天页还显示旧钱包状态。
请按 PATCH 流程处理，先分析根因，再修复。
```

预期路由：

```text
origin -> pipeline(PATCH)
-> req
-> check-in
-> coder
-> qa
-> digest
-> update-map
```

如果过程中发现问题其实是状态流设计问题，系统应补：

```text
architect
```

如果涉及高风险问题，再补：

```text
audit
```

## 3.5 场景五：我要做重构

比如你想把工具层改成 `registry + adapter`。

你可以说：

```text
请使用 x-ray skill，从 origin 进入。
我想把 Web3 AI Agent 里的 tool 调用层重构成 registry + adapter。
目标是不改行为，只优化结构。请按 REFACTOR 流程推进。
```

预期路由：

```text
origin -> pipeline(REFACTOR)
-> req
-> check-in
-> architect
-> qa
-> coder
-> audit
-> digest
-> update-map
```

## 3.6 场景六：我要浏览器验收

你可以说：

```text
请使用 x-ray skill，从 origin 进入。
帮我在浏览器里验证一下聊天页这个修复是否生效，并检查是否有视觉回归。
```

预期路由：

```text
origin -> browser-verify
```

## 3.7 场景七：我要解决文档冲突

你可以说：

```text
请使用 x-ray skill，从 origin 进入。
帮我处理 docs 目录里的冲突，只处理文档，不动业务代码。
```

预期路由：

```text
origin -> resolve-doc-conflicts
```

---

## 4. 什么时候需要显式说 FEAT / PATCH / REFACTOR

不是必须。

你有两种用法：

### 自然用法

直接说任务：

- “帮我修复这个 bug”
- “我想加一个新功能”
- “我想做一次重构”

系统应该能自己判断。

### 强控制用法

如果你想避免误判，可以直接说：

- “请按 FEAT 流程推进”
- “请按 PATCH 快链路推进”
- “请按 REFACTOR 流程推进”

这会更稳。

---

## 5. 在 Codex 里怎么配置和使用

## 5.1 skill 放哪里

你现在这套 skill 的目录已经在工作区里：

`D:\2026\code\AI-Agent\skills\x-ray`

里面包含：
- 主入口 `SKILL.md`
- 各子 skill 目录
- V3 设计稿
- 模板
- 地图

## 5.2 在 Codex 里如何触发

如果当前环境支持从工作区读取 skill，那么你直接在聊天框里写：

```text
请使用 x-ray skill，从 origin 开始处理这次任务。
```

或者更自然一点：

```text
我现在要开发一个 Web3 AI Agent，请按 x-ray 的 V3 流程推进。
```

建议你优先用这种格式：

```text
请使用 x-ray skill，从 origin 开始。
[你的任务]
```

这样触发最稳定。

## 5.3 Codex 中推荐的调用模板

### 看项目

```text
请使用 x-ray skill，从 origin 开始。
先帮我梳理这个 Web3 AI Agent 项目的当前结构和模块。
```

### 做需求

```text
请使用 x-ray skill，从 origin 开始。
我想新增一个 xxx 功能，请先收敛需求，不要直接写代码。
```

### 做开发

```text
请使用 x-ray skill，从 origin 开始。
我要新增一个 xxx 功能，请按 FEAT 流程推进。
```

### 修 bug

```text
请使用 x-ray skill，从 origin 开始。
帮我修复 xxx bug，请按 PATCH 流程处理。
```

### 重构

```text
请使用 x-ray skill，从 origin 开始。
帮我重构 xxx，请按 REFACTOR 流程处理。
```

---

## 6. 在 Cursor 里怎么配置和使用

Cursor 本身没有和这里完全相同的一套官方 skill 机制，所以通常有两种落地方式。

## 6.1 方式一：把它当作“本地规则库 + 提示词入口”

这是最实用的方式。

你可以：

1. 把这套目录保留在仓库里
2. 在 Cursor 中打开这些文档
3. 每次对话时显式告诉 Cursor：

```text
请把 `skills/x-ray/SKILL.md` 作为主入口规则，
并按其中的 origin -> pipeline / define / verify 路由来处理这次任务。
```

更直接一点：

```text
请先阅读：
1. skills/x-ray/SKILL.md
2. skills/x-ray/SKILL-SYSTEM-DESIGN-V3.md
然后按这套 V3 规则推进我的任务。
```

这是 Cursor 里最稳定的办法。

## 6.2 方式二：放进 Cursor Rules / Project Rules

如果你在 Cursor 里有项目级规则能力，可以把这几条写成规则：

```text
本项目使用 `skills/x-ray/SKILL.md` 作为主入口开发规则。
所有任务先从 `origin` 判断类型。
交付型任务走 `pipeline(FEAT/PATCH/REFACTOR)`。
实施前必须执行 `check-in`。
FEAT 默认 QA 先 RED，Coder 最多 10 轮自愈，Audit >=80 才放行。
```

然后在具体对话里再补任务本身。

## 6.3 Cursor 中推荐的使用方式

我建议你在 Cursor 里每次都这样开头：

```text
请先阅读 `skills/x-ray/SKILL.md` 作为主入口。
然后从 origin 开始判断这次任务该走哪条流程。
[你的任务描述]
```

例如：

```text
请先阅读 `skills/x-ray/SKILL.md` 作为主入口。
然后从 origin 开始。
我要给 Web3 AI Agent 增加一个链上 gas price 查询功能，请按 FEAT 流程推进。
```

---

## 7. 最推荐的实际使用习惯

如果你想让这套体系真正好用，我建议你以后统一用这一种开场：

```text
请使用 x-ray skill，从 origin 开始。
[我这次要做的事]
```

比如：

```text
请使用 x-ray skill，从 origin 开始。
我要开发一个 Web3 AI Agent 的 MVP，请先帮我明确 MVP 范围和第一阶段功能。
```

或者：

```text
请使用 x-ray skill，从 origin 开始。
我要修复聊天页在钱包切换后的状态错误，请按 PATCH 流程处理。
```

这会比你手工点名某个子 skill 更省心，也更符合这套体系的设计初衷。

---

## 8. 斜杠命令风格用法

如果你更希望像命令一样使用，也可以统一写成：

```text
/origin
我想给 Web3 AI Agent 增加 gas price 查询功能
```

或者：

```text
/pipeline patch
帮我修复钱包切换后聊天页状态没刷新的问题
```

或者：

```text
/explore
帮我看看当前 Web3 AI Agent 项目有哪些模块
```

我已经把这套写法整理成单独文档：

- `skills/x-ray/COMMANDS.md`

注意：
- 这种格式现在就可以作为输入约定使用
- 但输入 `/` 时聊天框是否自动弹出命令列表，取决于宿主产品本身
- 也就是说，命令约定可以落地，但 UI 下拉菜单不一定仅靠本地 skill 文件开启
