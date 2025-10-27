/**
 * OTP Service
 * Xử lý OTP generation và verification
 */

const { hashCCCDNumber } = require('../../utils/crypto-utils');
const { 
  generateVerificationToken, 
  getCitizenInformation,
  updatePreVerificationStatus 
} = require('./pre-verification.service');

/**
 * Generate random 6-digit OTP code
 * @returns {string} 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Lưu OTP vào database
 * @param {string} cccdNumberHash - Hash của CCCD
 * @param {string} phoneNumber - Số điện thoại
 * @param {string} otp - OTP code
 * @param {Object} pool - PostgreSQL pool
 * @returns {Promise<Date>} Expiry time
 */
async function saveOTP(cccdNumberHash, phoneNumber, otp, pool) {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  
  await pool.query(
    `INSERT INTO otp_codes (cccd_number_hash, phone_number, code, expires_at) 
     VALUES ($1, $2, $3, $4)`,
    [cccdNumberHash, phoneNumber, otp, expiresAt]
  );
  
  return expiresAt;
}

/**
 * Send OTP via SMS (mock cho demo)
 * @param {string} phoneNumber - Số điện thoại
 * @param {string} otp - OTP code
 * @param {Object} logger - Winston logger
 */
function sendOTPSMS(phoneNumber, otp, logger) {
  // TODO: Integrate với Twilio/VNPT SMS Gateway trong production
  logger.info('OTP generated (DEMO - would send SMS)', { 
    phoneNumber, 
    otp, // Trong production, KHÔNG log OTP!
  });
  
  console.log('\n========================================');
  console.log('📱 SMS MOCK (Demo Mode)');
  console.log(`To: ${phoneNumber}`);
  console.log(`Message: Mã OTP của bạn là: ${otp}`);
  console.log(`Có hiệu lực trong 5 phút.`);
  console.log('========================================\n');
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
  const cccdNumberHash = hashCCCDNumber(cccdNumber);
  
  logger.info('OTP request', { 
    cccdNumber: cccdNumber.slice(0, 4) + '****', 
    phoneNumber 
  });
  
  // Check if CCCD exists in pre_verified_cccd table (CRITICAL CHECK)
  const cccdCheck = await pool.query(
    'SELECT status, phone_number FROM pre_verified_cccd WHERE cccd_number_hash = $1',
    [cccdNumberHash]
  );
  
  if (cccdCheck.rows.length === 0) {
    logger.warn('CCCD not found in pre_verified list', { cccdNumberHash: cccdNumberHash.slice(0, 10) + '...' });
    return {
      success: false,
      message: 'Số CCCD không có trong danh sách được xác thực. Vui lòng liên hệ cơ quan cấp CCCD.'
    };
  }
  
  const currentStatus = cccdCheck.rows[0].status;
  const registeredPhone = cccdCheck.rows[0].phone_number;
  
  // CRITICAL: Validate phone number matches
  if (registeredPhone !== phoneNumber) {
    logger.warn('Phone number mismatch', { 
      cccdNumberHash: cccdNumberHash.slice(0, 10) + '...', 
      providedPhone: phoneNumber,
      registeredPhone: registeredPhone.slice(0, 4) + '****'
    });
    return {
      success: false,
      message: 'Số điện thoại không khớp với CCCD đã đăng ký. Vui lòng kiểm tra lại.'
    };
  }
  
  // Check if already verified or claimed
  if (currentStatus === 'verified') {
    logger.info('CCCD already verified, allowing re-verification', { cccdNumberHash: cccdNumberHash.slice(0, 10) + '...' });
    // Allow user to request new OTP (maybe they lost the token)
  }
  
  if (currentStatus === 'claimed') {
    logger.warn('CCCD already claimed', { cccdNumberHash: cccdNumberHash.slice(0, 10) + '...' });
    return {
      success: false,
      message: 'Số CCCD này đã được đăng ký DID rồi. Không thể yêu cầu OTP mới.'
    };
  }
  
  if (currentStatus === 'blacklisted') {
    logger.warn('CCCD blacklisted', { cccdNumberHash: cccdNumberHash.slice(0, 10) + '...' });
    return {
      success: false,
      message: 'Số CCCD đã bị khóa. Vui lòng liên hệ bộ phận hỗ trợ.'
    };
  }
  
  // Generate OTP
  const otp = generateOTP();
  const expiresAt = await saveOTP(cccdNumberHash, phoneNumber, otp, pool);
  
  // Send SMS
  sendOTPSMS(phoneNumber, otp, logger);
  
  return {
    success: true,
    message: 'Mã OTP đã được gửi đến số điện thoại của bạn.',
    expiresAt
  };
}

/**
 * Lấy OTP record từ database
 * @param {string} cccdNumberHash - Hash của CCCD
 * @param {Object} pool - PostgreSQL pool
 * @returns {Promise<Object|null>} OTP record hoặc null
 */
async function getLatestOTP(cccdNumberHash, pool) {
  const result = await pool.query(
    `SELECT id, code, expires_at, verified, attempts 
     FROM otp_codes 
     WHERE cccd_number_hash = $1 
     AND verified = FALSE
     ORDER BY created_at DESC 
     LIMIT 1`,
    [cccdNumberHash]
  );
  
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Increment OTP verification attempts
 * @param {number} otpId - OTP record ID
 * @param {Object} pool - PostgreSQL pool
 */
async function incrementOTPAttempts(otpId, pool) {
  await pool.query(
    'UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1',
    [otpId]
  );
}

/**
 * Mark OTP as verified
 * @param {number} otpId - OTP record ID
 * @param {Object} pool - PostgreSQL pool
 */
async function markOTPAsVerified(otpId, pool) {
  await pool.query(
    'UPDATE otp_codes SET verified = TRUE WHERE id = $1',
    [otpId]
  );
}

/**
 * Verify OTP code
 * @param {string} cccdNumberHash - Hash của CCCD
 * @param {string} otp - 6-digit OTP code
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<{success: boolean, message: string, verificationToken?: string, citizenInfo?: Object}>}
 */
async function verifyOTP(cccdNumberHash, otp, pool, logger) {
  logger.info('OTP verification attempt', { 
    cccdNumberHash: cccdNumberHash.slice(0, 10) + '...' 
  });
  
  // Find latest OTP
  const otpRecord = await getLatestOTP(cccdNumberHash, pool);
  
  if (!otpRecord) {
    return {
      success: false,
      message: 'Không tìm thấy mã OTP. Vui lòng yêu cầu mã mới.'
    };
  }
  
  // Check expiration
  if (new Date() > new Date(otpRecord.expires_at)) {
    logger.warn('OTP expired', { cccdNumberHash });
    return {
      success: false,
      message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.'
    };
  }
  
  // Check attempts (max 5 tries)
  if (otpRecord.attempts >= 5) {
    logger.warn('OTP max attempts exceeded', { cccdNumberHash });
    return {
      success: false,
      message: 'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.'
    };
  }
  
  // Verify OTP code
  if (otpRecord.code !== otp) {
    await incrementOTPAttempts(otpRecord.id, pool);
    const remainingAttempts = 5 - (otpRecord.attempts + 1);
    logger.warn('OTP mismatch', { cccdNumberHash, attempts: otpRecord.attempts + 1 });
    
    return {
      success: false,
      message: `Mã OTP không chính xác. Còn ${remainingAttempts} lần thử.`
    };
  }
  
  // OTP correct! Mark as verified
  await markOTPAsVerified(otpRecord.id, pool);
  logger.info('OTP verified successfully', { cccdNumberHash });
  
  // Update pre_verified_cccd status to 'verified' (CRITICAL FIX)
  await updatePreVerificationStatus(cccdNumberHash, 'verified', pool);
  logger.info('Pre-verification status updated to verified', { 
    cccdNumberHash: cccdNumberHash.slice(0, 10) + '...' 
  });
  
  // Generate verification token
  const verificationToken = generateVerificationToken(cccdNumberHash);
  logger.info('Verification token generated', { 
    cccdNumberHash: cccdNumberHash.slice(0, 10) + '...' 
  });
  
  // Get citizen information
  const citizenInfo = await getCitizenInformation(cccdNumberHash, pool, logger);
  logger.info('Citizen info retrieved', { 
    hasInfo: !!citizenInfo,
    fullName: citizenInfo?.fullName 
  });
  
  return {
    success: true,
    message: 'Xác thực thành công!',
    verificationToken,
    citizenInfo
  };
}

module.exports = {
  generateOTP,
  requestOTP,
  verifyOTP
};
