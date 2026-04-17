---
name: x-ray
description: X-Ray 是 Web3 AI Agent 项目的总入口 skill。所有外部调用统一先从 origin 进入，再按任务类型路由到 DEFINE、DELIVER、VERIFY 或治理链路。
---

# Web3 AI Agent

## 作用

这是整套 `x-ray` skill 系统的主入口。

外部使用时，不需要手工决定先调哪个子 skill。
默认规则是：

```text
先进入 origin
-> 识别任务类型
-> 再路由到对应 skill 或 pipeline
```

## 总入口规则

### 第一步：统一从 `origin` 进入

任何外部请求，默认都先经过：

```text
x-ray -> origin
```

由 `origin` 判断属于哪一类任务：

- `DISCOVER`
- `BOOTSTRAP`
- `DEFINE`
- `DELIVER-FEAT`
- `DELIVER-PATCH`
- `DELIVER-REFACTOR`
- `VERIFY/GOVERN`

### 第二步：只在交付型任务中进入 `pipeline`

只有以下任务进入 `pipeline`：

- 新功能开发
- 修 bug
- 重构

对应：

```text
DELIVER-FEAT -> pipeline(FEAT)
DELIVER-PATCH -> pipeline(PATCH)
DELIVER-REFACTOR -> pipeline(REFACTOR)
```

### 第三步：实施前强制经过 `check-in`

以下任务必须经过 `check-in`：

- FEAT
- PATCH
- REFACTOR
- 准备进入实施的 DEFINE 任务

以下任务默认不强制：

- DISCOVER
- BOOTSTRAP
- 纯验证
- 纯治理

## 主入口使用方式

### 用一句自然语言发起

你可以直接说：

- “帮我看看这个 Web3 AI Agent 项目现在有哪些模块”
- “我想给 Web3 AI Agent 增加一个 gas price 查询功能”
- “帮我修复钱包切换后 UI 不刷新的 bug”
- “我想把 tool 调用层重构成 registry + adapter”
- “帮我用浏览器验收一下聊天页这个修复”

系统应默认理解为：

```text
先走 x-ray 主入口
-> 再由 origin 自动分流
```

## 主入口到子 skill 的映射

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
-> pm(按需)
-> prd
-> req
-> check-in
-> architect
-> qa
-> coder
-> audit
-> digest
-> update-map
```

### DELIVER-PATCH

```text
origin -> pipeline(PATCH)
-> req
-> check-in
-> coder
-> qa
-> digest
-> update-map
```

### DELIVER-REFACTOR

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

### VERIFY / GOVERN

```text
origin -> qa / audit / browser-verify / resolve-doc-conflicts / digest / update-map
```

## 内部硬规则

1. 不允许跳过 `origin` 手工直进主链。
2. 不允许没有 `check-in` 就进入 `architect / qa / coder`。
3. `FEAT` 默认先由 `qa` 执行 RED。
4. `coder` 最多 10 轮自愈，超过即终止并人工介入。
5. `audit` 总分 100，`>=80` 才通过，`<60` 直接拒绝。

## 外部调用建议

如果外部环境支持直接点名 skill，推荐使用：

```text
请使用 x-ray skill，先从 origin 进入，判断这次任务该走哪条流程。
```

如果外部环境不支持显式点名，也可以直接说任务目标，由系统按主入口规则解释。

## 补充：斜杠命令约定

如果你希望统一成“命令 + 描述”的形式，推荐使用下面这套约定：

```text
/origin
我想给 Web3 AI Agent 增加 gas price 查询功能
```

```text
/pipeline feat
我想给 Web3 AI Agent 增加 gas price 查询功能
```

```text
/explore
帮我看看当前 Web3 AI Agent 项目有哪些模块
```

注意：
- 这里的 `/origin`、`/pipeline`、`/explore` 是命令约定
- 是否能在聊天框输入 `/` 时自动弹出可选菜单，取决于宿主产品本身
- 即使没有下拉菜单，也推荐按这个格式使用，因为它能显著降低路由歧义

## 推荐斜杠命令表

```text
/origin
/pipeline feat
/pipeline patch
/pipeline refactor
/pm
/prd
/req
/check-in
/architect
/qa
/coder
/audit
/digest
/update-map
/explore
/init-docs
/browser-verify
/resolve-doc-conflicts
```
