const logger = require('../../config/logger');

/**
 * Get recent service requests
 */
async function getRecentRequests(req, res) {
  const { pool } = req.app.locals;
  const limit = req.query.limit || 10;

  try {
    const query = `
      SELECT 
        sr.id,
        sr.service_type,
        sr.status,
        sr.created_at,
        pv.full_name
      FROM service_requests sr
      LEFT JOIN users u ON sr.wallet_address = u.wallet_address
      LEFT JOIN pre_verified_cccd pv ON u.cccd_hash = pv.cccd_hash
      ORDER BY sr.created_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error fetching recent requests:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải yêu cầu gần đây'
    });
  }
}

module.exports = {
  getRecentRequests
};
