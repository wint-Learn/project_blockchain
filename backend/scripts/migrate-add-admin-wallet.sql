-- ============================================
-- MIGRATION: Add wallet_address to admin_users
-- Purpose: Admin cần wallet để tạo blockchain transactions khi approve services
-- Date: 2025-10-27
-- ============================================

-- Add wallet_address column to admin_users
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42) UNIQUE;

-- Add comment
COMMENT ON COLUMN admin_users.wallet_address IS 'Ethereum wallet address của admin (để ký transactions on-chain)';

-- Update default admin with a Ganache account
-- Sử dụng Ganache account index 0: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
UPDATE admin_users 
SET wallet_address = '0x90F79bf6EB2c4f870365E785982E1f101E93b906'
WHERE username = 'admin' AND wallet_address IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_wallet_address ON admin_users(wallet_address);

-- Show result
SELECT id, username, role, wallet_address, created_at 
FROM admin_users 
ORDER BY id;
