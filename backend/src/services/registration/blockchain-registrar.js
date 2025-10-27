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
 * @returns {string} Public key bytes
 */
function preparePublicKey(walletAddress, publicKey, privateKey, provider, logger) {
  if (walletAddress) {
    // User's existing wallet - public key should be provided (recovered from signature)
    if (!publicKey) {
      const error = new Error('Public key is required for existing wallet registration');
      error.code = 'PUBLIC_KEY_REQUIRED';
      error.statusCode = 400;
      throw error;
    }
    logger.info('Using recovered public key for existing wallet', { address: walletAddress });
    return publicKey;
  } else {
    // New wallet - we have private key
    const userWallet = new ethers.Wallet(privateKey, provider);
    return userWallet.signingKey.publicKey;
  }
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
