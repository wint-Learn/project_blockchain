/**
 * Service Management Service - Main Entry Point
 * Wrapper cho backward compatibility
 */

const { createService, listServices } = require('./service-management/service-catalog.service');
const { requestService, getUserServices, getServiceRequests } = require('./service-management/service-request.service');
const { approveServiceRequest, rejectServiceRequest } = require('./service-management/service-approval.service');

module.exports = {
  createService,
  listServices,
  requestService,
  approveServiceRequest,
  rejectServiceRequest,
  getUserServices,
  getServiceRequests
};
