-- 创建转账卡片表
CREATE TABLE IF NOT EXISTS transfer_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,  -- 关联 Message 的 id
  
  -- 转账信息
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL,  -- 'ETH', 'USDT', 'USDC'
  token_address TEXT,          -- ERC20 合约地址(NULL 表示原生币)
  amount TEXT NOT NULL,        -- 字符串避免精度丢失
  chain TEXT NOT NULL,         -- 'ethereum', 'polygon', 'bsc'
  
  -- 交易状态
  status TEXT NOT NULL DEFAULT 'pending',  -- pending/signing/confirmed/failed
  tx_hash TEXT,                -- 交易哈希
  error_message TEXT,          -- 失败原因
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_transfer_cards_conversation ON transfer_cards(conversation_id);
CREATE INDEX IF NOT EXISTS idx_transfer_cards_message ON transfer_cards(message_id);

-- 添加 RLS 策略(与 conversations 表一致)
ALTER TABLE transfer_cards ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的转账记录
CREATE POLICY "Users can view own transfer cards"
  ON transfer_cards FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE wallet_address = auth.jwt()->>'wallet_address'
    )
  );

CREATE POLICY "Users can insert own transfer cards"
  ON transfer_cards FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE wallet_address = auth.jwt()->>'wallet_address'
    )
  );

CREATE POLICY "Users can update own transfer cards"
  ON transfer_cards FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE wallet_address = auth.jwt()->>'wallet_address'
    )
  );

-- 添加更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transfer_cards_updated_at
  BEFORE UPDATE ON transfer_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
