/**
 * OTP Verification Controller
 * Xử lý xác thực OTP
 */

const { verifyOTP: verifyOTPService } = require('../../services/verification');
const { hashCCCDNumber } = require('../../utils/crypto-utils');
const logger = require('../../config/logger');

/**
 * Verify OTP code
 * POST /api/verify/confirm-otp
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
    
    // Hash CCCD number before verification (CRITICAL FIX)
    const cccdNumberHash = hashCCCDNumber(cccdNumber);
    
    const { pool } = req.app.locals;
    const result = await verifyOTPService(cccdNumberHash, otp, pool, logger);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Xác thực OTP thất bại',
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      message: result.message,
      verificationToken: result.verificationToken,
      citizenInfo: result.citizenInfo
    });
    
  } catch (error) {
    logger.error('Confirm OTP controller error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      error: 'Lỗi hệ thống',
      message: 'Không thể xử lý yêu cầu. Vui lòng thử lại sau.'
    });
  }
}

module.exports = {
  confirmOTP
};
