# Token 图标修复与 TransferCard 网络展示模式重构 复盘

## 本轮完成了什么

1. **Token 图标加载修复**
   - 给 `<Image>` 组件添加 `unoptimized` 属性，彻底绕过 Next.js 图片优化管道和 `remotePatterns` 白名单验证
   - `next.config.js` 保留 `remotePatterns` 白名单（assets.coingecko.com + cdn.jsdelivr.net）作为防御性配置
   - 本币图标改为按 `tokenSymbol.toUpperCase()` 映射（ETH/MATIC/POL/BNB 各自独立图标）

2. **网络切换功能 → 回退为纯文本展示**
   - 最初实现了完整的链选择器 UI（下拉菜单、选中勾号、颜色标识）+ CHAIN_CONFIGS 注册表
   - 用户要求取消网络联动后，回退为纯文本展示 `CHAIN_CONFIGS[data.chain]?.name`
   - 链配置注册表 `CHAIN_CONFIGS` 保留（取代旧的 `EXPLORER_URLS` + `CHAIN_NAMES` 分散配置）

3. **wagmi 配置扩展**
   - `app/config.ts` 新增 `polygon` 和 `bsc` 链，配置了 llama RPC 公共节点

4. **Token 配置扩展**
   - `lib/tokens.ts` 新增 polygon 和 bsc 网络的 USDT/USDC 合约地址和图标

5. **Audit 问题修复**
   - 移除 `useSwitchChain` 依赖（不再需要自动切换钱包链）
   - 链不匹配时仅显示错误提示，由用户通过 RainbowKit 手动切换
   - 清理 `CHAIN_LIST` 死代码

## 遇到了什么问题

1. **CoinGecko CDN 国内超时**：`ConnectTimeoutError`（173.252.108.21:443）根本无法连接，jsdelivr 方案被用户回滚，最终通过 `unoptimized` 绕过了 Next.js 的图片优化强制校验

2. **Next.js remotePatterns 缓存不生效**：修改 `next.config.js` 后必须 `Stop-Process node + Remove-Item .next` 才能生效，仅重启 dev server 不够

3. **新增文件 git 无法回滚**：`lib/tokens.ts` 未跟踪，`git checkout` 无法恢复，需手动删除

4. **需求来回摇摆**：网络切换功能完整的 UI 和状态管理都实现了，用户又要求回退为纯展示，导致多次重写

5. **`switchChain` vs `switchChainAsync` 混淆**：两者返回值不同，同步函数被 `await` 调用，catch 永远不会触发

## 学到了什么

1. **`unoptimized` 是 Next.js 外部图片的终极方案**：比配置 `remotePatterns` 更彻底，绕过所有优化管道和白名单验证
2. **next.config.js 缓存陷阱**：修改图片配置后必须清除 `.next` 缓存，不能只靠热更新
3. **wagmi `switchChain` 是同步触发**：不返回 Promise，不能 `await`；`switchChainAsync` 才返回 Promise
4. **多链架构的配置集中化**：`CHAIN_CONFIGS` 注册表模式比分散的 `EXPLORER_URLS` + `CHAIN_NAMES` 更易维护，扩展新链只需加一项
5. **新增文件 git 管理**：`git checkout` 只能恢复已跟踪文件，新文件需 `rm` 或手动还原

## 仍未解决的问题

1. **ERC20 approve 流程仍为 TODO**：TransferCard 中直接调用 `transfer` 函数，如果 allowance 不足会失败
2. **BNB 图标使用 `raw.githubusercontent.com`**：未在 `remotePatterns` 白名单中，但有 `unoptimized` 保护
3. **`raw.githubusercontent.com` 国内访问稳定性**：未验证，可能也会超时
4. **`CHAIN_CONFIGS.iconColor` 和 `nativeToken` 字段暂时未使用**：保留了配置结构，待后续 UI 增强时使用

## 下一步建议

1. 验证 polygon/bsc 网络的 Token 转账流程（RPC 连通性、合约交互）
2. 实现 ERC20 approve 流程（`useWriteContract` 先调用 `approve`）
3. 如果需要更多网络（Arbitrum、Optimism、Avalanche），只需在 `CHAIN_CONFIGS` + `TOKENS` 中各加一条
4. 考虑将 `raw.githubusercontent.com` 加入 `remotePatterns`
