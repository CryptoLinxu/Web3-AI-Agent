/**
 * Solana 转账适配器实现
 * 
 * 实现 TransferAdapter 接口，提供 Solana 网络的转账功能
 * 支持 SOL 原生代币和 SPL Token（USDT、USDC）
 */

import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, getMint, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  TransferAdapter,
  NetworkConfig,
  TransferParams,
  TransferReceipt,
  FeeEstimate,
} from '../TransferAdapter';
import { SOLANA_CONFIG, SOLANA_TOKENS } from '@/config/solana-chains';
import { isValidSolanaAddress } from '@/utils/address-validator';

/**
 * Solana 转账适配器
 */
export class SolanaAdapter extends TransferAdapter {
  private connection: Connection;
  private wallet: ReturnType<typeof useWallet>;

  constructor(wallet: ReturnType<typeof useWallet>) {
    super();
    this.wallet = wallet;
    // 使用 HTTP 连接，禁用 WebSocket（公共 RPC 不支持）
    this.connection = new Connection(SOLANA_CONFIG.mainnet.endpoint, {
      commitment: 'confirmed',
      wsEndpoint: undefined, // 禁用 WebSocket
    });
  }

  /**
   * 获取当前网络 ID
   */
  getNetworkId(): string {
    return SOLANA_CONFIG.mainnet.id;
  }

  /**
   * 获取支持的网络列表
   */
  getNetworks(): NetworkConfig[] {
    return [
      {
        id: SOLANA_CONFIG.mainnet.id,
        name: SOLANA_CONFIG.mainnet.name,
        nativeCurrency: SOLANA_CONFIG.mainnet.nativeCurrency,
      },
    ];
  }

  /**
   * 获取余额
   * @param address 钱包地址
   * @param token Mint Address（SPL Token 时传入，原生 SOL 时为空）
   */
  async getBalance(address: string, token?: string): Promise<string> {
    const publicKey = new PublicKey(address);

    if (!token) {
      // SOL 原生代币余额
      const balance = await this.connection.getBalance(publicKey);
      return (balance / LAMPORTS_PER_SOL).toString();
    } else {
      // SPL Token 余额
      const mintAddress = new PublicKey(token);
      const associatedToken = await getAssociatedTokenAddress(mintAddress, publicKey);
      
      try {
        const balance = await this.connection.getTokenAccountBalance(associatedToken);
        return balance.value.uiAmount?.toString() || '0';
      } catch {
        return '0'; // 代币账户不存在时余额为 0
      }
    }
  }

  /**
   * 发送转账交易
   */
  async sendTransfer(params: TransferParams): Promise<TransferReceipt> {
    try {
      if (!this.wallet.publicKey) {
        throw new Error('钱包未连接');
      }

      // 验证地址格式
      if (!isValidSolanaAddress(params.toAddress)) {
        throw new Error('无效的 Solana 地址格式');
      }

      const toPublicKey = new PublicKey(params.toAddress);
      const fromPublicKey = this.wallet.publicKey;

      let transaction: Transaction;

      if (!params.token) {
        // SOL 原生转账
        transaction = await this.createSOLTransfer(fromPublicKey, toPublicKey, params.amount);
      } else {
        // SPL Token 转账
        transaction = await this.createSPLTokenTransfer(
          fromPublicKey,
          toPublicKey,
          params.token,
          params.amount
        );
      }

      // 发送交易
      const signature = await this.wallet.sendTransaction(transaction, this.connection);
      
      // 等待确认
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        return {
          txHash: signature,
          status: 'failed',
          error: '交易确认失败',
        };
      }

      return {
        txHash: signature,
        status: 'success',
      };
    } catch (error: any) {
      return {
        txHash: '',
        status: 'failed',
        error: error.message || '转账失败',
      };
    }
  }

  /**
   * 估算交易费用
   */
  async estimateFee(params: TransferParams): Promise<FeeEstimate> {
    // Solana 费用相对固定，约为 0.000005 SOL
    const baseFee = 0.000005;
    
    // SPL Token 需要创建关联账户，费用略高
    const tokenFee = params.token ? 0.002 : 0; // 可能需要的账户创建费用
    
    return {
      fee: (baseFee + tokenFee).toString(),
      unit: 'SOL',
    };
  }

  /**
   * 验证地址格式
   */
  validateAddress(address: string): boolean {
    return isValidSolanaAddress(address);
  }

  /**
   * 创建 SOL 转账交易
   */
  private async createSOLTransfer(
    fromPubkey: PublicKey,
    toPubkey: PublicKey,
    amount: string
  ): Promise<Transaction> {
    const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      })
    );

    // 设置最近区块哈希
    const latestBlockhash = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.feePayer = fromPubkey;

    return transaction;
  }

  /**
   * 创建 SPL Token 转账交易
   */
  private async createSPLTokenTransfer(
    fromPubkey: PublicKey,
    toPubkey: PublicKey,
    mintAddress: string,
    amount: string
  ): Promise<Transaction> {
    const mint = new PublicKey(mintAddress);
    
    // 获取 Mint 信息以确定精度
    const mintInfo = await getMint(this.connection, mint);
    const decimals = mintInfo.decimals;
    
    // 计算实际转账数量（考虑精度）
    const rawAmount = BigInt(Math.floor(parseFloat(amount) * 10 ** decimals));

    // 获取发送方和接收方的关联代币账户
    const fromTokenAccount = await getAssociatedTokenAddress(mint, fromPubkey);
    const toTokenAccount = await getAssociatedTokenAddress(mint, toPubkey);

    const transaction = new Transaction();

    // 检查接收方的 ATA 是否存在
    const toTokenAccountInfo = await this.connection.getAccountInfo(toTokenAccount);
    
    // 如果不存在，需要先创建 ATA
    if (!toTokenAccountInfo) {
      console.log('[SolanaAdapter] 接收方 ATA 不存在，创建中...', toTokenAccount.toBase58());
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromPubkey, // 支付租金的账户
          toTokenAccount, // 新的 ATA 地址
          toPubkey, // 接收方钱包
          mint // Mint 地址
        )
      );
    }

    // 添加转账指令
    transaction.add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromPubkey,
        rawAmount
      )
    );

    // 设置最近区块哈希
    const latestBlockhash = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.feePayer = fromPubkey;

    return transaction;
  }
}
