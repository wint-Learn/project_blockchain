/**
 * Admin Logs Controller
 * Xử lý xem và xuất login logs với IP geolocation
 */

/**
 * Get login logs with statistics
 * GET /api/admin/login-logs
 */
async function getLoginLogs(req, res) {
  try {
    const { address, limit = 100 } = req.query;
    const pool = req.app.locals.pool;
    const logger = req.app.locals.logger;
    
    logger.info('Admin viewing login logs', { address: address || 'all', limit });
    
    // Get login logs
    let query = `
      SELECT 
        ll.id,
        ll.user_id,
        ll.username,
        ll.wallet_address,
        ll.login_time,
        ll.ip_address,
        ll.user_agent,
        ll.location,
        ll.country_code,
        ll.is_anomaly,
        ll.anomaly_reason,
        ll.status
      FROM login_logs ll
    `;
    const params = [];
    
    if (address) {
      query += ' WHERE ll.wallet_address = $1';
      params.push(address.toLowerCase());
    }
    
    query += ` ORDER BY ll.login_time DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));
    
    const logsResult = await pool.query(query, params);
    
    // Get statistics
    let statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_anomaly = true) as anomalies,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_attempts
      FROM login_logs
    `;
    
    if (address) {
      statsQuery += ' WHERE wallet_address = $1';
    }
    
    const statsResult = await pool.query(
      statsQuery, 
      address ? [address.toLowerCase()] : []
    );
    
    const stats = {
      total: parseInt(statsResult.rows[0].total) || 0,
      anomalies: parseInt(statsResult.rows[0].anomalies) || 0,
      failedAttempts: parseInt(statsResult.rows[0].failed_attempts) || 0
    };
    
    res.json({ 
      success: true,
      logs: logsResult.rows, 
      stats
    });
  } catch (error) {
    logger.error('Get login logs failed', {
      error: error.message,
      stack: error.stack,
      address: req.query.address
    });
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

module.exports = {
  getLoginLogs
};
