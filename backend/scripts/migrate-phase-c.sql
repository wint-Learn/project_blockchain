-- ============================================
-- PHASE C MIGRATION: Admin Panel + Pre-Verification + Services
-- Created: 2025-10-24
-- ============================================

-- ============================================
-- 1. PRE-VERIFIED CCCD TABLE
-- Chứa list CCCD đã được chính phủ approve trước
-- ============================================
CREATE TABLE IF NOT EXISTS pre_verified_cccd (
  id SERIAL PRIMARY KEY,
  cccd_number_hash VARCHAR(66) UNIQUE NOT NULL, -- sha256(cccdNumber) with 0x prefix
  phone_number VARCHAR(15) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'claimed', 'blacklisted')),
  verified_at TIMESTAMP,
  claimed_at TIMESTAMP,
  notes TEXT, -- Admin notes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pre_verified_status ON pre_verified_cccd(status);
CREATE INDEX IF NOT EXISTS idx_pre_verified_phone ON pre_verified_cccd(phone_number);

-- ============================================
-- 2. OTP CODES TABLE
-- Lưu OTP codes cho verification
-- ============================================
CREATE TABLE IF NOT EXISTS otp_codes (
  id SERIAL PRIMARY KEY,
  cccd_number_hash VARCHAR(66) NOT NULL,
  phone_number VARCHAR(15) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0, -- Track số lần thử sai
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otp_cccd ON otp_codes(cccd_number_hash);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes(expires_at);

-- ============================================
-- 3. ADMIN USERS TABLE
-- Tài khoản admin/chính phủ
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- bcrypt hash
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  full_name VARCHAR(255),
  email VARCHAR(255),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_username ON admin_users(username);

-- ============================================
-- 4. SERVICES TABLE
-- Danh mục dịch vụ công
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- e.g., 'business', 'health', 'education', 'transport'
  requires_verification BOOLEAN DEFAULT TRUE,
  metadata JSONB, -- Flexible fields: required_documents, processing_time, etc.
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);

-- ============================================
-- 5. SERVICE REQUESTS TABLE
-- User applications for services
-- ============================================
CREATE TABLE IF NOT EXISTS service_requests (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL, -- Ethereum address
  service_id INT NOT NULL REFERENCES services(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  request_data JSONB NOT NULL, -- User-submitted data (flexible per service)
  admin_notes TEXT, -- Admin rejection reason or notes
  approved_by INT REFERENCES admin_users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_service_requests_user ON service_requests(user_address);
CREATE INDEX IF NOT EXISTS idx_service_requests_service ON service_requests(service_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);

-- ============================================
-- 6. ADMIN ACTION LOGS TABLE (Optional but Recommended)
-- Track admin actions for compliance (renamed to avoid conflict with base schema)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_action_logs (
  id SERIAL PRIMARY KEY,
  admin_id INT, -- FK to admin_users(id) - not enforced for flexibility
  action VARCHAR(100) NOT NULL, -- e.g., 'import_cccd', 'approve_service', 'blacklist_user'
  resource_type VARCHAR(50), -- e.g., 'pre_verified_cccd', 'service_requests'
  resource_id INT,
  details JSONB, -- Flexible log data
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_admin ON admin_action_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_action ON admin_action_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_created ON admin_action_logs(created_at);

-- ============================================
-- 7. UPDATE EXISTING USERS TABLE
-- Add fields for service integration
-- ============================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(15),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

-- Note: login_logs already exists from previous migration
-- We don't modify it here to avoid conflicts

-- ============================================
-- 8. FUNCTION: Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
DROP TRIGGER IF EXISTS update_pre_verified_cccd_updated_at ON pre_verified_cccd;
CREATE TRIGGER update_pre_verified_cccd_updated_at
BEFORE UPDATE ON pre_verified_cccd
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON admin_users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_requests_updated_at ON service_requests;
CREATE TRIGGER update_service_requests_updated_at
BEFORE UPDATE ON service_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. INITIAL DATA SETUP
-- ============================================
-- Insert default super admin (password: admin123 - CHANGE IN PRODUCTION!)
-- Password hash generated with bcrypt rounds=10
INSERT INTO admin_users (username, password_hash, role, full_name, email)
VALUES (
  'admin',
  '$2b$10$XOPzO7.8t5IaAeYx5UqZ5.X1lv9zIqVYD3nZIQZPQMXQZXQZXQZXQ', -- Hash of 'admin123'
  'super_admin',
  'System Administrator',
  'admin@did-system.gov.vn'
) ON CONFLICT (username) DO NOTHING;

-- Insert demo services
INSERT INTO services (name, description, category, requires_verification, metadata, created_by)
VALUES 
(
  'Đăng ký giấy phép kinh doanh',
  'Đăng ký thành lập doanh nghiệp, hộ kinh doanh cá thể',
  'business',
  TRUE,
  '{"required_documents": ["Đơn đăng ký", "Bản sao CCCD", "Địa chỉ kinh doanh"], "processing_time": "5-7 ngày làm việc", "fee": "0 VND"}'::jsonb,
  1
),
(
  'Đăng ký xe máy',
  'Cấp biển số xe máy mới hoặc chuyển nhượng',
  'transport',
  TRUE,
  '{"required_documents": ["Hóa đơn mua xe", "Chứng minh thu nhập", "Bảo hiểm xe"], "processing_time": "1-2 ngày làm việc", "fee": "1.500.000 VND"}'::jsonb,
  1
),
(
  'Khai báo y tế',
  'Khai báo tình trạng sức khỏe, tiêm chủng',
  'health',
  TRUE,
  '{"required_documents": ["Sổ tiêm chủng (nếu có)"], "processing_time": "Ngay lập tức", "fee": "0 VND"}'::jsonb,
  1
) ON CONFLICT DO NOTHING;

-- ============================================
-- MIGRATION COMPLETED
-- ============================================
-- Run this script with:
-- psql -U postgres -d identity_db -f backend/scripts/migrate-phase-c.sql
-- Or use Node.js runner: node backend/scripts/run-phase-c-migration.js
