/**
 * Verification Service - Main Entry Point
 * Re-export functions từ cấu trúc module mới
 */

const { requestOTP, verifyOTP } = require('./otp.service');
const { checkVerificationStatus } = require('./pre-verification.service');

module.exports = {
  requestOTP,
  verifyOTP,
  checkVerificationStatus
};
