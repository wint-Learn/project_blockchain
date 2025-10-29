-- Migration: Add login_logs table for tracking user logins with anomaly detection
-- Created: 2025-10-29

-- First, add username column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='users' AND column_name='username'
  ) THEN
    ALTER TABLE users ADD COLUMN username VARCHAR(100);
  END IF;
END $$;

-- Drop table if exists to avoid conflicts
DROP TABLE IF EXISTS login_logs CASCADE;

CREATE TABLE login_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(100),
  wallet_address VARCHAR(42),
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45), -- IPv6 support
  user_agent TEXT,
  location VARCHAR(200), -- City, Country from IP geolocation
  country_code VARCHAR(2), -- For anomaly detection
  is_anomaly BOOLEAN DEFAULT FALSE,
  anomaly_reason TEXT,
  status VARCHAR(20) DEFAULT 'success', -- success, failed, suspicious
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX idx_login_logs_login_time ON login_logs(login_time DESC);
CREATE INDEX idx_login_logs_is_anomaly ON login_logs(is_anomaly);
CREATE INDEX idx_login_logs_status ON login_logs(status);

-- Add comment
COMMENT ON TABLE login_logs IS 'Tracks user login attempts with IP geolocation and anomaly detection';
COMMENT ON COLUMN login_logs.is_anomaly IS 'Auto-detected based on IP, location, time patterns';
COMMENT ON COLUMN login_logs.anomaly_reason IS 'Reason for anomaly: new_ip, new_country, unusual_time, etc.';
