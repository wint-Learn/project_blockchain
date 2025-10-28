/**
 * Get login activities for a specific wallet
 */
const getLoginActivities = async (req, res) => {
  const pool = req.app.locals.pool;
  const logger = req.app.locals.logger;
  
  try {
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required',
      });
    }

    // Query login activities from user_logins table (if exists)
    const result = await pool.query(
      `SELECT 
        id,
        wallet_address,
        login_time,
        ip_address,
        user_agent,
        location
      FROM user_logins 
      WHERE wallet_address = $1
      ORDER BY login_time DESC
      LIMIT 50`,
      [walletAddress.toLowerCase()]
    );

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error fetching login activities:', error);
    
    // If table doesn't exist, return empty array
    if (error.code === '42P01') {
      return res.json({
        success: true,
        data: [],
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch login activities',
      error: error.message,
    });
  }
};

module.exports = {
  getLoginActivities,
};
