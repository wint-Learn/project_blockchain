-- ============================================
-- Add citizen information to pre_verified_cccd
-- Thông tin công dân đã có sẵn từ DB chính phủ
-- ============================================

-- Add columns for citizen info
ALTER TABLE pre_verified_cccd 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS issue_date DATE,
ADD COLUMN IF NOT EXISTS place_of_origin TEXT,
ADD COLUMN IF NOT EXISTS place_of_residence TEXT;

-- Add comments
COMMENT ON COLUMN pre_verified_cccd.full_name IS 'Họ và tên (từ CCCD)';
COMMENT ON COLUMN pre_verified_cccd.date_of_birth IS 'Ngày sinh';
COMMENT ON COLUMN pre_verified_cccd.gender IS 'Giới tính (Nam/Nữ)';
COMMENT ON COLUMN pre_verified_cccd.address IS 'Địa chỉ thường trú';
COMMENT ON COLUMN pre_verified_cccd.issue_date IS 'Ngày cấp CCCD';
COMMENT ON COLUMN pre_verified_cccd.place_of_origin IS 'Quê quán';
COMMENT ON COLUMN pre_verified_cccd.place_of_residence IS 'Nơi đăng ký thường trú';

-- Update existing test data
UPDATE pre_verified_cccd 
SET 
  full_name = 'Nguyễn Văn A',
  date_of_birth = '1990-01-15',
  gender = 'Nam',
  address = 'Số 123, Đường ABC, Phường XYZ, Quận 1, TP.HCM',
  issue_date = '2020-01-01',
  place_of_origin = 'Hà Nội',
  place_of_residence = 'TP. Hồ Chí Minh'
WHERE id = 1;

UPDATE pre_verified_cccd 
SET 
  full_name = 'Trần Thị B',
  date_of_birth = '1995-05-20',
  gender = 'Nữ',
  address = 'Số 456, Đường DEF, Phường UVW, Quận 3, TP.HCM',
  issue_date = '2021-06-15',
  place_of_origin = 'Đà Nẵng',
  place_of_residence = 'TP. Hồ Chí Minh'
WHERE id = 2;

UPDATE pre_verified_cccd 
SET 
  full_name = 'Lê Văn C',
  date_of_birth = '1988-12-10',
  gender = 'Nam',
  address = 'Số 789, Đường GHI, Phường RST, Quận 5, TP.HCM',
  issue_date = '2019-03-20',
  place_of_origin = 'Hải Phòng',
  place_of_residence = 'TP. Hồ Chí Minh'
WHERE id = 3;

UPDATE pre_verified_cccd 
SET 
  full_name = 'Phạm Thị D',
  date_of_birth = '1992-08-25',
  gender = 'Nữ',
  address = 'Số 321, Đường JKL, Phường MNO, Quận 7, TP.HCM',
  issue_date = '2020-09-10',
  place_of_origin = 'Cần Thơ',
  place_of_residence = 'TP. Hồ Chí Minh'
WHERE id = 4;

UPDATE pre_verified_cccd 
SET 
  full_name = 'Hoàng Văn E',
  date_of_birth = '1985-03-30',
  gender = 'Nam',
  address = 'Số 654, Đường PQR, Phường STU, Quận 10, TP.HCM',
  issue_date = '2018-11-05',
  place_of_origin = 'Huế',
  place_of_residence = 'TP. Hồ Chí Minh'
WHERE id = 5;

-- Show result
SELECT 
  id, 
  cccd_number_hash, 
  phone_number, 
  full_name, 
  date_of_birth, 
  gender,
  status 
FROM pre_verified_cccd 
ORDER BY id 
LIMIT 10;
