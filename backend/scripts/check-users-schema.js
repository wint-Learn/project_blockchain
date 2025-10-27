const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:1@localhost:5432/identity_db'
});

async function checkSchema() {
  try {
    // Get table structure
    console.log('\n📋 Users table structure:');
    const schema = await pool.query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'users' 
       ORDER BY ordinal_position`
    );
    console.table(schema.rows);
    
    // Get all users
    console.log('\n👥 All users:');
    const users = await pool.query('SELECT * FROM users LIMIT 10');
    console.table(users.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
