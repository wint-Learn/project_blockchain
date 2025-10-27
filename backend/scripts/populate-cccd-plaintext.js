/**
 * Populate cccd_number for existing records
 * Note: This is for DEMO only - in production you would NOT reverse hash!
 */

require('dotenv').config();
const { Pool } = require('pg');

// DEMO data mapping (chỉ dùng cho test)
const testCCCDs = {
  '0x5bf191c3e81ae3336b5fbb3d5d36bdc15cfa8b6ef958457e93a6c1781cba1ee0': '036202012345',
  '0x874aadb9e231b5c7c86439471fc1c5be88260995be47f72378c2ae5bcffb5f5d': '036202012346',
  // Add more mappings if you know them
};

async function populateCCCDNumbers() {
  const pool = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING,
  });

  try {
    console.log('🔄 Populating cccd_number for existing records...\n');

    // Get all records with NULL cccd_number
    const result = await pool.query(`
      SELECT id, cccd_number_hash, phone_number 
      FROM pre_verified_cccd 
      WHERE cccd_number IS NULL
      ORDER BY id
    `);

    console.log(`Found ${result.rows.length} records with NULL cccd_number\n`);

    let updated = 0;
    let skipped = 0;

    for (const row of result.rows) {
      const plaintext = testCCCDs[row.cccd_number_hash];
      
      if (plaintext) {
        await pool.query(
          'UPDATE pre_verified_cccd SET cccd_number = $1 WHERE id = $2',
          [plaintext, row.id]
        );
        console.log(`✅ ID ${row.id}: Updated with CCCD ${plaintext}`);
        updated++;
      } else {
        console.log(`⏭️  ID ${row.id}: Skipped (hash not in mapping) - ${row.cccd_number_hash.substring(0, 20)}...`);
        skipped++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📝 Total: ${result.rows.length}`);

    // Show updated data
    console.log('\n📋 Updated records:');
    const updated_data = await pool.query(`
      SELECT id, cccd_number, phone_number, status 
      FROM pre_verified_cccd 
      WHERE cccd_number IS NOT NULL
      ORDER BY id
    `);
    
    updated_data.rows.forEach(row => {
      console.log(`   ID ${row.id}: ${row.cccd_number} | ${row.phone_number} | ${row.status}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

populateCCCDNumbers();
