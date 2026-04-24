# Changelog - 2026-04-24

## 任务信息
- **类型**: FEAT
- **主题**: Web3 转账卡片功能完整实施
- **Pipeline**: origin -> check-in -> architect -> qa -> coder -> audit -> digest -> changelog
- **完成时间**: 2026-04-24

## 架构设计

### 目标
在 Web3 AI Agent 聊天窗口中实现在线转账功能,用户通过自然语言指令即可完成链上转账操作,支持 ETH 原生转账和 ERC20 Token 转账。

### 模块边界
- **新增模块**: `apps/web/components/cards/` - 转账卡片组件目录
- **新增模块**: `apps/web/lib/supabase/transfers.ts` - 转账卡片数据访问层
- **新增模块**: `apps/web/lib/tokens.ts` - Token 配置管理
- **新增模块**: `packages/web3-tools/src/transfer.ts` - 转账工具函数
- **新增模块**: `apps/web/types/transfer.ts` - 转账相关类型定义
- **修改模块**: `apps/web/app/api/chat/route.ts` - 增加 createTransferCard 工具
- **修改模块**: `apps/web/hooks/useChatStream.ts` - 增加 transfer_data 事件处理
- **不影响**: 现有聊天、钱包登录、对话持久化功能

### 接口契约

#### TransferCard 组件 Props
```typescript
interface TransferCardProps {
  data: TransferData
  conversationId: string
  onUpdate?: (cardId: string, status: TransferStatus, txHash?: string, error?: string) => void
}

interface TransferData {
  id: string
  from: string
  to: string
  tokenSymbol: string
  tokenAddress?: string
  amount: string
  chain: 'ethereum' | 'polygon' | 'bsc'
  status?: TransferStatus
  txHash?: string
  error?: string
}

type TransferStatus = 'pending' | 'signing' | 'confirmed' | 'failed'
```

#### AI 工具定义
```typescript
{
  name: 'createTransferCard',
  parameters: {
    to: string,
    tokenSymbol: string,
    amount: string,
    chain: string,
    tokenAddress?: string
  }
}
```

#### SSE 事件类型
```typescript
interface StreamChunk {
  type: 'content' | 'tool_call' | 'transfer_data' | 'done'
  transferData?: TransferData
}
```

#### Supabase CRUD 接口
```typescript
// 创建转账卡片
async function createTransferCard(params: CreateTransferCardParams): Promise<string>

// 更新转账状态
async function updateTransferStatus(
  cardId: string, 
  status: TransferStatus, 
  txHash?: string, 
  error?: string
): Promise<void>

// 查询对话的所有转账卡片
async function getTransferCardsByConversation(conversationId: string): Promise<TransferCard[]>
```

### 数据流/状态流

```
用户输入 "转 0.01 USDT 到 0x..."
  ↓
AI 识别转账意图 (System Prompt)
  ↓
调用 createTransferCard 工具
  ↓
后端返回 transferData (SSE transfer_data 事件)
  ↓
前端 useChatStream 解析事件 (useRef 同步保存)
  ↓
渲染 TransferCard 组件 (状态: pending)
  ↓
用户点击"确认"按钮
  ↓
检查链是否匹配 → 检查余额是否充足 → 验证地址格式
  ↓
调用 wagmi hooks (useSendTransaction / useWriteContract)
  ↓
钱包弹出签名弹窗 (状态: signing)
  ↓
用户确认签名 → 广播交易
  ↓
交易上链确认 (状态: confirmed)
  ↓
更新 TransferCard 状态 + 同步 Supabase 数据库
  ↓
显示"查看交易"按钮 (区块链浏览器链接)
  ↓
刷新页面 → 从数据库恢复卡片和状态
```

### 风险点

1. **资金安全风险**: 
   - 风险: 用户可能发送到错误地址
   - 应对: 地址格式验证 (viem isAddress) + 二次确认弹窗
   
2. **ERC20 Approve 缺失**: 
   - 风险: USDT 等 Token 需要先 approve 授权
   - 应对: 当前仅错误提示,生产环境必须实现完整 approve 流程
   
3. **RLS 策略开放**: 
   - 风险: 开发环境临时放开 RLS 策略
   - 应对: 生产部署前必须收紧 (集成 Supabase Auth)
   
4. **RPC 节点 CORS**: 
   - 风险: 公共 RPC 可能不支持浏览器端 CORS
   - 应对: 已更换为 eth.llamarpc.com (支持 CORS)
   
5. **Gas 估算不准确**: 
   - 风险: 网络拥堵时 gas 可能不足
   - 应对: 提示用户余额不足,允许手动调整

## 变更详情

### 新增
- `apps/web/components/cards/TransferCard.tsx` (338行) - 转账卡片核心组件
- `apps/web/components/cards/DexSwapCard.tsx` - DexSwap 卡片预留
- `apps/web/components/cards/index.ts` - 卡片组件统一导出
- `apps/web/lib/supabase/transfers.ts` (146行) - 转账卡片 CRUD 操作
- `apps/web/lib/tokens.ts` - Token 配置管理 (支持多链)
- `apps/web/types/transfer.ts` - 转账相关类型定义
- `packages/web3-tools/src/transfer.ts` (99行) - 转账工具函数
- `supabase/migrations/create_transfer_cards.sql` - 数据库表创建脚本
- `supabase/migrations/fix_transfer_cards_rls.sql` - RLS 策略修复脚本
- `supabase/migrations/alter_messages_id_type.sql` - messages 表 ID 类型修改
- `docs/digest/2026-04-24-web3-transfer-card-implementation.md` - 实施文档

### 修改
- `apps/web/app/api/chat/route.ts` (+103/-3)
  - 新增 createTransferCard 工具定义
  - 优化 System Prompt (转账场景识别)
  - transferData 数据流处理 (变量声明提前)
  - SSE 流式响应支持 transfer_data 事件
  - 避免 AI 文字回复与卡片重复显示
  
- `apps/web/app/page.tsx` (+33/-1)
  - 处理 assistantMessage.transferData
  - 传递 conversationId 给 TransferCard
  
- `apps/web/hooks/useChatStream.ts` (+41/-3)
  - 新增 transferDataRef (useRef 同步保存)
  - 解析 transfer_data SSE 事件
  - 返回时使用 ref 而非异步 state
  
- `apps/web/components/MessageItem.tsx` (+39/-1)
  - 渲染 TransferCard 组件
  - 传递 onUpdate 回调
  
- `apps/web/components/MessageList.tsx` (+5/-1)
  - 透传 conversationId 给 MessageItem
  
- `apps/web/lib/supabase/conversations.ts` (+44/-2)
  - saveMessages 包含 msg.id (避免 Supabase 自动生成 UUID)
  - 使用 upsert 避免重复插入
  - loadMessages 加载 transferData 并附加到消息
  
- `apps/web/types/chat.ts` (+3)
  - Message 类型增加 transferData 字段
  
- `apps/web/types/stream.ts` (+5/-1)
  - StreamChunk 增加 transfer_data 类型和 transferData 字段
  
- `apps/web/app/config.ts` (+18/-3)
  - 更换 RPC 节点支持 CORS (eth.llamarpc.com)
  
- `apps/web/next.config.js` (+15)
  - 添加 CoinGecko 和 jsdelivr 域名白名单
  
- `packages/ai-config/src/types.ts` (+12/-1)
  - 完善 AI 工具类型定义
  
- `packages/web3-tools/package.json` (+1)
  - 添加 viem 依赖
  
- `packages/web3-tools/src/index.ts` (+1)
  - 导出 transfer 工具函数

### 删除
- 无

### 修复
- React State 异步延迟问题 (使用 useRef)
- 变量声明顺序错误 (transferData 提前定义)
- Supabase RLS 策略冲突 (开发环境临时放开)
- 数据库字段类型不匹配 (UUID → TEXT)
- 消息 ID 不一致 (保存 msg.id + upsert)
- RPC 节点 CORS 错误 (更换公共 RPC)
- Next.js Image 外部 URL 加载 (配置 remotePatterns)

## 影响范围

- **影响模块**: 
  - 聊天界面 (MessageItem, MessageList, page.tsx)
  - AI 工具调用 (chat route, System Prompt)
  - SSE 流式传输 (useChatStream)
  - 数据持久化 (Supabase conversations, transfers)
  - Web3 工具集 (web3-tools transfer)
  - Token 配置管理 (tokens.ts)
  
- **破坏性变更**: 否
  
- **需要迁移**: 是
  - 数据库迁移: 执行 3 个 SQL 脚本 (create_transfer_cards, fix_rls, alter_id_type)
  - 前端迁移: 无 (向后兼容)

## 上下文标记

**关键词**: Web3转账,TransferCard,ERC20,ETH转账,Supabase持久化,数据恢复,卡片组件,可扩展架构,客户端直连,wagmi,viem,SSE流式,useRef同步,RLS策略,CORS,RPC节点
**相关文档**: 
- docs/digest/2026-04-24-web3-transfer-card-implementation.md (实施详情)
- docs/checklist/PROJECT-CHECKLIST.md (项目清单 v0.5.0)
- apps/web/components/cards/TransferCard.tsx (核心组件)
- apps/web/lib/supabase/transfers.ts (数据访问层)
- supabase/migrations/ (数据库迁移脚本)

**后续建议**: 
1. 🔴 **立即执行**: 实现完整的 ERC20 approve 流程 (P0)
2. 🟡 **本周完成**: 生产环境收紧 RLS 策略 (集成 Supabase Auth)
3. 🟡 **本周完成**: 添加 Supabase 数据访问层单元测试
4. 🟢 **长期优化**: 支持批量转账、交易历史记录页面、Gas 估算优化
