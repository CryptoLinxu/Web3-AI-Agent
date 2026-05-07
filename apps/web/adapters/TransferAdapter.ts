/**
 * 转账适配器接口定义
 * 
 * 定义统一的转账适配器抽象类，屏蔽不同链的转账差异
 * EVM 和 Solana 各自实现此接口
 */

/**
 * 网络配置
 */
export interface NetworkConfig {
  id: string;
  name: string;
  nativeCurrency: {
    symbol: string;
    decimals: number;
  };
}

/**
 * 转账参数
 */
export interface TransferParams {
  /** 接收地址 */
  toAddress: string;
  /** 转账金额（字符串格式，如 "1.5"） */
  amount: string;
  /** Token 合约地址或 Mint Address（原生代币时为空） */
  token?: string;
}

/**
 * 转账回执
 */
export interface TransferReceipt {
  /** 交易哈希 */
  txHash: string;
  /** 交易状态 */
  status: 'success' | 'failed' | 'pending';
  /** 区块号（可选） */
  blockNumber?: number;
  /** 错误信息（失败时） */
  error?: string;
}

/**
 * Gas/费用估算
 */
export interface FeeEstimate {
  /** 费用金额（字符串格式） */
  fee: string;
  /** 费用单位（如 "ETH", "SOL"） */
  unit: string;
}

/**
 * 转账适配器抽象类
 * 
 * 所有链的转账实现都必须继承此类
 */
export abstract class TransferAdapter {
  /**
   * 获取当前网络 ID
   */
  abstract getNetworkId(): string;

  /**
   * 获取支持的网络列表
   */
  abstract getNetworks(): NetworkConfig[];

  /**
   * 获取余额
   * @param address 钱包地址
   * @param token Token 合约地址（原生代币时为空）
   * @returns 余额字符串
   */
  abstract getBalance(address: string, token?: string): Promise<string>;

  /**
   * 发送转账交易
   * @param params 转账参数
   * @returns 交易回执
   */
  abstract sendTransfer(params: TransferParams): Promise<TransferReceipt>;

  /**
   * 估算交易费用
   * @param params 转账参数
   * @returns 费用估算
   */
  abstract estimateFee(params: TransferParams): Promise<FeeEstimate>;

  /**
   * 验证地址格式
   * @param address 地址
   * @returns 是否有效
   */
  abstract validateAddress(address: string): boolean;
}
