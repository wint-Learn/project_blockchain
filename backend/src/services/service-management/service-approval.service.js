/**
 * Service Approval Service
 * Admin duyệt/từ chối yêu cầu dịch vụ
 */

const { setAttributeOnChain } = require('../shared/blockchain.helper');

/**
 * Admin duyệt yêu cầu dịch vụ
 * @param {number} requestId - Service request ID
 * @param {number} adminId - Admin user ID
 * @param {string} adminNotes - Ghi chú của admin
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} contract - DIDRegistry contract instance
 * @param {Object} adminWallet - Admin's ethers.Wallet
 * @param {Object} logger - Winston logger
 * @returns {Promise<{success: boolean, txHash: string}>}
 */
async function approveServiceRequest(requestId, adminId, adminNotes, pool, contract, adminWallet, logger) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update request status
    const result = await client.query(
      `UPDATE service_requests 
       SET status = 'approved', 
           approved_by = $1, 
           admin_notes = $2,
           updated_at = NOW()
       WHERE id = $3 AND status = 'pending'
       RETURNING user_address, service_id`,
      [adminId, adminNotes, requestId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Yêu cầu không tồn tại hoặc đã được xử lý');
    }
    
    const { user_address, service_id } = result.rows[0];
    
    // Blockchain transaction: Grant service credential
    let txHash = null;
    
    if (contract && adminWallet) {
      try {
        const attributeKey = `service_${service_id}_approved`;
        const attributeValue = JSON.stringify({
          requestId,
          approvedBy: adminWallet.address,
          approvedAt: new Date().toISOString(),
          notes: adminNotes
        });
        
        txHash = await setAttributeOnChain({
          userAddress: user_address,
          attributeKey,
          attributeValue,
          validity: 86400 * 365, // 1 năm
          contract,
          adminWallet,
          logger
        });
        
        logger.info('Blockchain transaction created for service approval', {
          requestId,
          txHash,
          userAddress: user_address,
          serviceId: service_id
        });
        
      } catch (blockchainError) {
        logger.error('Blockchain transaction failed, but continuing with DB update', {
          error: blockchainError.message,
          requestId
        });
        // KHÔNG throw error - vẫn approve trong DB nếu blockchain fail
      }
    } else {
      logger.warn('No blockchain contract or admin wallet provided, skipping on-chain transaction');
    }
    
    // Update transaction hash
    if (txHash) {
      await client.query(
        `UPDATE service_requests SET admin_notes = $1 WHERE id = $2`,
        [adminNotes + ` [TX: ${txHash}]`, requestId]
      );
    }
    
    // Log admin action
    await client.query(
      `INSERT INTO admin_action_logs (admin_id, action, resource_type, resource_id, details)
       VALUES ($1, 'approve_service_request', 'service_requests', $2, $3)`,
      [adminId, requestId, JSON.stringify({ 
        userAddress: user_address.slice(0, 10) + '...', 
        serviceId: service_id,
        txHash: txHash || 'N/A'
      })]
    );
    
    await client.query('COMMIT');
    
    logger.info('Service request approved', { requestId, adminId, txHash });
    
    return { 
      success: true,
      txHash: txHash || null
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to approve service request', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Admin từ chối yêu cầu dịch vụ
 * @param {number} requestId - Service request ID
 * @param {number} adminId - Admin user ID
 * @param {string} reason - Lý do từ chối
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<{success: boolean}>}
 */
async function rejectServiceRequest(requestId, adminId, reason, pool, logger) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update request status
    const result = await client.query(
      `UPDATE service_requests 
       SET status = 'rejected', 
           approved_by = $1, 
           admin_notes = $2,
           updated_at = NOW()
       WHERE id = $3 AND status = 'pending'
       RETURNING user_address, service_id`,
      [adminId, reason, requestId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Yêu cầu không tồn tại hoặc đã được xử lý');
    }
    
    const { user_address, service_id } = result.rows[0];
    
    // Log admin action
    await client.query(
      `INSERT INTO admin_action_logs (admin_id, action, resource_type, resource_id, details)
       VALUES ($1, 'reject_service_request', 'service_requests', $2, $3)`,
      [adminId, requestId, JSON.stringify({ 
        userAddress: user_address.slice(0, 10) + '...', 
        serviceId: service_id, 
        reason 
      })]
    );
    
    await client.query('COMMIT');
    
    logger.info('Service request rejected', { requestId, adminId, reason });
    
    return { success: true };
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to reject service request', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  approveServiceRequest,
  rejectServiceRequest
};
