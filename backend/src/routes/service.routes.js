const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const { auditMiddleware } = require('../middleware/audit-middleware');

/**
 * ============ PUBLIC ROUTES ============
 */

/**
 * @route   GET /api/services
 * @desc    Lấy danh sách tất cả dịch vụ (public)
 * @access  Public
 */
router.get('/', serviceController.listServices);

/**
 * @route   POST /api/services/:id/request
 * @desc    User nộp đơn yêu cầu dịch vụ
 * @access  User (cần có DID)
 */
router.post('/:id/request', serviceController.requestService);

/**
 * @route   GET /api/services/my-services
 * @desc    User xem danh sách dịch vụ của mình
 * @access  User
 */
router.get('/my-services', serviceController.getMyServices);

/**
 * ============ ADMIN ROUTES ============
 */

/**
 * @route   POST /api/services/admin/create
 * @desc    Admin tạo dịch vụ mới
 * @access  Admin
 */
router.post('/admin/create',
  auditMiddleware('create_service', (req) => req.body.name || 'new_service'),
  serviceController.createService
);

/**
 * @route   GET /api/services/admin/requests
 * @desc    Admin xem tất cả service requests
 * @access  Admin
 */
router.get('/admin/requests',
  auditMiddleware('view_service_requests', (req) => req.query.status || 'all'),
  serviceController.getServiceRequests
);

/**
 * @route   PUT /api/services/admin/requests/:id/approve
 * @desc    Admin duyệt service request
 * @access  Admin
 */
router.put('/admin/requests/:id/approve',
  auditMiddleware('approve_service_request', (req) => req.params.id),
  serviceController.approveServiceRequest
);

/**
 * @route   PUT /api/services/admin/requests/:id/reject
 * @desc    Admin từ chối service request
 * @access  Admin
 */
router.put('/admin/requests/:id/reject',
  auditMiddleware('reject_service_request', (req) => req.params.id),
  serviceController.rejectServiceRequest
);

module.exports = router;
