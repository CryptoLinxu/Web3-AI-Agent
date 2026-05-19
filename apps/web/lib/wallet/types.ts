/**
 * 钱包抽象层类型定义
 * 
 * 定义统一的钱包接口，屏蔽 EVM 和 Solana 的差异
 * 为上层提供一致的钱包操作 API
 */

/**
 * 链类型
 */
export type ChainType = 'evm' | 'solana';

/**
 * 统一钱包状态
 */
export interface UnifiedWalletState {
  /** 当前连接的链类型 */
  chain: ChainType;
  /** 钱包地址（EVM: 0x... / Solana: Base58） */
  address: string;
  /** 是否已连接 */
  connected: boolean;
  /** EVM chainId（仅 EVM 有效） */
  chainId?: number;
  /** Solana networkId（仅 Solana 有效） */
  networkId?: string;
}

/**
 * 统一钱包操作
 */
export interface UnifiedWalletActions {
  /** 断开钱包连接 */
  disconnect(): Promise<void>;
}

/**
 * 统一钱包上下文（状态 + 操作）
 */
export type UnifiedWalletContext = UnifiedWalletState & UnifiedWalletActions;

/**
 * 通用钱包接口（用于更底层的钱包适配器）
 */
export interface UniversalWallet {
  readonly chain: ChainType;
  
  /** 连接钱包 */
  connect(): Promise<void>;
  /** 断开连接 */
  disconnect(): Promise<void>;
  /** 获取地址 */
  getAddress(): string;
  /** 签名消息 */
  signMessage(message: string): Promise<string>;
  
  /** 是否已连接 */
  isConnected(): boolean;
  /** 获取链 ID（EVM: number / Solana: string） */
  getChainId(): number | string;
}
