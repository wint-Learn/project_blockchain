/**
 * Database Helper
 * Các hàm tiện ích để truy vấn database
 */

const { hashCCCDNumber } = require('../../utils/crypto-utils');

/**
 * Kiểm tra CCCD đã tồn tại chưa
 * @param {string} cccdNumber - Số CCCD
 * @param {Object} pool - PostgreSQL pool
 * @returns {Promise<Object|null>} User record hoặc null
 */
async function checkCCCDExists(cccdNumber, pool) {
  const cccdNumberHash = hashCCCDNumber(cccdNumber);
  
  const result = await pool.query(
    'SELECT wallet_address, cccd_hash FROM users WHERE cccd_number_hash = $1',
    [cccdNumberHash]
  );
  
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Kiểm tra pre-verification status
 * @param {string} cccdNumberHash - Hash của CCCD
 * @param {Object} pool - PostgreSQL pool
 * @returns {Promise<Object|null>} Pre-verification record hoặc null
 */
async function getPreVerificationStatus(cccdNumberHash, pool) {
  const result = await pool.query(
    'SELECT id, status, phone_number, verified_at FROM pre_verified_cccd WHERE cccd_number_hash = $1',
    [cccdNumberHash]
  );
  
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Lưu user mới vào database
 * @param {Object} params - { walletAddress, cccdHash, cccdNumberHash, encryptedPrivateKey, pool }
 * @returns {Promise<void>}
 */
async function saveUser({ walletAddress, cccdHash, cccdNumberHash, encryptedPrivateKey, pool }) {
  await pool.query(
    `INSERT INTO users (wallet_address, cccd_hash, cccd_number_hash, encrypted_cccd_data) 
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (wallet_address) DO UPDATE 
     SET cccd_hash = $2, cccd_number_hash = $3, encrypted_cccd_data = $4, updated_at = NOW()`,
    [walletAddress.toLowerCase(), cccdHash, cccdNumberHash, encryptedPrivateKey]
  );
}

/**
 * Đánh dấu CCCD đã được claim
 * @param {string} cccdNumberHash - Hash của CCCD
 * @param {Object} pool - PostgreSQL pool
 * @returns {Promise<void>}
 */
async function markCCCDAsClaimed(cccdNumberHash, pool) {
  await pool.query(
    `UPDATE pre_verified_cccd 
     SET status = 'claimed', claimed_at = NOW() 
     WHERE cccd_number_hash = $1`,
    [cccdNumberHash]
  );
}

/**
 * Lấy thông tin công dân từ pre_verified_cccd
 * @param {string} cccdNumberHash - Hash của CCCD
 * @param {Object} pool - PostgreSQL pool
 * @returns {Promise<Object|null>} Citizen info hoặc null
 */
async function getCitizenInfo(cccdNumberHash, pool) {
  const result = await pool.query(
    `SELECT full_name, date_of_birth, gender, address, issue_date, 
            place_of_origin, place_of_residence, phone_number
     FROM pre_verified_cccd 
     WHERE cccd_number_hash = $1`,
    [cccdNumberHash]
  );
  
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Format date sang YYYY-MM-DD
 * @param {Date|string} date - Date object hoặc string
 * @returns {string} Formatted date
 */
function formatDate(date) {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
}

module.exports = {
  checkCCCDExists,
  getPreVerificationStatus,
  saveUser,
  markCCCDAsClaimed,
  getCitizenInfo,
  formatDate
};
