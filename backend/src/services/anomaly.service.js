/**
 * Anomaly Detection Service
 * Phát hiện hành vi bất thường khi đăng nhập
 */

/**
 * Detect anomaly based on rules
 * @param {Pool} pool - PostgreSQL pool
 * @param {string} walletAddress - User wallet address
 * @param {string} currentIp - Current IP address
 * @returns {Promise<{isAnomaly: boolean, score: number, reason: string|null}>}
 */
async function detectAnomaly(pool, walletAddress, currentIp) {
  try {
    // Rule 1: IP change in 24h
    const ipChangeResult = await pool.query(
      `SELECT COUNT(DISTINCT ip_address) as ip_count
       FROM login_logs
       WHERE wallet_address = $1 
       AND timestamp > NOW() - INTERVAL '24 hours'`,
      [walletAddress]
    );
    const ipCount = parseInt(ipChangeResult.rows[0]?.ip_count || 0);
    
    // Rule 2: Login frequency in 1h
    const freqResult = await pool.query(
      `SELECT COUNT(*) as login_count
       FROM login_logs
       WHERE wallet_address = $1
       AND timestamp > NOW() - INTERVAL '1 hour'`,
      [walletAddress]
    );
    const loginCount = parseInt(freqResult.rows[0]?.login_count || 0);
    
    // Calculate anomaly score
    let score = 0;
    const reasons = [];
    
    if (ipCount > 3) {
      score += 0.4;
      reasons.push(`IP thay đổi ${ipCount} lần trong 24h`);
    }
    
    if (loginCount > 10) {
      score += 0.5;
      reasons.push(`Đăng nhập ${loginCount} lần trong 1h`);
    }
    
    // Night time login (0-5am VN = UTC+7)
    const hour = new Date().getUTCHours();
    const vnHour = (hour + 7) % 24;
    if (vnHour >= 0 && vnHour < 5) {
      score += 0.2;
      reasons.push('Đăng nhập vào giờ đêm (0-5am)');
    }
    
    return {
      isAnomaly: score >= 0.5,
      score: Math.min(score, 1.0),
      reason: reasons.join(', ') || null
    };
  } catch (error) {
    // Silent fail for anomaly detection
    console.error('Anomaly detection error:', error);
    return { isAnomaly: false, score: 0, reason: null };
  }
}

module.exports = { detectAnomaly };
