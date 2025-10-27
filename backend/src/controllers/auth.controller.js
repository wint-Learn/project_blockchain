/**
 * Auth Controller
 * Xử lý HTTP requests cho authentication (register, login) - MetaMask-based
 */

const { registerDID } = require('../services/registration');
const { loginWithSignature } = require('../services/login.service');
const { generateWallet, generateWalletQR, verifySignature, generateLoginMessage } = require('../services/wallet.service');

/**
 * Register new DID with MetaMask
 * POST /api/auth/register
 * Body: { cccdNumber, fullName, dateOfBirth, gender, address, issueDate, phoneNumber, verificationToken, walletAddress?, signature? }
 */
exports.register = async (req, res) => {
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
      walletAddress, // 🆕 Optional: User's existing wallet
      signature // 🆕 Optional: Signature to recover public key
    } = req.body;
    
    logger.info('Registration attempt started (MetaMask flow)', { 
      cccdNumber: cccdNumber.slice(0, 4) + '***',
      phoneNumber: phoneNumber.slice(0, 4) + '***',
      withPreVerification: !!verificationToken,
      useExistingWallet: !!walletAddress
    });
    
    let wallet;
    let qrCode = null;
    
    // Option 1: Use existing wallet (user connected MetaMask)
    if (walletAddress) {
      logger.info('Using existing wallet', { address: walletAddress });
      
      // Recover public key from signature if provided
      let publicKey = null;
      if (signature) {
        const message = 'Register DID for e-Government';
        const recoveredAddress = ethers.verifyMessage(message, signature);
        
        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
          const error = new Error('Chữ ký không hợp lệ');
          error.statusCode = 400;
          throw error;
        }
        
        // Derive public key from signature
        const messageHash = ethers.hashMessage(message);
        const messageHashBytes = ethers.getBytes(messageHash);
        publicKey = ethers.SigningKey.recoverPublicKey(messageHashBytes, signature);
        logger.info('Public key recovered from signature', { publicKey: publicKey.slice(0, 20) + '...' });
      }
      
      wallet = {
        address: walletAddress,
        privateKey: null, // User controls their own private key
        mnemonic: null,
        publicKey // Recovered from signature
      };
    } 
    // Option 2: Generate new wallet (backend creates)
    else {
      wallet = generateWallet();
      logger.info('Wallet generated', { address: wallet.address });
      
      // Generate QR code for MetaMask import
      qrCode = await generateWalletQR(wallet.privateKey, phoneNumber);
    }
    
    // Step 3: Register DID on blockchain
    const qrData = `${cccdNumber}|${fullName}|${dateOfBirth}|${gender}|${userAddress}|${issueDate}`;
    
    const result = await registerDID({
      qrData,
      privateKey: wallet.privateKey || process.env.PRIVATE_KEY, // Use admin key if user wallet
      walletAddress: wallet.address, // The DID owner's address
      publicKey: wallet.publicKey, // Public key (from signature or generated)
      verificationToken,
      pool,
      contract,
      provider,
      logger
    });
    
    // Return response based on wallet type
    if (walletAddress) {
      // User used existing wallet - no need to return private key
      res.json({
        ...result,
        wallet: {
          address: wallet.address
        },
        message: 'Đăng ký thành công! Bạn có thể đăng nhập bằng ví MetaMask hiện tại.',
      });
    } else {
      // Backend created new wallet - return credentials
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
};

/**
 * Login with MetaMask signature
 * POST /api/auth/login
 * Body: { address, signature }
 */
exports.login = async (req, res) => {
  const { pool, contract, logger } = req.app.locals;
  
  try {
    const { address, signature } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Generate message that was signed
    const message = generateLoginMessage(address);
    
    // Verify signature
    const isValid = verifySignature(message, signature, address);
    if (!isValid) {
      return res.status(401).json({ 
        success: false,
        error: 'Chữ ký không hợp lệ. Vui lòng thử lại.',
      });
    }
    
    const result = await loginWithSignature({
      address,
      ip,
      userAgent,
      pool,
      contract,
      logger
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Login error', {
      error: error.message,
      stack: error.stack,
      address: req.body.address,
      ip: req.ip
    });
    
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ 
      success: false,
      error: error.message,
      details: error.details
    });
  }
};

/**
 * Get login message for signing
 * POST /api/auth/get-message
 * Body: { address }
 */
exports.getMessage = async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }
    
    const message = generateLoginMessage(address);
    
    res.json({ 
      success: true,
      message,
      timestamp: Date.now(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
