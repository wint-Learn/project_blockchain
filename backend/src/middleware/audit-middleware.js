/**
 * Audit Middleware cho admin actions
 * Tự động log tất cả actions vào audit_logs table
 */

const { Pool } = require('pg');

/**
 * Log một admin action vào audit_logs table
 * @param {Object} pool - PostgreSQL connection pool
 * @param {Object} options - Audit log options
 * @param {string} options.adminAddress - Admin wallet address (optional)
 * @param {string} options.actionType - Type of action (e.g., 'view_logs', 'rotate_key')
 * @param {string} options.targetResource - Resource being accessed (e.g., wallet address, log ID)
 * @param {Object} options.details - Additional details as JSON
 * @param {string} options.ipAddress - IP address of request
 * @param {string} options.userAgent - User agent string
 * @param {boolean} options.success - Whether action succeeded (default: true)
 * @param {string} options.errorMessage - Error message if failed
 */
async function logAuditAction(pool, options) {
  const {
    adminAddress = null,
    actionType,
    targetResource = null,
    details = {},
    ipAddress = null,
    userAgent = null,
    success = true,
    errorMessage = null
  } = options;

  try {
    await pool.query(
      `INSERT INTO audit_logs 
       (admin_address, action_type, target_resource, details, ip_address, user_agent, success, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        adminAddress,
        actionType,
        targetResource,
        JSON.stringify(details),
        ipAddress,
        userAgent,
        success,
        errorMessage
      ]
    );
  } catch (error) {
    // Không throw error để tránh break request chính
    // Chỉ log ra console
    console.error('❌ Failed to log audit action:', error.message);
  }
}

/**
 * Express middleware để tự động audit admin endpoints
 * Wrap endpoint handler và log action sau khi thực hiện
 * 
 * Usage:
 * app.get('/api/admin/logs', auditMiddleware('view_logs'), async (req, res) => {...})
 * 
 * @param {string} actionType - Type of action being performed
 * @param {Function} getTargetResource - Optional function to extract target resource from req
 * @returns {Function} Express middleware
 */
function auditMiddleware(actionType, getTargetResource = null) {
  return async (req, res, next) => {
    // Lưu original send method
    const originalSend = res.send;
    
    // Override res.send để capture response
    res.send = function(data) {
      // Restore original send
      res.send = originalSend;
      
      // Extract info from request
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');
      const adminAddress = req.get('x-admin-address') || req.query.admin || null;
      
      // Determine target resource
      let targetResource = null;
      if (getTargetResource) {
        targetResource = getTargetResource(req);
      } else if (req.params.address || req.query.address) {
        targetResource = req.params.address || req.query.address;
      }
      
      // Capture success status
      const success = res.statusCode >= 200 && res.statusCode < 400;
      
      // Log audit action (không đợi để tránh chậm response)
      setImmediate(() => {
        logAuditAction(req.app.locals.pool, {
          adminAddress,
          actionType,
          targetResource,
          details: {
            method: req.method,
            path: req.path,
            query: req.query,
            params: req.params,
            statusCode: res.statusCode
          },
          ipAddress,
          userAgent,
          success,
          errorMessage: success ? null : 'Request failed'
        });
      });
      
      // Send response như bình thường
      return originalSend.call(this, data);
    };
    
    next();
  };
}

module.exports = {
  logAuditAction,
  auditMiddleware
};
