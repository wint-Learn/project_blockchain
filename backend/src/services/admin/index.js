/**
 * Admin Service - Main Entry Point
 * Export các admin services
 */

const { importCCCDBatch, getPreVerifiedList, blacklistCCCD } = require('./cccd-management.service');
const { getDashboardStats } = require('./dashboard.service');
const { exportLogs } = require('./logs.service');

module.exports = {
  importCCCDBatch,
  getPreVerifiedList,
  blacklistCCCD,
  getDashboardStats,
  exportLogs
};
