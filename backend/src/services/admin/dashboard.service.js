/**
 * Dashboard Service
 * Thống kê và analytics cho admin dashboard
 */

/**
 * Get dashboard statistics
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<Object>} Dashboard stats
 */
async function getDashboardStats(pool, logger) {
  try {
    const stats = {};
    
    // Total DIDs
    const totalDIDs = await pool.query('SELECT COUNT(*) FROM users');
    stats.totalDIDs = parseInt(totalDIDs.rows[0].count);
    
    // Today's registrations
    const todayRegistrations = await pool.query(
      `SELECT COUNT(*) FROM users 
       WHERE DATE(created_at) = CURRENT_DATE`
    );
    stats.todayRegistrations = parseInt(todayRegistrations.rows[0].count);
    
    // Pre-verified status breakdown
    const preVerifiedStats = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM pre_verified_cccd 
       GROUP BY status`
    );
    stats.preVerified = {
      pending: 0,
      verified: 0,
      blacklisted: 0,
      claimed: 0
    };
    preVerifiedStats.rows.forEach(row => {
      stats.preVerified[row.status] = parseInt(row.count);
    });
    
    // Anomaly alerts (last 24h)
    const anomalyAlerts = await pool.query(
      `SELECT COUNT(*) FROM login_logs 
       WHERE anomaly_score > 0.5 
       AND timestamp > NOW() - INTERVAL '24 hours'`
    );
    stats.anomalyAlerts = parseInt(anomalyAlerts.rows[0].count);
    
    // Recent logins (last 7 days, grouped by date)
    const recentLogins = await pool.query(
      `SELECT DATE(timestamp) as date, COUNT(*) as count 
       FROM login_logs 
       WHERE timestamp > NOW() - INTERVAL '7 days'
       GROUP BY DATE(timestamp)
       ORDER BY date ASC`
    );
    stats.recentLogins = recentLogins.rows;
    
    // Service requests breakdown
    const serviceStats = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM service_requests 
       GROUP BY status`
    );
    stats.serviceRequests = {
      pending: 0,
      approved: 0,
      rejected: 0
    };
    serviceStats.rows.forEach(row => {
      stats.serviceRequests[row.status] = parseInt(row.count);
    });
    
    logger.info('Dashboard stats retrieved');
    
    return stats;
    
  } catch (error) {
    logger.error('Failed to get dashboard stats', { error: error.message });
    throw error;
  }
}

module.exports = {
  getDashboardStats
};
