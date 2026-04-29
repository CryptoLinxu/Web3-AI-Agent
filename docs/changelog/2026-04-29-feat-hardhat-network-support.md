# Changelog - 2026-04-29

## 任务信息
- **类型**: FEAT
- **主题**: 添加 Hardhat 本地网络支持
- **Pipeline**: origin -> check-in -> pipeline(FEAT) -> coder -> qa -> changelog -> update-map
- **完成时间**: 2026-04-29 13:05

## 架构设计

### 目标
为项目添加本地 Hardhat 网络支持（chainId: 31337），使开发者能够在本地开发环境中进行智能合约调试、钱包连接、转账签名等操作。

### 模块边界
- **修改模块**:
  - `packages/web3-tools/src/types.ts` - 扩展 EvmChainId 类型
  - `packages/web3-tools/src/chains/config.ts` - 添加 Hardhat 链配置
  - `packages/web3-tools/src/transfer.ts` - 添加 Hardhat Chain 映射
  - `apps/web/app/config.ts` - wagmi 配置添加 Hardhat 链
  - `apps/web/components/cards/TransferCard.tsx` - 支持 Hardhat 网络展示
  - `apps/web/.env.example` - 添加环境变量模板

### 接口契约

#### 类型扩展
```typescript
// packages/web3-tools/src/types.ts
export type EvmChainId = 'ethereum' | 'polygon' | 'bsc' | 'hardhat'
```

#### 链配置
```typescript
// packages/web3-tools/src/chains/config.ts
hardhat: {
  id: 'hardhat',
  name: 'Hardhat',
  nativeToken: 'ETH',
  chainId: 31337,
  rpcUrls: ['http://127.0.0.1:8545'],
  explorerUrl: '', // 本地网络无浏览器
}
```

#### wagmi 配置
```typescript
// apps/web/app/config.ts
const hardhat = defineChain({
  id: 31337,
  name: 'Hardhat',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_HARDHAT_RPC_URL || 'http://127.0.0.1:8545'] },
    public: { http: [process.env.NEXT_PUBLIC_HARDHAT_RPC_URL || 'http://127.0.0.1:8545'] },
  },
})
```

### 数据流/状态流
1. **前端网络切换**: RainbowKit 网络选择器 -> wagmi switchChain -> Hardhat (31337)
2. **余额查询**: AI Agent -> web3-tools getBalance('hardhat', address) -> Hardhat RPC -> 返回余额
3. **转账流程**: TransferCard -> wagmi sendTransaction -> MetaMask 签名 -> Hardhat 本地网络

### 风险点
- **RPC 可用性**: Hardhat 节点需本地运行，默认 http://127.0.0.1:8545
- **无区块浏览器**: 本地网络无 explorerUrl，TransferCard 不显示交易链接
- **测试网区分**: 仅支持 Hardhat，不支持其他本地网络（如 Foundry/Anvil）

## 变更详情

### 新增
- `hardhat` 链类型（EvmChainId 扩展）
- Hardhat 链配置（chainId: 31337）
- wagmi Hardhat 链定义（defineChain）
- `NEXT_PUBLIC_HARDHAT_RPC_URL` 环境变量支持

### 修改
- `packages/web3-tools/src/types.ts` - EvmChainId 添加 'hardhat'
- `packages/web3-tools/src/chains/config.ts` - CHAIN_CONFIGS 和 DEFAULT_RPC_URLS 添加 hardhat
- `packages/web3-tools/src/transfer.ts` - CHAIN_MAP 添加 hardhatChain 映射
- `apps/web/app/config.ts` - chains 数组和 transports 添加 hardhat
- `apps/web/components/cards/TransferCard.tsx` - CHAIN_CONFIGS 添加 hardhat 展示配置
- `apps/web/.env.example` - 添加 NEXT_PUBLIC_HARDHAT_RPC_URL 配置项

### 删除
- 无

### 修复
- 修复 transfer.ts 类型错误（CHAIN_MAP 缺少 hardhat 映射）

## 影响范围

- **影响模块**: 
  - `packages/web3-tools/` - Web3 工具包（类型、配置、转账工具）
  - `apps/web/` - 前端应用（wagmi 配置、TransferCard 组件、环境变量）
  
- **破坏性变更**: 否
- **需要迁移**: 否
- **向后兼容**: 是（现有链配置不受影响）

## 代码统计

- **新增文件**: 0 个
- **修改文件**: 6 个
- **新增代码**: ~45 行
- **测试状态**: 74/74 tests passed
- **类型检查**: 通过

## 上下文标记

**关键词**: Hardhat,本地网络,chainId 31337,wagmi,RainbowKit,web3-tools,转账,余额查询,本地开发
**相关文档**: 
- `docs/checklist/PROJECT-CHECKLIST.md` - 项目清单
- `docs/changelog/2026-04-22-feat-multichain-web3-tools.md` - 多链架构原始设计

**后续建议**:
1. 考虑添加 Foundry/Anvil 支持（chainId 也不同）
2. 可添加本地网络自动检测逻辑（检测 127.0.0.1:8545 是否可用）
3. 考虑为 Hardhat 添加测试账户预导入功能（RainbowKit 连接时自动导入测试账户）
4. 可添加本地网络专属 UI 标识（如"本地开发模式"徽章）
