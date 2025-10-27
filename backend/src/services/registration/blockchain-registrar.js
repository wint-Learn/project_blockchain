/**
 * Blockchain Registrar
 * Xử lý đăng ký DID lên blockchain
 */

const ethers = require('ethers');
const { createDIDOnChain } = require('../shared/blockchain.helper');

/**
 * Chuẩn bị public key cho blockchain
 * @param {string|null} walletAddress - Existing wallet address (nếu có)
 * @param {string|null} publicKey - Public key đã recover (nếu có)
 * @param {string|null} privateKey - Private key của wallet mới
 * @param {Object} provider - Ethers provider
 * @param {Object} logger - Winston logger
 * @returns {string} Public key bytes (hex string, sẽ được convert sang bytes khi gửi)
 */
function preparePublicKey(walletAddress, publicKey, privateKey, provider, logger) {
  let pkHex;
  
  if (walletAddress) {
    // User's existing wallet - public key should be provided (recovered from signature)
    if (!publicKey) {
      const error = new Error('Public key is required for existing wallet registration');
      error.code = 'PUBLIC_KEY_REQUIRED';
      error.statusCode = 400;
      throw error;
    }
    logger.info('Using recovered public key for existing wallet', { address: walletAddress });
    pkHex = publicKey;
  } else {
    // New wallet - we have private key
    const userWallet = new ethers.Wallet(privateKey, provider);
    pkHex = userWallet.signingKey.publicKey;
  }
  
  // CRITICAL FIX: Ensure publicKey is proper hex format
  // Contract expects bytes - ethers will auto-convert hex string to bytes
  if (!pkHex.startsWith('0x')) {
    pkHex = '0x' + pkHex;
  }
  
  // Validate length (33 bytes compressed or 65 bytes uncompressed)
  const pkBytes = ethers.getBytes(pkHex);
  if (pkBytes.length !== 33 && pkBytes.length !== 65) {
    logger.error('Invalid public key length', { 
      length: pkBytes.length, 
      expected: '33 or 65 bytes',
      publicKey: pkHex.substring(0, 20) + '...'
    });
    const error = new Error(`Invalid public key length: ${pkBytes.length} bytes (expected 33 or 65)`);
    error.code = 'INVALID_PUBLIC_KEY';
    error.statusCode = 400;
    throw error;
  }
  
  logger.info('Public key validated', { 
    length: pkBytes.length, 
    format: pkBytes.length === 65 ? 'uncompressed' : 'compressed',
    preview: pkHex.substring(0, 20) + '...'
  });
  
  return pkHex;
}

/**
 * Đăng ký DID lên blockchain
 * @param {Object} params - { cccdHash, publicKey, userAddress, contract, provider, logger }
 * @returns {Promise<Object>} { txHash, blockNumber }
 */
async function registerDIDOnBlockchain({ cccdHash, publicKey, userAddress, contract, provider, logger }) {
  try {
    const result = await createDIDOnChain({
      cccdHash,
      publicKey,
      userAddress,
      contract,
      provider,
      logger
    });
    
    logger.info('DID registered on blockchain', {
      userAddress,
      txHash: result.txHash,
      blockNumber: result.blockNumber
    });
    
    return result;
    
  } catch (error) {
    logger.error('Failed to register DID on blockchain', {
      error: error.message,
      userAddress
    });
    throw error;
  }
}

module.exports = {
  preparePublicKey,
  registerDIDOnBlockchain
};
