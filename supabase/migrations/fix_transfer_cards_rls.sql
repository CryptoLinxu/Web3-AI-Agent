-- 修复 transfer_cards 表的 RLS 策略
-- 问题：当前策略依赖 auth.jwt()，但项目使用应用层钱包验证
-- 解决方案：临时禁用 RLS（仅开发环境）或使用应用层验证

-- 方案 1：临时禁用 RLS（快速，但不安全）
-- ALTER TABLE transfer_cards DISABLE ROW LEVEL SECURITY;

-- 方案 2：修改策略为允许所有已认证的会话（推荐用于开发）
-- 删除旧的依赖 JWT 的策略
DROP POLICY IF EXISTS "Users can view own transfer cards" ON transfer_cards;
DROP POLICY IF EXISTS "Users can insert own transfer cards" ON transfer_cards;
DROP POLICY IF EXISTS "Users can update own transfer cards" ON transfer_cards;

-- 创建新的策略：允许所有操作（开发环境）
-- 注意：生产环境必须使用 Supabase Auth + JWT
CREATE POLICY "Allow all operations for development"
  ON transfer_cards FOR ALL
  USING (true)
  WITH CHECK (true);

-- 方案 3：如果未来使用 Supabase Auth，应该这样写：
-- CREATE POLICY "Users can view own transfer cards"
--   ON transfer_cards FOR SELECT
--   USING (
--     conversation_id IN (
--       SELECT id FROM conversations WHERE wallet_address = auth.uid()::text
--     )
--   );
