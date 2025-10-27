/**
 * Logs Service
 * Export và quản lý logs
 */

/**
 * Export logs to CSV format
 * @param {Object} filters - { startDate, endDate, anomalyOnly }
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<string>} CSV data
 */
async function exportLogs(filters = {}, pool, logger) {
  try {
    const { startDate, endDate, anomalyOnly } = filters;
    
    let query = `
      SELECT 
        ll.wallet_address,
        ll.ip_address,
        ll.user_agent,
        ll.anomaly_score,
        ll.timestamp,
        u.cccd_hash
      FROM login_logs ll
      LEFT JOIN users u ON ll.wallet_address = u.wallet_address
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (startDate) {
      query += ` AND ll.timestamp >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      query += ` AND ll.timestamp <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    if (anomalyOnly) {
      query += ` AND ll.anomaly_score > 0.5`;
    }
    
    query += ` ORDER BY ll.timestamp DESC`;
    
    const result = await pool.query(query, params);
    
    // Build CSV
    const headers = ['Wallet Address', 'IP Address', 'User Agent', 'Anomaly Score', 'Timestamp', 'CCCD Hash'];
    let csv = headers.join(',') + '\n';
    
    result.rows.forEach(row => {
      csv += [
        row.wallet_address,
        row.ip_address,
        `"${row.user_agent || ''}"`, // Quote user agent to handle commas
        row.anomaly_score || 0,
        row.timestamp.toISOString(),
        row.cccd_hash || ''
      ].join(',') + '\n';
    });
    
    logger.info('Logs exported', { 
      count: result.rows.length, 
      filters 
    });
    
    return csv;
    
  } catch (error) {
    logger.error('Failed to export logs', { error: error.message });
    throw error;
  }
}

module.exports = {
  exportLogs
};
