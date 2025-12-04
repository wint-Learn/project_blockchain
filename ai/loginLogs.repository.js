/**
 * Repository for login logs
 * Handles all database operations for login history
 */

/**
 * Log a login with risk score and anomaly detection
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} data - Login data
 * @returns {Promise<Object>} Inserted log record
 */
async function createLoginLog(pool, data) {
  const {
    userId,
    username,
    walletAddress,
    ipAddress,
    userAgent,
    location,
    countryCode,
    riskScore = 0,
    isAnomaly = false,
    anomalyReason = null,
    status = 'success'
  } = data;

  const query = `
    INSERT INTO login_logs (
      user_id,
      username,
      wallet_address,
      ip_address,
      user_agent,
      location,
      country_code,
      risk_score,
      is_anomaly,
      anomaly_reason,
      status,
      login_time
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
    RETURNING *
  `;

  const values = [
    userId || null,
    username || null,
    walletAddress ? walletAddress.toLowerCase() : null,
    ipAddress,
    userAgent || null,
    location || null,
    countryCode || null,
    riskScore,
    isAnomaly,
    anomalyReason,
    status
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Get login history for a user
 * @param {Object} pool - PostgreSQL pool
 * @param {number} userId - User ID
 * @param {number} limit - Number of records to return
 * @returns {Promise<Array>} Login records
 */
async function getUserLoginHistory(pool, userId, limit = 50) {
  const query = `
    SELECT *
    FROM login_logs
    WHERE user_id = $1
    ORDER BY login_time DESC
    LIMIT $2
  `;

  const result = await pool.query(query, [userId, limit]);
  return result.rows;
}

/**
 * Get anomalous logins (admin view)
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} { total: number, logs: Array }
 */
async function getAnomalousLogins(pool, filters = {}) {
  const {
    userId = null,
    fromDate = null,
    toDate = null,
    limit = 50,
    offset = 0
  } = filters;

  let query = `
    SELECT *
    FROM login_logs
    WHERE is_anomaly = true
  `;

  const params = [];
  let paramIndex = 1;

  if (userId) {
    query += ` AND user_id = $${paramIndex}`;
    params.push(userId);
    paramIndex++;
  }

  if (fromDate) {
    query += ` AND login_time >= $${paramIndex}`;
    params.push(fromDate);
    paramIndex++;
  }

  if (toDate) {
    query += ` AND login_time <= $${paramIndex}`;
    params.push(toDate);
    paramIndex++;
  }

  // Get total count
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Get paginated results
  query += ` ORDER BY login_time DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit);
  params.push(offset);

  const result = await pool.query(query, params);

  return {
    total,
    logs: result.rows,
    page: Math.floor(offset / limit) + 1,
    pageSize: limit
  };
}

/**
 * Get login statistics for a user
 * @param {Object} pool - PostgreSQL pool
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Statistics
 */
async function getUserLoginStats(pool, userId) {
  const query = `
    SELECT
      COUNT(*) as total_logins,
      COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_logins,
      COUNT(CASE WHEN is_anomaly = true THEN 1 END) as anomalous_logins,
      COUNT(DISTINCT ip_address) as unique_ips,
      COUNT(DISTINCT country_code) as unique_countries,
      AVG(risk_score) as avg_risk_score,
      MAX(risk_score) as max_risk_score,
      MIN(login_time) as first_login,
      MAX(login_time) as last_login
    FROM login_logs
    WHERE user_id = $1
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0] || {};
}

module.exports = {
  createLoginLog,
  getUserLoginHistory,
  getAnomalousLogins,
  getUserLoginStats
};
