/**
 * Service Controller
 * Xử lý HTTP requests cho quản lý dịch vụ công
 */

const serviceManagementService = require('../services/service-management.service');
const logger = require('../config/logger');

/**
 * Lấy danh sách dịch vụ (Public)
 * GET /api/services
 */
async function listServices(req, res) {
  const { pool } = req.app.locals;
  
  try {
    const { category, isActive } = req.query;
    
    const filters = {
      category,
      isActive: isActive !== undefined ? isActive === 'true' : true
    };
    
    const services = await serviceManagementService.listServices(filters, pool, logger);
    
    return res.status(200).json({
      success: true,
      services,
      count: services.length
    });
    
  } catch (error) {
    logger.error('List services failed', { error: error.message });
    return res.status(500).json({
      error: 'Lỗi khi lấy danh sách dịch vụ',
      message: error.message
    });
  }
}

/**
 * User nộp đơn yêu cầu dịch vụ
 * POST /api/services/:id/request
 */
async function requestService(req, res) {
  const { pool } = req.app.locals;
  
  try {
    const { id } = req.params;
    const { userAddress, requestData } = req.body;
    
    if (!userAddress || !requestData) {
      return res.status(400).json({
        error: 'Thiếu thông tin',
        message: 'Vui lòng cung cấp userAddress và requestData'
      });
    }
    
    logger.info('Service request attempt', { 
      serviceId: id, 
      userAddress: userAddress.slice(0, 10) + '...' 
    });
    
    const result = await serviceManagementService.requestService(
      userAddress,
      parseInt(id),
      requestData,
      pool,
      logger
    );
    
    return res.status(200).json({
      success: true,
      message: 'Yêu cầu dịch vụ đã được gửi thành công',
      requestId: result.requestId
    });
    
  } catch (error) {
    logger.error('Request service failed', { error: error.message });
    return res.status(400).json({
      error: 'Lỗi khi gửi yêu cầu',
      message: error.message
    });
  }
}

/**
 * User xem danh sách dịch vụ của mình
 * GET /api/services/my-services
 */
async function getMyServices(req, res) {
  const { pool } = req.app.locals;
  
  try {
    const { userAddress } = req.query;
    
    if (!userAddress) {
      return res.status(400).json({
        error: 'Thiếu thông tin',
        message: 'Vui lòng cung cấp userAddress'
      });
    }
    
    const services = await serviceManagementService.getUserServices(userAddress, pool, logger);
    
    return res.status(200).json({
      success: true,
      services,
      count: services.length
    });
    
  } catch (error) {
    logger.error('Get my services failed', { error: error.message });
    return res.status(500).json({
      error: 'Lỗi khi lấy danh sách dịch vụ',
      message: error.message
    });
  }
}

/**
 * Admin tạo dịch vụ mới
 * POST /api/admin/services/create
 */
async function createService(req, res) {
  const { pool } = req.app.locals;
  
  try {
    const { name, description, category, requiresVerification, metadata } = req.body;
    
    if (!name || !description || !category) {
      return res.status(400).json({
        error: 'Thiếu thông tin',
        message: 'Vui lòng cung cấp name, description, category'
      });
    }
    
    logger.info('Admin creating service', { 
      admin: req.admin?.username, 
      name, 
      category 
    });
    
    const result = await serviceManagementService.createService(
      { name, description, category, requiresVerification, metadata },
      pool,
      logger
    );
    
    return res.status(201).json({
      success: true,
      message: 'Dịch vụ đã được tạo thành công',
      serviceId: result.serviceId
    });
    
  } catch (error) {
    logger.error('Create service failed', { error: error.message });
    return res.status(500).json({
      error: 'Lỗi khi tạo dịch vụ',
      message: error.message
    });
  }
}

/**
 * Admin xem tất cả service requests
 * GET /api/admin/services/requests
 */
async function getServiceRequests(req, res) {
  const { pool } = req.app.locals;
  
  try {
    const { status, serviceId, limit, offset } = req.query;
    
    const filters = {
      status,
      serviceId: serviceId ? parseInt(serviceId) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    };
    
    logger.info('Admin viewing service requests', { 
      admin: req.admin?.username, 
      filters 
    });
    
    const result = await serviceManagementService.getServiceRequests(filters, pool, logger);
    
    return res.status(200).json({
      success: true,
      ...result
    });
    
  } catch (error) {
    logger.error('Get service requests failed', { error: error.message });
    return res.status(500).json({
      error: 'Lỗi khi lấy danh sách yêu cầu',
      message: error.message
    });
  }
}

/**
 * Admin duyệt service request
 * PUT /api/admin/services/requests/:id/approve
 */
async function approveServiceRequest(req, res) {
  const { pool } = req.app.locals;
  
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    
    logger.info('Admin approving service request', { 
      admin: req.admin?.username, 
      requestId: id 
    });
    
    const adminId = req.admin?.id || 1; // Default to first admin if no auth
    const result = await serviceManagementService.approveServiceRequest(
      parseInt(id),
      adminId,
      adminNotes || 'Đã được phê duyệt',
      pool,
      logger
    );
    
    return res.status(200).json({
      success: true,
      message: 'Yêu cầu đã được phê duyệt'
    });
    
  } catch (error) {
    logger.error('Approve service request failed', { error: error.message });
    return res.status(400).json({
      error: 'Lỗi khi duyệt yêu cầu',
      message: error.message
    });
  }
}

/**
 * Admin từ chối service request
 * PUT /api/admin/services/requests/:id/reject
 */
async function rejectServiceRequest(req, res) {
  const { pool } = req.app.locals;
  
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        error: 'Thiếu thông tin',
        message: 'Vui lòng cung cấp lý do từ chối'
      });
    }
    
    logger.info('Admin rejecting service request', { 
      admin: req.admin?.username, 
      requestId: id,
      reason 
    });
    
    const adminId = req.admin?.id || 1; // Default to first admin if no auth
    const result = await serviceManagementService.rejectServiceRequest(
      parseInt(id),
      adminId,
      reason,
      pool,
      logger
    );
    
    return res.status(200).json({
      success: true,
      message: 'Yêu cầu đã bị từ chối'
    });
    
  } catch (error) {
    logger.error('Reject service request failed', { error: error.message });
    return res.status(400).json({
      error: 'Lỗi khi từ chối yêu cầu',
      message: error.message
    });
  }
}

module.exports = {
  listServices,
  requestService,
  getMyServices,
  createService,
  getServiceRequests,
  approveServiceRequest,
  rejectServiceRequest
};
