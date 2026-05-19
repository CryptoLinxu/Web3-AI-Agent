# 2026-05-07 feat-wallet-ui-optimization

## 任务基本信息

- **类型**: FEAT
- **主题**: 优化钱包连接弹窗UI与双主题适配
- **Commit**: `be80246`
- **分支**: `solana-transfer`
- **Pipeline**: 完整 UI/UX 优化

## 架构设计内容

### 设计目标
1. 简化钱包连接流程，去除多余的中间步骤
2. 完善双主题样式隔离，确保浅色/深色主题独立且专业
3. 提升用户体验，优化交互细节和视觉效果

### 技术方案
- **EVM钱包**: 使用隐藏的 `ConnectButton.Custom` 组件获取 `openConnectModal` 函数，点击后直接触发 RainbowKit
- **Solana钱包**: 直接渲染钱包列表组件，使用 `useWallet` hook 获取可用钱包
- **双主题隔离**: 所有样式使用 `dark:` 前缀分离，浅色主题使用具体颜色值，深色主题使用深色系
- **光晕效果**: 弹窗四周使用双色 shadow（紫色 + 青色）与黑色背景区分

## 变更详情

### 新增文件
1. **`apps/web/components/SolanaWalletList.tsx`**
   - Solana 钱包列表组件
   - 直接展示可用钱包，支持点击连接
   - 双主题样式适配

2. **`apps/web/components/EVMWalletList.tsx`**
   - EVM 钱包列表组件（备用，未在当前流程中使用）

### 修改文件
1. **`apps/web/components/UnifiedWalletModal.tsx`**
   - 重构弹窗结构：双层遮罩（外层固定定位 + 内层绝对定位）
   - EVM 选项：点击直接触发 RainbowKit（去除中间步骤）
   - Solana 选项：显示钱包列表（去除中间步骤）
   - 浅色主题：白色背景 + 紫色/青色卡片 + 深色文本
   - 深色主题：深灰背景 + 深灰卡片 + 白色文本 + 彩色光晕
   - 图标更新：EVM 使用标准菱形，Solana 使用三条平行四边形

2. **`apps/web/components/UnifiedWalletButton.tsx`**
   - 优化已连接状态显示
   - 断开按钮专业化：红色危险操作样式
   - 添加断开图标（SVG）
   - Hover 效果：红色光晕和文字颜色变化
   - 添加 `aria-label` 提升可访问性

3. **`apps/web/adapters/solana/SolanaAdapter.ts`**
   - 优化 RPC 配置
   - 改进交易流程

4. **`apps/web/app/api/chat/route.ts`**
   - 适配新的钱包连接流程

5. **`apps/web/components/cards/SolanaTransferCard.tsx`**
   - UI 优化和样式调整

6. **`apps/web/config/solana-chains.ts`**
   - Solana 链配置优化

7. **`apps/web/.env.example`**
   - 添加 Solana RPC 配置示例

### 删除内容
- 去除 EVM 钱包的中间选择步骤
- 去除 Solana 钱包的中间选择步骤

### 修复问题
- 修复浅色主题下弹窗样式被深色主题覆盖的问题
- 修复弹窗背景与页面背景区分度不足的问题
- 修复断开按钮样式过于朴素的问题
- 修复 Solana 图标形状不准确的问题

## 影响范围

### 破坏性变更
无

### 迁移需求
无

### 向后兼容
✅ 完全兼容，仅 UI 优化

## 上下文标记

### 关键词
- 钱包连接
- UI/UX 优化
- 双主题适配
- RainbowKit
- Solana Wallet Adapter
- 弹窗设计

### 相关文档
- [钱包连接功能修复相关文件](../checklist/PROJECT-CHECKLIST.md)
- [浅色模式主题样式系统化改造](../changelog/README.md)

### 设计决策
1. **直接触发 vs 中间步骤**: 去除中间选择步骤，提升用户体验
2. **双主题隔离**: 使用 `dark:` 前缀严格分离，修改一个主题不影响另一个
3. **图标选择**: EVM 使用以太坊官方菱形标志，Solana 使用三条平行四边形

### 后续建议
1. 考虑为 EVM 钱包列表添加自定义组件（当前直接使用 RainbowKit）
2. 优化 Solana 图标的 SVG 路径，使其更接近官方标志
3. 添加钱包连接动画效果提升体验

## 统计数据

- **修改文件**: 7 个
- **新增文件**: 2 个
- **代码变更**: +267 / -68 行
- **主要模块**: UI 组件、钱包适配器、配置
