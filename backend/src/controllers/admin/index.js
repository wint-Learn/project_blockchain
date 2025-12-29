/**
 * Admin Controller - Main Entry Point
 * Export tất cả admin controller functions
 */

const { adminLogin } = require('./auth.controller');
const { getLoginLogs } = require('./logs.controller');
const { getPreVerifiedCCCDs } = require('./cccd.controller');
const { getDashboardStats, exportLogs } = require('./dashboard.controller');

module.exports = {
  // Authentication
  adminLogin,
  
  // Log Management
  getLoginLogs,
  
  // CCCD Management
  getPreVerifiedCCCDs,
  
  // Dashboard & Analytics
  getDashboardStats,
  exportLogs
};
