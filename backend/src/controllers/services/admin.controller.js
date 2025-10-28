/**
 * Controller: Admin phê duyệt/từ chối yêu cầu dịch vụ công
 */

const { ethers } = require('ethers');

/**
 * GET /api/services/admin/pending
 * Lấy danh sách yêu cầu đang chờ xử lý
 */
async function getPendingRequests(req, res) {
  const pool = req.app.locals.pool;
  const logger = req.app.locals.logger;
  
  try {
    const { serviceType } = req.query; // optional filter
    
    let query = `
      SELECT 
        sr.id,
        sr.wallet_address,
        sr.service_type,
        sr.service_data,
        sr.status,
        sr.created_at,
        pv.full_name,
        pv.phone_number,
        pv.cccd_number
      FROM service_requests sr
      LEFT JOIN users u ON sr.wallet_address = u.wallet_address
      LEFT JOIN pre_verified_cccd pv ON sr.cccd_number_hash = pv.cccd_number_hash
      WHERE sr.status = 'pending'
    `;
    
    const params = [];
    
    if (serviceType) {
      query += ` AND sr.service_type = $1`;
      params.push(serviceType);
    }
    
    query += ` ORDER BY sr.created_at ASC`;
    
    const result = await pool.query(query, params);
    
    return res.json({
      success: true,
      data: result.rows,
    });
    
  } catch (error) {
    logger.error('❌ Get pending requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách yêu cầu',
      error: error.message,
    });
  }
}

/**
 * POST /api/services/admin/approve/:id
 * Admin phê duyệt yêu cầu và ghi lên blockchain
 */
async function approveRequest(req, res) {
  const pool = req.app.locals.pool;
  const logger = req.app.locals.logger;
  const contract = req.app.locals.serviceContract; // ServiceRegistry contract
  
  try {
    const { id } = req.params;
    
    // Backend tự động dùng admin wallet từ .env
    // Không cần frontend gửi adminAddress nữa
    const adminPrivateKey = process.env.ADMIN_WALLET_PRIVATE_KEY_1;
    
    if (!adminPrivateKey) {
      return res.status(500).json({
        success: false,
        message: 'Admin wallet chưa được cấu hình',
      });
    }
    
    // Lấy admin address từ private key
    const provider = req.app.locals.provider;
    const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
    const adminAddress = adminWallet.address;
    
    logger.info(`🔐 Admin wallet: ${adminAddress}`);
    
    // Lấy thông tin yêu cầu
    const requestQuery = await pool.query(
      `SELECT sr.*, pv.cccd_number_hash 
       FROM service_requests sr
       LEFT JOIN pre_verified_cccd pv ON sr.cccd_number_hash = pv.cccd_number_hash
       WHERE sr.id = $1`,
      [id]
    );
    
    if (requestQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu',
      });
    }
    
    const request = requestQuery.rows[0];
    
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Yêu cầu này đã được xử lý (${request.status})`,
      });
    }
    
    // Gọi smart contract để đăng ký dịch vụ lên blockchain
    logger.info(`🔗 Đang ghi dịch vụ lên blockchain: Request ID=${id}`);
    
    try {
      // Admin wallet đã được tạo ở trên
      const contractWithSigner = contract.connect(adminWallet);
      
      // Convert cccd_number_hash to bytes32
      const cccdHashBytes32 = request.cccd_number_hash;
      
      // Gọi contract.registerService()
      const tx = await contractWithSigner.registerService(
        request.wallet_address,
        cccdHashBytes32,
        request.service_type,
        JSON.stringify(request.service_data)
      );
      
      logger.info(`⏳ Transaction submitted: ${tx.hash}`);
      
      // Đợi transaction được mine
      const receipt = await tx.wait();
      
      logger.info(`✅ Transaction mined: Block ${receipt.blockNumber}`);
      
      // Lấy serviceId từ event (nếu có)
      let serviceId = null;
      if (receipt.logs && receipt.logs.length > 0) {
        // Parse event ServiceRegistered
        try {
          const serviceRegisteredEvent = receipt.logs.find(log => {
            try {
              const parsed = contract.interface.parseLog(log);
              return parsed && parsed.name === 'ServiceRegistered';
            } catch {
              return false;
            }
          });
          
          if (serviceRegisteredEvent) {
            const parsed = contract.interface.parseLog(serviceRegisteredEvent);
            serviceId = parsed.args.serviceId.toString();
          }
        } catch (e) {
          logger.warn('Không parse được serviceId từ event:', e.message);
        }
      }
      
      // Cập nhật database
      const updateQuery = `
        UPDATE service_requests
        SET status = 'approved',
            tx_hash = $1,
            service_id = $2,
            approved_by = $3,
            approved_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;
      
      const updateResult = await pool.query(updateQuery, [
        receipt.hash,
        serviceId,
        adminAddress.toLowerCase(),
        id,
      ]);
      
      logger.info(`✅ Đã phê duyệt yêu cầu ID=${id}, TX=${receipt.hash}`);
      
      return res.json({
        success: true,
        message: 'Phê duyệt thành công!',
        data: {
          requestId: id,
          txHash: receipt.hash,
          serviceId,
          blockNumber: receipt.blockNumber,
          request: updateResult.rows[0],
        },
      });
      
    } catch (blockchainError) {
      logger.error('❌ Blockchain error:', blockchainError);
      
      // Nếu lỗi blockchain, vẫn có thể approve trong DB (tùy logic)
      // Hoặc rollback và báo lỗi
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi ghi lên blockchain',
        error: blockchainError.message,
      });
    }
    
  } catch (error) {
    logger.error('❌ Approve request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi phê duyệt',
      error: error.message,
    });
  }
}

/**
 * POST /api/services/admin/reject/:id
 * Admin từ chối yêu cầu
 */
async function rejectRequest(req, res) {
  const pool = req.app.locals.pool;
  const logger = req.app.locals.logger;
  
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    
    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu lý do từ chối',
      });
    }
    
    // Backend tự động dùng admin wallet từ .env
    const adminPrivateKey = process.env.ADMIN_WALLET_PRIVATE_KEY_1;
    
    if (!adminPrivateKey) {
      return res.status(500).json({
        success: false,
        message: 'Admin wallet chưa được cấu hình',
      });
    }
    
    // Lấy admin address từ private key
    const provider = req.app.locals.provider;
    const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
    const adminAddress = adminWallet.address;
    
    // Kiểm tra yêu cầu
    const requestQuery = await pool.query(
      'SELECT * FROM service_requests WHERE id = $1',
      [id]
    );
    
    if (requestQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu',
      });
    }
    
    const request = requestQuery.rows[0];
    
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Yêu cầu này đã được xử lý (${request.status})`,
      });
    }
    
    // Cập nhật trạng thái
    const updateQuery = `
      UPDATE service_requests
      SET status = 'rejected',
          rejection_reason = $1,
          approved_by = $2,
          approved_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [
      rejectionReason,
      adminAddress.toLowerCase(),
      id,
    ]);
    
    logger.info(`❌ Đã từ chối yêu cầu ID=${id}, Lý do: ${rejectionReason}`);
    
    return res.json({
      success: true,
      message: 'Đã từ chối yêu cầu',
      data: result.rows[0],
    });
    
  } catch (error) {
    logger.error('❌ Reject request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi từ chối',
      error: error.message,
    });
  }
}

/**
 * GET /api/services/admin/all
 * Lấy tất cả yêu cầu (mọi trạng thái)
 */
async function getAllRequests(req, res) {
  const pool = req.app.locals.pool;
  const logger = req.app.locals.logger;
  
  try {
    const { status, serviceType } = req.query;
    
    let query = `
      SELECT 
        sr.*,
        pv.full_name,
        pv.phone_number,
        pv.cccd_number
      FROM service_requests sr
      LEFT JOIN pre_verified_cccd pv ON sr.cccd_number_hash = pv.cccd_number_hash
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND sr.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (serviceType) {
      query += ` AND sr.service_type = $${paramIndex}`;
      params.push(serviceType);
      paramIndex++;
    }
    
    query += ` ORDER BY sr.created_at DESC`;
    
    const result = await pool.query(query, params);
    
    return res.json({
      success: true,
      data: result.rows,
    });
    
  } catch (error) {
    logger.error('❌ Get all requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách yêu cầu',
      error: error.message,
    });
  }
}

module.exports = {
  getPendingRequests,
  approveRequest,
  rejectRequest,
  getAllRequests,
};
