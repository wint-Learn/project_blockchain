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
async function registerDID({ qrData, privateKey, pool, contract, provider, logger }) {
  // User wallet (mới tạo, chưa có gas)
  const userWallet = new ethers.Wallet(privateKey, provider);
  
  // Ganache wallet (account 0) - có gas để trả transaction fee
  const ganacheWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // 1) Extract và hash số CCCD (để check duplicate)
  const cccdNumber = extractCCCDNumber(qrData);
  const cccdNumberHash = hashCCCDNumber(cccdNumber);
  
  // 2) Hash full QR data (để lưu on-chain)
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
  
  logger.info('Registration successful', {
    walletAddress: userWallet.address,
    txHash: tx.hash,
    blockNumber: receipt.blockNumber
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
