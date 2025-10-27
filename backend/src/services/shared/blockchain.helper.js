/**
 * Blockchain Helper
 * Các hàm tiện ích để tương tác với blockchain
 */

const ethers = require('ethers');

/**
 * Lấy admin wallet từ private key
 * @param {Object} provider - Ethers provider
 * @returns {ethers.Wallet} Admin wallet
 */
function getAdminWallet(provider) {
  return new ethers.Wallet(process.env.PRIVATE_KEY, provider);
}

/**
 * Tạo DID trên blockchain
 * @param {Object} params - { cccdHash, publicKey, userAddress, contract, provider, logger }
 * @returns {Promise<Object>} { txHash, blockNumber }
 */
async function createDIDOnChain({ cccdHash, publicKey, userAddress, contract, provider, logger }) {
  try {
    const adminWallet = getAdminWallet(provider);
    
    // Admin wallet trả phí gas cho transaction
    const tx = await contract.connect(adminWallet).createDID(
      cccdHash,
      publicKey,
      userAddress
    );
    
    const receipt = await tx.wait();
    
    logger.info('Blockchain DID created', {
      userAddress,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    });
    
    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
    
  } catch (error) {
    logger.error('Blockchain transaction failed', {
      error: error.message,
      userAddress
    });
    throw error;
  }
}

/**
 * Set attribute trên blockchain (dùng cho service approval)
 * @param {Object} params - { userAddress, attributeKey, attributeValue, validity, contract, adminWallet, logger }
 * @returns {Promise<string>} Transaction hash
 */
async function setAttributeOnChain({ userAddress, attributeKey, attributeValue, validity, contract, adminWallet, logger }) {
  try {
    const contractWithSigner = contract.connect(adminWallet);
    
    const tx = await contractWithSigner.setAttribute(
      userAddress,
      attributeKey,
      attributeValue,
      validity
    );
    
    const receipt = await tx.wait();
    
    logger.info('Blockchain attribute set', {
      userAddress,
      attributeKey,
      txHash: receipt.hash
    });
    
    return receipt.hash;
    
  } catch (error) {
    logger.error('Set attribute failed', {
      error: error.message,
      userAddress,
      attributeKey
    });
    throw error;
  }
}

module.exports = {
  getAdminWallet,
  createDIDOnChain,
  setAttributeOnChain
};
