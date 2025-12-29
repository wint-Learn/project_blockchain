/**
 * Registration Service (Refactored)
 * Main orchestrator cho registration flow
 */

const { hashCCCD, hashCCCDNumber, extractCCCDNumber, encrypt } = require('../../utils/crypto-utils');
const { validateVerificationToken } = require('./verification-validator');
const { preparePublicKey, registerDIDOnBlockchain } = require('./blockchain-registrar');
const { checkCCCDExists, saveUser, markCCCDAsClaimed } = require('../shared/database.helper');

/**
 * Register new DID
 * @param {Object} params - Registration parameters
 * @returns {Promise<Object>} Registration result
 */
async function registerDID({ 
  qrData, 
  privateKey, 
  walletAddress, 
  publicKey, 
  verificationToken, 
  pool, 
  contract, 
  provider, 
  logger 
}) {
  // 1) Extract và hash số CCCD
  const cccdNumber = extractCCCDNumber(qrData);
  const cccdNumberHash = hashCCCDNumber(cccdNumber);
  const cccdHash = hashCCCD(qrData);
  
  // 2) Kiểm tra token xác thực (nếu có)
  await validateVerificationToken(verificationToken, cccdNumberHash, pool, logger);
  
  // 3) Kiểm tra xem CCCD đã được đăng ký chưa
  const existingUser = await checkCCCDExists(cccdNumber, pool);
  if (existingUser) {
    logger.warn('CCCD number already registered', { 
      cccdNumber: cccdNumber.slice(0, 4) + '***',
      existingAddress: existingUser.wallet_address
    });
    
    const error = new Error(`Số CCCD ${cccdNumber} đã được đăng ký với địa chỉ ví khác. Vui lòng sử dụng chức năng đăng nhập.`);
    error.code = 'CCCD_ALREADY_EXISTS';
    error.statusCode = 409;
    error.existingAddress = existingUser.wallet_address;
    throw error;
  }
  
  // 4) Prepare public key
  const publicKeyBytes = preparePublicKey(walletAddress, publicKey, privateKey, provider, logger);
  
  // 5) Determine DID owner address
  const didOwnerAddress = walletAddress || require('ethers').Wallet.createRandom().address;
  
  // 6) Register DID on blockchain
  const blockchainResult = await registerDIDOnBlockchain({
    cccdHash,
    publicKey: publicKeyBytes,
    userAddress: didOwnerAddress,
    contract,
    provider,
    logger
  });
  
  // 7) Encrypt private key (only if we created the wallet)
  let encryptedPrivateKey = null;
  if (privateKey && !walletAddress) {
    encryptedPrivateKey = encrypt(privateKey);
  }
  
  // 8) Save to database
  await saveUser({
    walletAddress: didOwnerAddress,
    cccdHash,
    cccdNumberHash,
    encryptedPrivateKey,
    pool
  });
  
  // 9) Mark CCCD as claimed
  if (verificationToken) {
    await markCCCDAsClaimed(cccdNumberHash, pool);
    logger.info('CCCD marked as claimed', {
      cccdNumberHash: cccdNumberHash.slice(0, 10) + '...'
    });
  }
  
  logger.info('Registration successful', {
    walletAddress: didOwnerAddress,
    txHash: blockchainResult.txHash,
    blockNumber: blockchainResult.blockNumber,
    withPreVerification: !!verificationToken
  });
  
  return {
    success: true,
    txHash: blockchainResult.txHash,
    blockNumber: blockchainResult.blockNumber,
    address: didOwnerAddress,
    cccdHash
  };
}

module.exports = { registerDID };
