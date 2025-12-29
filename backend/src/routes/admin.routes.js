const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');
const usersController = require('../controllers/admin/users.controller');
const statsController = require('../controllers/admin/stats.controller');
const anomalyController = require('../controllers/admin/anomaly.controller');
const { auditMiddleware } = require('../middleware/audit-middleware');

/**
 * @route   POST /api/admin/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/login', adminController.adminLogin);

/**
 * @route   GET /api/admin/users
 * @desc    Lấy danh sách users đã đăng ký DID
 * @access  Admin
 */
router.get('/users',
  auditMiddleware('view_users', () => 'all'),
  usersController.getRegisteredUsers
);

/**
 * @route   POST /api/admin/users/:userId/lock
 * @desc    Khóa tài khoản người dùng
 * @access  Admin
 */
router.post('/users/:userId/lock',
  auditMiddleware('lock_user', (req) => req.params.userId),
  usersController.lockUser
);

/**
 * @route   POST /api/admin/users/:userId/unlock
 * @desc    Mở khóa tài khoản người dùng
 * @access  Admin
 */
router.post('/users/:userId/unlock',
  auditMiddleware('unlock_user', (req) => req.params.userId),
  usersController.unlockUser
);

/**
 * @route   GET /api/admin/login-logs
 * @desc    Xem login logs với geolocation và anomaly detection
 * @access  Admin
 */
router.get('/login-logs', 
  auditMiddleware('view_login_logs', (req) => req.query.address || 'all'), 
  adminController.getLoginLogs
);

/**
 * @route   GET /api/admin/logs
 * @desc    Xem login logs (alias cho backward compatibility)
 * @access  Admin (cần thêm auth middleware sau)
 */
router.get('/logs', 
  auditMiddleware('view_logs', (req) => req.query.address || 'all'), 
  adminController.getLoginLogs
);

/**
 * @route   GET /api/admin/cccd
 * @desc    Lấy danh sách pre-verified CCCD
 * @access  Admin
 */
router.get('/cccd',
  auditMiddleware('view_cccd_list', () => 'all'),
  adminController.getPreVerifiedCCCDs
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
 * @route   GET /api/admin/services/recent
 * @desc    Lấy danh sách yêu cầu dịch vụ gần đây
 * @access  Admin
 */
router.get('/services/recent',
  auditMiddleware('view_recent_requests', () => 'dashboard'),
  statsController.getRecentRequests
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

/**
 * @route   GET /api/admin/anomalies
 * @desc    Get list of anomalous logins (AI detection)
 * @access  Admin
 */
router.get('/anomalies',
  auditMiddleware('view_anomalies', () => 'all'),
  anomalyController.getAnomalies
);

/**
 * @route   GET /api/admin/anomaly-summary
 * @desc    Get summary of anomalous login patterns
 * @access  Admin
 */
router.get('/anomaly-summary',
  auditMiddleware('view_anomaly_summary', () => 'dashboard'),
  anomalyController.getAnomalySummary
);

/**
 * @route   GET /api/admin/user-login-stats/:userId
 * @desc    Get login statistics for a specific user
 * @access  Admin
 */
router.get('/user-login-stats/:userId',
  auditMiddleware('view_user_stats', (req) => req.params.userId),
  anomalyController.getUserStats
);

module.exports = router;
