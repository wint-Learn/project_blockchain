/**
 * Admin Anomaly Detection Controller
 * API endpoints for viewing and analyzing anomalous logins
 */

const { getAnomalousLogins, getUserLoginStats } = require('../../../../ai/loginLogs.repository');

/**
 * GET /api/admin/anomalies
 * Get list of anomalous logins (admin view)
 */
async function getAnomalies(req, res) {
  const { pool, logger } = req.app.locals;
  
  try {
    const { userId, fromDate, toDate, limit = 50, offset = 0 } = req.query;
    
    const filters = {
      userId: userId ? parseInt(userId) : null,
      fromDate: fromDate ? new Date(fromDate) : null,
      toDate: toDate ? new Date(toDate) : null,
      limit: Math.min(parseInt(limit) || 50, 100), // Max 100 per page
      offset: parseInt(offset) || 0
    };
    
    const result = await getAnomalousLogins(pool, filters);
    
    logger.info('Admin viewed anomalies', {
      total: result.total,
      page: result.page,
      filters: { userId: filters.userId }
    });
    
    return res.json({
      success: true,
      data: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        logs: result.logs.map(log => ({
          id: log.id,
          userId: log.user_id,
          username: log.username,
          walletAddress: log.wallet_address,
          loginTime: log.login_time,
          ipAddress: log.ip_address,
          location: log.location,
          countryCode: log.country_code,
          riskScore: log.risk_score,
          isAnomaly: log.is_anomaly,
          anomalyReason: log.anomaly_reason,
          userAgent: log.user_agent
        }))
      }
    });
    
  } catch (error) {
    logger.error('❌ Get anomalies error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh sách anomalies',
      error: error.message
    });
  }
}

/**
 * GET /api/admin/user-login-stats/:userId
 * Get login statistics for a specific user
 */
async function getUserStats(req, res) {
  const { pool, logger } = req.app.locals;
  
  try {
    const { userId } = req.params;
    
    const stats = await getUserLoginStats(pool, parseInt(userId));
    
    logger.info('Admin viewed user login stats', { userId });
    
    return res.json({
      success: true,
      data: {
        userId: parseInt(userId),
        totalLogins: parseInt(stats.total_logins) || 0,
        successfulLogins: parseInt(stats.successful_logins) || 0,
        anomalousLogins: parseInt(stats.anomalous_logins) || 0,
        uniqueIPs: parseInt(stats.unique_ips) || 0,
        uniqueCountries: parseInt(stats.unique_countries) || 0,
        avgRiskScore: parseFloat(stats.avg_risk_score) || 0,
        maxRiskScore: parseFloat(stats.max_risk_score) || 0,
        firstLogin: stats.first_login,
        lastLogin: stats.last_login
      }
    });
    
  } catch (error) {
    logger.error('❌ Get user stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải thống kê người dùng',
      error: error.message
    });
  }
}

/**
 * GET /api/admin/anomaly-summary
 * Get summary statistics of all anomalies
 */
async function getAnomalySummary(req, res) {
  const { pool, logger } = req.app.locals;
  
  try {
    // Get summary stats
    const summaryQuery = `
      SELECT
        COUNT(*) as total_anomalies,
        COUNT(DISTINCT user_id) as affected_users,
        AVG(risk_score) as avg_risk_score,
        MAX(risk_score) as max_risk_score,
        COUNT(CASE WHEN risk_score >= 0.9 THEN 1 END) as critical_anomalies
      FROM login_logs
      WHERE is_anomaly = true
        AND login_time > NOW() - INTERVAL '7 days'
    `;
    
    const result = await pool.query(summaryQuery);
    const summary = result.rows[0];
    
    // Top anomalous users
    const topUsersQuery = `
      SELECT
        user_id,
        username,
        COUNT(*) as anomaly_count,
        AVG(risk_score) as avg_risk_score
      FROM login_logs
      WHERE is_anomaly = true
        AND login_time > NOW() - INTERVAL '7 days'
      GROUP BY user_id, username
      ORDER BY anomaly_count DESC
      LIMIT 10
    `;
    
    const topUsersResult = await pool.query(topUsersQuery);
    
    // Top anomalous countries
    const topCountriesQuery = `
      SELECT
        country_code,
        location,
        COUNT(*) as anomaly_count,
        AVG(risk_score) as avg_risk_score
      FROM login_logs
      WHERE is_anomaly = true
        AND login_time > NOW() - INTERVAL '7 days'
      GROUP BY country_code, location
      ORDER BY anomaly_count DESC
      LIMIT 10
    `;
    
    const topCountriesResult = await pool.query(topCountriesQuery);
    
    logger.info('Admin viewed anomaly summary');
    
    return res.json({
      success: true,
      data: {
        period: 'Last 7 days',
        summary: {
          totalAnomalies: parseInt(summary.total_anomalies) || 0,
          affectedUsers: parseInt(summary.affected_users) || 0,
          avgRiskScore: parseFloat(summary.avg_risk_score) || 0,
          maxRiskScore: parseFloat(summary.max_risk_score) || 0,
          criticalAnomalies: parseInt(summary.critical_anomalies) || 0
        },
        topAnomalousUsers: topUsersResult.rows.map(row => ({
          userId: row.user_id,
          username: row.username,
          anomalyCount: parseInt(row.anomaly_count),
          avgRiskScore: parseFloat(row.avg_risk_score)
        })),
        topAnomalousCountries: topCountriesResult.rows.map(row => ({
          countryCode: row.country_code,
          location: row.location,
          anomalyCount: parseInt(row.anomaly_count),
          avgRiskScore: parseFloat(row.avg_risk_score)
        }))
      }
    });
    
  } catch (error) {
    logger.error('Get anomaly summary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải tóm tắt anomalies',
      error: error.message
    });
  }
}

module.exports = {
  getAnomalies,
  getUserStats,
  getAnomalySummary
};
