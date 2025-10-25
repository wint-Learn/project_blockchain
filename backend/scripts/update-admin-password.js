require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: process.env.DB_CONNECTION_STRING });

async function updateAdminPassword() {
  try {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    
    console.log('Updating admin password...');
    console.log('New hash:', hash);
    
    await pool.query(
      'UPDATE admin_users SET password_hash = $1 WHERE username = $2',
      [hash, 'admin']
    );
    
    console.log('✅ Password updated successfully!');
    
    // Verify
    const result = await pool.query(
      'SELECT id, username, password_hash FROM admin_users WHERE username = $1',
      ['admin']
    );
    
    const admin = result.rows[0];
    const isValid = await bcrypt.compare(password, admin.password_hash);
    console.log('Verification:', isValid ? '✅ Password matches!' : '❌ Password does not match');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
  }
}

updateAdminPassword();
