-- ============================================
-- Supabase 数据库初始化脚本
-- Web3 AI Agent - 钱包登录 + 对话历史持久化
-- ============================================

-- 1. 创建 conversations 表
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  title VARCHAR(200) DEFAULT '新对话',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建 messages 表
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_conversations_wallet ON conversations(wallet_address);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- 4. 启用行级安全（RLS）
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 5. 创建 RLS 策略 - 基于钱包地址隔离
-- 注意：当前采用应用层过滤 + RLS 基础保护
-- 生产环境强烈建议使用 Supabase Auth + 钱包签名登录

-- conversations 表策略
-- 当前：允许所有查询（应用层通过 wallet_address 过滤）
-- 生产：使用 auth.uid() 或自定义 claim 验证
CREATE POLICY "Enable read access for all users" 
  ON conversations FOR SELECT 
  USING (true);

CREATE POLICY "Enable insert for authenticated users" 
  ON conversations FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Enable update for users based on wallet_address" 
  ON conversations FOR UPDATE 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for users based on wallet_address" 
  ON conversations FOR DELETE 
  USING (true);

-- messages 表策略
CREATE POLICY "Enable read access for all users" 
  ON messages FOR SELECT 
  USING (true);

CREATE POLICY "Enable insert for authenticated users" 
  ON messages FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Enable update for users based on conversation" 
  ON messages FOR UPDATE 
  USING (true);

CREATE POLICY "Enable delete for users based on conversation" 
  ON messages FOR DELETE 
  USING (true);

-- 6. 创建数据库函数（用于生产环境的严格 RLS）
-- 以下函数需要配合 Supabase Auth 使用
-- CREATE OR REPLACE FUNCTION public.check_wallet_ownership(wallet_addr TEXT)
-- RETURNS BOOLEAN AS $$
-- BEGIN
--   RETURN wallet_addr = current_setting('app.current_wallet_address', true);
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 添加注释
COMMENT ON TABLE conversations IS '对话会话表，按钱包地址隔离';
COMMENT ON TABLE messages IS '对话消息表，关联到 conversation';
COMMENT ON COLUMN conversations.wallet_address IS '钱包地址（0x 开头 42 字符）';
COMMENT ON COLUMN messages.metadata IS '扩展字段：timestamp, toolCalls, isError 等';
