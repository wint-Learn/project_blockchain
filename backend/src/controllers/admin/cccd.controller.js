/**
 * Admin CCCD Management Controller
 * Xử lý import, blacklist, và quản lý CCCD
 */

const { 
  importCCCDBatch, 
  getPreVerifiedList, 
  blacklistCCCD 
} = require('../../services/admin');
const logger = require('../../config/logger');

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
async function blacklistCCCDController(req, res) {
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
    
    const adminId = req.admin?.id || 1;
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

module.exports = {
  importCCCD,
  getPreVerifiedCCCDs,
  blacklistCCCD: blacklistCCCDController
};
