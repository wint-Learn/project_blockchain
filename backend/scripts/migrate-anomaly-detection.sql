-- Migration: Update login_logs table with risk_score and improved schema
-- Run this after creating the initial login_logs table

ALTER TABLE login_logs
ADD COLUMN IF NOT EXISTS user_id INTEGER,
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS login_time TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS country_code VARCHAR(2),
ADD COLUMN IF NOT EXISTS risk_score REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'success';

-- Rename old columns for backward compatibility (keep them but add new ones)
-- If using the new schema, you can ignore the old columns

-- Update indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_login_time ON login_logs(login_time);
CREATE INDEX IF NOT EXISTS idx_login_logs_risk_score ON login_logs(risk_score);
CREATE INDEX IF NOT EXISTS idx_login_logs_is_anomaly ON login_logs(is_anomaly);
CREATE INDEX IF NOT EXISTS idx_login_logs_wallet_address ON login_logs(wallet_address);

-- Add comment explaining the new columns
COMMENT ON COLUMN login_logs.user_id IS 'User ID (references users table)';
COMMENT ON COLUMN login_logs.username IS 'Username for easy identification';
COMMENT ON COLUMN login_logs.login_time IS 'Timestamp when login occurred';
COMMENT ON COLUMN login_logs.location IS 'Geographic location from IP geolocation';
COMMENT ON COLUMN login_logs.country_code IS 'Country code (ISO 3166-1 alpha-2)';
COMMENT ON COLUMN login_logs.risk_score IS 'Risk score 0-1: 0=normal, 1=high risk (calculated by AI)';
COMMENT ON COLUMN login_logs.status IS 'Login status: success, failed, anomaly_blocked';
COMMENT ON COLUMN login_logs.is_anomaly IS 'Boolean flag: true if risk_score >= 0.7';
