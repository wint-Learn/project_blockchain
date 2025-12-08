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
        u.is_locked,
        u.locked_reason,
        u.locked_at,
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
    logger.error('Get registered users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách người dùng',
      error: error.message,
    });
  }
}

/**
 * POST /api/admin/users/:userId/lock
 * Khóa tài khoản người dùng
 */
async function lockUser(req, res) {
  const pool = req.app.locals.pool;
  const logger = req.app.locals.logger;
  const { userId } = req.params;
  const { reason } = req.body;
  
  try {
    // Validate reason
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Lý do khóa tài khoản là bắt buộc',
      });
    }

    // Check if user exists
    const checkQuery = 'SELECT id, wallet_address, is_locked FROM users WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    const user = checkResult.rows[0];
    if (user.is_locked) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản đã bị khóa trước đó',
      });
    }

    // Lock user
    const lockQuery = `
      UPDATE users 
      SET is_locked = true, 
          locked_reason = $1, 
          locked_at = NOW()
      WHERE id = $2
      RETURNING id, wallet_address, is_locked, locked_reason, locked_at
    `;
    const lockResult = await pool.query(lockQuery, [reason.trim(), userId]);
    
    logger.info(`User ${user.wallet_address} (ID: ${userId}) has been locked. Reason: ${reason}`);
    
    return res.json({
      success: true,
      message: 'Đã khóa tài khoản người dùng thành công',
      data: lockResult.rows[0],
    });
    
  } catch (error) {
    logger.error('Lock user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi khóa tài khoản người dùng',
      error: error.message,
    });
  }
}

/**
 * POST /api/admin/users/:userId/unlock
 * Mở khóa tài khoản người dùng
 */
async function unlockUser(req, res) {
  const pool = req.app.locals.pool;
  const logger = req.app.locals.logger;
  const { userId } = req.params;
  
  try {
    // Check if user exists
    const checkQuery = 'SELECT id, wallet_address, is_locked FROM users WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    const user = checkResult.rows[0];
    if (!user.is_locked) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản chưa bị khóa',
      });
    }

    // Unlock user
    const unlockQuery = `
      UPDATE users 
      SET is_locked = false, 
          locked_reason = NULL, 
          locked_at = NULL
      WHERE id = $1
      RETURNING id, wallet_address, is_locked
    `;
    const unlockResult = await pool.query(unlockQuery, [userId]);
    
    logger.info(`User ${user.wallet_address} (ID: ${userId}) has been unlocked.`);
    
    return res.json({
      success: true,
      message: 'Đã mở khóa tài khoản người dùng thành công',
      data: unlockResult.rows[0],
    });
    
  } catch (error) {
    logger.error('Unlock user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi mở khóa tài khoản người dùng',
      error: error.message,
    });
  }
}

module.exports = {
  getRegisteredUsers,
  lockUser,
  unlockUser,
};
