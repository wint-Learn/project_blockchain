const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');
const { auditMiddleware } = require('../middleware/audit-middleware');

/**
 * @route   POST /api/admin/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/login', adminController.adminLogin);

/**
 * @route   GET /api/admin/logs
 * @desc    Xem login logs (với audit logging)
 * @access  Admin (cần thêm auth middleware sau)
 */
router.get('/logs', 
  auditMiddleware('view_logs', (req) => req.query.address || 'all'), 
  adminController.getLoginLogs
);

/**
 * @route   POST /api/admin/cccd/import
 * @desc    Import batch CCCD từ CSV
 * @access  Admin
 */
router.post('/cccd/import',
  auditMiddleware('import_cccd', () => 'batch'),
  adminController.importCCCD
);

/**
 * @route   GET /api/admin/cccd/list
 * @desc    Lấy danh sách pre-verified CCCD
 * @access  Admin
 */
router.get('/cccd/list',
  auditMiddleware('view_cccd_list', (req) => req.query.status || 'all'),
  adminController.getPreVerifiedCCCDs
);

/**
 * @route   PUT /api/admin/cccd/:id/blacklist
 * @desc    Blacklist một CCCD
 * @access  Admin
 */
router.put('/cccd/:id/blacklist',
  auditMiddleware('blacklist_cccd', (req) => req.params.id),
  adminController.blacklistCCCD
);

/**
 * @route   GET /api/admin/stats
 * @desc    Lấy dashboard statistics
 * @access  Admin
 */
router.get('/stats',
  auditMiddleware('view_stats', () => 'dashboard'),
  adminController.getDashboardStats
);

/**
 * @route   GET /api/admin/logs/export
 * @desc    Export login logs to CSV
 * @access  Admin
 */
router.get('/logs/export',
  auditMiddleware('export_logs', () => 'csv'),
  adminController.exportLogs
);

module.exports = router;
