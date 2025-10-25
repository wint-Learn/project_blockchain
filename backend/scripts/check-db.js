require('dotenv').config();
const {Pool} = require('pg');

(async () => {
  const pool = new Pool({connectionString: process.env.DB_CONNECTION_STRING});
  
  // Check tables
  const tables = await pool.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname='public' 
    ORDER BY tablename
  `);
  
  console.log('📋 Existing tables:');
  tables.rows.forEach(t => console.log('  -', t.tablename));
  
  // Check for any FK constraints referencing admin_id
  const constraints = await pool.query(`
    SELECT 
      tc.table_name, 
      tc.constraint_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'admin_id'
  `);
  
  if (constraints.rows.length > 0) {
    console.log('\n⚠️  Found FK constraints on admin_id:');
    constraints.rows.forEach(c => {
      console.log(`  - ${c.table_name}.${c.column_name} (${c.constraint_name})`);
    });
  }
  
  await pool.end();
})();
