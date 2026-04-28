-- ============================================
-- 生产环境 RLS 升级
-- 从应用层防护 → 数据库层 + 服务端 API 双重防护
-- ============================================

-- 说明：
-- 1. 删除操作已迁移到服务端 API（/api/supabase/delete-conversation）
--    使用 service_role 密钥执行，完全绕过 RLS
-- 2. 前端直接调用 Supabase 的 SELECT/INSERT/UPDATE 仍受应用层 protect
-- 3. 生产环境建议所有操作都通过服务端 API 代理

-- ============================================
-- Step 1: 删除旧的宽松策略
-- ============================================

-- conversations 表
DROP POLICY IF EXISTS "Enable read access for all users" ON conversations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON conversations;
DROP POLICY IF EXISTS "Enable update for users based on wallet_address" ON conversations;
DROP POLICY IF EXISTS "Enable delete for users based on wallet_address" ON conversations;

-- messages 表
DROP POLICY IF EXISTS "Enable read access for all users" ON messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON messages;
DROP POLICY IF EXISTS "Enable update for users based on conversation" ON messages;
DROP POLICY IF EXISTS "Enable delete for users based on conversation" ON messages;

-- transfer_cards 表（如果存在）
DROP POLICY IF EXISTS "Allow all operations for development" ON transfer_cards;
DROP POLICY IF EXISTS "Users can view own transfer cards" ON transfer_cards;
DROP POLICY IF EXISTS "Users can insert own transfer cards" ON transfer_cards;
DROP POLICY IF EXISTS "Users can update own transfer cards" ON transfer_cards;

-- ============================================
-- Step 2: 创建新的 RLS 策略
-- ============================================

-- conversations 表策略
-- SELECT: 应用层通过 wallet_address 过滤，RLS 允许所有读取
-- INSERT: 应用层保证 wallet_address 正确，RLS 放行
-- UPDATE: 同 INSERT
-- DELETE: 严格模式，需要会话变量匹配（服务端 API 绕过 RLS 执行删除）
--         前端直接调用将因无法设置会话变量而被 RLS 拦截

CREATE POLICY "conversations_select_policy"
  ON conversations FOR SELECT
  USING (true);  -- 应用层通过 wallet_address 过滤

CREATE POLICY "conversations_insert_policy"
  ON conversations FOR INSERT
  WITH CHECK (true);  -- 应用层保证 wallet_address 正确

CREATE POLICY "conversations_update_policy"
  ON conversations FOR UPDATE
  USING (true)
  WITH CHECK (true);  -- 应用层验证所有权

CREATE POLICY "conversations_delete_policy"
  ON conversations FOR DELETE
  USING (
    wallet_address = current_setting('app.current_wallet_address', true)
  );  -- 需要会话变量，仅服务端 API 可执行

-- messages 表策略
CREATE POLICY "messages_select_policy"
  ON messages FOR SELECT
  USING (true);  -- 应用层通过 conversation_id 过滤

CREATE POLICY "messages_insert_policy"
  ON messages FOR INSERT
  WITH CHECK (true);  -- 应用层保证关联正确

CREATE POLICY "messages_update_policy"
  ON messages FOR UPDATE
  USING (true);

CREATE POLICY "messages_delete_policy"
  ON messages FOR DELETE
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE wallet_address = current_setting('app.current_wallet_address', true)
    )
  );  -- 级联删除保护，仅服务端 API 可执行

-- transfer_cards 表策略（如已存在）
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transfer_cards') THEN
    ALTER TABLE transfer_cards ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "transfer_cards_select_policy"
      ON transfer_cards FOR SELECT
      USING (true);

    CREATE POLICY "transfer_cards_insert_policy"
      ON transfer_cards FOR INSERT
      WITH CHECK (true);

    CREATE POLICY "transfer_cards_update_policy"
      ON transfer_cards FOR UPDATE
      USING (true);

    CREATE POLICY "transfer_cards_delete_policy"
      ON transfer_cards FOR DELETE
      USING (true);
  END IF;
END $$;

-- ============================================
-- Step 3: 验证配置
-- ============================================

-- 验证 RLS 已启用
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'messages', 'transfer_cards');
