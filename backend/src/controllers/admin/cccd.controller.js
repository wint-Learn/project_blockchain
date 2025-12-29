/**
 * Admin CCCD Management Controller
 * Xử lý quản lý CCCD đã xác minh trước
 */

const { getPreVerifiedList } = require('../../services/admin');
const logger = require('../../config/logger');

/**
 * Get pre-verified CCCD list
 * GET /api/admin/cccd
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

module.exports = {
  getPreVerifiedCCCDs
};
