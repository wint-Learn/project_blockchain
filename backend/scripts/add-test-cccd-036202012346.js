/**
 * Thêm CCCD 036202012346 vào pre_verified_cccd để test
 */

require('dotenv').config();
const { Pool } = require('pg');
const { hashCCCDNumber } = require('../src/utils/crypto-utils');

const CCCD = '036202012346';

async function addTestCCCD() {
  const pool = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING,
  });

  try {
    console.log(`➕ Đang thêm CCCD ${CCCD} vào hệ thống...`);
    
    const cccdHash = hashCCCDNumber(CCCD);
    console.log(`   Hash: ${cccdHash}`);

    // Kiểm tra xem đã tồn tại chưa
    const existing = await pool.query(
      'SELECT * FROM pre_verified_cccd WHERE cccd_number_hash = $1',
      [cccdHash]
    );

    if (existing.rows.length > 0) {
      console.log(`   ⚠️  CCCD đã tồn tại với status: ${existing.rows[0].status}`);
      
      // Nếu đã claimed, reset về pending
      if (existing.rows[0].status === 'claimed') {
        await pool.query(
          'UPDATE pre_verified_cccd SET status = $1, updated_at = NOW() WHERE cccd_number_hash = $2',
          ['pending', cccdHash]
        );
        console.log(`   ✅ Đã reset status về 'pending'`);
      }
    } else {
      // Thêm mới
      await pool.query(
        `INSERT INTO pre_verified_cccd 
         (cccd_number_hash, phone_number, full_name, date_of_birth, gender, address, issue_date, issue_place, status, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [
          cccdHash,
          '0901234568',
          'Nguyễn Văn B',
          '1991-01-01',
          'Nam',
          'Số 456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
          '2020-01-15',
          'Cục Cảnh sát ĐKQL cư trú và DLQG về dân cư',
          'pending'
        ]
      );
      console.log(`   ✅ Đã thêm CCCD mới với thông tin:`);
      console.log(`      Họ tên: Nguyễn Văn B`);
      console.log(`      Ngày sinh: 01/01/1991`);
      console.log(`      Giới tính: Nam`);
      console.log(`      Địa chỉ: Số 456 Đường Nguyễn Huệ, Quận 1, TP.HCM`);
      console.log(`      Ngày cấp: 15/01/2020`);
      console.log(`      Nơi cấp: Cục Cảnh sát ĐKQL cư trú và DLQG về dân cư`);
    }

    console.log('\n✅ Sẵn sàng để test!');
    console.log('\n📝 Hướng dẫn test:');
    console.log('   1. Vào frontend: http://localhost:5173/verify');
    console.log(`   2. Nhập CCCD: ${CCCD}`);
    console.log('   3. Nhập SĐT: 0901234568 (hoặc số nào cũng được)');
    console.log('   4. Nhận OTP từ console backend');
    console.log('   5. Xác thực OTP');
    console.log('   6. Kết nối MetaMask với ví: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
    console.log('   7. Đăng ký DID');
    console.log('   8. Đăng nhập thành công!');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await pool.end();
  }
}

addTestCCCD();
