/**
 * Admin Service - Main Entry Point
 * Wrapper cho backward compatibility
 */

const { importCCCDBatch, getPreVerifiedList, blacklistCCCD } = require('./admin/cccd-management.service');
const { getDashboardStats } = require('./admin/dashboard.service');
const { exportLogs } = require('./admin/logs.service');

module.exports = {
  importCCCDBatch,
  getPreVerifiedList,
  blacklistCCCD,
  getDashboardStats,
  exportLogs
};
