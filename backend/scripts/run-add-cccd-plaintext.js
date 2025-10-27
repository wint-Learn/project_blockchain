/**
 * Migration: Add cccd_number plaintext column
 */

require('dotenv').config();
const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING,
  });

  try {
    console.log('🔄 Running migration: Add cccd_number plaintext column...\n');

    // 1. Add cccd_number column
    await pool.query(`
      ALTER TABLE pre_verified_cccd 
      ADD COLUMN IF NOT EXISTS cccd_number VARCHAR(12)
    `);
    console.log('✅ Added cccd_number column');

    // 2. Add index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_pre_verified_cccd_number 
      ON pre_verified_cccd(cccd_number)
    `);
    console.log('✅ Added index on cccd_number');

    // 3. Make cccd_number_hash nullable
    await pool.query(`
      ALTER TABLE pre_verified_cccd 
      ALTER COLUMN cccd_number_hash DROP NOT NULL
    `);
    console.log('✅ Made cccd_number_hash nullable');

    // 4. Show current schema
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'pre_verified_cccd' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current schema:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

migrate();
