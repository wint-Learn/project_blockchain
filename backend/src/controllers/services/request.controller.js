/**
 * Controller: Xử lý yêu cầu dịch vụ công
 */

const { hashCCCDNumber } = require('../../utils/crypto-utils');

/**
 * POST /api/services/request
 * Người dân gửi yêu cầu sử dụng dịch vụ công
 */
async function requestService(req, res) {
  const pool = req.app.locals.pool;
  const logger = req.app.locals.logger;
  
  try {
    const { walletAddress, serviceType, serviceData } = req.body;
    
    // Validate input
    if (!walletAddress || !serviceType || !serviceData) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc',
      });
    }
    
    // Validate service type
    const validServiceTypes = ['business_registration', 'vehicle_registration'];
    if (!validServiceTypes.includes(serviceType)) {
      return res.status(400).json({
        success: false,
        message: 'Loại dịch vụ không hợp lệ',
      });
    }
    
    // Kiểm tra user đã đăng ký chưa và lấy CCCD hash
    const userQuery = await pool.query(
      'SELECT wallet_address, cccd_number_hash FROM users WHERE wallet_address = $1',
      [walletAddress.toLowerCase()]
    );
    
    if (userQuery.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Vui lòng đăng ký tài khoản trước khi sử dụng dịch vụ',
      });
    }
    
    const cccdHash = userQuery.rows[0].cccd_number_hash;
    
    // Kiểm tra CCCD có trong danh sách pre-verified không
    const cccdQuery = await pool.query(
      'SELECT cccd_number_hash, full_name, status FROM pre_verified_cccd WHERE cccd_number_hash = $1',
      [cccdHash]
    );
    
    if (cccdQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Số CCCD không tồn tại trong hệ thống',
      });
    }
    
    if (cccdQuery.rows[0].status === 'blacklisted') {
      return res.status(403).json({
        success: false,
        message: 'CCCD này đã bị đưa vào danh sách đen',
      });
    }
    
    // Kiểm tra user có yêu cầu đang pending không (tránh spam)
    const pendingQuery = await pool.query(
      `SELECT id FROM service_requests 
       WHERE wallet_address = $1 
       AND service_type = $2 
       AND status = 'pending'`,
      [walletAddress.toLowerCase(), serviceType]
    );
    
    if (pendingQuery.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Bạn đã có yêu cầu đang chờ xử lý cho dịch vụ này',
      });
    }
    
    // Lưu yêu cầu vào database
    const insertQuery = `
      INSERT INTO service_requests (
        wallet_address, 
        cccd_number_hash, 
        service_type, 
        service_data,
        status
      ) VALUES ($1, $2, $3, $4, 'pending')
      RETURNING id, created_at
    `;
    
    const result = await pool.query(insertQuery, [
      walletAddress.toLowerCase(),
      cccdHash,
      serviceType,
      JSON.stringify(serviceData),
    ]);
    
    const requestId = result.rows[0].id;
    const createdAt = result.rows[0].created_at;
    
    logger.info(`📝 Yêu cầu dịch vụ mới: ID=${requestId}, Type=${serviceType}, User=${walletAddress}`);
    
    return res.status(201).json({
      success: true,
      message: 'Gửi yêu cầu thành công! Vui lòng đợi admin phê duyệt',
      data: {
        requestId,
        serviceType,
        status: 'pending',
        createdAt,
      },
    });
    
  } catch (error) {
    logger.error('❌ Request service error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi xử lý yêu cầu',
      error: error.message,
    });
  }
}

/**
 * GET /api/services/my-requests
 * Lấy danh sách yêu cầu của user
 */
async function getMyRequests(req, res) {
  const pool = req.app.locals.pool;
  const logger = req.app.locals.logger;
  
  try {
    const { walletAddress } = req.query;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu địa chỉ ví',
      });
    }
    
    const query = `
      SELECT 
        sr.id,
        sr.service_type,
        sr.service_data,
        sr.status,
        sr.rejection_reason,
        sr.tx_hash,
        sr.service_id,
        sr.approved_by,
        sr.approved_at,
        sr.created_at,
        sr.updated_at,
        pv.full_name
      FROM service_requests sr
      LEFT JOIN pre_verified_cccd pv ON sr.cccd_number_hash = pv.cccd_number_hash
      WHERE sr.wallet_address = $1
      ORDER BY sr.created_at DESC
    `;
    
    const result = await pool.query(query, [walletAddress.toLowerCase()]);
    
    return res.json({
      success: true,
      data: result.rows,
    });
    
  } catch (error) {
    logger.error('❌ Get my requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách yêu cầu',
      error: error.message,
    });
  }
}

/**
 * GET /api/services/request/:id
 * Lấy chi tiết một yêu cầu
 */
async function getRequestDetail(req, res) {
  const pool = req.app.locals.pool;
  const logger = req.app.locals.logger;
  
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        sr.*,
        pv.full_name,
        pv.phone_number
      FROM service_requests sr
      LEFT JOIN pre_verified_cccd pv ON sr.cccd_number_hash = pv.cccd_number_hash
      WHERE sr.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu',
      });
    }
    
    return res.json({
      success: true,
      data: result.rows[0],
    });
    
  } catch (error) {
    logger.error('❌ Get request detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết yêu cầu',
      error: error.message,
    });
  }
}

module.exports = {
  requestService,
  getMyRequests,
  getRequestDetail,
};
