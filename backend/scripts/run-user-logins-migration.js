require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING,
});

async function runMigration() {
  try {
    console.log('🔄 Running user_logins table migration...\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'migrate-user-logins.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute migration
    await pool.query(sql);
    console.log('✅ user_logins table created successfully');

    // Verify table
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_logins'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
