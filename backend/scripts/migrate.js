// migrate.js - Chạy DB migration
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({ connectionString: process.env.DB_CONNECTION_STRING });

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🔄 Đang chạy migration...');
    
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(sql);
    
    console.log('✅ Migration hoàn tất!');
    console.log('📊 Các bảng đã tạo:');
    console.log('   - users (encrypted CCCD metadata)');
    console.log('   - login_logs (đăng nhập logs cho AI)');
    console.log('   - anomaly_rules (rules cho AI detection)');
    
    // Kiểm tra
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('\n📋 Danh sách tables:');
    result.rows.forEach(row => console.log(`   - ${row.table_name}`));
    
  } catch (error) {
    console.error('❌ Lỗi migration:', error.message);
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
