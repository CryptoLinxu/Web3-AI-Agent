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

-- 5. 创建 RLS 策略
-- 注意：当前实现通过客户端传入 wallet_address 过滤
-- 生产环境建议使用 Supabase Auth + JWT 进行更严格的控制

-- conversations 表策略
CREATE POLICY "Users can view own conversations" 
  ON conversations FOR SELECT 
  USING (true); -- 暂时允许所有查询，实际通过客户端过滤

CREATE POLICY "Users can insert own conversations" 
  ON conversations FOR INSERT 
  WITH CHECK (true); -- 暂时允许所有插入

CREATE POLICY "Users can update own conversations" 
  ON conversations FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete own conversations" 
  ON conversations FOR DELETE 
  USING (true);

-- messages 表策略
CREATE POLICY "Users can view messages of own conversations" 
  ON messages FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert messages of own conversations" 
  ON messages FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update messages of own conversations" 
  ON messages FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete messages of own conversations" 
  ON messages FOR DELETE 
  USING (true);

-- 6. 添加注释
COMMENT ON TABLE conversations IS '对话会话表，按钱包地址隔离';
COMMENT ON TABLE messages IS '对话消息表，关联到 conversation';
COMMENT ON COLUMN conversations.wallet_address IS '钱包地址（0x 开头 42 字符）';
COMMENT ON COLUMN messages.metadata IS '扩展字段：timestamp, toolCalls, isError 等';
