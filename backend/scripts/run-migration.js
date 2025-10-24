// Run migration: Add cccd_number_hash column
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ 
  connectionString: process.env.DB_CONNECTION_STRING 
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting migration: Add cccd_number_hash column...');
    
    const sqlPath = path.join(__dirname, 'migrate-add-cccd-number-hash.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    
    // Verify
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Updated schema:');
    console.table(result.rows);
    
    const countResult = await client.query('SELECT COUNT(*) as total FROM users');
    console.log(`\n👥 Total users: ${countResult.rows[0].total}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error(err);
  process.exit(1);
});
