/**
 * Verification Validator
 * Xác thực pre-verification token
 */

/**
 * Validate verification token
 * @param {string} verificationToken - Base64 encoded token
 * @param {string} cccdNumberHash - CCCD hash để so sánh
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<void>} Throws error nếu không hợp lệ
 */
async function validateVerificationToken(verificationToken, cccdNumberHash, pool, logger) {
  if (!verificationToken) {
    return; // Skip validation if no token
  }
  
  try {
    // Decode token (base64 encoded JSON)
    const tokenData = JSON.parse(Buffer.from(verificationToken, 'base64').toString('utf-8'));
    
    // Check if CCCD number matches
    if (tokenData.cccdNumberHash !== cccdNumberHash) {
      const error = new Error('Token xác thực không khớp với số CCCD trong QR code');
      error.code = 'VERIFICATION_TOKEN_MISMATCH';
      error.statusCode = 400;
      throw error;
    }
    
    // Check token expiry (30 minutes)
    const tokenAge = Date.now() - tokenData.verifiedAt;
    if (tokenAge > 30 * 60 * 1000) {
      const error = new Error('Token xác thực đã hết hạn. Vui lòng xác thực lại.');
      error.code = 'VERIFICATION_TOKEN_EXPIRED';
      error.statusCode = 400;
      throw error;
    }
    
    // Verify status in database
    const verificationCheck = await pool.query(
      'SELECT status FROM pre_verified_cccd WHERE cccd_number_hash = $1',
      [cccdNumberHash]
    );
    
    if (verificationCheck.rows.length === 0) {
      const error = new Error('Số CCCD không tồn tại trong danh sách xác thực trước');
      error.code = 'CCCD_NOT_PRE_VERIFIED';
      error.statusCode = 403;
      throw error;
    }
    
    const status = verificationCheck.rows[0].status;
    
    if (status === 'claimed') {
      const error = new Error('Số CCCD này đã được đăng ký DID rồi');
      error.code = 'CCCD_ALREADY_CLAIMED';
      error.statusCode = 409;
      throw error;
    }
    
    if (status !== 'verified') {
      const error = new Error('Số CCCD chưa được xác thực OTP hoặc đã bị khóa');
      error.code = 'CCCD_NOT_VERIFIED';
      error.statusCode = 403;
      throw error;
    }
    
    logger.info('Pre-verification token validated', {
      cccdNumberHash: cccdNumberHash.slice(0, 10) + '...',
      verifiedAt: new Date(tokenData.verifiedAt)
    });
    
  } catch (err) {
    if (err.code && err.statusCode) {
      throw err; // Re-throw our custom errors
    }
    logger.error('Failed to validate verification token', { error: err.message });
    const error = new Error('Token xác thực không hợp lệ');
    error.code = 'INVALID_VERIFICATION_TOKEN';
    error.statusCode = 400;
    throw error;
  }
}

module.exports = {
  validateVerificationToken
};
