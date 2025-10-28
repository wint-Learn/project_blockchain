const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:1@localhost:5432/identity_db'
});

async function checkSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'service_requests'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Cấu trúc bảng service_requests:');
    console.log('='.repeat(60));
    
    if (result.rows.length === 0) {
      console.log('❌ Bảng service_requests chưa tồn tại!');
    } else {
      result.rows.forEach(row => {
        const nullable = row.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
        console.log(`✓ ${row.column_name.padEnd(25)} ${row.data_type.padEnd(20)} ${nullable}`);
      });
    }
    
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
