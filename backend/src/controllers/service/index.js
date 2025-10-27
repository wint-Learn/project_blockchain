/**
 * Service Controller - Main Entry Point
 * Export tất cả service controller functions
 */

const { listServices } = require('./public.controller');
const { requestService, getMyServices } = require('./user-request.controller');
const { 
  createService, 
  getServiceRequests, 
  approveServiceRequest, 
  rejectServiceRequest 
} = require('./admin-management.controller');

module.exports = {
    // Public
    listServices,
    
    // User
    requestService,
    getMyServices,
    
    // Admin
    createService,
    getServiceRequests,
    approveServiceRequest,
    rejectServiceRequest
};
