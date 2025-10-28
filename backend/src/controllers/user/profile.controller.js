/**
 * User Profile Controller
 * Lấy thông tin cá nhân của user (CCCD + DID)
 */

/**
 * Get user profile
 * GET /api/user/profile/:address
 */
async function getProfile(req, res) {
  const { pool, contract, logger } = req.app.locals;
  const { address } = req.params;

  try {
    logger.info('Get profile request', { address: address.slice(0, 10) + '...' });

    // 1. Lấy thông tin từ blockchain (DID)
    let didInfo = null;
    try {
      const publicKey = await contract.publicKeys(address);
      const cccdHash = await contract.cccdHashes(address);

      if (publicKey && publicKey !== '0x') {
        didInfo = {
          address,
          publicKey,
          cccdHash,
          hasMetadata: true,
        };
      }
    } catch (error) {
      logger.warn('Could not fetch DID from blockchain', { error: error.message });
    }

    // 2. Lấy thông tin CCCD từ database
    // Tìm trong bảng users (nếu đã đăng ký DID)
    let cccdInfo = null;
    
    const userQuery = await pool.query(
      'SELECT cccd_hash, cccd_number_hash FROM users WHERE wallet_address = $1',
      [address]
    );

    if (userQuery.rows.length > 0) {
      const cccdNumberHash = userQuery.rows[0].cccd_number_hash;
      
      // Lấy thông tin chi tiết từ pre_verified_cccd
      const cccdQuery = await pool.query(
        `SELECT cccd_number, full_name, date_of_birth, gender, address, issue_date, phone_number 
         FROM pre_verified_cccd 
         WHERE cccd_number_hash = $1`,
        [cccdNumberHash]
      );

      if (cccdQuery.rows.length > 0) {
        const row = cccdQuery.rows[0];
        cccdInfo = {
          cccdNumber: row.cccd_number,
          fullName: row.full_name,
          dateOfBirth: row.date_of_birth,
          gender: row.gender,
          address: row.address,
          issueDate: row.issue_date,
          phoneNumber: row.phone_number,
        };
      }
    }

    // 3. Lấy anomaly score từ login_logs (nếu có)
    let anomalyScore = 0;
    const anomalyQuery = await pool.query(
      `SELECT AVG(anomaly_score) as avg_score 
       FROM login_logs 
       WHERE wallet_address = $1 
       AND timestamp > NOW() - INTERVAL '7 days'`,
      [address]
    );

    if (anomalyQuery.rows.length > 0 && anomalyQuery.rows[0].avg_score) {
      anomalyScore = parseFloat(anomalyQuery.rows[0].avg_score);
    }

    // 4. Return combined data
    return res.json({
      success: true,
      data: {
        address,
        didInfo,
        cccdInfo,
        anomalyScore,
      },
    });

  } catch (error) {
    logger.error('Get profile error', { 
      error: error.message, 
      stack: error.stack,
      address 
    });
    
    return res.status(500).json({
      success: false,
      error: 'Không thể lấy thông tin profile',
      message: error.message,
    });
  }
}

module.exports = {
  getProfile,
};
