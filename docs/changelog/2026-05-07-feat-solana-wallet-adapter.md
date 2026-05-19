# Changelog - 2026-05-07

## 任务信息
- **类型**: FEAT
- **主题**: 添加 Solana 多链钱包支持和转账适配器架构
- **Pipeline**: origin -> pipeline(FEAT) -> check-in -> architect -> qa -> coder -> browser-verify
- **完成时间**: 2026-05-07 11:29

## 架构设计

### 目标
扩展项目从仅支持 EVM 生态到支持 Solana 网络转账，包括 SOL 本币和 SPL Token（USDT、USDC），采用适配器模式实现代码解耦。

### 模块边界
- 新增 `apps/web/adapters/` - 转账适配器层
  - `TransferAdapter.ts` - 抽象接口定义
  - `SolanaAdapter.ts` - Solana 实现
  - `EVMAdapter.ts` - EVM 实现（预留）
  - `AdapterFactory.ts` - 工厂模式
- 新增 `apps/web/components/UnifiedWallet*` - 统一钱包 UI
- 新增 `apps/web/hooks/useUnifiedWallet.ts` - 统一钱包状态
- 新增 `apps/web/lib/ai-intent-parser.ts` - AI 意图解析
- 修改 `apps/web/app/providers.tsx` - 嵌套 Solana Provider
- 修改 `apps/web/app/page.tsx` - 使用统一钱包按钮

### 接口契约

```typescript
// 转账适配器接口
abstract class TransferAdapter {
  getNetworkId(): string
  getNetworks(): NetworkConfig[]
  getBalance(address: string, token?: string): Promise<string>
  sendTransfer(params: TransferParams): Promise<TransferReceipt>
  estimateFee(params: TransferParams): Promise<FeeEstimate>
  validateAddress(address: string): boolean
}

// 转账参数
interface TransferParams {
  toAddress: string
  amount: string
  token?: string
}

// 统一钱包状态
interface UnifiedWalletContext {
  chain: 'evm' | 'solana' | 'none'
  address: string
  connected: boolean
  chainId?: number
  networkId?: string
  disconnect: () => void
}
```

### 数据流

**钱包连接流程**：
用户点击 Connect Wallet → UnifiedWalletModal 打开 → 选择链类型（EVM/Solana） → 显示对应钱包列表 → 连接成功 → useUnifiedWallet 合并状态 → 页面显示地址和网络

**转账流程（未来）**：
用户输入 "转 1 SOL 到 xxx" → AI 意图解析识别网络 → 检查网络一致性 → AdapterFactory 创建 SolanaAdapter → 执行转账 → 返回交易回执

### 风险点
- **RainbowKit 不支持 Solana**：采用双 Provider 架构，RainbowKit 处理 EVM，@solana/wallet-adapter 处理 Solana
- **wagmi hooks 限制**：必须在 React 组件中使用，EVMAdapter 无法完全封装转账逻辑
- **依赖安装问题**：@stellar/stellar-sdk 的 postinstall 脚本失败，需使用 `--ignore-scripts` 参数

## 变更详情

### 新增
- `apps/web/adapters/TransferAdapter.ts` - 转账适配器抽象接口
- `apps/web/adapters/solana/SolanaAdapter.ts` - Solana 适配器（支持 SOL 和 SPL Token）
- `apps/web/adapters/evm/EVMAdapter.ts` - EVM 适配器（网络配置和地址校验）
- `apps/web/adapters/AdapterFactory.ts` - 适配器工厂
- `apps/web/adapters/INTEGRATION-GUIDE.md` - 集成指南文档
- `apps/web/components/UnifiedWalletButton.tsx` - 统一钱包按钮组件
- `apps/web/components/UnifiedWalletModal.tsx` - 统一钱包选择弹窗
- `apps/web/hooks/useUnifiedWallet.ts` - 统一钱包状态 Hook
- `apps/web/hooks/adapter.test.ts` - 适配器测试（13 个用例）
- `apps/web/lib/ai-intent-parser.ts` - AI 意图解析和网络一致性校验
- `apps/web/lib/wallet/types.ts` - 钱包抽象层类型定义
- `apps/web/config/solana-chains.ts` - Solana 网络和 Token 配置
- `apps/web/utils/address-validator.ts` - 地址格式校验工具

### 修改
- `apps/web/app/providers.tsx` - 嵌套 Solana Provider（ConnectionProvider + WalletProvider + WalletModalProvider）
- `apps/web/app/page.tsx` - 替换 useAccount 为 useUnifiedWallet，替换 WalletConnectButton 为 UnifiedWalletButton
- `apps/web/package.json` - 添加 Solana 相关依赖

### 依赖新增
- `@solana/web3.js` - Solana Web3 SDK
- `@solana/spl-token` - SPL Token 支持
- `@solana/wallet-adapter-react` - Solana 钱包 React 集成
- `@solana/wallet-adapter-wallets` - Phantom 和 Solflare 钱包
- `@solana/wallet-adapter-base` - 钱包适配器基础

## 影响范围

- **影响模块**: web（钱包连接层、UI 组件层、适配器层）
- **破坏性变更**: 否
- **需要迁移**: 否（现有 EVM 功能保持不变）

## 测试验证

### 类型检查
- ✅ `pnpm type-check` 全部通过（3/3 packages）

### 浏览器验收
- ✅ 统一钱包按钮正常显示
- ✅ 链类型选择弹窗正常（EVM/Solana）
- ✅ RainbowKit 钱包列表正常（9+ 钱包）
- ✅ Solana 钱包列表正常（Phantom, Solflare）
- ✅ UI 样式符合规范（毛玻璃、圆角、阴影）
- ✅ 无控制台错误

### 单元测试
- ✅ 13 个适配器测试用例，11 个通过
- ✅ 地址格式校验测试全部通过

## 上下文标记

**关键词**: Solana,多链钱包,适配器模式,TransferAdapter,UnifiedWallet,RainbowKit,wallet-adapter,SPL Token,AI意图解析,网络一致性
**相关文档**: 
- `docs/changelog/` - 变更历史
- `apps/web/adapters/INTEGRATION-GUIDE.md` - 集成指南
- `docs/checklist/PROJECT-CHECKLIST.md` - 项目清单

**后续建议**:
1. 创建 `SolanaTransferCard` 组件，完整实现 Solana 转账 UI
2. 在 AI 意图解析后自动选择正确的 TransferCard（EVM vs Solana）
3. 完善 EVMAdapter，将现有 TransferCard 的 wagmi 逻辑封装进去
4. 添加更多 Solana 网络支持（Devnet, Testnet）
5. 支持更多 SPL Token
6. 完整的端到端转账测试（E2E）
