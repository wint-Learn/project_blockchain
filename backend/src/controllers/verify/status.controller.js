/**
 * Verification Status Controller
 * Xử lý kiểm tra trạng thái verification
 */

const logger = require('../../config/logger');
const verificationService = require('../../services/verification.service');

/**
 * Check verification status of a CCCD
 * GET /api/verify/status/:cccdHash
 */
async function getVerificationStatus(req, res) {
  try {
    const { cccdHash } = req.params;
    
    if (!cccdHash) {
      return res.status(400).json({
        error: 'Thiếu thông tin',
        message: 'Vui lòng cung cấp CCCD hash'
      });
    }
    
    const { pool } = req.app.locals;
    const result = await verificationService.checkVerificationStatus(cccdHash, pool, logger);
    
    return res.status(200).json({
      success: true,
      isVerified: result.isVerified,
      status: result.status,
      verifiedAt: result.verifiedAt
    });
    
  } catch (error) {
    logger.error('Get verification status error', { error: error.message });
    return res.status(500).json({
      error: 'Lỗi hệ thống',
      message: 'Không thể kiểm tra trạng thái'
    });
  }
}

module.exports = {
  getVerificationStatus
};
