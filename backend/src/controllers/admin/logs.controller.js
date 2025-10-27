/**
 * Admin Logs Controller
 * Xử lý xem và xuất login logs
 */

const logger = require('../../config/logger');

/**
 * Get login logs
 * GET /api/admin/logs
 */
async function getLoginLogs(req, res) {
  try {
    const { address, limit = 50 } = req.query;
    const pool = req.app.locals.pool;
    const logger = req.app.locals.logger;
    
    logger.info('Admin viewing logs', { address: address || 'all', limit });
    
    let query = `
      SELECT id, wallet_address, ip_address, login_success, is_anomaly, anomaly_reason, timestamp
      FROM login_logs
    `;
    const params = [];
    
    if (address) {
      query += ' WHERE wallet_address = $1';
      params.push(address.toLowerCase());
    }
    
    query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    res.json({ logs: result.rows, count: result.rows.length });
  } catch (error) {
    logger.error('Get login logs failed', {
      error: error.message,
      stack: error.stack,
      address: req.query.address
    });
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getLoginLogs
};
