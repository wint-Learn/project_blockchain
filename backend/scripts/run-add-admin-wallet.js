/**
 * Add wallet_address to admin_users table
 * Run: node scripts/run-add-admin-wallet.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

// Use connection string from .env
const connectionString = process.env.DB_CONNECTION_STRING || 'postgres://postgres:1@localhost:5432/identity_db';

const pool = new Pool({
  connectionString
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('📦 Starting migration: Add wallet_address to admin_users...\n');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'migrate-add-admin-wallet.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute migration
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ Admin wallet_address column added');
    console.log('✅ Default admin wallet: 0x90F79bf6EB2c4f870365E785982E1f101E93b906');
    console.log('\n📝 Note: Đây là Ganache account index 0');
    console.log('   Private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
    console.log('   (Chỉ dùng cho development, KHÔNG dùng production!)\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
