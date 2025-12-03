/**
 * Admin Authentication Controller
 * Xử lý đăng nhập admin
 */

const logger = require('../../config/logger');
const bcrypt = require('bcrypt');

/**
 * Admin login
 * POST /api/admin/login
 */
async function adminLogin(req, res) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        error: 'Thiếu thông tin',
        message: 'Vui lòng nhập tên đăng nhập và mật khẩu'
      });
    }
    
    const pool = req.app.locals.pool;
    
    // Find admin user
    const result = await pool.query(
      'SELECT id, username, password_hash, role FROM admin_users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      logger.warn('Admin login failed - user not found', { username });
      return res.status(401).json({
        error: 'Đăng nhập thất bại',
        message: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
    }
    
    const admin = result.rows[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    
    if (!isValidPassword) {
      logger.warn('Quản trị viên đăng nhập thất bại - mật khẩu không hợp lệ', { username });
      return res.status(401).json({
        error: 'Đăng nhập thất bại',
        message: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
    }
    
    // Generate token (simple demo token - use JWT in production)
    const token = Buffer.from(`${admin.id}:${admin.username}:${Date.now()}`).toString('base64');

    logger.info('Quản trị viên đăng nhập thành công', { adminId: admin.id, username: admin.username });

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      }
    });
    
  } catch (error) {
    logger.error('Admin login error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      error: 'Lỗi hệ thống',
      message: 'Không thể xử lý đăng nhập. Vui lòng thử lại.'
    });
  }
}

module.exports = {
  adminLogin
};
