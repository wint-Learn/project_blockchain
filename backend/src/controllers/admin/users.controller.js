/**
 * Controller: Admin quản lý users đã đăng ký DID
 */

/**
 * GET /api/admin/users
 * Lấy danh sách users đã đăng ký DID
 */
async function getRegisteredUsers(req, res) {
  const pool = req.app.locals.pool;
  const logger = req.app.locals.logger;
  
  try {
    const query = `
      SELECT 
        u.id,
        u.wallet_address,
        u.cccd_hash,
        u.cccd_number_hash,
        u.created_at,
        pv.full_name,
        pv.phone_number,
        pv.cccd_number,
        pv.date_of_birth,
        pv.gender,
        pv.address
      FROM users u
      LEFT JOIN pre_verified_cccd pv ON u.cccd_number_hash = pv.cccd_number_hash
      ORDER BY u.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    return res.json({
      success: true,
      data: result.rows,
    });
    
  } catch (error) {
    logger.error('❌ Get registered users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách người dùng',
      error: error.message,
    });
  }
}

module.exports = {
  getRegisteredUsers,
};
