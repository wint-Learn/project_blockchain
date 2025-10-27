/**
 * Reset CCCD 036202012345 - Xóa hoàn toàn để test lại
 */

require('dotenv').config();
const { Pool } = require('pg');
const { hashCCCDNumber } = require('../src/utils/crypto-utils');

const CCCD = '036202012345';

async function reset() {
  const pool = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING,
  });

  try {
    console.log(`🗑️  Đang xóa CCCD ${CCCD}...`);
    
    const cccdHash = hashCCCDNumber(CCCD);
    console.log(`   Hash: ${cccdHash}`);

    // 1. Xóa từ bảng users
    const usersResult = await pool.query(
      'DELETE FROM users WHERE cccd_number_hash = $1 RETURNING wallet_address',
      [cccdHash]
    );
    console.log(`   ✅ Xóa ${usersResult.rowCount} users`);
    if (usersResult.rows[0]) {
      console.log(`      Wallet: ${usersResult.rows[0].wallet_address}`);
    }

    // 2. Xóa từ bảng pre_verified_cccd
    const preVerified = await pool.query(
      'DELETE FROM pre_verified_cccd WHERE cccd_number_hash = $1 RETURNING id',
      [cccdHash]
    );
    console.log(`   ✅ Xóa ${preVerified.rowCount} pre-verified records`);

    // 3. Xóa OTP codes
    const otpResult = await pool.query(
      'DELETE FROM otp_codes WHERE cccd_number_hash = $1 RETURNING id',
      [cccdHash]
    );
    console.log(`   ✅ Xóa ${otpResult.rowCount} OTP codes`);

    // 4. Xóa login logs
    if (usersResult.rows[0]) {
      const logsResult = await pool.query(
        'DELETE FROM login_logs WHERE wallet_address = $1 RETURNING id',
        [usersResult.rows[0].wallet_address.toLowerCase()]
      );
      console.log(`   ✅ Xóa ${logsResult.rowCount} login logs`);
    }

    console.log('\n✅ Đã xóa xong CCCD khỏi DATABASE!');
    console.log('\n⚠️  LƯU Ý: CCCD VẪN CÒN TRÊN BLOCKCHAIN!');
    console.log('   Blockchain data không thể xóa.');
    console.log('   Nếu cần test lại, hãy:');
    console.log('   1. Dùng CCCD khác');
    console.log('   2. Hoặc restart Ganache để reset blockchain');
    console.log('\n   Để restart Ganache:');
    console.log('   - Tắt Ganache');
    console.log('   - Mở lại Ganache');
    console.log('   - Redeploy contract: cd blockchain && npm run deploy:local');
    console.log('   - Cập nhật CONTRACT_ADDRESS trong backend/.env');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await pool.end();
  }
}

reset();
