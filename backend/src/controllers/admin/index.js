/**
 * Admin Controller - Main Entry Point
 * Export tất cả admin controller functions
 */

const { adminLogin } = require('./auth.controller');
const { getLoginLogs } = require('./logs.controller');
const { importCCCD, getPreVerifiedCCCDs, blacklistCCCD } = require('./cccd.controller');
const { getDashboardStats, exportLogs } = require('./dashboard.controller');

module.exports = {
  // Authentication
  adminLogin,
  
  // Log Management
  getLoginLogs,
  
  // CCCD Management
  importCCCD,
  getPreVerifiedCCCDs,
  blacklistCCCD,
  
  // Dashboard & Analytics
  getDashboardStats,
  exportLogs
};
