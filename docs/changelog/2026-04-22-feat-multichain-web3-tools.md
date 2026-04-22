# Changelog - 2026-04-22

## 任务信息
- **类型**: FEAT + REFACTOR（多阶段重构）
- **主题**: 多链 Web3 工具架构重构
- **Pipeline**: origin → architect → req → check-in → pipeline(FEAT) × 4 phases → coder → qa → git-commit
- **完成时间**: 2026-04-22 14:00

## 架构设计

### 目标
将硬编码的单链/单币种 Web3 工具重构为可扩展的多链架构，支持 5 条链（Ethereum, Polygon, BSC, Bitcoin, Solana）的价格查询、余额查询、Gas 查询和 Token 信息查询。

### 模块边界
- **新增模块**:
  - `packages/web3-tools/src/chains/` - 链抽象层（配置 + 适配器）
  - `packages/web3-tools/src/tokens/` - Token 注册表
  - `packages/web3-tools/src/token.ts` - Token 查询工具
  
- **重构模块**:
  - `packages/web3-tools/src/price.ts` - 价格工具参数化
  - `packages/web3-tools/src/balance.ts` - 余额工具多链化
  - `packages/web3-tools/src/gas.ts` - Gas 工具多链化
  - `packages/web3-tools/src/types.ts` - 类型系统扩展
  
- **集成模块**:
  - `apps/web/app/api/chat/route.ts` - AI Agent 工具定义和调用

### 接口契约

#### 价格工具
```typescript
// 新增
function getTokenPrice(symbol: string): Promise<ToolResult<TokenPriceData>>

// 废弃（向后兼容）
function getETHPrice(): Promise<ToolResult<TokenPriceData>>
function getBTCPrice(): Promise<ToolResult<TokenPriceData>>
```

#### 余额工具
```typescript
// 新增
function getBalance(chain: ChainId, address: string): Promise<ToolResult<BalanceData>>

// 废弃（向后兼容）
function getWalletBalance(address: string): Promise<ToolResult<BalanceData>>
```

#### Gas 工具
```typescript
// 新增
function getGasPrice(chain: EvmChainId): Promise<ToolResult<GasData>>

// 废弃（向后兼容）
function getEthGasPrice(): Promise<ToolResult<GasData>>
```

#### Token 工具
```typescript
// 新增
function getTokenInfo(chain: ChainId, symbolOrAddress: string): Promise<ToolResult<TokenMetadata>>
```

#### 链适配器
```typescript
interface ChainAdapter {
  getBalance(address: string): Promise<ToolResult<BalanceData>>
  getGasPrice?(): Promise<ToolResult<GasData>>  // 仅 EVM
  validateAddress(address: string): boolean
}

// EVM 适配器
class EvmChainAdapter implements ChainAdapter

// BTC 适配器
class BitcoinAdapter implements ChainAdapter

// Solana 适配器
class SolanaAdapter implements ChainAdapter
```

### 数据流

#### 价格查询
```
用户请求 → AI Agent → getTokenPrice(symbol) → Binance/Huobi API → 返回价格
```

#### 余额查询
```
用户请求 → AI Agent → getBalance(chain, address) 
  → 根据 chain 选择适配器
    → EvmChainAdapter (Ethereum/Polygon/BSC) → ethers.JsonRpcProvider
    → BitcoinAdapter → Blockchain.info/Blockchair API
    → SolanaAdapter → Solana JSON-RPC
  → 返回余额
```

#### Token 查询
```
用户请求 → AI Agent → getTokenInfo(chain, symbol) 
  → 查询 TOKEN_REGISTRY
  → 返回 Token 元数据
```

### 风险点
1. **API 限流**: 公共 RPC 和价格 API 可能限流 → 已配置多节点容错
2. **国内网络**: Binance/Huobi 可能被墙 → 支持代理配置（HTTPS_PROXY）
3. **类型安全**: ChainId 联合类型需类型窄化 → 已实现 isEvmChain 守卫
4. **向后兼容**: 旧函数标记 @deprecated → 委托给新函数，保持兼容

## 变更详情

### Phase 1: 价格工具抽象（REFACTOR）
**Commit**: `ca148db`

#### 新增
- `TokenPriceData` 类型（统一价格数据）
- `SYMBOL_MAP` 币种映射（ETH, BTC, SOL, MATIC, BNB）
- `getTokenPrice(symbol)` 参数化函数
- `test-phase1.ts` 测试脚本

#### 修改
- `types.ts` - ETHPriceData/BTCPriceData 改为类型别名
- `price.ts` - 合并 getETHPrice/getBTCPrice 为 getTokenPrice
- `route.ts` - 工具定义改为参数化，保留旧工具兼容

### Phase 2: EVM 多链支持（FEAT）
**Commit**: `d7f2880`

#### 新增
- `chains/config.ts` - 链配置管理（76 行）
- `chains/evm-adapter.ts` - EVM 适配器（112 行）
- `chains/index.ts` - 模块导出
- `EvmChainId` 类型（ethereum, polygon, bsc）
- `ChainConfig`, `BalanceData`, `GasData` 接口

#### 修改
- `types.ts` - 新增链相关类型
- `balance.ts` - 重构为 getBalance(chain, address)
- `gas.ts` - 重构为 getGasPrice(chain)
- `route.ts` - 工具定义支持 chain 参数

### Phase 3: BTC/Solana 支持（FEAT）
**Commit**: `2aff04a`

#### 新增
- `chains/bitcoin.ts` - BTC 适配器（125 行）
  - 使用 Blockchain.info / Blockchair API
  - 多数据源容错
  - Base58/Bech32 地址验证
- `chains/solana.ts` - Solana 适配器（119 行）
  - 使用 JSON-RPC API
  - Base58 公钥验证
  - 支持自定义 RPC
- `NonEvmChainId` 类型（bitcoin, solana）
- `ChainId` 统一类型

#### 修改
- `types.ts` - 新增 NonEvmChainConfig，ChainConfig 改为联合类型
- `balance.ts` - 支持 5 条链，根据链类型选择适配器
- `route.ts` - 工具定义支持 5 条链

### Phase 4: Token 信息查询（FEAT）
**Commit**: `52e65de`

#### 新增
- `tokens/registry.ts` - Token 注册表（145 行）
  - 11 个主流 Token（USDT, USDC, DAI, WETH, UNI, WMATIC, WBNB）
  - 覆盖 3 条 EVM 链
  - 支持符号和地址查询
- `tokens/index.ts` - 模块导出
- `token.ts` - Token 查询工具（65 行）
- `TokenMetadata` 接口

#### 修改
- `types.ts` - 新增 TokenMetadata
- `index.ts` - 导出 tokens 模块和 token 工具
- `route.ts` - 新增 getTokenInfo 工具定义

### 删除
- 无（保持向后兼容）

## 影响范围

- **影响模块**: 
  - `packages/web3-tools/` - Web3 工具包（核心变更）
  - `apps/web/app/api/chat/` - Chat API 集成
  
- **破坏性变更**: 否（所有旧函数保留并标记 @deprecated）
- **需要迁移**: 否（向后兼容，可逐步迁移）

## 最终能力清单

### 价格查询（5 币种）
- ✅ ETH, BTC, SOL, MATIC, BNB
- ✅ 多数据源容错（Binance, Huobi）
- ✅ 代理支持

### 余额查询（5 链）
- ✅ EVM: Ethereum, Polygon, BSC
- ✅ 非 EVM: Bitcoin, Solana
- ✅ 地址格式验证
- ✅ 多 RPC 容错

### Gas 查询（3 链）
- ✅ Ethereum, Polygon, BSC
- ✅ EIP-1559 费用数据

### Token 查询（11 Token）
- ✅ Ethereum: USDT, USDC, DAI, WETH, UNI
- ✅ Polygon: USDT, USDC, WMATIC
- ✅ BSC: USDT, USDC, WBNB
- ✅ 支持符号和合约地址查询

## 代码统计

- **新增文件**: 9 个
- **修改文件**: 5 个
- **新增代码**: ~600 行
- **删除代码**: ~150 行（重复逻辑）
- **提交次数**: 4 次

## 上下文标记

**关键词**: 多链架构,链适配器,EVM,Bitcoin,Solana,价格查询,余额查询,Gas查询,Token查询,web3-tools,重构,参数化,向后兼容

**相关文档**: 
- `docs/Web3-AI-Agent-PRD-MVP.md` - 项目需求
- `docs/changelog/2026-04-22-feat-multichain-web3-tools.md` - 本文档

**架构设计文档**: 已在 architect 阶段产出（未保存为文件）

**后续建议**:
1. 添加更多 Token 到注册表（当前 11 个，可扩展到 50+）
2. 支持更多 L2 链（Arbitrum, Optimism, zkSync）
3. 实现链上 Token 元数据查询（通过合约 ABI 调用）
4. 添加单元测试覆盖（当前仅手动测试）
5. 考虑实现 Token 价格查询（结合 price 和 token 工具）
6. 优化国内网络访问（添加更多国内可访问的数据源）
