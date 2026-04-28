# P1 任务全量交付 - RLS 升级 + E2E 覆盖完善

> 日期：2026-04-28
> 版本：v0.7.2
> 类型：DELIVER-PATCH（安全加固 + 测试覆盖）

## 变更内容

### 1. RLS 升级方案（安全增强）

#### 背景
当前数据库 RLS 策略使用 `USING (true)`，仅依赖应用层 `verifyWalletContext()` 做数据隔离，Delete 操作缺乏数据库层保护。

#### 解决方案
- **服务端所有权验证 API** (`/api/supabase/verify-ownership`)：接收 conversationId + walletAddress，查询数据库确认对话归属
- **服务端删除 API** (`/api/supabase/delete-conversation`)：使用 service_role 密钥（或 anon key）执行删除，内置所有权验证
- **前端联动**：ConversationHistory 的 `handleDeleteConfirm` 先调用 verify-ownership，再调用 delete-conversation，双重验证
- **RLS Migration** (`supabase/migrations/upgrade_production_rls.sql`)：DELETE 策略升级为 `current_setting('app.current_wallet_address', true)` 严格模式
- **部署文档**：新增"生产环境 RLS 升级指南"章节

#### 相关文件
- `apps/web/app/api/supabase/verify-ownership/route.ts` (新增)
- `apps/web/app/api/supabase/delete-conversation/route.ts` (新增)
- `apps/web/components/ConversationHistory.tsx` (修改)
- `supabase/migrations/upgrade_production_rls.sql` (新增)
- `supabase/init.sql` (RLS 策略命名规整)
- `docs/DEPLOYMENT.md` (新增 RLS 指南章节)
- `apps/web/.env.example` (新增 SUPABASE_SERVICE_ROLE_KEY)

### 2. E2E 测试覆盖完善

#### 新增测试场景
- **钱包上下文验证（api.spec.ts）**：
  - 有效钱包地址 → 正常响应
  - 无效钱包地址 → 400 错误
  - 不传钱包地址 → 正常响应
- **verify-ownership API（api.spec.ts）**：
  - 无效参数 → 400
  - 不存在的对话 → 404
  - 无效钱包格式 → 400
- **转账卡片 UI（transfer.spec.ts，新增文件）**：
  - 发送转账指令触发卡片生成
  - 卡片显示正确的金额和币种
  - 不完整转账指令的 AI 回复

#### 测试结果
- 总数：9 → 18 个测试
- 全部通过：18/18 (53.0s)

#### 相关文件
- `e2e/api.spec.ts` (3→ 9 tests)
- `e2e/transfer.spec.ts` (新增，3 tests)
- `docs/E2E-TESTING.md` (更新文档)

### 3. 钱包地址格式验证

聊天 API route.ts 添加 `isValidEthereumAddress()` 函数，在 system prompt 注入前验证钱包地址格式，无效地址返回 400 错误。

### 4. SSR 主题闪烁修复

确认 layout.tsx `<head>` 已有内联同步脚本，在 React 执行前设置 data-theme 和 dark class，更新文档标记完成。

## 架构图

```mermaid
graph TB
    subgraph "删除操作安全流程"
        A[用户点击删除] --> B[verify-ownership API]
        B --> C{数据库查询}
        C -->|wallet_address 匹配| D[delete-conversation API]
        C -->|不匹配| E[返回 403 拒绝]
        D --> F[删除 messages + conversations]
    end

    subgraph "API 路由"
        G[/api/supabase/verify-ownership]
        H[/api/supabase/delete-conversation]
        I[/api/chat]
    end

    subgraph "数据库"
        J[(conversations)]
        K[(messages)]
    end

    G --> J
    H --> K
    I --> |walletAddress 验证| I
```

## 检查清单

- [x] E2E 18 tests 全部通过
- [x] RLS migration 文件可执行
- [x] 部署文档包含 RLS 升级指南
- [x] 项目状态文档已更新 (v0.7.2)
- [x] 技能地图已更新
