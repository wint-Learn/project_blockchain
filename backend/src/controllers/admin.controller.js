/**
 * Admin Controller
 * Xử lý business logic cho admin operations (xem logs, analytics...)
 */

const { importCCCDBatch, getPreVerifiedList, blacklistCCCD, getDashboardStats, exportLogs } = require('../services/admin');
const logger = require('../config/logger');
const bcrypt = require('bcrypt');

/**
 * Admin login
 */
async function adminLogin(req, res) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        error: 'Thiếu thông tin',
        message: 'Vui lòng nhập username và password'
      });
    }
    
    const pool = req.app.locals.pool;
    
    // Find admin user
    const result = await pool.query(
      'SELECT id, username, password_hash, role FROM admin_users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      logger.warn('Admin login failed - user not found', { username });
      return res.status(401).json({
        error: 'Đăng nhập thất bại',
        message: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
    }
    
    const admin = result.rows[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    
    if (!isValidPassword) {
      logger.warn('Admin login failed - invalid password', { username });
      return res.status(401).json({
        error: 'Đăng nhập thất bại',
        message: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
    }
    
    // Generate token (simple demo token - use JWT in production)
    const token = Buffer.from(`${admin.id}:${admin.username}:${Date.now()}`).toString('base64');
    
    logger.info('Admin login successful', { adminId: admin.id, username: admin.username });
    
    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      }
    });
    
  } catch (error) {
    logger.error('Admin login error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      error: 'Lỗi hệ thống',
      message: 'Không thể xử lý đăng nhập. Vui lòng thử lại.'
    });
  }
}

/**
 * Xem login logs
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
  adminLogin,
  getLoginLogs,
  importCCCD,
  getPreVerifiedCCCDs,
  blacklistCCCD,
  getDashboardStats,
  exportLogs
};

/**
 * Import CCCD batch from CSV
 * POST /api/admin/cccd/import
 */
async function importCCCD(req, res) {
  const { pool } = req.app.locals;
  
  try {
    const { csvData } = req.body;
    
    if (!csvData) {
      return res.status(400).json({
        error: 'Thiếu dữ liệu CSV',
        message: 'Vui lòng cung cấp csvData trong body'
      });
    }
    
    logger.info('Admin importing CCCD batch', { 
      admin: req.admin?.username,
      lines: csvData.split('\n').length 
    });
    
    const result = await importCCCDBatch(csvData, pool, logger);
    
    return res.status(200).json({
      success: true,
      ...result
    });
    
  } catch (error) {
    logger.error('Import CCCD failed', { error: error.message });
    return res.status(500).json({
      error: 'Lỗi khi import CCCD',
      message: error.message
    });
  }
}

/**
 * Get pre-verified CCCD list
 * GET /api/admin/cccd/list
 */
async function getPreVerifiedCCCDs(req, res) {
  const { pool } = req.app.locals;
  
  try {
    const { status, limit, offset, search } = req.query;
    
    const filters = {
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      search
    };
    
    logger.info('Admin viewing pre-verified CCCDs', { 
      admin: req.admin?.username,
      filters 
    });
    
    const result = await getPreVerifiedList(filters, pool, logger);
    
    return res.status(200).json({
      success: true,
      ...result
    });
    
  } catch (error) {
    logger.error('Get pre-verified list failed', { error: error.message });
    return res.status(500).json({
      error: 'Lỗi khi lấy danh sách',
      message: error.message
    });
  }
}

/**
 * Blacklist a CCCD
 * PUT /api/admin/cccd/:id/blacklist
 */
async function blacklistCCCD(req, res) {
  const { pool } = req.app.locals;
  
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        error: 'Thiếu lý do',
        message: 'Vui lòng cung cấp lý do blacklist'
      });
    }
    
    logger.info('Admin blacklisting CCCD', { 
      admin: req.admin?.username,
      id,
      reason 
    });
    
    const adminId = req.admin?.id || 1; // Default to first admin if no auth
    const result = await blacklistCCCD(
      parseInt(id), 
      reason, 
      adminId, 
      pool, 
      logger
    );
    
    return res.status(200).json({
      success: true,
      message: 'CCCD đã được blacklist thành công'
    });
    
  } catch (error) {
    logger.error('Blacklist CCCD failed', { error: error.message });
    return res.status(500).json({
      error: 'Lỗi khi blacklist CCCD',
      message: error.message
    });
  }
}

/**
 * Get dashboard statistics
 * GET /api/admin/stats
 */
async function getDashboardStats(req, res) {
  const { pool } = req.app.locals;
  
  try {
    logger.info('Admin viewing dashboard stats', { 
      admin: req.admin?.username 
    });
    
    const stats = await getDashboardStats(pool, logger);
    
    return res.status(200).json({
      success: true,
      stats
    });
    
  } catch (error) {
    logger.error('Get dashboard stats failed', { error: error.message });
    return res.status(500).json({
      error: 'Lỗi khi lấy thống kê',
      message: error.message
    });
  }
}

/**
 * Export logs to CSV
 * GET /api/admin/logs/export
 */
async function exportLogs(req, res) {
  const { pool } = req.app.locals;
  
  try {
    const { startDate, endDate, anomalyOnly } = req.query;
    
    const filters = {
      startDate,
      endDate,
      anomalyOnly: anomalyOnly === 'true'
    };
    
    logger.info('Admin exporting logs', { 
      admin: req.admin?.username,
      filters 
    });
    
    const csv = await exportLogs(filters, pool, logger);
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=login_logs.csv');
    
    return res.status(200).send(csv);
    
  } catch (error) {
    logger.error('Export logs failed', { error: error.message });
    return res.status(500).json({
      error: 'Lỗi khi export logs',
      message: error.message
    });
  }
}
