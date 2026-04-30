
# 🚨 Vercel + pnpm Monorepo 部署常见错误 FAQ（你的案例复盘）

## 🧩 项目背景

* 技术栈：Next.js 14 + Tailwind + Web3（wagmi / ethers）
* 架构：pnpm workspace + Turborepo（monorepo）
* 部署平台：Vercel

---

# ❗ 问题一：`Cannot find module 'tailwindcss'`

## 📌 现象

```bash
Error: Cannot find module 'tailwindcss'
```

---

## 🎯 根本原因

> Tailwind 被错误地放在 `devDependencies`，而 Vercel 生产环境不会安装 devDependencies

---

## 🧠 原理解释

Vercel 构建环境：

```bash
NODE_ENV=production
pnpm install --frozen-lockfile
```

👉 行为：

* 只安装 `dependencies`
* 忽略 `devDependencies`

但：

> ❗ Tailwind 是 **build-time 依赖（构建阶段必须存在）**

---

## ✅ 解决方案

```json
// apps/web/package.json
{
  "dependencies": {
    "tailwindcss": "^3.x",
    "postcss": "^8.x",
    "autoprefixer": "^10.x"
  }
}
```

---

# ❗ 问题二：`ERR_PNPM_OUTDATED_LOCKFILE`

## 📌 现象

```bash
Cannot install with "frozen-lockfile"
pnpm-lock.yaml is not up to date
```

---

## 🎯 根本原因

> 修改了 `package.json`，但没有同步更新 `pnpm-lock.yaml`

---

## 🧠 原理解释

CI/CD（Vercel）使用：

```bash
pnpm install --frozen-lockfile
```

👉 要求：

* lockfile 必须和 package.json 完全一致
* 不允许自动修复

---

## ✅ 解决方案

在**项目根目录**执行：

```bash
pnpm install
git add pnpm-lock.yaml
git commit -m "fix: sync lockfile"
```

---

## ⚠️ 注意（monorepo 关键点）

> ❗ **必须在 root 执行 pnpm install**

因为：

* lockfile 在根目录
* workspace 依赖需要统一解析

---

# ❗ 问题三：`Module not found: @/components/...`

## 📌 现象

```bash
Can't resolve '@/components/MessageList'
```

---

## 🎯 表面原因

> alias `@/` 解析失败

---

## ❗ 实际根因（关键）

> ❗ 并不是路径错，而是构建过程提前崩溃（Tailwind 问题导致）

---

## 🧠 原理链路

```bash
tailwind 缺失
→ PostCSS 配置失败
→ Next.js webpack config 崩溃
→ module graph 未正确构建
→ alias 解析失败（假错误）
```

---

## ✅ 解决方式

> 修复 Tailwind 问题后，此问题自动消失

---

# ❗ 问题四：配置修改无效（最隐蔽）

## 📌 现象

你已经在 Vercel UI 设置：

```bash
Build Command = pnpm build
```

但日志仍然显示：

```bash
pnpm install && pnpm build
```

---

## 🎯 根本原因

> `vercel.json` 覆盖了 Vercel UI 配置

---

## 🧠 优先级规则

```bash
vercel.json > Vercel UI
```

---

## ❌ 错误配置

```json
{
  "buildCommand": "pnpm install && pnpm build"
}
```

---

## ✅ 正确方案

### ✔ 推荐（最简单）

```json
{
  "framework": "nextjs"
}
```

---

### ✔ 或手动指定

```json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install --frozen-lockfile"
}
```

---

# ❗ 问题五：pnpm install 执行两次

## 📌 现象

```bash
Running install
Running pnpm install && pnpm build
```

---

## 🎯 根本原因

> buildCommand 中重复执行 install

---

## 🧠 后果

```bash
第一次 install → 安装完整依赖
第二次 install（production）→ 删除 devDependencies
```

👉 导致：

* Tailwind 被删除 ❌
* 构建失败 ❌

---

## ✅ 解决方案

```bash
Build Command: pnpm build
```

---

# ❗ 问题六：Monorepo 路径问题（潜在）

## 📌 现象

```bash
@/components 无法解析
```

---

## 🎯 根本原因

> Vercel 默认在 root 构建，而不是 apps/web

---

## ✅ 解决方案

在 Vercel 设置：

```bash
Root Directory = apps/web
```

---

# 🧠 最终问题链总结（非常重要）

```bash
vercel.json 错误配置
→ pnpm install 执行两次
→ devDependencies 被删除
→ tailwind 缺失
→ Next.js CSS pipeline 崩溃
→ webpack 构建失败
→ alias 解析失败（表象）
→ components not found（误导错误）
```

---

# ✅ 最终正确配置（推荐模板）

## vercel.json

```json
{
  "framework": "nextjs"
}
```

---

## Vercel UI

```bash
Root Directory: apps/web
Build Command: pnpm build
Install Command: pnpm install --frozen-lockfile
```

---

## package.json（apps/web）

```json
"dependencies": {
  "tailwindcss": "^3.x",
  "postcss": "^8.x",
  "autoprefixer": "^10.x"
}
```

---

# 🚀 最佳实践（强烈建议写进项目规范）

### ✅ 1. 所有依赖变更必须同步 lockfile

```bash
pnpm install
```

---

### ✅ 2. 只在 root 执行 pnpm install

---

### ✅ 3. 禁止在 buildCommand 里写 install

---

### ✅ 4. build-time 依赖必须在 dependencies

---

### ✅ 5. 优先使用 vercel.json 或 UI（二选一）

---

# 🎯 一句话总结（FAQ核心）

> **Vercel 部署失败的本质不是代码问题，而是依赖管理 + 构建配置冲突（pnpm + monorepo + Next.js）导致的构建环境不一致**

