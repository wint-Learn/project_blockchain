/**
 * Auth Controller
 * Xử lý HTTP requests cho authentication (register, login)
 */

const { registerDID } = require('../services/registration.service');
const { loginDID } = require('../services/login.service');

/**
 * Register new DID
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  const { pool, contract, provider, logger } = req.app.locals;
  
  try {
    const { qrData, privateKey, verificationToken } = req.body;
    
    logger.info('Registration attempt started', { 
      qrDataPreview: qrData.slice(0, 20) + '...',
      withPreVerification: !!verificationToken
    });
    
    const result = await registerDID({
      qrData,
      privateKey,
      verificationToken,
      pool,
      contract,
      provider,
      logger
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Registration failed', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      qrDataPreview: req.body.qrData?.slice(0, 20) + '...'
    });
    
    // Handle specific error codes with proper status codes
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
 * Login with DID verification
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  const { pool, contract, logger } = req.app.locals;
  
  try {
    const { address, qrData, message, signature } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    const result = await loginDID({
      address,
      qrData,
      message,
      signature,
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
