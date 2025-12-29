/**
 * Verification Service - Main Entry Point
 */

const { requestOTP, verifyOTP } = require('./otp.service');
const { checkVerificationStatus } = require('./pre-verification.service');

module.exports = {
  requestOTP,
  verifyOTP,
  checkVerificationStatus
};
