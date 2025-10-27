/**
 * Verification Service - Main Entry Point
 * Wrapper cho backward compatibility với code cũ
 */

const { hashCCCDNumber } = require('../utils/crypto-utils');
const { requestOTP: requestOTPService, verifyOTP: verifyOTPService } = require('./verification/otp.service');
const { 
  checkPreVerification, 
  updatePreVerificationStatus, 
  generateVerificationToken,
  getCitizenInformation,
  checkVerificationStatus: checkStatus
} = require('./verification/pre-verification.service');

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
    logger.info('OTP request', { 
      cccdNumber: cccdNumber.slice(0, 4) + '****', 
      phoneNumber 
    });
    
    // Check pre-verification
    const preVerifyResult = await checkPreVerification(cccdNumber, phoneNumber, pool, logger);
    
    if (!preVerifyResult.success) {
      return preVerifyResult;
    }
    
    // Request OTP
    const result = await requestOTPService(cccdNumber, phoneNumber, pool, logger);
    return result;
    
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
 * @returns {Promise<{success: boolean, message: string, verificationToken?: string, citizenInfo?: Object}>}
 */
async function verifyOTP(cccdNumber, otp, pool, logger) {
  const client = await pool.connect();
  
  try {
    const cccdNumberHash = hashCCCDNumber(cccdNumber);
    
    logger.info('OTP verification attempt', { 
      cccdNumber: cccdNumber.slice(0, 4) + '****' 
    });
    
    // Verify OTP
    const otpResult = await verifyOTPService(cccdNumberHash, otp, pool, logger);
    
    if (!otpResult.success) {
      return otpResult;
    }
    
    // OTP correct! Update pre-verification status
    await client.query('BEGIN');
    
    await updatePreVerificationStatus(cccdNumberHash, 'verified', pool);
    
    // Get citizen information
    const citizenInfo = await getCitizenInformation(cccdNumberHash, pool, logger);
    
    await client.query('COMMIT');
    
    // Generate verification token
    const verificationToken = generateVerificationToken(cccdNumberHash);
    
    logger.info('OTP verified successfully', { cccdNumberHash });
    
    return {
      success: true,
      message: 'Xác thực thành công! Thông tin của bạn đã được tải từ hệ thống.',
      verificationToken,
      citizenInfo
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
  return await checkStatus(cccdNumberHash, pool, logger);
}

module.exports = {
  requestOTP,
  verifyOTP,
  checkVerificationStatus
};
