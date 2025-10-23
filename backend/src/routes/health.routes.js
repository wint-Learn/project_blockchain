const express = require('express');
const router = express.Router();

/**
 * @route   GET /health
 * @desc    Health check endpoint - kiểm tra server và blockchain connection
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const provider = req.app.locals.provider;
    const net = await provider.getNetwork();
    res.json({ 
      ok: true, 
      network: { 
        name: net.name, 
        chainId: Number(net.chainId) 
      } 
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
