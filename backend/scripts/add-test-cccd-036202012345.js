require('dotenv').config();
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:1@localhost:5432/identity_db'
});

async function addTestCCCD() {
  const cccdNumber = '036202012345';
  const phoneNumber = '0987654321'; // Mock phone
  
  const cccdHash = '0x' + crypto.createHash('sha256').update(cccdNumber).digest('hex'); // ✅ Use SHA256 like backend
  
  console.log('📋 Details:');
  console.log('  CCCD Number:', cccdNumber);
  console.log('  CCCD Hash:', cccdHash);
  console.log('  Phone Number:', phoneNumber);
  console.log('');
  
  try {
    // Check if already exists
    const checkResult = await pool.query(
      'SELECT id, status FROM pre_verified_cccd WHERE cccd_number_hash = $1',
      [cccdHash]
    );
    
    if (checkResult.rows.length > 0) {
      console.log('⚠️  CCCD already exists with ID:', checkResult.rows[0].id);
      console.log('   Status:', checkResult.rows[0].status);
      console.log('');
      console.log('💡 Updating with citizen info instead...');
      
      // Update existing record
      await pool.query(`
        UPDATE pre_verified_cccd
        SET
          full_name = $1,
          date_of_birth = $2,
          gender = $3,
          address = $4,
          issue_date = $5,
          place_of_origin = $6,
          place_of_residence = $7,
          status = $8,
          verified_at = NULL,
          claimed_at = NULL
        WHERE cccd_number_hash = $9
      `, [
        'Nguyễn Văn A',
        '1990-01-15',
        'Nam',
        'Số 123, Đường ABC, Phường XYZ, Quận 1, TP.HCM',
        '2020-06-15',
        'Hà Nội',
        'TP. Hồ Chí Minh',
        'pending', // Reset to pending
        cccdHash
      ]);
      
      console.log('✅ Updated successfully!');
      
    } else {
      // Insert new record
      await pool.query(`
        INSERT INTO pre_verified_cccd (
          cccd_number_hash,
          phone_number,
          status,
          full_name,
          date_of_birth,
          gender,
          address,
          issue_date,
          place_of_origin,
          place_of_residence,
          notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        cccdHash,
        phoneNumber,
        'pending',
        'Nguyễn Văn A',
        '1990-01-15',
        'Nam',
        'Số 123, Đường ABC, Phường XYZ, Quận 1, TP.HCM',
        '2020-06-15',
        'Hà Nội',
        'TP. Hồ Chí Minh',
        'Test user for demo - CCCD 036202012345'
      ]);
      
      console.log('✅ Inserted successfully!');
    }
    
    // Display result
    const result = await pool.query(`
      SELECT 
        id, 
        phone_number, 
        full_name, 
        date_of_birth,
        gender,
        status,
        LEFT(cccd_number_hash, 20) as hash_prefix
      FROM pre_verified_cccd 
      WHERE cccd_number_hash = $1
    `, [cccdHash]);
    
    console.log('');
    console.log('📊 Final record:');
    console.table(result.rows);
    
    console.log('');
    console.log('✅ Ready to test with:');
    console.log('   CCCD: 036202012345');
    console.log('   Phone: 0901234567');
    console.log('   Expected auto-fill: Nguyễn Văn A, 1990-01-15, Nam');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addTestCCCD();
