require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING,
});

async function addLockColumns() {
  try {
    console.log('Adding lock columns to users table...');
    
    // Thêm cột is_locked, locked_reason, locked_at
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS locked_reason TEXT,
      ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP
    `);
    
    console.log('✅ Successfully added lock columns to users table');
    
    // Kiểm tra lại schema
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('is_locked', 'locked_reason', 'locked_at')
      ORDER BY ordinal_position
    `);
    
    console.log('\nNew columns:');
    console.log(JSON.stringify(result.rows, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addLockColumns();
