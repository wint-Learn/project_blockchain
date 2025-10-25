/**
 * Verification Service - Pre-verification flow với OTP
 * Handles CCCD verification before allowing DID registration
 */

const { hashCCCDNumber } = require('../utils/crypto-utils');
const logger = require('../config/logger');

/**
 * Generate random 6-digit OTP code
 * @returns {string} 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Request OTP for CCCD verification
 * @param {string} cccdNumber - CCCD number (12 digits)
 * @param {string} phoneNumber - Phone number
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<{success: boolean, message: string, expiresAt: Date}>}
 */
async function requestOTP(cccdNumber, phoneNumber, pool, logger) {
  const client = await pool.connect();
  
  try {
    // Hash CCCD number
    const cccdNumberHash = hashCCCDNumber(cccdNumber);
    
    logger.info('OTP request', { cccdNumber: cccdNumber.slice(0, 4) + '****', phoneNumber });
    
    // Check if CCCD is pre-verified
    const preVerifiedCheck = await client.query(
      'SELECT id, status, phone_number FROM pre_verified_cccd WHERE cccd_number_hash = $1',
      [cccdNumberHash]
    );
    
    if (preVerifiedCheck.rows.length === 0) {
      logger.warn('CCCD not pre-verified', { cccdNumberHash });
      return {
        success: false,
        message: 'Số CCCD này chưa được phê duyệt. Vui lòng liên hệ cơ quan cấp phép.'
      };
    }
    
    const preVerified = preVerifiedCheck.rows[0];
    
    // Check status
    if (preVerified.status === 'blacklisted') {
      logger.warn('CCCD blacklisted', { cccdNumberHash });
      return {
        success: false,
        message: 'Số CCCD này đã bị khóa. Vui lòng liên hệ cơ quan cấp phép.'
      };
    }
    
    if (preVerified.status === 'claimed') {
      logger.warn('CCCD already claimed', { cccdNumberHash });
      return {
        success: false,
        message: 'Số CCCD này đã được đăng ký. Vui lòng sử dụng chức năng đăng nhập.'
      };
    }
    
    // Verify phone number matches
    if (preVerified.phone_number !== phoneNumber) {
      logger.warn('Phone number mismatch', { 
        cccdNumberHash, 
        expected: preVerified.phone_number,
        provided: phoneNumber 
      });
      return {
        success: false,
        message: 'Số điện thoại không khớp với thông tin đã đăng ký. Vui lòng kiểm tra lại.'
      };
    }
    
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    // Save OTP to database
    await client.query(
      `INSERT INTO otp_codes (cccd_number_hash, phone_number, code, expires_at) 
       VALUES ($1, $2, $3, $4)`,
      [cccdNumberHash, phoneNumber, otp, expiresAt]
    );
    
    // TODO: Send SMS in production (integrate Twilio/VNPT SMS Gateway)
    // For demo, just log to console
    logger.info('OTP generated (DEMO - would send SMS)', { 
      phoneNumber, 
      otp, // In production, NEVER log OTP!
      expiresAt 
    });
    
    console.log('\n========================================');
    console.log('📱 SMS MOCK (Demo Mode)');
    console.log(`To: ${phoneNumber}`);
    console.log(`Message: Mã OTP của bạn là: ${otp}`);
    console.log(`Có hiệu lực trong 5 phút.`);
    console.log('========================================\n');
    
    return {
      success: true,
      message: 'Mã OTP đã được gửi đến số điện thoại của bạn.',
      expiresAt
    };
    
  } catch (error) {
    logger.error('Request OTP error', { error: error.message, stack: error.stack });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Verify OTP code
 * @param {string} cccdNumber - CCCD number
 * @param {string} otp - 6-digit OTP code
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<{success: boolean, message: string, verificationToken?: string}>}
 */
async function verifyOTP(cccdNumber, otp, pool, logger) {
  const client = await pool.connect();
  
  try {
    const cccdNumberHash = hashCCCDNumber(cccdNumber);
    
    logger.info('OTP verification attempt', { cccdNumber: cccdNumber.slice(0, 4) + '****' });
    
    // Find latest OTP for this CCCD
    const otpCheck = await client.query(
      `SELECT id, code, expires_at, verified, attempts 
       FROM otp_codes 
       WHERE cccd_number_hash = $1 
       AND verified = FALSE
       ORDER BY created_at DESC 
       LIMIT 1`,
      [cccdNumberHash]
    );
    
    if (otpCheck.rows.length === 0) {
      logger.warn('No OTP found', { cccdNumberHash });
      return {
        success: false,
        message: 'Không tìm thấy mã OTP. Vui lòng yêu cầu mã mới.'
      };
    }
    
    const otpRecord = otpCheck.rows[0];
    
    // Check expiration
    if (new Date() > new Date(otpRecord.expires_at)) {
      logger.warn('OTP expired', { cccdNumberHash, expiresAt: otpRecord.expires_at });
      return {
        success: false,
        message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.'
      };
    }
    
    // Check attempts (max 5 tries)
    if (otpRecord.attempts >= 5) {
      logger.warn('OTP max attempts exceeded', { cccdNumberHash, attempts: otpRecord.attempts });
      return {
        success: false,
        message: 'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.'
      };
    }
    
    // Verify OTP code
    if (otpRecord.code !== otp) {
      // Increment attempts
      await client.query(
        'UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1',
        [otpRecord.id]
      );
      
      const remainingAttempts = 5 - (otpRecord.attempts + 1);
      logger.warn('OTP mismatch', { cccdNumberHash, attempts: otpRecord.attempts + 1 });
      
      return {
        success: false,
        message: `Mã OTP không chính xác. Còn ${remainingAttempts} lần thử.`
      };
    }
    
    // OTP correct! Mark as verified
    await client.query('BEGIN');
    
    await client.query(
      'UPDATE otp_codes SET verified = TRUE WHERE id = $1',
      [otpRecord.id]
    );
    
    // Update pre_verified_cccd status
    await client.query(
      `UPDATE pre_verified_cccd 
       SET status = 'verified', verified_at = CURRENT_TIMESTAMP 
       WHERE cccd_number_hash = $1`,
      [cccdNumberHash]
    );
    
    await client.query('COMMIT');
    
    // Generate verification token (JWT in production, simple token for demo)
    const verificationToken = Buffer.from(
      JSON.stringify({ cccdNumberHash, timestamp: Date.now() })
    ).toString('base64');
    
    logger.info('OTP verified successfully', { cccdNumberHash });
    
    return {
      success: true,
      message: 'Xác thực thành công! Bạn có thể đăng ký DID ngay bây giờ.',
      verificationToken
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Verify OTP error', { error: error.message, stack: error.stack });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check if CCCD is verified and ready for registration
 * @param {string} cccdNumberHash - Hashed CCCD number
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<{isVerified: boolean, status: string}>}
 */
async function checkVerificationStatus(cccdNumberHash, pool, logger) {
  try {
    const result = await pool.query(
      'SELECT status, verified_at FROM pre_verified_cccd WHERE cccd_number_hash = $1',
      [cccdNumberHash]
    );
    
    if (result.rows.length === 0) {
      return { isVerified: false, status: 'not_found' };
    }
    
    const record = result.rows[0];
    return {
      isVerified: record.status === 'verified',
      status: record.status,
      verifiedAt: record.verified_at
    };
    
  } catch (error) {
    logger.error('Check verification status error', { error: error.message });
    throw error;
  }
}

module.exports = {
  requestOTP,
  verifyOTP,
  checkVerificationStatus,
  generateOTP // Export for testing
};
