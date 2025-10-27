/**
 * Service Request Service
 * Xử lý user yêu cầu dịch vụ
 */

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
  requestService,
  getUserServices,
  getServiceRequests
};
