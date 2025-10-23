const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { auditMiddleware } = require('../middleware/audit-middleware');

/**
 * @route   GET /api/admin/logs
 * @desc    Xem login logs (với audit logging)
 * @access  Admin (cần thêm auth middleware sau)
 */
router.get('/logs', 
  auditMiddleware('view_logs', (req) => req.query.address || 'all'), 
  adminController.getLoginLogs
);

module.exports = router;
