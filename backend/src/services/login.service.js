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

/**
 * Login with MetaMask signature (no QR data needed)
 * @param {Object} params - Login parameters
 * @returns {Promise<Object>} Login result with user info
 */
async function loginWithSignature({ address, ip, userAgent, pool, contract, logger }) {
  logger.info('MetaMask login attempt', { address, ip });
  
  // 1) Check if user exists in database
  const userResult = await pool.query(
    `SELECT u.*, 
            COALESCE(AVG(ll.anomaly_score), 0) as avg_anomaly_score
     FROM users u
     LEFT JOIN login_logs ll ON ll.wallet_address = u.wallet_address AND ll.timestamp > NOW() - INTERVAL '7 days'
     WHERE u.wallet_address = $1
     GROUP BY u.id`,
    [address.toLowerCase()]
  );
  
  if (userResult.rows.length === 0) {
    logger.warn('Login failed - user not found', { address });
    const error = new Error('Địa chỉ ví chưa đăng ký DID');
    error.statusCode = 404;
    throw error;
  }
  
  const user = userResult.rows[0];
  
  // 2) Detect anomaly
  const anomalyCheck = await detectAnomaly(pool, address.toLowerCase(), ip);
  
  // 3) Log to database
  await pool.query(
    `INSERT INTO login_logs 
     (wallet_address, ip_address, user_agent, signature_valid, hash_match, login_success, is_anomaly, anomaly_score, anomaly_reason)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      address.toLowerCase(), 
      ip, 
      userAgent, 
      true, // signature already verified in controller
      true, // hash match not applicable for MetaMask login
      true, 
      anomalyCheck.isAnomaly, 
      anomalyCheck.score, 
      anomalyCheck.reason
    ]
  );
  
  logger.info('MetaMask login successful', { address, ip, anomaly: anomalyCheck.isAnomaly });
  
  return {
    success: true,
    message: 'Đăng nhập thành công',
    user: {
      address: user.wallet_address,
      cccdHash: user.cccd_hash,
      cccdNumberHash: user.cccd_number_hash,
      createdAt: user.created_at,
      anomalyScore: parseFloat(user.avg_anomaly_score),
    },
    anomaly: anomalyCheck.isAnomaly ? {
      score: anomalyCheck.score,
      reason: anomalyCheck.reason,
      message: 'Phát hiện hoạt động bất thường. Vui lòng kiểm tra email để xác nhận.'
    } : null
  };
}

module.exports = { loginDID, loginWithSignature };
