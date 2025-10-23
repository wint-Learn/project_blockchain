const express = require('express');
const router = express.Router();
const didController = require('../controllers/did.controller');

/**
 * @route   GET /api/did/:address
 * @desc    Lấy thông tin DID của một address
 * @access  Public
 */
router.get('/:address', didController.getDIDInfo);

module.exports = router;
