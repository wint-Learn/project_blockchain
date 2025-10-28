/**
 * Legacy Service Controller
 * Wrapper cho Phase 2 services API để tương thích với frontend cũ
 */

const requestController = require('./services/request.controller');
const adminController = require('./services/admin.controller');

/**
 * GET /api/services
 * Lấy danh sách tất cả dịch vụ
 */
async function listServices(req, res) {
  // Trả về danh sách các loại dịch vụ có sẵn
  return res.json({
    success: true,
    data: [
      {
        id: 'business_registration',
        name: 'Đăng ký kinh doanh',
        description: 'Đăng ký giấy phép kinh doanh cho hộ kinh doanh cá thể',
        icon: 'business',
        fields: [
          { name: 'businessName', label: 'Tên doanh nghiệp', type: 'text', required: true },
          { name: 'businessAddress', label: 'Địa chỉ kinh doanh', type: 'text', required: true },
          { name: 'businessType', label: 'Loại hình kinh doanh', type: 'select', options: ['Hộ kinh doanh cá thể', 'Công ty TNHH', 'Công ty cổ phần'], required: true },
          { name: 'taxCode', label: 'Mã số thuế (nếu có)', type: 'text', required: false },
        ]
      },
      {
        id: 'vehicle_registration',
        name: 'Đăng ký xe máy',
        description: 'Đăng ký biển số xe máy mới',
        icon: 'motorcycle',
        fields: [
          { name: 'vehicleType', label: 'Loại xe', type: 'select', options: ['Xe máy', 'Xe gắn máy'], required: true },
          { name: 'brand', label: 'Hãng xe', type: 'text', required: true },
          { name: 'model', label: 'Dòng xe', type: 'text', required: true },
          { name: 'frameNumber', label: 'Số khung', type: 'text', required: true },
          { name: 'engineNumber', label: 'Số máy', type: 'text', required: true },
          { name: 'color', label: 'Màu xe', type: 'text', required: true },
          { name: 'year', label: 'Năm sản xuất', type: 'number', required: true },
        ]
      }
    ]
  });
}

/**
 * GET /api/services/my-services
 * Wrapper cho /api/services/my-requests
 */
async function getMyServices(req, res) {
  // Forward to my-requests endpoint
  return requestController.getMyRequests(req, res);
}

/**
 * POST /api/services/:id/request
 * Wrapper cho /api/services/request
 */
async function requestService(req, res) {
  // Extract service type from URL param
  const serviceType = req.params.id; // 'business_registration' or 'vehicle_registration'
  
  // Add serviceType to body
  req.body.serviceType = serviceType;
  
  // Forward to request endpoint
  return requestController.requestService(req, res);
}

/**
 * POST /api/services/admin/create
 * Tạo loại dịch vụ mới (placeholder)
 */
async function createService(req, res) {
  return res.status(501).json({
    success: false,
    message: 'Chức năng này chưa được triển khai trong Phase 2'
  });
}

/**
 * GET /api/services/admin/requests
 * Wrapper cho /api/services/admin/all
 */
async function getServiceRequests(req, res) {
  // Forward to admin/all endpoint
  return adminController.getAllRequests(req, res);
}

/**
 * PUT /api/services/admin/requests/:id/approve
 * Wrapper cho POST /api/services/admin/approve/:id
 */
async function approveServiceRequest(req, res) {
  // Forward to approve endpoint
  return adminController.approveRequest(req, res);
}

/**
 * PUT /api/services/admin/requests/:id/reject
 * Wrapper cho POST /api/services/admin/reject/:id
 */
async function rejectServiceRequest(req, res) {
  // Forward to reject endpoint
  return adminController.rejectRequest(req, res);
}

module.exports = {
  listServices,
  getMyServices,
  requestService,
  createService,
  getServiceRequests,
  approveServiceRequest,
  rejectServiceRequest,
};
