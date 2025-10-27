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

    // Pre-flight checks to give clearer errors instead of opaque estimateGas failures
    logger.info('Pre-flight blockchain checks', { contractAddress: contract.target || contract.address, admin: adminWallet.address });

    // 1) Check if CCCD already mapped on-chain
    try {
      const mapped = await contract.cccdToAddress(cccdHash);
      if (mapped && mapped !== '0x0000000000000000000000000000000000000000') {
        const msg = 'CCCD already registered on-chain';
        logger.warn(msg, { cccdHash, mapped });
        const error = new Error(msg);
        error.code = 'CCCD_ALREADY_REGISTERED';
        throw error;
      }
    } catch (readErr) {
      // If read fails, log and continue — some providers may throw for view calls with complex inputs
      logger.warn('Failed to read cccdToAddress before createDID', { error: readErr.message });
    }

    // 2) Check if target address already has a public key
    try {
      const existingPk = await contract.publicKeys(userAddress);
      if (existingPk && existingPk.length && existingPk !== '0x') {
        const msg = 'Address already has DID on-chain';
        logger.warn(msg, { userAddress });
        const error = new Error(msg);
        error.code = 'ADDRESS_ALREADY_HAS_DID';
        throw error;
      }
    } catch (readErr) {
      logger.warn('Failed to read publicKeys before createDID', { error: readErr.message });
    }

    // 3) Check admin wallet balance
    try {
      const bal = await provider.getBalance(adminWallet.address);
      logger.info('Admin wallet balance', { admin: adminWallet.address, balance: bal.toString() });
      if (bal === 0n) {
        const msg = 'Admin wallet has zero balance to pay gas';
        logger.error(msg, { admin: adminWallet.address });
        const error = new Error(msg);
        error.code = 'ADMIN_NO_FUNDS';
        throw error;
      }
    } catch (balErr) {
      logger.warn('Failed to read admin wallet balance', { error: balErr.message });
    }

    // Log chi tiết arguments trước khi gửi
    logger.info('createDID arguments', {
      cccdHash,
      publicKeyType: typeof publicKey,
      publicKeyLength: publicKey?.length || 0,
      publicKeyPreview: publicKey?.substring(0, 20) + '...',
      userAddress
    });

    // Try callStatic first to get revert reason (if any)
    try {
      await contract.connect(adminWallet).createDID.staticCall(
        cccdHash,
        publicKey,
        userAddress
      );
      logger.info('callStatic success - transaction should work');
    } catch (staticErr) {
      logger.error('callStatic failed - contract will revert', {
        error: staticErr.message,
        reason: staticErr.reason || 'unknown',
        code: staticErr.code,
        cccdHash,
        userAddress
      });
      
      // Parse revert reason to user-friendly message
      let userMessage = staticErr.reason || staticErr.message;
      let errorCode = 'CONTRACT_REVERT';
      
      if (userMessage.includes('CCCD already registered')) {
        userMessage = 'Số CCCD này đã được đăng ký trên blockchain';
        errorCode = 'CCCD_ALREADY_REGISTERED';
      } else if (userMessage.includes('Address already has DID')) {
        userMessage = 'Địa chỉ ví này đã có DID rồi';
        errorCode = 'ADDRESS_ALREADY_HAS_DID';
      }
      
      // Re-throw với message rõ ràng hơn
      const error = new Error(userMessage);
      error.code = errorCode;
      error.originalError = staticErr;
      throw error;
    }

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
