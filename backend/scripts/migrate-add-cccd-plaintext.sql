-- ============================================
-- Add cccd_number plaintext column for demo/development
-- Migration: 2025-10-27
-- ============================================

-- Add cccd_number column (plaintext for demo)
ALTER TABLE pre_verified_cccd 
ADD COLUMN IF NOT EXISTS cccd_number VARCHAR(12);

-- Add index for quick lookup
CREATE INDEX IF NOT EXISTS idx_pre_verified_cccd_number ON pre_verified_cccd(cccd_number);

-- Make cccd_number_hash nullable (we'll keep it for consistency but populate from cccd_number)
ALTER TABLE pre_verified_cccd 
ALTER COLUMN cccd_number_hash DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN pre_verified_cccd.cccd_number IS 'Số CCCD plaintext (chỉ dùng cho demo/development)';
COMMENT ON COLUMN pre_verified_cccd.cccd_number_hash IS 'Hash của số CCCD (auto-generated from cccd_number)';

-- Show current data
SELECT id, cccd_number, cccd_number_hash, phone_number, status FROM pre_verified_cccd ORDER BY id LIMIT 10;
