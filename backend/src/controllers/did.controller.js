/**
 * DID Controller
 * Xử lý business logic cho DID operations
 */

/**
 * Lấy thông tin DID từ blockchain và database
 */
async function getDIDInfo(req, res) {
  try {
    const addr = req.params.address;
    const contract = req.app.locals.contract;
    const pool = req.app.locals.pool;
    const logger = req.app.locals.logger;
    
    logger.info('DID info query', { address: addr });
    
    // Lấy data từ blockchain
    const [pk, hashOnChain] = await Promise.all([
      contract.publicKeys(addr),
      contract.cccdHashes(addr)
    ]);
    
    // Lấy encrypted metadata từ DB (nếu có)
    const dbRes = await pool.query(
      'SELECT encrypted_cccd_data, created_at FROM users WHERE wallet_address = $1',
      [addr.toLowerCase()]
    );
    
    res.json({ 
      address: addr, 
      publicKey: pk, 
      cccdHashOnChain: hashOnChain,
      hasMetadata: dbRes.rows.length > 0,
      registeredAt: dbRes.rows[0]?.created_at
    });
  } catch (error) {
    logger.error('DID info query failed', {
      error: error.message,
      stack: error.stack,
      address: req.params.address
    });
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getDIDInfo
};
