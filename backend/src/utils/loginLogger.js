/**
 * Login Logger Utility
 * Logs user logins with IP geolocation and anomaly detection
 * Uses free IP geolocation API: ip-api.com (no API key needed)
 */

const axios = require('axios');

/**
 * Get IP geolocation from free API
 * @param {string} ip - IP address
 * @returns {Promise<Object>} Location data
 */
async function getIPLocation(ip) {
  // Skip localhost/private IPs
  if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {
      city: 'Localhost',
      country: 'Vietnam',
      countryCode: 'VN',
      full: 'Localhost, Vietnam'
    };
  }

  try {
    // Free IP geolocation API - no key needed
    // Limit: 45 requests/minute
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,lat,lon`);
    
    if (response.data.status === 'success') {
      return {
        city: response.data.city || 'Unknown',
        country: response.data.country || 'Unknown',
        countryCode: response.data.countryCode || 'XX',
        full: `${response.data.city}, ${response.data.country}`
      };
    }
  } catch (error) {
    console.error('IP geolocation failed:', error.message);
  }
  
  return {
    city: 'Unknown',
    country: 'Unknown',
    countryCode: 'XX',
    full: 'Unknown'
  };
}

/**
 * Check if login is anomaly based on user history
 * @param {Object} pool - Database pool
 * @param {number} userId - User ID
 * @param {string} ip - Current IP
 * @param {string} countryCode - Current country code
 * @returns {Promise<Object>} { isAnomaly, reason }
 */
async function detectAnomaly(pool, userId, ip, countryCode) {
  try {
    // Get user's login history (last 30 days)
    const historyQuery = `
      SELECT DISTINCT ip_address, country_code 
      FROM login_logs 
      WHERE user_id = $1 
        AND login_time > NOW() - INTERVAL '30 days'
        AND status = 'success'
      LIMIT 50
    `;
    
    const result = await pool.query(historyQuery, [userId]);
    
    // New user - no history
    if (result.rows.length === 0) {
      return { isAnomaly: false, reason: null };
    }
    
    const knownIPs = result.rows.map(r => r.ip_address);
    const knownCountries = [...new Set(result.rows.map(r => r.country_code))];
    
    // Check for anomalies
    const reasons = [];
    
    // 1. New IP address
    if (!knownIPs.includes(ip)) {
      reasons.push('IP mới chưa từng đăng nhập');
    }
    
    // 2. New country
    if (!knownCountries.includes(countryCode) && countryCode !== 'XX') {
      reasons.push('Quốc gia mới chưa từng đăng nhập');
    }
    
    // 3. Unusual time (3am - 5am Vietnam time)
    const hour = new Date().getHours();
    if (hour >= 3 && hour <= 5) {
      reasons.push('Đăng nhập vào giờ bất thường (3-5 giờ sáng)');
    }
    
    return {
      isAnomaly: reasons.length > 0,
      reason: reasons.length > 0 ? reasons.join('; ') : null
    };
    
  } catch (error) {
    console.error('Anomaly detection failed:', error.message);
    return { isAnomaly: false, reason: null };
  }
}

/**
 * Log a login attempt
 * @param {Object} pool - Database pool
 * @param {Object} data - Login data
 * @returns {Promise<void>}
 */
async function logLogin(pool, data) {
  const {
    userId,
    username,
    walletAddress,
    ip,
    userAgent,
    status = 'success'
  } = data;
  
  try {
    // Get IP location
    const location = await getIPLocation(ip);
    
    // Detect anomaly (only for successful logins)
    let isAnomaly = false;
    let anomalyReason = null;
    
    if (status === 'success' && userId) {
      const anomaly = await detectAnomaly(pool, userId, ip, location.countryCode);
      isAnomaly = anomaly.isAnomaly;
      anomalyReason = anomaly.reason;
    }
    
    // Insert log
    const query = `
      INSERT INTO login_logs (
        user_id, 
        username, 
        wallet_address, 
        ip_address, 
        user_agent, 
        location, 
        country_code,
        is_anomaly, 
        anomaly_reason, 
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;
    
    const values = [
      userId || null,
      username || null,
      walletAddress ? walletAddress.toLowerCase() : null,
      ip,
      userAgent || null,
      location.full,
      location.countryCode,
      isAnomaly,
      anomalyReason,
      status
    ];
    
    await pool.query(query, values);
    
    console.log(`✅ Login logged: ${username || walletAddress} from ${location.full}${isAnomaly ? ' [ANOMALY]' : ''}`);
    
  } catch (error) {
    console.error('Failed to log login:', error.message);
    // Don't throw - logging failure shouldn't break login
  }
}

module.exports = {
  logLogin,
  getIPLocation,
  detectAnomaly
};
