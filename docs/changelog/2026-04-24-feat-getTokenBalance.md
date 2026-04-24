# Changelog - 2026-04-24

## 任务信息
- **类型**: FEAT
- **主题**: 新增 getTokenBalance 工具查询 ERC20 Token 余额
- **Pipeline**: audit -> coder -> audit
- **完成时间**: 2026-04-24

## 架构设计

### 目标
解决 `getBalance` 只能查原生币（ETH/MATIC/BNB）余额，无法查询 ERC20 Token（USDT/USDC/DAI）余额的问题。AI 模型之前错误地把原生 ETH 余额标注为 USDT/USDC 返回值。

### 模块边界
- **新增函数**: `getTokenBalance(chain, address, tokenSymbol)` 在 `packages/web3-tools/src/token.ts`
- **Token 注册表**: 复用 `packages/web3-tools/src/tokens/registry.ts` 的 `findToken()` 获取合约地址和精度
- **RPC 层**: 复用 `getRpcUrl()` 创建 ethers `JsonRpcProvider`，调用 ERC20 `balanceOf` 方法
- **AI 工具定义**: `chat/route.ts` 新增 `getTokenBalance` 工具 + 路由
- **独立 API 路由**: `tools/route.ts` 新增 `getTokenBalance` 路由
- **精度处理**: USDT/USDC 用 6 位小数，DAI/UNI 用 18 位，从 Token 注册表动态获取

### 接口契约
```typescript
// 新增函数
function getTokenBalance(chain: ChainId, address: string, tokenSymbol: string): Promise<ToolResult<BalanceData>>

// 返回值示例
{
  success: true,
  data: {
    chain: 'ethereum',
    address: '0x...',
    balance: '2.85217',
    unit: 'USDT',
    decimals: 6
  }
}
```

### 数据流
```
用户请求 → AI Agent → getTokenBalance(chain, address, tokenSymbol)
  → findToken(chain, tokenSymbol) → 获取合约地址和精度
  → ethers.JsonRpcProvider(rpcUrl)
  → Contract.balanceOf(address)
  → formatUnits(balance, token.decimals)
  → 返回标准化的 ToolResult<BalanceData>
```

### 风险点
- 仅支持 Token 注册表中的 Token，未注册的 Token 需先添加到注册表
- RPC 节点可用性影响查询成功率
- 只读操作，无资金安全风险

## 变更详情

### 新增
- `packages/web3-tools/src/token.ts` - `getTokenBalance` 函数（ERC20 balanceOf 链上查询）
- `apps/web/app/api/chat/route.ts` - `getTokenBalance` 工具定义 + 路由 + system prompt 规则第 9 条
- `apps/web/app/api/tools/route.ts` - `getTokenBalance` API 路由

### 修改
- `packages/web3-tools/src/balance.ts` - 添加 `getBalance` 调试日志便于排障

## 影响范围

- **影响模块**: web3-tools, chat API, tools API
- **破坏性变更**: 否
- **需要迁移**: 否

## 上下文标记

**关键词**: ERC20, Token余额, USDT, USDC, balanceOf, getTokenBalance, 精度, decimal
**相关文档**: docs/changelog/2026-04-22-feat-multichain-web3-tools.md
**后续建议**: 可考虑添加地址格式验证和 RPC 超时配置
