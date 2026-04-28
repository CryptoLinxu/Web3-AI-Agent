/**
 * 提示词配置文件
 * 
 * 集中管理所有场景的提示词模板，支持随时修改
 */

export type PromptCategory =
  | 'price'      // 价格查询
  | 'balance'    // 余额查询
  | 'gas'        // Gas 查询
  | 'token'      // Token 查询
  | 'transfer'   // 转账操作
  | 'system'     // 系统提示词

export interface PromptTemplate {
  id: string
  category: PromptCategory
  title: string
  content: string
  description?: string
}

/**
 * 用户输入提示词模板（按分类组织）
 */
export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // ========== 价格查询 ==========
  {
    id: 'price-eth',
    category: 'price',
    title: '查询 ETH 价格',
    content: 'ETH 现在多少钱？',
    description: '查询以太坊当前价格（美元）',
  },
  {
    id: 'price-btc',
    category: 'price',
    title: '查询 BTC 价格',
    content: 'BTC 现在多少钱？',
    description: '查询比特币当前价格（美元）',
  },
  {
    id: 'price-sol',
    category: 'price',
    title: '查询 SOL 价格',
    content: 'SOL 现在多少钱？',
    description: '查询 Solana 当前价格（美元）',
  },
  {
    id: 'price-matic',
    category: 'price',
    title: '查询 MATIC 价格',
    content: 'MATIC 现在多少钱？',
    description: '查询 Polygon 当前价格（美元）',
  },
  {
    id: 'price-bnb',
    category: 'price',
    title: '查询 BNB 价格',
    content: 'BNB 现在多少钱？',
    description: '查询 BNB 当前价格（美元）',
  },

  // ========== 余额查询 ==========
  {
    id: 'balance-my-eth',
    category: 'balance',
    title: '查询我的 ETH 余额',
    content: '查询我的 Ethereum 钱包余额',
    description: '查询当前连接钱包的 ETH 余额',
  },
  {
    id: 'balance-my-polygon',
    category: 'balance',
    title: '查询我的 Polygon 余额',
    content: '查询我的 Polygon 钱包余额',
    description: '查询当前连接钱包的 Polygon 链余额',
  },
  {
    id: 'balance-my-bsc',
    category: 'balance',
    title: '查询我的 BSC 余额',
    content: '查询我的 BSC 钱包余额',
    description: '查询当前连接钱包的 BSC 链余额',
  },
  {
    id: 'balance-address',
    category: 'balance',
    title: '查询指定地址余额',
    content: '查询地址 0x4aee12a85515f731bcd4321def58d68b31938720 的余额',
    description: '查询指定以太坊地址的余额',
  },

  // ========== Gas 查询 ==========
  {
    id: 'gas-eth',
    category: 'gas',
    title: '查询 ETH Gas',
    content: 'Ethereum 现在的 Gas 价格是多少？',
    description: '查询以太坊当前 Gas 价格',
  },
  {
    id: 'gas-polygon',
    category: 'gas',
    title: '查询 Polygon Gas',
    content: 'Polygon 现在的 Gas 价格是多少？',
    description: '查询 Polygon 链当前 Gas 价格',
  },
  {
    id: 'gas-bsc',
    category: 'gas',
    title: '查询 BSC Gas',
    content: 'BSC 现在的 Gas 价格是多少？',
    description: '查询 BSC 链当前 Gas 价格',
  },

  // ========== Token 查询 ==========
  {
    id: 'token-info-usdt',
    category: 'token',
    title: '查询 USDT 信息',
    content: '查询 USDT Token 的合约地址和元数据信息',
    description: '查询 USDT Token 的详细信息',
  },
  {
    id: 'token-info-usdc',
    category: 'token',
    title: '查询 USDC 信息',
    content: '查询 USDC Token 的合约地址和元数据信息',
    description: '查询 USDC Token 的详细信息',
  },
  {
    id: 'token-balance-usdt',
    category: 'token',
    title: '查询我的 USDT 余额',
    content: '查询我的 USDT 余额',
    description: '查询当前钱包的 USDT Token 余额',
  },
  {
    id: 'token-balance-usdc',
    category: 'token',
    title: '查询我的 USDC 余额',
    content: '查询我的 USDC 余额',
    description: '查询当前钱包的 USDC Token 余额',
  },

  // ========== 转账操作 ==========
  {
    id: 'transfer-eth',
    category: 'transfer',
    title: '转账 ETH',
    content: '帮我转账 0.001 ETH 到 0x8ac1f3b24775072bd33528408cfae6a45a7e10d7',
    description: '发起 ETH 原生转账',
  },
  {
    id: 'transfer-usdt',
    category: 'transfer',
    title: '转账 USDT',
    content: '帮我转账 0.001 USDT 到 0x8ac1f3b24775072bd33528408cfae6a45a7e10d7',
    description: '发起 USDT ERC20 转账',
  },
  {
    id: 'transfer-usdc',
    category: 'transfer',
    title: '转账 USDC',
    content: '帮我转账 0.001 USDC 到 0x8ac1f3b24775072bd33528408cfae6a45a7e10d7',
    description: '发起 USDc ERC20 转账',
  },
]

/**
 * 系统提示词（AI 行为定义）
 * 从 route.ts 迁移过来，集中管理
 */
export const SYSTEM_PROMPT_BASE = `你是 Web3 AI Agent，一个专门帮助用户查询 Web3 信息和执行链上操作的助手。

## 你的能力
- 查询多种加密货币价格（ETH, BTC, SOL, MATIC, BNB）
- 查询多条链上钱包地址的余额：
  - EVM 链：Ethereum, Polygon, BSC
  - 非 EVM 链：Bitcoin, Solana
- 查询 EVM 链的当前 Gas 价格
- 查询 Token 元数据信息（名称、合约地址、精度）
- 查询 Token 余额（通过 getTokenBalance 工具查询 USDT、USDC 等 ERC20 Token 余额）
- 生成转账卡片，帮助用户在聊天窗口内完成链上转账

## 行为准则
1. 只回答与 Web3 相关的问题
2. 对于超出能力范围的问题，明确告知用户
3. 当需要查询数据时，主动调用相应工具
4. 工具返回的结果要整理成易懂的自然语言
5. 查询价格时使用 getTokenPrice 工具，传入 symbol 参数
6. 查询余额时使用 getBalance 工具，需要指定 chain 和 address
7. 查询 Gas 时使用 getGasPrice 工具，需要指定 chain（仅 EVM 链）
8. 查询 Token 信息时使用 getTokenInfo 工具，需要指定 chain 和 symbol
9. 查询 ERC20 Token（如 USDT、USDC）余额时使用 getTokenBalance 工具，需要指定 chain、address 和 tokenSymbol
10. 当用户表达转账意图时，使用 createTransferCard 工具生成转账卡片

## 转账场景识别
以下场景需要调用 createTransferCard 工具：
- "转 X 个 Token 给地址"
- "发送 X ETH/USDT 到地址"
- "帮我转账..."
- "向地址转账 X 金额"

调用时必须提供：to（接收地址）、tokenSymbol（Token符号）、amount（金额）、chain（链名称）

**重要：调用 createTransferCard 工具后，不要生成任何文字回复，直接返回空字符串。转账卡片会由前端自动渲染。**

## 安全边界
- 不提供交易建议
- 不预测价格走势
- 所有数据仅供参考，不构成投资建议
- 明确标注数据来源
- 转账前提醒用户确认地址和金额
- 明确告知"此操作不可逆"

## 回复格式
- 简洁明了
- 重要数据突出显示
- 必要时提供数据来源说明
- **Token 信息查询时，Logo 必须使用 Markdown 图片格式展示**
  - 格式：使用 ![](url) 语法（留空 alt 文本），例如 ![](logoUri)
  - 错误示例：不要使用 "Logo：点击查看 Logo" 或纯文本链接，不要使用 ![Token Logo](url) 带 alt 文本
  - 如果 logoUri 为空，可以不展示 Logo`

/**
 * 分类元数据（图标和标签）
 */
const CATEGORY_META: Record<PromptCategory, { icon: string; label: string }> = {
  price: { icon: '📊', label: '价格查询' },
  balance: { icon: '💰', label: '余额查询' },
  gas: { icon: '⛽', label: 'Gas 查询' },
  token: { icon: '🪙', label: 'Token 查询' },
  transfer: { icon: '💸', label: '转账操作' },
  system: { icon: '⚙️', label: '系统提示词' },
}

/**
 * 辅助函数：按分类获取提示词
 */
export function getPromptsByCategory(category: PromptCategory): PromptTemplate[] {
  return PROMPT_TEMPLATES.filter((p) => p.category === category)
}

/**
 * 辅助函数：根据 ID 获取提示词
 */
export function getPromptById(id: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES.find((p) => p.id === id)
}

/**
 * 辅助函数：获取所有分类元数据
 */
export function getAllCategories(): Array<{
  category: PromptCategory
  icon: string
  label: string
}> {
  return Object.entries(CATEGORY_META).map(([category, meta]) => ({
    category: category as PromptCategory,
    ...meta,
  }))
}
