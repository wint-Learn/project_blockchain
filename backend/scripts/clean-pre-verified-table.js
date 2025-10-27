/**
 * Cleanup pre_verified_cccd table
 * 1. Delete records with NULL cccd_number
 * 2. Drop unused columns: place_of_origin, place_of_residence
 */

require('dotenv').config();
const { Pool } = require('pg');

async function cleanup() {
  const pool = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING,
  });

  try {
    console.log('🧹 Cleaning up pre_verified_cccd table...\n');

    // 1. Delete records with NULL cccd_number
    console.log('1️⃣ Deleting records with NULL cccd_number...');
    const deleteResult = await pool.query(`
      DELETE FROM pre_verified_cccd 
      WHERE cccd_number IS NULL
      RETURNING id, phone_number
    `);
    console.log(`   ✅ Deleted ${deleteResult.rowCount} records:`);
    deleteResult.rows.forEach(row => {
      console.log(`      - ID ${row.id}: ${row.phone_number}`);
    });

    // 2. Drop place_of_origin column
    console.log('\n2️⃣ Dropping column place_of_origin...');
    await pool.query(`
      ALTER TABLE pre_verified_cccd 
      DROP COLUMN IF EXISTS place_of_origin
    `);
    console.log('   ✅ Dropped place_of_origin');

    // 3. Drop place_of_residence column
    console.log('\n3️⃣ Dropping column place_of_residence...');
    await pool.query(`
      ALTER TABLE pre_verified_cccd 
      DROP COLUMN IF EXISTS place_of_residence
    `);
    console.log('   ✅ Dropped place_of_residence');

    // 4. Show final structure
    console.log('\n📋 Final table structure:');
    const columns = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'pre_verified_cccd' 
      ORDER BY ordinal_position
    `);
    
    columns.rows.forEach((row, idx) => {
      const length = row.character_maximum_length ? `(${row.character_maximum_length})` : '';
      const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`   ${idx + 1}. ${row.column_name}: ${row.data_type}${length} ${nullable}`);
    });

    // 5. Show remaining data
    console.log('\n📊 Remaining records:');
    const data = await pool.query(`
      SELECT id, cccd_number, phone_number, full_name, status 
      FROM pre_verified_cccd 
      ORDER BY id
    `);
    
    if (data.rows.length > 0) {
      data.rows.forEach(row => {
        console.log(`   ID ${row.id}: ${row.cccd_number} | ${row.full_name} | ${row.phone_number} | ${row.status}`);
      });
    } else {
      console.log('   (No records remaining)');
    }

    console.log('\n✅ Cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

cleanup();
