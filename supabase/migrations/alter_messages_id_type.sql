-- 修改 messages 表以支持自定义 ID
-- 问题：messages.id 是 UUID，但前端使用 Date.now() 字符串
-- 解决方案：将 id 改为 TEXT 类型

-- 步骤 1：删除外键约束（如果有的话）
-- ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;

-- 步骤 2：创建新表（保留数据）
CREATE TABLE IF NOT EXISTS messages_new (
  id TEXT PRIMARY KEY,  -- 改为 TEXT 类型
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 步骤 3：复制数据（如果 messages 表有数据）
-- INSERT INTO messages_new (id, conversation_id, role, content, metadata, created_at)
-- SELECT id::text, conversation_id, role, content, metadata, created_at FROM messages;

-- 步骤 4：删除旧表
-- DROP TABLE IF EXISTS messages;

-- 步骤 5：重命名新表
-- ALTER TABLE messages_new RENAME TO messages;

-- 步骤 6：重建索引
-- CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
-- CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- 注意：如果 messages 表已有数据，需要手动执行上述步骤
-- 如果是新表，直接执行以下步骤即可：

-- 直接修改列类型（如果表为空或数据量小）
-- ALTER TABLE messages ALTER COLUMN id TYPE TEXT;

-- 更安全的方案：在 Supabase Dashboard 中手动修改表结构
-- 1. 进入 Table Editor
-- 2. 选择 messages 表
-- 3. 点击 id 列的设置图标
-- 4. 将类型从 uuid 改为 text
-- 5. 保存
