/**
 * Check pre_verified_cccd table structure
 */

require('dotenv').config();
const { Pool } = require('pg');

async function checkSchema() {
  const pool = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING,
  });

  try {
    console.log('🔍 Checking pre_verified_cccd table structure...\n');

    // Get all columns
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'pre_verified_cccd' 
      ORDER BY ordinal_position
    `);

    console.log('📋 Columns in pre_verified_cccd:');
    result.rows.forEach((row, idx) => {
      const length = row.character_maximum_length ? `(${row.character_maximum_length})` : '';
      const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`   ${idx + 1}. ${row.column_name}: ${row.data_type}${length} ${nullable}`);
    });

    // Check if cccd_number exists
    const hasCCCDNumber = result.rows.some(row => row.column_name === 'cccd_number');
    console.log(`\n${hasCCCDNumber ? '✅' : '❌'} Column 'cccd_number' ${hasCCCDNumber ? 'EXISTS' : 'DOES NOT EXIST'}`);

    // Show sample data
    console.log('\n📊 Sample data (first 3 rows):');
    const data = await pool.query(`
      SELECT id, cccd_number, cccd_number_hash, phone_number, status 
      FROM pre_verified_cccd 
      ORDER BY id 
      LIMIT 3
    `);
    
    if (data.rows.length > 0) {
      data.rows.forEach(row => {
        console.log(`   ID ${row.id}: ${row.cccd_number || 'NULL'} | ${row.cccd_number_hash?.substring(0, 20)}... | ${row.phone_number} | ${row.status}`);
      });
    } else {
      console.log('   (No data)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
