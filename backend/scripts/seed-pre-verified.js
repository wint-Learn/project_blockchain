/**
 * Seed Pre-Verified CCCD Data
 * Thêm dữ liệu CCCD mẫu vào bảng pre_verified_cccd để test
 */

const { Pool } = require('pg');
const { hashCCCDNumber } = require('../src/utils/crypto-utils');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING || 'postgres://postgres:1@localhost:5432/identity_db'
});

// Test CCCD data - Các số CCCD giả lập để test
const testCCCDs = [
  {
    cccdNumber: '001099001234',
    phoneNumber: '0901234567',
    notes: 'Test user 1 - Valid for registration'
  },
  {
    cccdNumber: '001099005678',
    phoneNumber: '0912345678',
    notes: 'Test user 2 - Valid for registration'
  },
  {
    cccdNumber: '001099009999',
    phoneNumber: '0923456789',
    notes: 'Test user 3 - Blacklisted example'
  },
  {
    cccdNumber: '079099001111',
    phoneNumber: '0934567890',
    notes: 'Test user 4 - Valid for registration'
  },
  {
    cccdNumber: '079099002222',
    phoneNumber: '0945678901',
    notes: 'Test user 5 - Valid for registration'
  }
];

async function seedPreVerifiedCCCD() {
  console.log('🌱 Starting pre-verified CCCD seed...\n');
  
  try {
    // Clear existing test data
    console.log('🧹 Cleaning existing test data...');
    await pool.query('DELETE FROM otp_codes');
    await pool.query('DELETE FROM pre_verified_cccd');
    console.log('✅ Test data cleaned\n');
    
    // Insert test CCCDs
    console.log('📝 Inserting test CCCD data...');
    
    for (const testCCCD of testCCCDs) {
      const cccdNumberHash = hashCCCDNumber(testCCCD.cccdNumber);
      
      // Determine initial status
      let status = 'pending';
      if (testCCCD.cccdNumber === '001099009999') {
        status = 'blacklisted'; // Blacklist test case
      }
      
      await pool.query(
        `INSERT INTO pre_verified_cccd 
         (cccd_number_hash, phone_number, status, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [cccdNumberHash, testCCCD.phoneNumber, status, testCCCD.notes]
      );
      
      console.log(`✅ Added: ${testCCCD.cccdNumber} | ${testCCCD.phoneNumber} | Status: ${status}`);
      console.log(`   Hash: ${cccdNumberHash.slice(0, 20)}...`);
      console.log(`   Notes: ${testCCCD.notes}\n`);
    }
    
    // Verify insertion
    const result = await pool.query('SELECT COUNT(*) FROM pre_verified_cccd');
    console.log(`\n✅ Seed completed! Total records: ${result.rows[0].count}`);
    
    // Display summary
    console.log('\n📊 Summary by status:');
    const summary = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM pre_verified_cccd 
      GROUP BY status 
      ORDER BY status
    `);
    
    summary.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count}`);
    });
    
    console.log('\n🎯 Testing Instructions:');
    console.log('1. Use any CCCD number above with matching phone number');
    console.log('2. Call POST /api/verify/request-otp with cccdNumber + phoneNumber');
    console.log('3. Check backend console for OTP code (mock SMS)');
    console.log('4. Call POST /api/verify/confirm-otp with OTP');
    console.log('5. Receive verificationToken');
    console.log('6. Use token in POST /api/auth/register\n');
    
    console.log('📝 Example CCCD for QR code (pipe-separated format):');
    console.log(`${testCCCDs[0].cccdNumber}|001234567890||NGUYEN VAN TEST|01/01/1990|Nam|Ha Noi|01/01/2020\n`);
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run seed
seedPreVerifiedCCCD()
  .then(() => {
    console.log('✅ Seed script completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Seed script failed:', err);
    process.exit(1);
  });
