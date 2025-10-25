/**
 * Clean Slate Script - Drop all tables and recreate from scratch
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING
});

async function cleanSlate() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Starting clean slate operation...\n');
    
    // Drop all tables
    console.log('📦 Dropping all tables...');
    await client.query('BEGIN');
    
    await client.query(`
      DROP TABLE IF EXISTS 
        admin_action_logs,
        service_requests,
        services,
        admin_users,
        otp_codes,
        pre_verified_cccd,
        login_logs,
        audit_logs,
        users
      CASCADE;
    `);
    
    await client.query('COMMIT');
    console.log('✅ All tables dropped\n');
    
    // Re-create base schema
    console.log('📄 Running base schema.sql...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query('BEGIN');
    await client.query(schemaSql);
    await client.query('COMMIT');
    console.log('✅ Base schema created\n');
    
    // Run Phase C migration
    console.log('📄 Running Phase C migration...');
    const phaseCPath = path.join(__dirname, 'migrate-phase-c.sql');
    const phaseCsql = fs.readFileSync(phaseCPath, 'utf8');
    
    await client.query('BEGIN');
    await client.query(phaseCsql);
    await client.query('COMMIT');
    console.log('✅ Phase C migration completed\n');
    
    // Verify
    console.log('🔍 Verifying tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log(`✅ Created ${result.rows.length} tables:`);
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check admin user
    const adminCheck = await client.query('SELECT username, role FROM admin_users LIMIT 1');
    if (adminCheck.rows.length > 0) {
      console.log(`\n👤 Default admin: ${adminCheck.rows[0].username} (${adminCheck.rows[0].role})`);
      console.log('   Password: admin123');
    }
    
    // Check services
    const servicesCheck = await client.query('SELECT COUNT(*) as count FROM services');
    console.log(`🛠️  Demo services: ${servicesCheck.rows[0].count}`);
    
    console.log('\n✨ Clean slate complete! Database is ready.');
    console.log('\n📝 Next steps:');
    console.log('   1. Test registration flow');
    console.log('   2. Start implementing verification APIs');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Clean slate failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanSlate();
