/**
 * Login Service
 * Xử lý logic đăng nhập và verification
 */

const { hashCCCD } = require('../utils/crypto-utils');
const ethers = require('ethers');
const { logLogin } = require('../utils/loginLogger');
const { calculateLoginRisk } = require('../../../ai/anomalyDetection.service');
const { createLoginLog } = require('../../../ai/loginLogs.repository');
const axios = require('axios');

/**
 * Get IP geolocation using free API
 * @param {string} ip - IP address
 * @returns {Promise<Object>} Location object
 */
async function getIPLocation(ip) {
  // Skip localhost/private IPs
  if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {
      city: 'Localhost',
      country: 'Vietnam',
      countryCode: 'VN',
      full: 'Localhost, Vietnam'
    };
  }

  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city`, {
      timeout: 5000
    });
    
    if (response.data.status === 'success') {
      return {
        city: response.data.city || 'Unknown',
        country: response.data.country || 'Unknown',
        countryCode: response.data.countryCode || 'XX',
        full: `${response.data.city}, ${response.data.country}`
      };
    }
  } catch (error) {
    console.error('⚠️  IP geolocation failed:', error.message);
  }
  
  return {
    city: 'Unknown',
    country: 'Unknown',
    countryCode: 'XX',
    full: 'Unknown'
  };
}

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
 * Uses AI to detect anomalous logins
 * @param {Object} params - Login parameters
 * @returns {Promise<Object>} Login result with user info and risk analysis
 */
async function loginWithSignature({ address, ip, userAgent, pool, contract, logger }) {
  logger.info('🔐 MetaMask login attempt', { address, ip });
  
  // 1) Check if user exists in database
  const userResult = await pool.query(
    `SELECT u.*
     FROM users u
     WHERE u.wallet_address = $1`,
    [address.toLowerCase()]
  );
  
  if (userResult.rows.length === 0) {
    logger.warn('❌ Login failed - user not found', { address });
    const error = new Error('Địa chỉ ví chưa đăng ký DID');
    error.code = 'USER_NOT_REGISTERED';
    error.statusCode = 404;
    throw error;
  }

  const user = userResult.rows[0];
  
  // 2) Get IP geolocation (free API)
  const location = await getIPLocation(ip);
  
  // 3) Calculate login risk using AI anomaly detection
  let riskScore = 0;
  let isAnomaly = false;
  let anomalyDetails = null;
  
  try {
    const riskAnalysis = await calculateLoginRisk(
      pool,
      user.id,
      ip,
      userAgent,
      new Date()
    );
    
    riskScore = riskAnalysis.riskScore;
    isAnomaly = riskAnalysis.isAnomaly;
    anomalyDetails = riskAnalysis.details;
    
    logger.info('🤖 Anomaly detection completed', {
      userId: user.id,
      riskScore: (riskScore * 100).toFixed(1) + '%',
      isAnomaly
    });
  } catch (error) {
    logger.warn('⚠️  Anomaly detection failed (non-blocking)', { error: error.message });
    // Don't throw - this is non-critical
  }
  
  // 4) Log login to login_logs with risk analysis
  try {
    await createLoginLog(pool, {
      userId: user.id,
      username: user.username || user.wallet_address,
      walletAddress: address,
      ipAddress: ip,
      userAgent: userAgent,
      location: location.full,
      countryCode: location.countryCode,
      riskScore: riskScore,
      isAnomaly: isAnomaly,
      anomalyReason: isAnomaly ? anomalyDetails?.details?.reason : null,
      status: 'success'
    });
  } catch (error) {
    logger.warn('⚠️  Failed to log login to login_logs', { error: error.message });
    // Don't break login flow
  }

  // 5) Log to user_logins for activity history (backward compatibility)
  try {
    await pool.query(
      `INSERT INTO user_logins (wallet_address, ip_address, user_agent, location)
       VALUES ($1, $2, $3, $4)`,
      [address.toLowerCase(), ip, userAgent, location.full]
    );
  } catch (err) {
    logger.warn('⚠️  Failed to log user login activity', { error: err.message });
  }
  
  logger.info('✅ MetaMask login successful', {
    userId: user.id,
    address,
    ip,
    riskLevel: isAnomaly ? 'HIGH' : 'NORMAL'
  });
  
  return {
    success: true,
    message: 'Đăng nhập thành công',
    user: {
      id: user.id,
      address: user.wallet_address,
      cccdHash: user.cccd_hash,
      cccdNumberHash: user.cccd_number_hash,
      createdAt: user.created_at,
    },
    loginRisk: {
      riskScore: Math.round(riskScore * 1000) / 1000,
      isAnomaly: isAnomaly,
      location: location,
      details: isAnomaly ? anomalyDetails : null
    }
  };
}

module.exports = { loginDID, loginWithSignature, getIPLocation };
