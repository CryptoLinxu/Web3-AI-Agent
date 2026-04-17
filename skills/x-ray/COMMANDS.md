# Web3 AI Agent Slash Commands

## 说明

这份文件定义的是这套 skill 的斜杠命令约定。

你可以直接这样写：

```text
/origin
我想给 Web3 AI Agent 增加 gas price 查询功能
```

注意：

1. 这种命令格式现在就可以作为输入约定使用
2. 但聊天框输入 `/` 时是否会自动弹出可选菜单，取决于宿主产品本身
3. 也就是说，命令约定可落地，但下拉 UI 不一定仅靠仓库文件开启

## 默认推荐入口

最推荐：

```text
/origin
[任务描述]
```

## 命令总表

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

## 例子

### 新功能

```text
/origin
我想给 Web3 AI Agent 增加 gas price 查询功能
```

### 修 bug

```text
/origin
帮我修复钱包切换后聊天页状态没刷新的 bug
```

### 重构

```text
/origin
我想把 tool 调用层重构成 registry + adapter，不改现有行为
```

### 探索项目

```text
/explore
帮我看看这个 Web3 AI Agent 项目当前有哪些模块和能力
```
