require('dotenv').config();
const { Pool } = require('pg');
const ethers = require('ethers');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:1@localhost:5432/identity_db'
});

async function checkCCCDStatus() {
  const cccdNumber = '036202012345';
  const cccdHash = ethers.keccak256(ethers.toUtf8Bytes(cccdNumber)); // ✅ Use Keccak256 like backend
  
  console.log('🔍 Checking CCCD:', cccdNumber);
  console.log('📋 CCCD Hash:', cccdHash);
  console.log('');
  
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        cccd_number_hash, 
        phone_number, 
        status, 
        full_name,
        date_of_birth,
        verified_at,
        claimed_at,
        notes
      FROM pre_verified_cccd 
      WHERE cccd_number_hash = $1
    `, [cccdHash]);
    
    if (result.rows.length === 0) {
      console.log('❌ CCCD not found in database!');
      console.log('💡 This CCCD needs to be added by admin first.');
    } else {
      console.log('✅ CCCD found in database:');
      console.log('');
      console.table(result.rows);
      console.log('');
      
      const record = result.rows[0];
      console.log('📊 Status Analysis:');
      console.log('  - Status:', record.status);
      console.log('  - Phone:', record.phone_number);
      console.log('  - Full Name:', record.full_name);
      console.log('  - Verified At:', record.verified_at || 'Not verified yet');
      console.log('  - Claimed At:', record.claimed_at || 'Not claimed yet');
      console.log('');
      
      if (record.status === 'pending') {
        console.log('✅ CCCD is APPROVED and ready for registration');
        console.log('👉 User can request OTP with phone:', record.phone_number);
      } else if (record.status === 'verified') {
        console.log('⚠️  CCCD is VERIFIED (OTP already verified)');
        console.log('👉 User can proceed to register DID');
      } else if (record.status === 'claimed') {
        console.log('❌ CCCD is CLAIMED (already registered)');
        console.log('👉 User cannot register again');
      } else if (record.status === 'blacklisted') {
        console.log('❌ CCCD is BLACKLISTED');
        console.log('👉 User cannot register');
      }
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

checkCCCDStatus();
