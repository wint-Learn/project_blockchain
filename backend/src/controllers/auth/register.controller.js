/**
 * Registration Controller
 * Xử lý đăng ký DID mới
 */

const { registerDID } = require('../../services/registration');
const { generateWallet, generateWalletQR } = require('../../services/wallet.service');
const { ethers } = require('ethers'); // 🆕 Import ethers for signature verification

/**
 * Register new DID with MetaMask
 * POST /api/auth/register
 */
async function register(req, res) {
  const { pool, contract, provider, logger } = req.app.locals;
  
  try {
    
    const { 
      cccdNumber, 
      fullName, 
      dateOfBirth, 
      gender, 
      address: userAddress, 
      issueDate, 
      phoneNumber,
      verificationToken,
      walletAddress,
      signature
    } = req.body;
    
    let wallet;
    let qrCode = null;
    
    // Option 1: Use existing wallet
    if (walletAddress) {
      logger.info('Using existing wallet', { address: walletAddress });
      
      let publicKey = null;
      if (signature) {
        const message = 'Register DID for e-Government';
        const recoveredAddress = ethers.verifyMessage(message, signature);
        
        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
          const error = new Error('Chữ ký không hợp lệ');
          error.statusCode = 400;
          throw error;
        }
        
        const messageHash = ethers.hashMessage(message);
        const messageHashBytes = ethers.getBytes(messageHash);
        publicKey = ethers.SigningKey.recoverPublicKey(messageHashBytes, signature);
        logger.info('Public key recovered from signature', { publicKey: publicKey.slice(0, 20) + '...' });
      }
      
      wallet = {
        address: walletAddress,
        privateKey: null,
        mnemonic: null,
        publicKey
      };
    } 
    // Option 2: Generate new wallet
    else {
      wallet = generateWallet();
      logger.info('Wallet generated', { address: wallet.address });
      qrCode = await generateWalletQR(wallet.privateKey, phoneNumber);
    }
    
    // Register DID on blockchain
    const qrData = `${cccdNumber}|${fullName}|${dateOfBirth}|${gender}|${userAddress}|${issueDate}`;
    
    const result = await registerDID({
      qrData,
      privateKey: wallet.privateKey || process.env.PRIVATE_KEY,
      walletAddress: wallet.address,
      publicKey: wallet.publicKey,
      verificationToken,
      pool,
      contract,
      provider,
      logger
    });
    
    // Return response based on wallet type
    if (walletAddress) {
      res.json({
        ...result,
        wallet: {
          address: wallet.address
        },
        message: 'Đăng ký thành công! Bạn có thể đăng nhập bằng ví MetaMask hiện tại.',
      });
    } else {
      res.json({
        ...result,
        wallet: {
          address: wallet.address,
          mnemonic: wallet.mnemonic,
          privateKey: wallet.privateKey,
        },
        qrCode,
        message: 'Đăng ký thành công! Import private key vào MetaMask để sử dụng.',
      });
    }
  } catch (error) {
    logger.error('Registration failed', {
      error: error.message,
      code: error.code,
      stack: error.stack,
    });
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({ 
        error: error.message,
        code: error.code,
        existingAddress: error.existingAddress
      });
    }
    
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  register
};
