const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING || 'postgres://postgres:1@localhost:5432/identity_db'
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('📦 Starting migration: Add citizen information...\n');
    
    const sql = fs.readFileSync(path.join(__dirname, 'migrate-add-citizen-info.sql'), 'utf8');
    
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!\n');
    
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
