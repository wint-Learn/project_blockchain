/**
 * Pre-Verification Service
 * Xử lý pre-verification checks và citizen info
 */

const { hashCCCDNumber } = require('../../utils/crypto-utils');
const { getPreVerificationStatus, getCitizenInfo, formatDate } = require('../shared/database.helper');

/**
 * Kiểm tra CCCD có pre-verified không
 * @param {string} cccdNumber - Số CCCD
 * @param {string} phoneNumber - Số điện thoại
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<{success: boolean, message: string, preVerified?: Object}>}
 */
async function checkPreVerification(cccdNumber, phoneNumber, pool, logger) {
  const cccdNumberHash = hashCCCDNumber(cccdNumber);
  
  // Get pre-verification record
  const preVerified = await getPreVerificationStatus(cccdNumberHash, pool);
  
  if (!preVerified) {
    logger.warn('CCCD not pre-verified', { cccdNumberHash });
    return {
      success: false,
      message: 'Số CCCD này chưa được phê duyệt. Vui lòng liên hệ cơ quan cấp phép.'
    };
  }
  
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
  
  return {
    success: true,
    message: 'CCCD hợp lệ',
    preVerified
  };
}

/**
 * Update pre-verification status
 * @param {string} cccdNumberHash - Hash của CCCD
 * @param {string} status - New status (verified, claimed, blacklisted)
 * @param {Object} pool - PostgreSQL pool
 */
async function updatePreVerificationStatus(cccdNumberHash, status, pool) {
  const statusField = status === 'verified' ? 'verified_at' : 'claimed_at';
  
  await pool.query(
    `UPDATE pre_verified_cccd 
     SET status = $1, ${statusField} = CURRENT_TIMESTAMP 
     WHERE cccd_number_hash = $2`,
    [status, cccdNumberHash]
  );
}

/**
 * Generate verification token
 * @param {string} cccdNumberHash - Hash của CCCD
 * @param {number} verifiedAt - Timestamp
 * @returns {string} Base64 encoded token
 */
function generateVerificationToken(cccdNumberHash, verifiedAt = Date.now()) {
  return Buffer.from(
    JSON.stringify({ cccdNumberHash, verifiedAt })
  ).toString('base64');
}

/**
 * Format citizen info cho frontend
 * @param {Object} citizenData - Raw data từ database
 * @returns {Object} Formatted citizen info
 */
function formatCitizenInfo(citizenData) {
  if (!citizenData) return {};
  
  return {
    fullName: citizenData.full_name || '',
    dateOfBirth: formatDate(citizenData.date_of_birth),
    gender: citizenData.gender || '',
    address: citizenData.address || '',
    issueDate: formatDate(citizenData.issue_date),
    placeOfOrigin: citizenData.place_of_origin || '',
    placeOfResidence: citizenData.place_of_residence || '',
    phoneNumber: citizenData.phone_number || ''
  };
}

/**
 * Get citizen information sau khi verify OTP
 * @param {string} cccdNumberHash - Hash của CCCD
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<Object>} Formatted citizen info
 */
async function getCitizenInformation(cccdNumberHash, pool, logger) {
  const citizenData = await getCitizenInfo(cccdNumberHash, pool);
  
  logger.info('Citizen data from DB', { 
    found: !!citizenData,
    fullName: citizenData?.full_name,
    hasData: citizenData ? Object.keys(citizenData).length : 0
  });
  
  const formatted = formatCitizenInfo(citizenData);
  
  logger.info('Formatted citizen info', { citizenInfo: formatted });
  
  return formatted;
}

/**
 * Check verification status
 * @param {string} cccdNumberHash - Hash của CCCD
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<{isVerified: boolean, status: string}>}
 */
async function checkVerificationStatus(cccdNumberHash, pool, logger) {
  try {
    const record = await getPreVerificationStatus(cccdNumberHash, pool);
    
    if (!record) {
      return { isVerified: false, status: 'not_found' };
    }
    
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
  checkPreVerification,
  updatePreVerificationStatus,
  generateVerificationToken,
  getCitizenInformation,
  checkVerificationStatus
};
