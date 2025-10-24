/**
 * Login Service
 * Xử lý logic đăng nhập và verification
 */

const { hashCCCD } = require('../utils/crypto-utils');
const ethers = require('ethers');
const { detectAnomaly } = require('./anomaly.service');

/**
 * Login with DID verification
 * @param {Object} params - Login parameters
 * @returns {Promise<Object>} Login result
 */
async function loginDID({ address, qrData, message, signature, ip, userAgent, pool, contract, logger }) {
  logger.info('Login attempt', { address, ip });
  
  // 1) Hash QR data
  const cccdHash = hashCCCD(qrData);
  
  // 2) Get hash from blockchain
  const hashOnChain = await contract.cccdHashes(address);
  const hashMatch = (cccdHash === hashOnChain);
  
  // 3) Verify signature
  const messageHash = ethers.hashMessage(message);
  const signatureValid = await contract.verifySignature(address, messageHash, signature);
  
  // 4) Result
  const loginSuccess = hashMatch && signatureValid;
  
  // 5) Log to database
  const logResult = await pool.query(
    `INSERT INTO login_logs 
     (wallet_address, ip_address, user_agent, signature_valid, hash_match, login_success, message_signed)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [address.toLowerCase(), ip, userAgent, signatureValid, hashMatch, loginSuccess, message]
  );
  
  // 6) Check anomaly
  const anomalyCheck = await detectAnomaly(pool, address.toLowerCase(), ip);
  if (anomalyCheck.isAnomaly) {
    await pool.query(
      `UPDATE login_logs SET is_anomaly = true, anomaly_score = $1, anomaly_reason = $2 WHERE id = $3`,
      [anomalyCheck.score, anomalyCheck.reason, logResult.rows[0].id]
    );
  }
  
  if (loginSuccess) {
    logger.info('Login successful', { address, ip, anomaly: anomalyCheck.isAnomaly });
    return {
      success: true,
      message: 'Đăng nhập thành công',
      anomaly: anomalyCheck.isAnomaly ? anomalyCheck.reason : null
    };
  } else {
    logger.warn('Login failed', { address, ip, signatureValid, hashMatch });
    const error = new Error('Xác thực thất bại');
    error.statusCode = 401;
    error.details = { signatureValid, hashMatch };
    throw error;
  }
}

module.exports = { loginDID };
