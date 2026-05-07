-- ============================================
-- 迁移脚本：扩展 wallet_address 字段长度 + 支持 Solana
-- 日期：2026-05-07
-- ============================================

-- 1. 删除 conversations 表的所有 RLS 策略
DROP POLICY IF EXISTS "conversations_select_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_delete_policy" ON conversations;

-- 2. 删除 messages 表的所有 RLS 策略（避免级联依赖）
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON messages;

-- 3. 修改 conversations 表的 wallet_address 字段
ALTER TABLE conversations 
  ALTER COLUMN wallet_address TYPE VARCHAR(44);

-- 4. 重建 conversations 表的 RLS 策略
CREATE POLICY "conversations_select_policy" 
  ON conversations FOR SELECT 
  USING (true);

CREATE POLICY "conversations_insert_policy" 
  ON conversations FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "conversations_update_policy" 
  ON conversations FOR UPDATE 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "conversations_delete_policy" 
  ON conversations FOR DELETE 
  USING (true);

-- 5. 重建 messages 表的 RLS 策略
CREATE POLICY "messages_select_policy" 
  ON messages FOR SELECT 
  USING (true);

CREATE POLICY "messages_insert_policy" 
  ON messages FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "messages_update_policy" 
  ON messages FOR UPDATE 
  USING (true);

CREATE POLICY "messages_delete_policy" 
  ON messages FOR DELETE 
  USING (true);

-- 6. 更新字段注释
COMMENT ON COLUMN conversations.wallet_address IS '钱包地址（EVM: 0x 开头 42 字符; Solana: Base58 编码 32-44 字符）';

-- 7. 更新 transfer_cards 表的 chain 字段注释
COMMENT ON COLUMN transfer_cards.chain IS '区块链（EVM: ethereum, polygon, bsc; Solana: solana）';

-- 验证修改结果
-- SELECT column_name, data_type, character_maximum_length 
-- FROM information_schema.columns 
-- WHERE table_name = 'conversations' AND column_name = 'wallet_address';
