require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DB_CONNECTION_STRING });

async function seedLoginLogs() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding login_logs with test data...');
    
    // Get existing users
    const usersResult = await client.query('SELECT id, wallet_address FROM users LIMIT 2');
    
    if (usersResult.rows.length === 0) {
      console.log('⚠️  No users found. Please register some users first.');
      return;
    }
    
    const testLogs = [
      // Normal logins
      {
        user_id: usersResult.rows[0].id,
        username: `User${usersResult.rows[0].id}`,
        wallet_address: usersResult.rows[0].wallet_address,
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
        location: 'Hanoi, Vietnam',
        country_code: 'VN',
        is_anomaly: false,
        status: 'success'
      },
      {
        user_id: usersResult.rows[0].id,
        username: `User${usersResult.rows[0].id}`,
        wallet_address: usersResult.rows[0].wallet_address,
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
        location: 'Hanoi, Vietnam',
        country_code: 'VN',
        is_anomaly: false,
        status: 'success'
      },
      // Anomaly: New IP from different country
      {
        user_id: usersResult.rows[0].id,
        username: `User${usersResult.rows[0].id}`,
        wallet_address: usersResult.rows[0].wallet_address,
        ip_address: '203.113.45.22',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        location: 'Singapore, Singapore',
        country_code: 'SG',
        is_anomaly: true,
        anomaly_reason: 'Quốc gia mới chưa từng đăng nhập',
        status: 'suspicious'
      },
      // Failed login
      {
        user_id: usersResult.rows[0].id,
        username: `User${usersResult.rows[0].id}`,
        wallet_address: usersResult.rows[0].wallet_address,
        ip_address: '45.77.88.199',
        user_agent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/90.0',
        location: 'Unknown',
        country_code: 'XX',
        is_anomaly: true,
        anomaly_reason: 'IP mới chưa từng đăng nhập; Quốc gia mới chưa từng đăng nhập',
        status: 'failed'
      }
    ];
    
    // Add second user logs if exists
    if (usersResult.rows.length > 1) {
      testLogs.push({
        user_id: usersResult.rows[1].id,
        username: `User${usersResult.rows[1].id}`,
        wallet_address: usersResult.rows[1].wallet_address,
        ip_address: '192.168.1.105',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0',
        location: 'Ho Chi Minh, Vietnam',
        country_code: 'VN',
        is_anomaly: false,
        status: 'success'
      });
    }
    
    for (const log of testLogs) {
      await client.query(`
        INSERT INTO login_logs (
          user_id, username, wallet_address, ip_address, user_agent,
          location, country_code, is_anomaly, anomaly_reason, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        log.user_id,
        log.username,
        log.wallet_address,
        log.ip_address,
        log.user_agent,
        log.location,
        log.country_code,
        log.is_anomaly,
        log.anomaly_reason || null,
        log.status
      ]);
    }
    
    console.log(`✅ Seeded ${testLogs.length} login logs`);
    
    // Show stats
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_anomaly = true) as anomalies,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM login_logs
    `);
    
    console.log('\n📊 Login logs statistics:');
    console.log(statsResult.rows[0]);
    
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedLoginLogs();
