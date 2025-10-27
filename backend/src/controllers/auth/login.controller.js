/**
 * Login Controller
 * Xử lý đăng nhập với MetaMask
 */

const { loginWithSignature } = require('../../services/login.service');
const { verifySignature, generateLoginMessage } = require('../../services/wallet.service');

/**
 * Login with MetaMask signature
 * POST /api/auth/login
 */
async function login(req, res) {
  const { pool, contract, logger } = req.app.locals;
  
  try {
    const { address, signature, message } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Validate that message was provided (frontend should send the message they signed)
    if (!message) {
      logger.warn('Missing message on login', { address, ip });
      return res.status(400).json({ 
        success: false,
        error: 'Missing message parameter',
        code: 'MISSING_MESSAGE'
      });
    }
    
    // Verify signature with the message that was actually signed
    const isValid = verifySignature(message, signature, address);
    if (!isValid) {
      logger.warn('Invalid signature on login', { address, ip, messageLength: message?.length });
      return res.status(401).json({ 
        success: false,
        error: 'Chữ ký không hợp lệ. Vui lòng thử lại.',
        code: 'INVALID_SIGNATURE'
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
      code: error.code || 'UNKNOWN_ERROR',
      details: error.details
    });
  }
}

module.exports = {
  login
};
