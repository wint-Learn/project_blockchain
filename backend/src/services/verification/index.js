/**
 * Verification Service - Main Entry Point
 * Re-export functions từ cấu trúc module mới
 */

const { requestOTP, verifyOTP, checkVerificationStatus } = require('./verification/verification.service');

module.exports = {
  requestOTP,
  verifyOTP,
  checkVerificationStatus
};
