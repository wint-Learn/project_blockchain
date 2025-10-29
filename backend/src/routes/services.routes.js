/**
 * Routes: Dịch vụ công (Public Services)
 */

const express = require('express');
const router = express.Router();

// Import controllers
const requestController = require('../controllers/services/request.controller');
const adminController = require('../controllers/services/admin.controller');

// ============================================
// User Routes - Yêu cầu dịch vụ
// ============================================

/**
 * POST /api/services/request
 * Người dân gửi yêu cầu sử dụng dịch vụ công
 * Body: { walletAddress, cccdNumber, serviceType, serviceData }
 */
router.post('/request', requestController.requestService);

/**
 * GET /api/services/my-requests?walletAddress=0x...
 * Lấy danh sách yêu cầu của user
 */
router.get('/my-requests', requestController.getMyRequests);

/**
 * GET /api/services/request/:id
 * Lấy chi tiết một yêu cầu
 */
router.get('/request/:id', requestController.getRequestDetail);

// ============================================
// Admin Routes - Quản lý và phê duyệt
// ============================================

/**
 * GET /api/services/admin/pending?serviceType=...
 * Lấy danh sách yêu cầu đang chờ xử lý
 */
router.get('/admin/pending', adminController.getPendingRequests);

/**
 * GET /api/services/admin/all?status=...&serviceType=...
 * Lấy tất cả yêu cầu (mọi trạng thái)
 */
router.get('/admin/all', adminController.getAllRequests);

/**
 * POST /api/services/admin/approve/:id
 * Admin phê duyệt yêu cầu (backend auto-sign) - OLD METHOD
 * Body: { adminAddress }
 */
router.post('/admin/approve/:id', adminController.approveRequest);

/**
 * POST /api/services/admin/save-approval/:id
 * Lưu kết quả phê duyệt từ MetaMask (frontend đã ký transaction)
 * Body: { tx_hash, block_number, gas_used, admin_address }
 */
router.post('/admin/save-approval/:id', adminController.saveApproval);

/**
 * POST /api/services/admin/reject/:id
 * Admin từ chối yêu cầu
 * Body: { adminAddress, reason }
 */
router.post('/admin/reject/:id', adminController.rejectRequest);

module.exports = router;
