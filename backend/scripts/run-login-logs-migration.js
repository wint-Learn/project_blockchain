require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ 
  connectionString: process.env.DB_CONNECTION_STRING 
});

const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running login_logs migration...');
    
    const sqlFile = path.join(__dirname, 'migrate-login-logs.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    await client.query(sql);
    
    console.log('✅ login_logs table created successfully!');
    console.log('📊 Indexes created for performance');
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
