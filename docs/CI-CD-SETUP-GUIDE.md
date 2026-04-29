# CI/CD 配置指南

本文档指导你如何完成 CI/CD 自动化部署的配置。

## 已完成的配置

✅ 已创建以下配置文件：

1. **vercel.json** - Vercel 项目配置
   - 构建命令：`pnpm build`
   - 输出目录：`apps/web/.next`
   - 框架：Next.js

2. **.github/workflows/ci-cd.yml** - GitHub Actions CI/CD 工作流
   - 触发条件：push 到 main 分支或创建 PR
   - 包含两个任务：
     - `lint-and-test`: 类型检查 + Lint + 单元测试
     - `deploy`: 部署到 Vercel（仅 main 分支）

## 需要手动完成的配置

### Step 1: 在 Vercel 创建项目

1. 访问 [Vercel 控制台](https://vercel.com/dashboard)
2. 点击 **"New Project"**
3. 导入你的 GitHub 仓库
4. 配置项目：
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`（如果需要）
   - **Build Command**: `pnpm build`（已在 vercel.json 配置）
   - **Output Directory**: `apps/web/.next`（已在 vercel.json 配置）
5. 点击 **"Deploy"**

### Step 2: 配置 Vercel 环境变量

在 Vercel 项目设置中添加以下环境变量：

1. 进入项目 → **Settings** → **Environment Variables**
2. 添加以下变量（Production 环境）：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect 项目 ID | `abc123...` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJ...` |
| `OPENAI_API_KEY` | OpenAI API 密钥 | `sk-...` |
| `DEFAULT_MODEL_PROVIDER` | 默认模型提供商 | `openai` |

**注意**: 
- 如果你使用 Anthropic，添加 `ANTHROPIC_API_KEY` 而不是 `OPENAI_API_KEY`
- 确保勾选 **Production** 环境

### Step 3: 获取 Vercel 项目信息

1. 安装 Vercel CLI：
```bash
npm install -g vercel
```

2. 登录 Vercel：
```bash
vercel login
```

3. 进入项目目录并链接：
```bash
cd d:\2026\code\AI-Agent
vercel link
```

4. 获取项目 ID：
```bash
vercel env pull
```

这会显示你的项目信息，记下：
- **VERCEL_ORG_ID**: 组织 ID
- **VERCEL_PROJECT_ID**: 项目 ID

### Step 4: 生成 Vercel Token

1. 访问 [Vercel Tokens 页面](https://vercel.com/account/tokens)
2. 点击 **"Create Token"**
3. 输入 Token 名称（如：`github-actions`）
4. 选择 Scope：**Read and Write**
5. 点击 **"Create"**
6. **复制 Token**（只显示一次，妥善保管）

### Step 5: 配置 GitHub Secrets

1. 打开 GitHub 仓库页面
2. 进入 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **"New repository secret"**
4. 添加以下 3 个 Secrets：

| Secret Name | 值 | 说明 |
|-------------|-----|------|
| `VERCEL_TOKEN` | 上一步生成的 Token | Vercel API Token |
| `VERCEL_ORG_ID` | 从 Step 3 获取 | Vercel 组织 ID |
| `VERCEL_PROJECT_ID` | 从 Step 3 获取 | Vercel 项目 ID |

### Step 6: 测试 CI/CD 流程

1. 提交配置文件到 GitHub：
```bash
git add vercel.json .github/workflows/ci-cd.yml
git commit -m "ci: 添加 CI/CD 自动化部署配置"
git push origin main
```

2. 观察 GitHub Actions：
   - 访问仓库 → **Actions** 标签
   - 查看 `CI/CD Pipeline` 工作流执行情况
   - 确认 `lint-and-test` 任务通过
   - 确认 `deploy` 任务成功部署到 Vercel

3. 检查 Vercel 部署：
   - 访问 Vercel 控制台
   - 查看最新的部署记录
   - 访问部署的 URL 验证应用正常运行

## CI/CD 工作流程

### Push 到 main 分支
```
push to main
  ↓
lint-and-test 任务
  ├─ pnpm install（安装依赖）
  ├─ pnpm type-check（类型检查）
  ├─ pnpm lint（代码规范检查）
  └─ pnpm test（单元测试）
  ↓（全部通过）
deploy 任务
  ├─ vercel pull（拉取 Vercel 配置）
  ├─ vercel build（构建项目）
  └─ vercel deploy（部署到生产环境）
```

### Pull Request
```
create PR
  ↓
lint-and-test 任务
  ├─ pnpm install
  ├─ pnpm type-check
  ├─ pnpm lint
  └─ pnpm test
  ↓
（仅运行测试，不部署）
```

## 常见问题

### Q1: GitHub Actions 失败，提示 "pnpm: command not found"
**解决方案**: 确保 `.github/workflows/ci-cd.yml` 中包含 `pnpm/action-setup` 步骤。

### Q2: Vercel 部署失败，提示环境变量缺失
**解决方案**: 检查 Vercel 控制台的环境变量配置，确保所有必需变量都已添加。

### Q3: 部署成功但应用无法访问
**解决方案**: 
1. 检查 Vercel 部署日志
2. 确认环境变量配置正确
3. 检查 Next.js 构建是否有错误

### Q4: 如何只运行测试不部署？
**解决方案**: 创建 Pull Request 而不是直接 push 到 main 分支。PR 只会运行 `lint-and-test` 任务。

## 后续优化建议

1. **PR 预览部署**: 添加 PR 预览部署（使用 `vercel deploy` 不带 `--prod`）
2. **E2E 测试**: 在 CI 中集成 Playwright E2E 测试
3. **通知集成**: 部署成功/失败时发送 Slack/钉钉通知
4. **性能监控**: 集成 Vercel Analytics 监控页面性能
5. **分支保护**: 配置 GitHub Branch Protection，要求 CI 通过才能合并

## 参考文档

- [Vercel 文档](https://vercel.com/docs)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
