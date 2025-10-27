/**
 * Verification Routes
 * Pre-verification flow for CCCD before DID registration
 */

const express = require('express');
const router = express.Router();
const verifyController = require('../controllers/verify');

/**
 * POST /api/verify/request-otp
 * Request OTP for CCCD verification
 * Body: { cccdNumber, phoneNumber }
 */
router.post('/request-otp', verifyController.requestOTP);

/**
 * POST /api/verify/confirm-otp
 * Verify OTP code
 * Body: { cccdNumber, otp }
 */
router.post('/confirm-otp', verifyController.confirmOTP);

/**
 * GET /api/verify/status/:cccdHash
 * Check verification status
 */
router.get('/status/:cccdHash', verifyController.getVerificationStatus);

module.exports = router;
