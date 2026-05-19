/**
 * 转账适配器测试
 * 
 * 验证适配器接口和地址校验工具的正确性
 */

import { describe, it, expect } from 'vitest';
import { validateAddress, isValidEVMAddress, isValidSolanaAddress } from '@/utils/address-validator';
import { AdapterFactory } from '@/adapters/AdapterFactory';

describe('地址格式校验', () => {
  describe('EVM 地址校验', () => {
    it('应该验证正确的 EVM 地址', () => {
      const validAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f5eE2B'; // 42 位
      expect(isValidEVMAddress(validAddress)).toBe(true);
    });

    it('应该拒绝错误的 EVM 地址', () => {
      const invalidAddress = '0x123';
      expect(isValidEVMAddress(invalidAddress)).toBe(false);
    });

    it('应该拒绝不带 0x 前缀的地址', () => {
      const invalidAddress = '742d35Cc6634C0532925a3b844Bc9e7595f5eE2B';
      expect(isValidEVMAddress(invalidAddress)).toBe(false);
    });
  });

  describe('Solana 地址校验', () => {
    it('应该验证正确的 Solana 地址', () => {
      // Phantom 钱包示例地址
      const validAddress = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
      expect(isValidSolanaAddress(validAddress)).toBe(true);
    });

    it('应该拒绝过短的 Solana 地址', () => {
      const invalidAddress = '7xKXtg2CW87d97TXJ';
      expect(isValidSolanaAddress(invalidAddress)).toBe(false);
    });

    it('应该拒绝包含非法字符的地址', () => {
      // 包含 0 和 O（Base58 不允许）
      const invalidAddress = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAs0';
      expect(isValidSolanaAddress(invalidAddress)).toBe(false);
    });
  });

  describe('通用地址验证', () => {
    it('应该验证 EVM 地址', () => {
      const result = validateAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f5eE2B', 'evm');
      expect(result.valid).toBe(true);
    });

    it('应该验证 Solana 地址', () => {
      const result = validateAddress('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 'solana');
      expect(result.valid).toBe(true);
    });

    it('应该返回错误信息当地址为空', () => {
      const result = validateAddress('', 'evm');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('地址不能为空');
    });

    it('应该返回错误信息当 EVM 地址格式错误', () => {
      const result = validateAddress('0x123', 'evm');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('无效的 EVM 地址格式');
    });

    it('应该返回错误信息当 Solana 地址格式错误', () => {
      const result = validateAddress('invalid', 'solana');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('无效的 Solana 地址格式');
    });
  });
});

describe('适配器工厂', () => {
  it('应该返回支持的网络列表', () => {
    const networks = AdapterFactory.getSupportedNetworks();
    expect(networks).toContain('solana-mainnet');
  });

  it('应该正确判断网络是否支持', () => {
    expect(AdapterFactory.isNetworkSupported('solana-mainnet')).toBe(true);
    expect(AdapterFactory.isNetworkSupported('evm-1')).toBe(false);
  });
});
