-- Migration: Tạo bảng service_requests để quản lý yêu cầu dịch vụ công

-- Drop bảng cũ nếu tồn tại (để tránh conflict)
DROP TABLE IF EXISTS service_requests CASCADE;

CREATE TABLE service_requests (
    id SERIAL PRIMARY KEY,
    
    -- Thông tin người yêu cầu
    wallet_address TEXT NOT NULL,
    cccd_number_hash TEXT NOT NULL,
    
    -- Loại dịch vụ
    service_type VARCHAR(50) NOT NULL, -- 'business_registration', 'vehicle_registration'
    
    -- Dữ liệu dịch vụ (JSON)
    service_data JSONB NOT NULL,
    
    -- Trạng thái
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
    
    -- Lý do từ chối (nếu có)
    rejection_reason TEXT,
    
    -- Blockchain transaction hash (sau khi approve)
    tx_hash TEXT,
    
    -- Service ID on-chain (sau khi approve)
    service_id INTEGER,
    
    -- Admin phê duyệt
    approved_by TEXT,
    approved_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    
    -- Note: Foreign key constraint bỏ qua vì có thể users table chưa có
    -- CONSTRAINT fk_wallet FOREIGN KEY (wallet_address) REFERENCES users(wallet_address) ON DELETE CASCADE
);

-- Tạo indexes để tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_service_requests_wallet ON service_requests(wallet_address);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_type ON service_requests(service_type);
CREATE INDEX IF NOT EXISTS idx_service_requests_created ON service_requests(created_at DESC);

-- Trigger để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_service_requests_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_requests_updated_at
    BEFORE UPDATE ON service_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_service_requests_timestamp();

-- Comment
COMMENT ON TABLE service_requests IS 'Bảng lưu trữ yêu cầu sử dụng dịch vụ công';
COMMENT ON COLUMN service_requests.service_type IS 'Loại dịch vụ: business_registration (đăng ký kinh doanh), vehicle_registration (đăng ký xe máy)';
COMMENT ON COLUMN service_requests.service_data IS 'Dữ liệu JSON chứa thông tin chi tiết dịch vụ';
COMMENT ON COLUMN service_requests.status IS 'Trạng thái: pending (chờ duyệt), approved (đã duyệt), rejected (từ chối), completed (hoàn tất)';
