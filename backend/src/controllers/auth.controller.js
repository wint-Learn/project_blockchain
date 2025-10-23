/**
 * Auth Controller
 * Xử lý business logic cho authentication (register, login, anomaly detection)
 */

const { hashCCCD } = require('../utils/crypto-utils');
const { encrypt } = require('../utils/crypto-utils');
const ethers = require('ethers');

/**
 * Register new DID
 * Flow: Hash CCCD → Send blockchain TX → Encrypt metadata → Save to DB
 */
exports.register = async (req, res) => {
  const { pool, contract, logger } = req.app.locals;
  
  try {
    const { cccdData, privateKey } = req.body;
    
    logger.info('Registration attempt started', { 
      cccdNumber: cccdData.cccdNumber?.slice(0, 4) + '***'
    });
    
    const wallet = new ethers.Wallet(privateKey, req.app.locals.provider);
    
    // 1) Hash CCCD data
    const cccdHash = hashCCCD(cccdData);
    
    // 2) Send blockchain transaction
    const tx = await contract.connect(wallet).createDID(cccdHash, wallet.publicKey);
    const receipt = await tx.wait();
    
    // 3) Encrypt metadata
    const encryptedData = encrypt(JSON.stringify(cccdData));
    
    // 4) Save to database
    await pool.query(
      `INSERT INTO users (wallet_address, cccd_hash, encrypted_cccd_data) 
       VALUES ($1, $2, $3)
       ON CONFLICT (wallet_address) DO UPDATE 
       SET cccd_hash = $2, encrypted_cccd_data = $3, updated_at = NOW()`,
      [wallet.address.toLowerCase(), cccdHash, encryptedData]
    );
    
    logger.info('Registration successful', {
      walletAddress: wallet.address,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    });
    
    res.json({ 
      success: true, 
      txHash: tx.hash, 
      blockNumber: receipt.blockNumber,
      walletAddress: wallet.address,
      cccdHash
    });
  } catch (error) {
    logger.error('Registration failed', {
      error: error.message,
      stack: error.stack,
      cccdNumber: req.body.cccdData?.cccdNumber?.slice(0, 4) + '***'
    });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Login with DID verification
 * Flow: Hash CCCD → Compare with on-chain → Verify signature → Log to DB
 */
exports.login = async (req, res) => {
  const { pool, contract, logger } = req.app.locals;
  
  try {
    const { address, cccdData, message, signature } = req.body;
    
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    logger.info('Login attempt', { address, ip });
    
    // 1) Hash CCCD data
    const cccdHash = hashCCCD(cccdData);
    
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
      res.json({ 
        success: true, 
        message: 'Đăng nhập thành công',
        anomaly: anomalyCheck.isAnomaly ? anomalyCheck.reason : null
      });
    } else {
      logger.warn('Login failed', { address, ip, signatureValid, hashMatch });
      res.status(401).json({ 
        success: false, 
        error: 'Xác thực thất bại',
        details: { signatureValid, hashMatch }
      });
    }
  } catch (error) {
    logger.error('Login error', {
      error: error.message,
      stack: error.stack,
      address: req.body.address,
      ip: req.ip
    });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Anomaly detection helper (rules-based)
 */
async function detectAnomaly(pool, walletAddress, currentIp) {
  try {
    // Rule 1: IP change in 24h
    const ipChangeResult = await pool.query(
      `SELECT COUNT(DISTINCT ip_address) as ip_count
       FROM login_logs
       WHERE wallet_address = $1 
       AND timestamp > NOW() - INTERVAL '24 hours'`,
      [walletAddress]
    );
    const ipCount = parseInt(ipChangeResult.rows[0]?.ip_count || 0);
    
    // Rule 2: Login frequency in 1h
    const freqResult = await pool.query(
      `SELECT COUNT(*) as login_count
       FROM login_logs
       WHERE wallet_address = $1
       AND timestamp > NOW() - INTERVAL '1 hour'`,
      [walletAddress]
    );
    const loginCount = parseInt(freqResult.rows[0]?.login_count || 0);
    
    // Calculate anomaly score
    let score = 0;
    const reasons = [];
    
    if (ipCount > 3) {
      score += 0.4;
      reasons.push(`IP thay đổi ${ipCount} lần trong 24h`);
    }
    
    if (loginCount > 10) {
      score += 0.5;
      reasons.push(`Đăng nhập ${loginCount} lần trong 1h`);
    }
    
    // Night time login (0-5am VN = UTC+7)
    const hour = new Date().getUTCHours();
    const vnHour = (hour + 7) % 24;
    if (vnHour >= 0 && vnHour < 5) {
      score += 0.2;
      reasons.push('Đăng nhập vào giờ đêm (0-5am)');
    }
    
    return {
      isAnomaly: score >= 0.5,
      score: Math.min(score, 1.0),
      reason: reasons.join(', ') || null
    };
  } catch (error) {
    // Silent fail for anomaly detection
    return { isAnomaly: false, score: 0, reason: null };
  }
}
