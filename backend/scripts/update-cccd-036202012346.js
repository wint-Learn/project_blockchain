/**
 * Update CCCD 036202012346 - Thêm ngày cấp và nơi cấp
 */

require('dotenv').config();
const { Pool } = require('pg');
const { hashCCCDNumber } = require('../src/utils/crypto-utils');

const CCCD = '036202012346';

async function updateCCCD() {
  const pool = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING,
  });

  try {
    console.log(`🔄 Đang cập nhật CCCD ${CCCD}...`);
    
    const cccdHash = hashCCCDNumber(CCCD);
    console.log(`   Hash: ${cccdHash}`);

    // Xóa record cũ nếu có (xóa theo cả plaintext và hash)
    await pool.query(
      'DELETE FROM pre_verified_cccd WHERE cccd_number = $1 OR cccd_number_hash = $2', 
      [CCCD, cccdHash]
    );
    console.log(`   ✅ Đã xóa record cũ`);

    // Thêm mới với CCCD plaintext (hash được tự động generate khi cần)
    await pool.query(
      `INSERT INTO pre_verified_cccd 
       (cccd_number, cccd_number_hash, phone_number, full_name, date_of_birth, gender, address, issue_date, status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [
        CCCD, // Plaintext cho demo
        cccdHash, // Hash để tương thích với code cũ
        '0901234568',
        'Nguyễn Văn B',
        '1991-01-01',
        'Nam',
        'Số 456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
        '2020-01-15',
        'pending'
      ]
    );

    console.log(`\n✅ Đã thêm CCCD mới với thông tin đầy đủ:`);
    console.log(`   🆔 Số CCCD: ${CCCD}`);
    console.log(`   📝 Họ tên: Nguyễn Văn B`);
    console.log(`   📅 Ngày sinh: 01/01/1991`);
    console.log(`   👤 Giới tính: Nam`);
    console.log(`   🏠 Địa chỉ: Số 456 Đường Nguyễn Huệ, Quận 1, TP.HCM`);
    console.log(`   📆 Ngày cấp: 15/01/2020`);
    console.log(`   🔐 Hash: ${cccdHash}`);

    console.log('\n✅ Sẵn sàng để test!');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await pool.end();
  }
}

updateCCCD();
