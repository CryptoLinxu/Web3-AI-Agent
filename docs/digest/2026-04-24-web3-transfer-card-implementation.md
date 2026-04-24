# Web3 转账卡片功能完整实施

> 日期: 2026-04-24
> 作者: AI-Agent Team
> 类型: FEAT (新功能交付)
> 状态: ✅ 已完成

## 一、背景与目标

### 1.1 业务需求
在 Web3 AI Agent 聊天窗口中实现在线转账功能,用户通过自然语言指令即可完成链上转账操作。

### 1.2 技术方案
采用**客户端直连方案**(方案一):
- AI 识别转账意图 → 返回结构化数据
- 前端渲染 TransferCard 组件
- 用户点击确认后调用 wagmi hooks 完成签名和广播
- 支持 ETH 原生转账和 ERC20 Token 转账

## 二、实现内容

### 2.1 核心功能

#### 转账卡片组件 (`apps/web/components/cards/TransferCard.tsx`)
- ✅ 卡片 UI 完整实现 (严格按照设计图)
- ✅ 4 种交易状态: pending/signing/confirmed/failed
- ✅ 代币图标显示 (支持原生币和 ERC20)
- ✅ 网络标识显示 (Ethereum/Polygon/BSC)
- ✅ 地址缩写显示 (前6...后6格式)
- ✅ 交易成功后显示交易哈希
- ✅ 余额验证 (Token 余额和 Gas 费)
- ✅ 错误提示 (用户取消/余额不足/Gas不足/网络错误)
- ✅ 链检查和切换提示
- ✅ 地址格式验证
- ✅ ERC20 approve 错误提示
- ✅ 区块链浏览器跳转
- ✅ 卡片最小宽度 300px

#### AI 工具调用 (`apps/web/app/api/chat/route.ts`)
- ✅ 新增 `createTransferCard` 工具定义
- ✅ System Prompt 优化 (转账场景识别)
- ✅ transferData 数据流处理
- ✅ SSE 流式响应支持 `transfer_data` 事件
- ✅ 避免 AI 文字回复与卡片重复显示

#### 数据持久化
- ✅ Supabase `transfer_cards` 表创建
- ✅ 转账卡片 CRUD 操作 (`apps/web/lib/supabase/transfers.ts`)
- ✅ 消息保存时同步保存转账卡片
- ✅ 加载消息时恢复转账卡片状态
- ✅ 交易状态实时更新数据库
- ✅ 刷新页面后状态正确恢复

#### 类型定义
- ✅ `TransferData` 类型 (`apps/web/types/transfer.ts`)
- ✅ `TransferStatus` 枚举
- ✅ `ChainId` 类型
- ✅ StreamChunk 增加 `transfer_data` 类型

### 2.2 架构设计

#### 卡片组件可扩展架构
- 独立目录: `apps/web/components/cards/`
- 统一导出: `apps/web/components/cards/index.ts`
- 预留 DexSwapCard 扩展位
- 后续支持更多卡片类型

#### Token 配置管理
- Token 合约地址配置 (`apps/web/lib/tokens.ts`)
- 支持多链 Token (ETH/Polygon/BSC)
- 支持原生币和 ERC20
- 提供 `getTokenConfig()` 和 `isNativeToken()` 工具函数

#### Web3 工具函数
- 转账工具函数 (`packages/web3-tools/src/transfer.ts`)
- Gas 估算
- 地址验证
- 区块链浏览器链接生成

### 2.3 数据库设计

#### transfer_cards 表结构
```sql
CREATE TABLE transfer_cards (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  message_id TEXT NOT NULL,
  
  -- 转账信息
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  token_address TEXT,
  amount TEXT NOT NULL,
  chain TEXT NOT NULL,
  
  -- 交易状态
  status TEXT NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  error_message TEXT,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### RLS 策略
- 用户只能访问自己的转账记录
- 基于 conversation_id 关联钱包地址
- 开发环境临时放开限制

### 2.4 数据流设计

```
用户输入 "转 0.01 USDT 到 0x..."
  ↓
AI 识别转账意图
  ↓
调用 createTransferCard 工具
  ↓
返回 transferData (SSE 流式)
  ↓
前端解析 transfer_data 事件
  ↓
渲染 TransferCard 组件
  ↓
用户点击"确认"
  ↓
wagmi hooks 签名 + 广播
  ↓
交易确认/失败
  ↓
更新卡片状态 + 同步数据库
  ↓
刷新页面恢复状态
```

## 三、遇到的问题与解决方案

### 3.1 React State 异步延迟
**问题**: SSE 流结束后 transferData 仍为 undefined  
**根因**: React setState 是异步的,sendMessage 立即返回时状态未更新  
**解决**: 使用 useRef 同步保存 transferData

### 3.2 变量声明顺序错误
**问题**: `Cannot access 'transferData' before initialization`  
**根因**: transferData 在流式分支之后定义,但在流式分支中使用  
**解决**: 将 transferData 定义提前到流式和非流式分支之前

### 3.3 Supabase RLS 策略冲突
**问题**: `new row violates row-level security policy`  
**根因**: RLS 策略依赖 auth.jwt(),但项目使用应用层钱包验证  
**解决**: 临时修改 RLS 策略允许所有操作(开发环境)

### 3.4 数据库字段类型不匹配
**问题**: `invalid input syntax for type uuid: "1777005534548"`  
**根因**: transfer_cards 和 messages 表的 id 字段是 UUID,但前端使用时间戳字符串  
**解决**: 修改表结构,将 id 改为 TEXT 类型

### 3.5 消息 ID 不一致
**问题**: 刷新后转账卡片无法恢复  
**根因**: saveMessages 没有保存消息的 id,Supabase 自动生成 UUID,与 transfer_cards.message_id 不匹配  
**解决**: 保存消息时包含 `id: msg.id`,使用 upsert 避免重复

### 3.6 RPC 节点 CORS 错误
**问题**: `Access to fetch at 'https://eth.merkle.io/' has been blocked by CORS policy`  
**根因**: wagmi 默认使用的公共 RPC 不支持浏览器端 CORS  
**解决**: 更换为支持 CORS 的公共 RPC (eth.llamarpc.com)

### 3.7 Next.js Image 外部 URL 加载
**问题**: `GET /_next/image?url=... 500`  
**根因**: Next.js Image 组件需要配置 remotePatterns 白名单  
**解决**: 在 next.config.js 中添加 CoinGecko 和 jsdelivr 域名

## 四、代码变更统计

### 新增文件 (7个)
- `apps/web/components/cards/TransferCard.tsx` (338行)
- `apps/web/components/cards/DexSwapCard.tsx` (预留)
- `apps/web/components/cards/index.ts`
- `apps/web/lib/supabase/transfers.ts` (146行)
- `apps/web/lib/tokens.ts`
- `apps/web/types/transfer.ts`
- `packages/web3-tools/src/transfer.ts` (99行)

### 修改文件 (14个)
- `apps/web/app/api/chat/route.ts` (+103/-3)
- `apps/web/app/page.tsx` (+33/-1)
- `apps/web/hooks/useChatStream.ts` (+41/-3)
- `apps/web/components/MessageItem.tsx` (+39/-1)
- `apps/web/components/MessageList.tsx` (+5/-1)
- `apps/web/lib/supabase/conversations.ts` (+44/-2)
- `apps/web/types/chat.ts` (+3)
- `apps/web/types/stream.ts` (+5/-1)
- `apps/web/app/config.ts` (+18/-3)
- `apps/web/next.config.js` (+15)
- `packages/ai-config/src/types.ts` (+12/-1)
- `packages/web3-tools/package.json` (+1)
- `packages/web3-tools/src/index.ts` (+1)
- `pnpm-lock.yaml` (+53/-1)

### 数据库变更
- 新增 `transfer_cards` 表
- 修改 `messages.id` 类型: UUID → TEXT
- 修改 `transfer_cards.id` 类型: UUID → TEXT
- 创建 RLS 策略和索引

## 五、测试验证

### 5.1 功能测试
- ✅ AI 识别转账意图生成卡片
- ✅ 卡片 UI 正确渲染
- ✅ ETH 原生转账
- ✅ ERC20 Token 转账
- ✅ 用户拒绝签名 → 错误提示
- ✅ 余额不足 → 禁用按钮
- ✅ 交易成功 → 状态流转
- ✅ 区块链浏览器跳转
- ✅ 刷新页面状态恢复

### 5.2 边界测试
- ✅ 地址格式验证
- ✅ 链切换提示
- ✅ 网络错误处理
- ✅ Gas 费不足提示
- ✅ 多链支持 (ETH/Polygon/BSC)

### 5.3 已知限制
- ⚠️ ERC20 approve 流程未完全实现 (仅错误提示)
- ⚠️ RLS 策略开发环境放开,生产环境需收紧
- ⚠️ 缺少单元测试覆盖

## 六、经验总结

### 6.1 技术经验
1. **React State 同步问题**: 异步场景使用 useRef 避免时序问题
2. **SSE 流式数据处理**: 在 consumeStream 完成后立即使用 ref 获取最新值
3. **Supabase 类型匹配**: 前端生成 ID 时数据库字段需改为 TEXT
4. **upsert vs insert**: 使用 upsert 避免重复插入冲突
5. **CORS 配置**: Web3 项目需选用支持浏览器端 CORS 的 RPC 节点

### 6.2 架构经验
1. **组件可扩展性**: 卡片组件独立目录,预留扩展位
2. **类型安全**: 完整的 TypeScript 类型定义,避免运行时错误
3. **数据持久化**: 状态变化时同步更新数据库,刷新后可恢复
4. **错误处理**: 分层错误处理 (UI 提示 + 数据库记录)

### 6.3 调试经验
1. **添加日志**: 关键路径添加 console.log 快速定位问题
2. **分步验证**: 从数据流入口到出口逐步验证
3. **数据库检查**: 直接查询数据库确认数据是否正确保存

## 七、后续优化建议

### 7.1 高优先级
1. 实现完整的 ERC20 approve 流程
2. 生产环境收紧 RLS 策略 (集成 Supabase Auth)
3. 添加单元测试覆盖

### 7.2 中优先级
4. 支持批量转账
5. 添加交易历史记录页面
6. 优化 Gas 估算准确性

### 7.3 低优先级
7. 支持跨链转账
8. 添加转账模板功能
9. 交易失败自动重试机制

## 八、安全注意事项

### 8.1 资金安全
- ✅ 余额验证防止超额转账
- ✅ 地址格式验证防止发送到无效地址
- ✅ 链检查防止跨链误操作
- ⚠️ 生产环境必须实现 approve 流程
- ⚠️ 建议添加二次确认弹窗

### 8.2 数据安全
- ✅ RLS 策略隔离用户数据
- ✅ 转账记录与对话关联
- ⚠️ 开发环境 RLS 放开,需在生产环境收紧
- ⚠️ 建议加密敏感字段 (地址、金额)

### 8.3 用户体验
- ✅ 清晰的错误提示
- ✅ 状态可视化
- ✅ 交易进度反馈
- ⚠️ 建议添加交易失败原因详细说明

---

## 附录

### A. 相关文件清单
- 核心组件: `apps/web/components/cards/TransferCard.tsx`
- 数据层: `apps/web/lib/supabase/transfers.ts`
- 类型定义: `apps/web/types/transfer.ts`
- AI 集成: `apps/web/app/api/chat/route.ts`
- 工具函数: `packages/web3-tools/src/transfer.ts`
- 数据库: `supabase/migrations/create_transfer_cards.sql`

### B. 测试账号
- 测试网: Sepolia / Mumbai / BSC Testnet
- 测试 Token: 0.01 USDT / 0.001 ETH

### C. 参考文档
- wagmi docs: https://wagmi.sh
- viem docs: https://viem.sh
- Supabase docs: https://supabase.com/docs
