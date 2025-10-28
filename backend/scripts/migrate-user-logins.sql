-- Migration: Create user_logins table for activity tracking
-- Description: Track user login activities with IP, user agent, and location

CREATE TABLE IF NOT EXISTS user_logins (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  location TEXT,
  
  -- Indexes for faster queries
  CONSTRAINT user_logins_wallet_idx UNIQUE (wallet_address, login_time)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_logins_wallet ON user_logins(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_logins_time ON user_logins(login_time DESC);

-- Add comment
COMMENT ON TABLE user_logins IS 'Tracks user login activities for security and audit purposes';
