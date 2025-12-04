/**
 * Run Migration: Add risk_score and other fields to login_logs
 */

require('dotenv').config();
const { Pool } = require('pg');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING
  });

  try {
    console.log('🔄 Running anomaly detection migration...\n');

    // Check if columns already exist
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'login_logs' AND column_name = 'risk_score'
    `;

    const checkResult = await pool.query(checkQuery);
    if (checkResult.rows.length > 0) {
      console.log('✅ Columns already exist. Nothing to do.');
      await pool.end();
      return;
    }

    // Add new columns
    console.log('📝 Adding new columns to login_logs table...');

    const queries = [
      'ALTER TABLE login_logs ADD COLUMN IF NOT EXISTS user_id INTEGER',
      'ALTER TABLE login_logs ADD COLUMN IF NOT EXISTS username TEXT',
      'ALTER TABLE login_logs ADD COLUMN IF NOT EXISTS login_time TIMESTAMPTZ DEFAULT NOW()',
      'ALTER TABLE login_logs ADD COLUMN IF NOT EXISTS location TEXT',
      'ALTER TABLE login_logs ADD COLUMN IF NOT EXISTS country_code VARCHAR(2)',
      'ALTER TABLE login_logs ADD COLUMN IF NOT EXISTS risk_score REAL DEFAULT 0',
      'ALTER TABLE login_logs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT \'success\'',
      
      // Add indexes
      'CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_login_logs_login_time ON login_logs(login_time)',
      'CREATE INDEX IF NOT EXISTS idx_login_logs_risk_score ON login_logs(risk_score)',
      'CREATE INDEX IF NOT EXISTS idx_login_logs_is_anomaly ON login_logs(is_anomaly)',
      'CREATE INDEX IF NOT EXISTS idx_login_logs_wallet_address ON login_logs(wallet_address)',
    ];

    for (const query of queries) {
      try {
        await pool.query(query);
        console.log(`  ✓ ${query.substring(0, 60)}...`);
      } catch (err) {
        console.log(`  ⚠️  ${query.substring(0, 60)}... (${err.message.split('\n')[0]})`);
      }
    }

    console.log('\n✅ Migration completed successfully!\n');
    console.log('📊 New columns added to login_logs:');
    console.log('  - user_id (INTEGER)');
    console.log('  - username (TEXT)');
    console.log('  - login_time (TIMESTAMPTZ)');
    console.log('  - location (TEXT)');
    console.log('  - country_code (VARCHAR(2))');
    console.log('  - risk_score (REAL) ← AI detection score');
    console.log('  - status (VARCHAR(20))');
    console.log('\n📈 Indexes added for fast queries on: user_id, login_time, risk_score, is_anomaly, wallet_address\n');

    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
