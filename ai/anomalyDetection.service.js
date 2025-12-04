/**
 * Anomaly Detection Service
 * 
 * Statistical AI-based anomaly detection for user logins
 * Analyzes: time patterns, IP history, User-Agent changes
 * Outputs: risk_score (0-1) and is_anomaly (boolean)
 */

/**
 * Calculate z-score for statistical anomaly detection
 * @param {number} value - Current value
 * @param {number} mean - Average value from history
 * @param {number} std - Standard deviation from history
 * @returns {number} Z-score
 */
function calculateZScore(value, mean, std) {
  if (std === 0) return 0;
  return Math.abs((value - mean) / std);
}

/**
 * Get risk score for time-based anomaly
 * @param {number} zScore - Z-score from time analysis
 * @returns {number} Risk score 0-1
 */
function getTimeRisk(zScore) {
  if (zScore <= 1) return 0.1;      // Normal time pattern
  if (zScore <= 2) return 0.3;      // Slightly unusual
  return 0.7;                        // Very unusual time
}

/**
 * Get risk score for IP-based anomaly
 * @param {boolean} isNewIP - Is this a new IP?
 * @returns {number} Risk score 0-1
 */
function getIPRisk(isNewIP) {
  return isNewIP ? 0.5 : 0;          // New IP is 50% risky, known IP is safe
}

/**
 * Get risk score for User-Agent-based anomaly
 * @param {boolean} isNewUA - Is this a new User-Agent?
 * @returns {number} Risk score 0-1
 */
function getUserAgentRisk(isNewUA) {
  return isNewUA ? 0.4 : 0;          // New UA is 40% risky, known UA is safe
}

/**
 * Combine individual risk scores into total risk
 * Formula: 1 - (1 - risk_time) * (1 - risk_ip) * (1 - risk_ua)
 * This way, multiple minor anomalies compound into higher risk
 * 
 * @param {number} riskTime - Time-based risk (0-1)
 * @param {number} riskIP - IP-based risk (0-1)
 * @param {number} riskUA - User-Agent-based risk (0-1)
 * @returns {number} Combined risk score (0-1)
 */
function combineRisks(riskTime, riskIP, riskUA) {
  const combined = 1 - (1 - riskTime) * (1 - riskIP) * (1 - riskUA);
  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, combined));
}

/**
 * Calculate login risk based on behavioral analysis
 * Statistically analyzes user's login history to detect anomalies
 * 
 * @param {Object} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @param {string} ipAddress - Current login IP
 * @param {string} userAgent - Current login User-Agent
 * @param {Date} loginAt - Login timestamp
 * @returns {Promise<Object>} { riskScore: 0-1, isAnomaly: boolean, details: {...} }
 */
async function calculateLoginRisk(pool, userId, ipAddress, userAgent, loginAt) {
  try {
    // Fetch recent login history (last 50 successful logins or 30 days)
    const historyQuery = `
      SELECT 
        DATE_EXTRACT('hour', login_time AT TIME ZONE 'UTC') as login_hour,
        ip_address,
        user_agent
      FROM login_logs
      WHERE user_id = $1
        AND status = 'success'
      ORDER BY login_time DESC
      LIMIT 50
    `;

    const historyResult = await pool.query(historyQuery, [userId]);
    const history = historyResult.rows;

    // If no history, return low-risk default
    if (history.length === 0) {
      return {
        riskScore: 0.2,
        isAnomaly: false,
        details: {
          reason: 'New user - no login history',
          riskTime: 0.1,
          riskIP: 0.1,
          riskUA: 0.0
        }
      };
    }

    // 1. TIME-BASED ANALYSIS
    // Extract hours from login history
    const loginHours = history.map(r => parseInt(r.login_hour) || 0);
    const meanHour = loginHours.reduce((a, b) => a + b, 0) / loginHours.length;
    
    // Calculate standard deviation
    const variance = loginHours.reduce((sum, h) => sum + Math.pow(h - meanHour, 2), 0) / loginHours.length;
    const stdHour = Math.sqrt(variance);

    // Current login hour (UTC)
    const currentHour = loginAt.getUTCHours();
    const timeZScore = calculateZScore(currentHour, meanHour, stdHour);
    const riskTime = getTimeRisk(timeZScore);

    // 2. IP-BASED ANALYSIS
    const knownIPs = new Set(history.map(r => r.ip_address));
    const isNewIP = !knownIPs.has(ipAddress);
    const riskIP = getIPRisk(isNewIP);

    // 3. USER-AGENT-BASED ANALYSIS
    const knownUAs = new Set(history.map(r => r.user_agent).filter(ua => ua));
    const isNewUA = !knownUAs.has(userAgent);
    const riskUA = getUserAgentRisk(isNewUA);

    // 4. COMBINE RISKS
    const riskScore = combineRisks(riskTime, riskIP, riskUA);
    const isAnomaly = riskScore >= 0.7;

    return {
      riskScore,
      isAnomaly,
      details: {
        timeAnalysis: {
          currentHour,
          meanHour: Math.round(meanHour * 100) / 100,
          stdHour: Math.round(stdHour * 100) / 100,
          zScore: Math.round(timeZScore * 100) / 100,
          riskScore: riskTime
        },
        ipAnalysis: {
          isNewIP,
          knownIPsCount: knownIPs.size,
          riskScore: riskIP
        },
        uaAnalysis: {
          isNewUA,
          knownUAsCount: knownUAs.size,
          riskScore: riskUA
        },
        combinedRiskScore: Math.round(riskScore * 1000) / 1000
      }
    };

  } catch (error) {
    console.error('Anomaly detection error:', error.message);
    // Fail gracefully - don't break login flow
    return {
      riskScore: 0.0,
      isAnomaly: false,
      details: {
        reason: 'Detection error - defaulting to safe',
        error: error.message
      }
    };
  }
}

module.exports = {
  calculateLoginRisk,
  combineRisks,
  getTimeRisk,
  getIPRisk,
  getUserAgentRisk,
  calculateZScore
};
