const express = require('express');
const router = express.Router();
const profileController = require('../controllers/user/profile.controller');

/**
 * @route   GET /api/user/profile/:address
 * @desc    Get user profile (CCCD + DID info)
 * @access  Public (nhưng nên có auth middleware sau)
 */
router.get('/profile/:address', profileController.getProfile);

module.exports = router;
