/**
 * Admin Service
 * Handles government admin operations: CCCD management, dashboard stats, logs
 */

const { hashCCCDNumber } = require('../utils/crypto-utils');

/**
 * Import batch of pre-verified CCCDs from CSV
 * CSV format: cccd_number,phone_number,notes
 * @param {string} csvData - CSV file content
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<{success: boolean, imported: number, skipped: number, errors: Array}>}
 */
async function importCCCDBatch(csvData, pool, logger) {
  const results = {
    success: true,
    imported: 0,
    skipped: 0,
    errors: []
  };
  
  try {
    // Parse CSV (simple parser, production should use csv-parser library)
    const lines = csvData.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    // Validate headers
    const requiredHeaders = ['cccd_number', 'phone_number'];
    const hasRequiredHeaders = requiredHeaders.every(h => headers.includes(h));
    
    if (!hasRequiredHeaders) {
      throw new Error(`CSV phải có các cột: ${requiredHeaders.join(', ')}`);
    }
    
    const cccdIndex = headers.indexOf('cccd_number');
    const phoneIndex = headers.indexOf('phone_number');
    const notesIndex = headers.indexOf('notes');
    
    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim());
      const cccdNumber = values[cccdIndex];
      const phoneNumber = values[phoneIndex];
      const notes = notesIndex >= 0 ? values[notesIndex] : '';
      
      try {
        // Validate CCCD format
        if (!/^\d{9,12}$/.test(cccdNumber)) {
          results.errors.push({ row: i + 1, cccdNumber, error: 'Số CCCD không hợp lệ' });
          results.skipped++;
          continue;
        }
        
        // Validate phone format
        if (!/^0\d{9,10}$/.test(phoneNumber)) {
          results.errors.push({ row: i + 1, cccdNumber, error: 'Số điện thoại không hợp lệ' });
          results.skipped++;
          continue;
        }
        
        const cccdNumberHash = hashCCCDNumber(cccdNumber);
        
        // Check if already exists
        const existing = await pool.query(
          'SELECT id, status FROM pre_verified_cccd WHERE cccd_number_hash = $1',
          [cccdNumberHash]
        );
        
        if (existing.rows.length > 0) {
          results.errors.push({ 
            row: i + 1, 
            cccdNumber, 
            error: `Đã tồn tại với status: ${existing.rows[0].status}` 
          });
          results.skipped++;
          continue;
        }
        
        // Insert new record
        await pool.query(
          `INSERT INTO pre_verified_cccd (cccd_number_hash, phone_number, status, notes)
           VALUES ($1, $2, 'pending', $3)`,
          [cccdNumberHash, phoneNumber, notes]
        );
        
        results.imported++;
        
      } catch (error) {
        results.errors.push({ row: i + 1, cccdNumber, error: error.message });
        results.skipped++;
      }
    }
    
    logger.info('CCCD batch import completed', {
      imported: results.imported,
      skipped: results.skipped,
      totalErrors: results.errors.length
    });
    
    return results;
    
  } catch (error) {
    logger.error('CCCD batch import failed', { error: error.message });
    throw error;
  }
}

/**
 * Get list of pre-verified CCCDs with filters
 * @param {Object} filters - { status, limit, offset, search }
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<{records: Array, total: number}>}
 */
async function getPreVerifiedList(filters = {}, pool, logger) {
  try {
    const { status, limit = 50, offset = 0, search } = filters;
    
    let query = 'SELECT id, cccd_number_hash, phone_number, status, notes, verified_at, claimed_at, created_at FROM pre_verified_cccd WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    // Apply status filter
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    // Apply search filter (phone number)
    if (search) {
      query += ` AND phone_number LIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // Get total count
    const countQuery = query.replace('SELECT id, cccd_number_hash, phone_number, status, notes, verified_at, claimed_at, created_at', 'SELECT COUNT(*)');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    logger.info('Retrieved pre-verified list', {
      filters,
      count: result.rows.length,
      total
    });
    
    return {
      records: result.rows,
      total,
      limit,
      offset
    };
    
  } catch (error) {
    logger.error('Failed to get pre-verified list', { error: error.message });
    throw error;
  }
}

/**
 * Blacklist a CCCD
 * @param {number} id - pre_verified_cccd table ID
 * @param {string} reason - Blacklist reason
 * @param {number} adminId - Admin user ID
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<{success: boolean}>}
 */
async function blacklistCCCD(id, reason, adminId, pool, logger) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update status to blacklisted
    const result = await client.query(
      `UPDATE pre_verified_cccd 
       SET status = 'blacklisted', updated_at = NOW() 
       WHERE id = $1 AND status != 'claimed'
       RETURNING cccd_number_hash`,
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new Error('CCCD không tồn tại hoặc đã được claim');
    }
    
    const cccdNumberHash = result.rows[0].cccd_number_hash;
    
    // Log admin action
    await client.query(
      `INSERT INTO admin_action_logs (admin_id, action, resource_type, resource_id, details)
       VALUES ($1, 'blacklist', 'pre_verified_cccd', $2, $3)`,
      [adminId, id, JSON.stringify({ reason, cccdNumberHash: cccdNumberHash.slice(0, 20) + '...' })]
    );
    
    await client.query('COMMIT');
    
    logger.info('CCCD blacklisted', { id, adminId, reason });
    
    return { success: true };
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to blacklist CCCD', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

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
  importCCCDBatch,
  getPreVerifiedList,
  blacklistCCCD,
  getDashboardStats,
  exportLogs
};
