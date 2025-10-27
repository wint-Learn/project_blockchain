/**
 * Admin Dashboard Controller
 * Xử lý thống kê và xuất báo cáo
 */

const { getDashboardStats, exportLogs } = require('../../services/admin');
const logger = require('../../config/logger');

/**
 * Get dashboard statistics
 * GET /api/admin/stats
 */
async function getDashboardStatsController(req, res) {
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
async function exportLogsController(req, res) {
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

module.exports = {
  getDashboardStats: getDashboardStatsController,
  exportLogs: exportLogsController
};
