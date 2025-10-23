const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { registerSchema, loginSchema, validateRequest } = require('../middleware/validation-schemas');

// Rate limit cho auth endpoints (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // chỉ 10 login/register attempts per 15 phút
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // chỉ đếm failed requests
});

/**
 * @route   POST /api/auth/register
 * @desc    Register DID mới
 * @access  Public (nhưng có rate limit)
 */
router.post('/register', authLimiter, validateRequest(registerSchema), authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login với signature verification
 * @access  Public (nhưng có rate limit)
 */
router.post('/login', authLimiter, validateRequest(loginSchema), authController.login);

module.exports = router;
