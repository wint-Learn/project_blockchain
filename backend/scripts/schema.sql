-- Schema cho hệ thống DID với encrypted metadata và AI anomaly detection

-- Bảng users: Lưu encrypted CCCD metadata off-chain
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,           -- Địa chỉ Ethereum (unique ID)
  cccd_hash TEXT NOT NULL,                       -- Hash của CCCD (match với on-chain)
  
  -- Encrypted metadata (dùng pgcrypto hoặc encrypt ở app layer)
  encrypted_cccd_data TEXT,                      -- Raw CCCD fields encrypted (JSON string)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng login_logs: Log chi tiết mỗi lần đăng nhập (cho AI analysis)
CREATE TABLE IF NOT EXISTS login_logs (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,                  -- Địa chỉ đăng nhập
  ip_address TEXT,                               -- IP của request
  user_agent TEXT,                               -- Browser/device info
  
  -- Kết quả verify
  signature_valid BOOLEAN NOT NULL,              -- Chữ ký hợp lệ?
  hash_match BOOLEAN NOT NULL,                   -- Hash on-chain khớp?
  login_success BOOLEAN NOT NULL,                -- Đăng nhập thành công?
  
  -- Anomaly flags (cho AI)
  is_anomaly BOOLEAN DEFAULT FALSE,              -- AI đánh dấu bất thường
  anomaly_score FLOAT DEFAULT 0,                 -- Điểm nghi ngờ (0-1)
  anomaly_reason TEXT,                           -- Lý do (IP lạ, tần suất cao...)
  
  -- Metadata
  message_signed TEXT,                           -- Message user đã ký
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng audit_logs: Audit trail cho admin actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  admin_address TEXT,                            -- Admin wallet address (nếu có)
  action_type TEXT NOT NULL,                     -- 'view_logs', 'rotate_key', 'modify_user', 'delete_user'
  target_resource TEXT,                          -- Resource bị tác động (wallet_address, log_id...)
  details JSONB,                                 -- Chi tiết action (old_value, new_value...)
  ip_address TEXT,                               -- IP của admin
  user_agent TEXT,                               -- Browser/device info
  success BOOLEAN DEFAULT TRUE,                  -- Action thành công?
  error_message TEXT,                            -- Lỗi nếu có
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Index để query nhanh
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_logs_wallet ON login_logs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON login_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_anomaly ON login_logs(is_anomaly);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON audit_logs(admin_address);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action_type);

-- Bảng anomaly_rules (tùy chọn): Lưu rules cho AI
CREATE TABLE IF NOT EXISTS anomaly_rules (
  id SERIAL PRIMARY KEY,
  rule_name TEXT UNIQUE NOT NULL,
  rule_type TEXT NOT NULL,                       -- 'ip_change', 'frequency', 'time_pattern'
  threshold FLOAT,                                -- Ngưỡng trigger
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default rules
INSERT INTO anomaly_rules (rule_name, rule_type, threshold) VALUES
  ('ip_change_24h', 'ip_change', 3.0),           -- Đổi IP >3 lần/24h
  ('login_frequency_1h', 'frequency', 10.0),      -- >10 lần đăng nhập/1h
  ('night_login', 'time_pattern', 2.0)            -- Đăng nhập 0-5am (giờ VN)
ON CONFLICT (rule_name) DO NOTHING;

-- Trigger tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE users IS 'Lưu encrypted CCCD metadata off-chain';
COMMENT ON TABLE login_logs IS 'Log đăng nhập chi tiết cho AI anomaly detection';
COMMENT ON TABLE audit_logs IS 'Audit trail cho tất cả admin actions';
COMMENT ON COLUMN users.encrypted_cccd_data IS 'Encrypted JSON: {cccd_number, name, dob, address...}';
COMMENT ON COLUMN login_logs.anomaly_score IS 'AI confidence score: 0 (normal) - 1 (suspicious)';
COMMENT ON COLUMN audit_logs.details IS 'JSON metadata về action (old/new values, query params...)';

