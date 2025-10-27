/**
 * OTP Request Controller
 * Xử lý yêu cầu OTP
 */

const { requestOTP: requestOTPService } = require('../../services/verification');
const logger = require('../../config/logger');

/**
 * Request OTP for CCCD verification
 * POST /api/verify/request-otp
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
    const result = await requestOTPService(cccdNumber, phoneNumber, pool, logger);
    
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

module.exports = {
  requestOTP
};
