/**
 * Message Controller
 * Xử lý tạo message để sign
 */

const { generateLoginMessage } = require('../../services/wallet.service');

/**
 * Get login message for signing
 * POST /api/auth/get-message
 */
async function getMessage(req, res) {
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
}

module.exports = {
  getMessage
};
