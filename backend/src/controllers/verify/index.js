/**
 * Verify Controller - Main Entry Point
 * Export tất cả verify controller functions
 */

const { requestOTP } = require('./otp-request.controller');
const { confirmOTP } = require('./otp-verify.controller');
const { getVerificationStatus } = require('./status.controller');

module.exports = {
  // OTP Flow
  requestOTP,
  confirmOTP,
  
  // Status
  getVerificationStatus
};
