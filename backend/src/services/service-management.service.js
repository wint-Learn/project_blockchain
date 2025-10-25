/**
 * Service Management Service
 * Xử lý các dịch vụ công: đăng ký giấy phép kinh doanh, đăng ký xe, khai báo y tế...
 */

/**
 * Tạo dịch vụ mới (chỉ admin)
 * @param {Object} serviceData - {name, description, category, requiresVerification, metadata}
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<{success: boolean, serviceId: number}>}
 */
async function createService(serviceData, pool, logger) {
  try {
    const { name, description, category, requiresVerification = true, metadata = {} } = serviceData;
    
    // Validate required fields
    if (!name || !description || !category) {
      throw new Error('Thiếu thông tin bắt buộc: name, description, category');
    }
    
    const result = await pool.query(
      `INSERT INTO services (name, description, category, requires_verification, metadata, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id`,
      [name, description, category, requiresVerification, JSON.stringify(metadata)]
    );
    
    const serviceId = result.rows[0].id;
    
    logger.info('Service created', { serviceId, name, category });
    
    return {
      success: true,
      serviceId
    };
    
  } catch (error) {
    logger.error('Failed to create service', { error: error.message });
    throw error;
  }
}

/**
 * Lấy danh sách dịch vụ (public - ai cũng xem được)
 * @param {Object} filters - {category, isActive}
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<Array>} List of services
 */
async function listServices(filters = {}, pool, logger) {
  try {
    const { category, isActive = true } = filters;
    
    let query = 'SELECT id, name, description, category, requires_verification, metadata, is_active, created_at FROM services WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (isActive !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    
    logger.info('Services listed', { count: result.rows.length, filters });
    
    return result.rows;
    
  } catch (error) {
    logger.error('Failed to list services', { error: error.message });
    throw error;
  }
}

/**
 * User nộp đơn yêu cầu dịch vụ
 * @param {string} userAddress - Wallet address
 * @param {number} serviceId - Service ID
 * @param {Object} requestData - Form data from user
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<{success: boolean, requestId: number}>}
 */
async function requestService(userAddress, serviceId, requestData, pool, logger) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if service exists and is active
    const serviceCheck = await client.query(
      'SELECT id, name, requires_verification FROM services WHERE id = $1 AND is_active = true',
      [serviceId]
    );
    
    if (serviceCheck.rows.length === 0) {
      throw new Error('Dịch vụ không tồn tại hoặc đã bị vô hiệu hóa');
    }
    
    const service = serviceCheck.rows[0];
    
    // Check if user has verified DID
    const userCheck = await client.query(
      'SELECT wallet_address FROM users WHERE wallet_address = $1',
      [userAddress.toLowerCase()]
    );
    
    if (userCheck.rows.length === 0) {
      throw new Error('User chưa đăng ký DID');
    }
    
    // Check if user already has pending request for this service
    const existingRequest = await client.query(
      `SELECT id FROM service_requests 
       WHERE user_address = $1 AND service_id = $2 AND status = 'pending'`,
      [userAddress.toLowerCase(), serviceId]
    );
    
    if (existingRequest.rows.length > 0) {
      throw new Error('Bạn đã có yêu cầu đang chờ xử lý cho dịch vụ này');
    }
    
    // Create service request
    const result = await client.query(
      `INSERT INTO service_requests (user_address, service_id, status, request_data)
       VALUES ($1, $2, 'pending', $3)
       RETURNING id`,
      [userAddress.toLowerCase(), serviceId, JSON.stringify(requestData)]
    );
    
    const requestId = result.rows[0].id;
    
    await client.query('COMMIT');
    
    logger.info('Service request created', { 
      requestId, 
      userAddress: userAddress.slice(0, 10) + '...', 
      serviceId,
      serviceName: service.name 
    });
    
    return {
      success: true,
      requestId
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to request service', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Admin duyệt yêu cầu dịch vụ
 * @param {number} requestId - Service request ID
 * @param {number} adminId - Admin user ID
 * @param {string} adminNotes - Ghi chú của admin
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<{success: boolean}>}
 */
async function approveServiceRequest(requestId, adminId, adminNotes, pool, logger) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update request status
    const result = await client.query(
      `UPDATE service_requests 
       SET status = 'approved', 
           approved_by = $1, 
           admin_notes = $2,
           updated_at = NOW()
       WHERE id = $3 AND status = 'pending'
       RETURNING user_address, service_id`,
      [adminId, adminNotes, requestId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Yêu cầu không tồn tại hoặc đã được xử lý');
    }
    
    const { user_address, service_id } = result.rows[0];
    
    // Log admin action
    await client.query(
      `INSERT INTO admin_action_logs (admin_id, action, resource_type, resource_id, details)
       VALUES ($1, 'approve_service_request', 'service_requests', $2, $3)`,
      [adminId, requestId, JSON.stringify({ userAddress: user_address.slice(0, 10) + '...', serviceId: service_id })]
    );
    
    await client.query('COMMIT');
    
    logger.info('Service request approved', { requestId, adminId });
    
    return { success: true };
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to approve service request', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Admin từ chối yêu cầu dịch vụ
 * @param {number} requestId - Service request ID
 * @param {number} adminId - Admin user ID
 * @param {string} reason - Lý do từ chối
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<{success: boolean}>}
 */
async function rejectServiceRequest(requestId, adminId, reason, pool, logger) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update request status
    const result = await client.query(
      `UPDATE service_requests 
       SET status = 'rejected', 
           approved_by = $1, 
           admin_notes = $2,
           updated_at = NOW()
       WHERE id = $3 AND status = 'pending'
       RETURNING user_address, service_id`,
      [adminId, reason, requestId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Yêu cầu không tồn tại hoặc đã được xử lý');
    }
    
    const { user_address, service_id } = result.rows[0];
    
    // Log admin action
    await client.query(
      `INSERT INTO admin_action_logs (admin_id, action, resource_type, resource_id, details)
       VALUES ($1, 'reject_service_request', 'service_requests', $2, $3)`,
      [adminId, requestId, JSON.stringify({ userAddress: user_address.slice(0, 10) + '...', serviceId: service_id, reason })]
    );
    
    await client.query('COMMIT');
    
    logger.info('Service request rejected', { requestId, adminId, reason });
    
    return { success: true };
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to reject service request', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Lấy danh sách yêu cầu dịch vụ của user
 * @param {string} userAddress - Wallet address
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<Array>} List of user's service requests
 */
async function getUserServices(userAddress, pool, logger) {
  try {
    const result = await pool.query(
      `SELECT 
        sr.id,
        sr.status,
        sr.request_data,
        sr.admin_notes,
        sr.created_at,
        sr.updated_at,
        s.id as service_id,
        s.name as service_name,
        s.description as service_description,
        s.category as service_category
       FROM service_requests sr
       JOIN services s ON sr.service_id = s.id
       WHERE sr.user_address = $1
       ORDER BY sr.created_at DESC`,
      [userAddress.toLowerCase()]
    );
    
    logger.info('User services retrieved', { 
      userAddress: userAddress.slice(0, 10) + '...', 
      count: result.rows.length 
    });
    
    return result.rows;
    
  } catch (error) {
    logger.error('Failed to get user services', { error: error.message });
    throw error;
  }
}

/**
 * Admin lấy danh sách tất cả service requests
 * @param {Object} filters - {status, serviceId, limit, offset}
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<{requests: Array, total: number}>}
 */
async function getServiceRequests(filters = {}, pool, logger) {
  try {
    const { status, serviceId, limit = 50, offset = 0 } = filters;
    
    let query = `
      SELECT 
        sr.id,
        sr.user_address,
        sr.status,
        sr.request_data,
        sr.admin_notes,
        sr.created_at,
        sr.updated_at,
        s.id as service_id,
        s.name as service_name,
        s.category as service_category
      FROM service_requests sr
      JOIN services s ON sr.service_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND sr.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (serviceId) {
      query += ` AND sr.service_id = $${paramIndex}`;
      params.push(serviceId);
      paramIndex++;
    }
    
    // Get total count
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Add pagination
    query += ` ORDER BY sr.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    logger.info('Service requests retrieved', { filters, count: result.rows.length, total });
    
    return {
      requests: result.rows,
      total,
      limit,
      offset
    };
    
  } catch (error) {
    logger.error('Failed to get service requests', { error: error.message });
    throw error;
  }
}

module.exports = {
  createService,
  listServices,
  requestService,
  approveServiceRequest,
  rejectServiceRequest,
  getUserServices,
  getServiceRequests
};
