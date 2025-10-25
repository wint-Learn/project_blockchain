/**
 * Phase C Migration Runner
 * Executes migrate-phase-c.sql to set up admin panel tables
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Use connection string if available, otherwise fall back to individual params
const pool = process.env.DB_CONNECTION_STRING 
  ? new Pool({ connectionString: process.env.DB_CONNECTION_STRING })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'identity_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Phase C migration...\n');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'migrate-phase-c.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Executing migration SQL...');
    console.log('   (This may take a moment...)\n');
    
    await client.query('BEGIN');
    
    try {
      await client.query(sql);
    } catch (err) {
      // Try to extract line number from error
      const match = err.message.match(/line (\d+)/);
      if (match) {
        const lineNum = parseInt(match[1]);
        const lines = sql.split('\n');
        console.error(`\n❌ Error at or near line ${lineNum}:`);
        console.error('Context:');
        const start = Math.max(0, lineNum - 3);
        const end = Math.min(lines.length, lineNum + 2);
        for (let i = start; i < end; i++) {
          const prefix = i === lineNum - 1 ? '>>> ' : '    ';
          console.error(`${prefix}${i+1}: ${lines[i]}`);
        }
      }
      throw err;
    }
    
    await client.query('COMMIT');
    
    console.log('✅ Phase C migration completed successfully!\n');
    
    // Verify tables created
    console.log('🔍 Verifying tables...');
    const tableCheckQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'pre_verified_cccd',
        'otp_codes',
        'admin_users',
        'services',
        'service_requests',
        'audit_logs'
      )
      ORDER BY table_name;
    `;
    
    const result = await client.query(tableCheckQuery);
    console.log(`✅ Created ${result.rows.length} tables:`);
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check admin user
    const adminCheck = await client.query('SELECT username, role FROM admin_users LIMIT 1');
    if (adminCheck.rows.length > 0) {
      console.log(`\n👤 Default admin created: ${adminCheck.rows[0].username} (${adminCheck.rows[0].role})`);
      console.log('   Password: admin123 (CHANGE THIS IN PRODUCTION!)');
    }
    
    // Check services
    const servicesCheck = await client.query('SELECT COUNT(*) as count FROM services');
    console.log(`\n🛠️  Demo services created: ${servicesCheck.rows[0].count}`);
    
    console.log('\n✨ Migration complete! You can now:');
    console.log('   1. Start backend: cd backend && node src/server.js');
    console.log('   2. Login as admin: username=admin, password=admin123');
    console.log('   3. Import pre-verified CCCD via admin panel');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration();
