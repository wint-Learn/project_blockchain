require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: process.env.DB_CONNECTION_STRING });

async function checkAdminPassword() {
  try {
    const result = await pool.query(
      'SELECT id, username, password_hash FROM admin_users WHERE username = $1',
      ['admin']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    const admin = result.rows[0];
    console.log('✅ Admin user found:', { id: admin.id, username: admin.username });
    console.log('Password hash:', admin.password_hash);
    
    // Test password
    const isValid = await bcrypt.compare('admin123', admin.password_hash);
    console.log('Password "admin123" valid?', isValid);
    
    // Generate correct hash
    const correctHash = await bcrypt.hash('admin123', 10);
    console.log('\nCorrect hash for "admin123":', correctHash);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
  }
}

checkAdminPassword();
