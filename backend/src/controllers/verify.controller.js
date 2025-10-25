/**
 * Verification Controller
 * Handles HTTP requests for CCCD pre-verification flow
 */

const verificationService = require('../services/verification.service');
const logger = require('../config/logger');

/**
 * POST /api/verify/request-otp
 * Request OTP for CCCD verification
 */
async function requestOTP(req, res) {
  try {
    const { cccdNumber, phoneNumber } = req.body;
    
    // Validation
    if (!cccdNumber || !phoneNumber) {
      return res.status(400).json({
        error: 'Thiếu thông tin bắt buộc',
        message: 'Vui lòng cung cấp số CCCD và số điện thoại'
      });
    }
    
    // Validate CCCD format (9-12 digits)
    if (!/^\d{9,12}$/.test(cccdNumber)) {
      return res.status(400).json({
        error: 'Số CCCD không hợp lệ',
        message: 'Số CCCD phải là 9-12 chữ số'
      });
    }
    
    // Validate phone format (10-11 digits, starts with 0)
    if (!/^0\d{9,10}$/.test(phoneNumber)) {
      return res.status(400).json({
        error: 'Số điện thoại không hợp lệ',
        message: 'Số điện thoại phải là 10-11 chữ số, bắt đầu bằng 0'
      });
    }
    
    logger.info('Request OTP API called', { 
      cccdNumber: cccdNumber.slice(0, 4) + '****',
      phoneNumber: phoneNumber.slice(0, 4) + '****',
      ip: req.ip 
    });
    
    const { pool } = req.app.locals;
    const result = await verificationService.requestOTP(cccdNumber, phoneNumber, pool, logger);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Yêu cầu OTP thất bại',
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      message: result.message,
      expiresAt: result.expiresAt
    });
    
  } catch (error) {
    logger.error('Request OTP controller error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      error: 'Lỗi hệ thống',
      message: 'Không thể xử lý yêu cầu. Vui lòng thử lại sau.'
    });
  }
}

/**
 * POST /api/verify/confirm-otp
 * Verify OTP code
 */
async function confirmOTP(req, res) {
  try {
    const { cccdNumber, otp } = req.body;
    
    // Validation
    if (!cccdNumber || !otp) {
      return res.status(400).json({
        error: 'Thiếu thông tin bắt buộc',
        message: 'Vui lòng cung cấp số CCCD và mã OTP'
      });
    }
    
    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        error: 'Mã OTP không hợp lệ',
        message: 'Mã OTP phải là 6 chữ số'
      });
    }
    
    logger.info('Confirm OTP API called', { 
      cccdNumber: cccdNumber.slice(0, 4) + '****',
      ip: req.ip 
    });
    
    const { pool } = req.app.locals;
    const result = await verificationService.verifyOTP(cccdNumber, otp, pool, logger);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Xác thực OTP thất bại',
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      message: result.message,
      verificationToken: result.verificationToken
    });
    
  } catch (error) {
    logger.error('Confirm OTP controller error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      error: 'Lỗi hệ thống',
      message: 'Không thể xử lý yêu cầu. Vui lòng thử lại sau.'
    });
  }
}

/**
 * GET /api/verify/status/:cccdHash
 * Check verification status of a CCCD
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
  requestOTP,
  confirmOTP,
  getVerificationStatus
};
