require('dotenv').config();
const { Pool } = require('pg');
const ethers = require('ethers');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:1@localhost:5432/identity_db'
});

async function resetCCCD() {
  const cccdNumber = '036202012345';
  const cccdHash = ethers.keccak256(ethers.toUtf8Bytes(cccdNumber));
  
  console.log('🔄 Resetting CCCD:', cccdNumber);
  
  try {
    // Reset status to pending
    await pool.query(`
      UPDATE pre_verified_cccd 
      SET 
        status = 'pending',
        verified_at = NULL,
        claimed_at = NULL
      WHERE cccd_number_hash = $1
    `, [cccdHash]);
    
    // Delete old OTP codes
    await pool.query(`
      DELETE FROM otp_codes 
      WHERE cccd_number_hash = $1
    `, [cccdHash]);
    
    console.log('✅ CCCD reset to pending');
    console.log('✅ Old OTP codes deleted');
    console.log('');
    console.log('👉 Ready to test again:');
    console.log('   1. Request OTP');
    console.log('   2. Verify OTP');
    console.log('   3. Check auto-fill');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

resetCCCD();
