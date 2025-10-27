/**
 * Service Catalog Service
 * Quản lý danh mục dịch vụ công
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

module.exports = {
  createService,
  listServices
};
