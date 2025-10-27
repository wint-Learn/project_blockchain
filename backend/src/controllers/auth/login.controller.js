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
}

module.exports = {
  login
};
