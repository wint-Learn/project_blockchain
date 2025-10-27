/**
 * CLEAN CCCD 036202012345
 * Xóa hoàn toàn CCCD khỏi database (cả users và pre_verified_cccd)
 * Để test lại từ đầu
 */

require('dotenv').config();
const { Pool } = require('pg');
const { hashCCCDNumber } = require('../src/utils/crypto-utils');

const pool = new Pool({
  connectionString: 'postgresql://postgres:1@localhost:5432/identity_db'
});

async function cleanCCCD() {
  const cccdNumber = '036202012345';
  const cccdNumberHash = hashCCCDNumber(cccdNumber);
  
  console.log('🗑️  Cleaning CCCD:', cccdNumber);
  console.log('Hash:', cccdNumberHash);
  
  try {
    // 1. Xóa từ bảng users
    const deleteUsers = await pool.query(
      'DELETE FROM users WHERE cccd_number_hash = $1 RETURNING wallet_address',
      [cccdNumberHash]
    );
    
    if (deleteUsers.rows.length > 0) {
      console.log('✅ Deleted from users table:', deleteUsers.rows[0].wallet_address);
    } else {
      console.log('ℹ️  No records in users table');
    }
    
    // 2. Reset pre_verified_cccd
    const resetPreVerified = await pool.query(
      `UPDATE pre_verified_cccd 
       SET status = 'pending', verified_at = NULL, claimed_at = NULL 
       WHERE cccd_number_hash = $1 
       RETURNING phone_number`,
      [cccdNumberHash]
    );
    
    if (resetPreVerified.rows.length > 0) {
      console.log('✅ Reset pre_verified_cccd:', resetPreVerified.rows[0].phone_number);
    } else {
      console.log('ℹ️  No records in pre_verified_cccd table');
    }
    
    // 3. Xóa OTP codes
    const deleteOTP = await pool.query(
      'DELETE FROM otp_codes WHERE cccd_number_hash = $1',
      [cccdNumberHash]
    );
    
    console.log(`✅ Deleted ${deleteOTP.rowCount} OTP codes`);
    
    // 4. Xóa login logs (optional)
    const deleteLogs = await pool.query(
      'DELETE FROM login_logs WHERE wallet_address IN (SELECT wallet_address FROM users WHERE cccd_number_hash = $1)',
      [cccdNumberHash]
    );
    
    console.log(`✅ Deleted ${deleteLogs.rowCount} login logs`);
    
    console.log('\n✨ CCCD cleaned successfully!');
    console.log('👉 Ready to register again from scratch');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

cleanCCCD();
