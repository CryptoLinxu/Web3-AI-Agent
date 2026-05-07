/**
 * 地址格式校验工具
 * 
 * 验证不同链的地址格式是否正确
 */

/**
 * 验证 EVM 地址格式
 * EVM 地址：0x 开头 + 40 位十六进制字符（共 42 位）
 */
export function isValidEVMAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * 验证 Solana 地址格式
 * Solana 地址：Base58 编码，32-44 位字符
 * Base58 字符集：123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
 */
export function isValidSolanaAddress(address: string): boolean {
  // Base58 字符集（不包含 0, O, I, l）
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

/**
 * 通用地址验证（根据链类型）
 */
export function validateAddress(address: string, chain: 'evm' | 'solana'): {
  valid: boolean;
  error?: string;
} {
  if (!address || address.trim() === '') {
    return {
      valid: false,
      error: '地址不能为空',
    };
  }

  if (chain === 'evm') {
    if (!isValidEVMAddress(address)) {
      return {
        valid: false,
        error: '无效的 EVM 地址格式（应为 0x 开头的 40 位十六进制）',
      };
    }
  }

  if (chain === 'solana') {
    if (!isValidSolanaAddress(address)) {
      return {
        valid: false,
        error: '无效的 Solana 地址格式（Base58 编码，32-44 位字符）',
      };
    }
  }

  return { valid: true };
}
