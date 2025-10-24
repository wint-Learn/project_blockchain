-- Migration: Add cccd_number_hash column
-- Chạy script này để update database hiện tại

-- 1. Add column cccd_number_hash (nullable ban đầu)
ALTER TABLE users ADD COLUMN IF NOT EXISTS cccd_number_hash TEXT;

-- 2. Xóa tất cả user cũ (vì không thể extract cccd_number từ encrypted data)
-- User sẽ phải đăng ký lại với logic mới
DELETE FROM users;
COMMENT ON TABLE users IS 'Đã xóa users cũ để migrate sang schema mới với cccd_number_hash';

-- Alternative: Nếu muốn giữ user cũ, set unique dummy values
-- UPDATE users 
-- SET cccd_number_hash = '0x' || md5(wallet_address || created_at::text)
-- WHERE cccd_number_hash IS NULL;

-- 3. Set NOT NULL constraint
ALTER TABLE users ALTER COLUMN cccd_number_hash SET NOT NULL;

-- 4. Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_cccd_number_hash ON users(cccd_number_hash);

-- 5. Update existing index for cccd_hash (remove unique constraint)
DROP INDEX IF EXISTS idx_users_cccd_hash;
CREATE INDEX IF NOT EXISTS idx_users_cccd_hash ON users(cccd_hash);

-- 6. Verify
SELECT COUNT(*) as total_users, 
       COUNT(DISTINCT cccd_number_hash) as unique_cccd_numbers
FROM users;

COMMENT ON COLUMN users.cccd_number_hash IS 'Hash của SỐ CCCD only (để check duplicate người dùng)';
COMMENT ON COLUMN users.cccd_hash IS 'Hash của full QR data (có thể thay đổi khi update thông tin)';
