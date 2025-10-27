/**
 * Service Management - Main Entry Point
 * Export các service management services
 */

const { createService, listServices } = require('./service-catalog.service');
const { requestService, getUserServices } = require('./service-request.service');
const { approveServiceRequest, rejectServiceRequest, getServiceRequests } = require('./service-approval.service');

module.exports = {
  createService,
  listServices,
  requestService,
  approveServiceRequest,
  rejectServiceRequest,
  getUserServices,
  getServiceRequests
};
