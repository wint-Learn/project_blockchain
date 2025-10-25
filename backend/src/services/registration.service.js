/**
 * Registration Service
 * Xử lý logic đăng ký DID
 */

const { hashCCCD, hashCCCDNumber, extractCCCDNumber, encrypt } = require('../utils/crypto-utils');
const ethers = require('ethers');

/**
 * Register new DID
 * @param {Object} params - Registration parameters
 * @returns {Promise<Object>} Registration result
 */
async function registerDID({ qrData, privateKey, verificationToken, pool, contract, provider, logger }) {
  // User wallet (mới tạo, chưa có gas)
  const userWallet = new ethers.Wallet(privateKey, provider);
  
  // Ganache wallet (account 0) - có gas để trả transaction fee
  const ganacheWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // 1) Extract và hash số CCCD (để check duplicate)
  const cccdNumber = extractCCCDNumber(qrData);
  const cccdNumberHash = hashCCCDNumber(cccdNumber);
  
  // 2) Verify pre-verification token (if provided)
  if (verificationToken) {
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
  
  // 3) Hash full QR data (để lưu on-chain)
  const cccdHash = hashCCCD(qrData);
  
  // 3) Check if SỐ CCCD already exists in database
  const existingUser = await pool.query(
    'SELECT wallet_address, cccd_hash FROM users WHERE cccd_number_hash = $1',
    [cccdNumberHash]
  );
  
  if (existingUser.rows.length > 0) {
    logger.warn('CCCD number already registered', { 
      cccdNumber: cccdNumber.slice(0, 4) + '***',
      cccdNumberHash,
      existingAddress: existingUser.rows[0].wallet_address
    });
    
    const error = new Error(`Số CCCD ${cccdNumber} đã được đăng ký với địa chỉ ví khác. Vui lòng sử dụng chức năng đăng nhập.`);
    error.code = 'CCCD_ALREADY_EXISTS';
    error.statusCode = 409;
    error.existingAddress = existingUser.rows[0].wallet_address;
    throw error;
  }
  
  // 4) Get public key as bytes từ USER wallet
  const publicKeyBytes = userWallet.signingKey.publicKey;
  
  // 5) Send blockchain transaction (dùng Ganache wallet để trả gas)
  const tx = await contract.connect(ganacheWallet).createDID(
    cccdHash, 
    publicKeyBytes, 
    userWallet.address
  );
  const receipt = await tx.wait();
  
  // 6) Encrypt private key for storage
  const encryptedPrivateKey = encrypt(privateKey);
  
  // 7) Save to database
  await pool.query(
    `INSERT INTO users (wallet_address, cccd_hash, cccd_number_hash, encrypted_cccd_data) 
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (wallet_address) DO UPDATE 
     SET cccd_hash = $2, cccd_number_hash = $3, encrypted_cccd_data = $4, updated_at = NOW()`,
    [userWallet.address.toLowerCase(), cccdHash, cccdNumberHash, encryptedPrivateKey]
  );
  
  // 8) Mark CCCD as claimed in pre-verification table (if verification token was used)
  if (verificationToken) {
    await pool.query(
      `UPDATE pre_verified_cccd 
       SET status = 'claimed', claimed_at = NOW() 
       WHERE cccd_number_hash = $1`,
      [cccdNumberHash]
    );
    
    logger.info('CCCD marked as claimed', {
      cccdNumberHash: cccdNumberHash.slice(0, 10) + '...'
    });
  }
  
  logger.info('Registration successful', {
    walletAddress: userWallet.address,
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
    withPreVerification: !!verificationToken
  });
  
  return {
    success: true,
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
    address: userWallet.address,
    cccdHash
  };
}

module.exports = { registerDID };
