const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:1@localhost:5432/identity_db'
});

async function checkWallets() {
  try {
    const result = await pool.query(`
      SELECT wallet_address, cccd_number_hash, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('📋 Registered DIDs:');
    console.log('==================');
    
    if (result.rows.length === 0) {
      console.log('❌ No DIDs found. Database is empty.');
    } else {
      result.rows.forEach((u, i) => {
        console.log(`${i+1}. Address: ${u.wallet_address}`);
        console.log(`   CCCD Hash: ${u.cccd_number_hash || 'N/A'}`);
        console.log(`   Created: ${new Date(u.created_at).toLocaleString('vi-VN')}`);
        console.log('');
      });
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkWallets();
