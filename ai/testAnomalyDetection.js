/**
 * Test Anomaly Detection Service
 * Run this to test the AI detection logic
 */

const { calculateLoginRisk } = require('./anomalyDetection.service');
const { Pool } = require('pg');
require('dotenv').config();

async function testAnomalyDetection() {
  const pool = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING
  });

  try {
    console.log('\n🧪 Testing Anomaly Detection Service\n');

    // Test 1: New user (should have low risk)
    console.log('Test 1: New user login (no history)');
    const result1 = await calculateLoginRisk(
      pool,
      999999, // Non-existent user
      '203.162.84.123',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      new Date()
    );
    console.log('Result:', result1);
    console.log('Expected: riskScore ~0.2, isAnomaly = false\n');

    // Test 2: Existing user with normal login
    console.log('Test 2: Get an existing user ID from database');
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      console.log('⚠️  No users in database. Run this after creating some test users.');
      await pool.end();
      return;
    }

    const userId = userResult.rows[0].id;
    console.log(`Found user ID: ${userId}`);

    // Create multiple login records to build history
    console.log('\nCreating test login history...');
    const baseTime = new Date();
    const testLogins = [
      { hour: 8, ip: '192.168.1.100', ua: 'Chrome/Windows' },
      { hour: 9, ip: '192.168.1.100', ua: 'Chrome/Windows' },
      { hour: 10, ip: '192.168.1.100', ua: 'Chrome/Windows' },
      { hour: 8, ip: '192.168.1.101', ua: 'Chrome/Windows' },
      { hour: 9, ip: '192.168.1.101', ua: 'Firefox/Windows' },
    ];

    for (const login of testLogins) {
      const loginTime = new Date(baseTime);
      loginTime.setUTCHours(login.hour);

      await pool.query(`
        INSERT INTO login_logs (
          user_id, username, wallet_address, ip_address, user_agent,
          location, country_code, risk_score, is_anomaly, status, login_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        userId,
        `User${userId}`,
        `0x${'0'.repeat(40)}`,
        login.ip,
        login.ua,
        'Test Location',
        'VN',
        0,
        false,
        'success',
        loginTime
      ]);
    }

    console.log('Created 5 test login records\n');

    // Test 3: Normal login (same time, same IP, same UA)
    console.log('Test 3: Normal login (same IP, same time, same UA)');
    const result3 = await calculateLoginRisk(
      pool,
      userId,
      '192.168.1.100',
      'Chrome/Windows',
      new Date(baseTime.getTime() + 24 * 60 * 60 * 1000) // Next day, 9 AM
    );
    console.log('Result:', result3);
    console.log('Expected: riskScore close to 0, isAnomaly = false\n');

    // Test 4: Unusual time
    console.log('Test 4: Unusual login time (3 AM - uncommon)');
    const unusualTime = new Date(baseTime);
    unusualTime.setUTCHours(3);
    const result4 = await calculateLoginRisk(
      pool,
      userId,
      '192.168.1.100',
      'Chrome/Windows',
      unusualTime
    );
    console.log('Result:', result4);
    console.log('Expected: Higher riskScore due to unusual time\n');

    // Test 5: New IP
    console.log('Test 5: New IP address');
    const result5 = await calculateLoginRisk(
      pool,
      userId,
      '203.162.84.123', // Completely new IP
      'Chrome/Windows',
      new Date(baseTime.getTime() + 24 * 60 * 60 * 1000)
    );
    console.log('Result:', result5);
    console.log('Expected: Higher riskScore due to new IP\n');

    // Test 6: New User-Agent
    console.log('Test 6: New User-Agent (new device/browser)');
    const result6 = await calculateLoginRisk(
      pool,
      userId,
      '192.168.1.100',
      'Safari/Mac (completely new UA)',
      new Date(baseTime.getTime() + 24 * 60 * 60 * 1000)
    );
    console.log('Result:', result6);
    console.log('Expected: Higher riskScore due to new UA\n');

    // Test 7: Multiple anomalies combined
    console.log('Test 7: Multiple anomalies (new IP + new UA + unusual time)');
    const result7 = await calculateLoginRisk(
      pool,
      userId,
      '203.162.84.200', // New IP
      'Safari/iPhone (new UA)', // New UA
      new Date(baseTime.getTime() + 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000) // 3 AM UTC
    );
    console.log('Result:', result7);
    console.log('Expected: Very high riskScore, isAnomaly = true\n');

    console.log('✅ All tests completed!\n');

    // Cleanup: delete test data
    console.log('Cleaning up test data...');
    await pool.query('DELETE FROM login_logs WHERE user_id = $1', [userId]);
    console.log('✅ Test data cleaned up\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  testAnomalyDetection();
}

module.exports = { testAnomalyDetection };
