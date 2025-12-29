/**
 * CCCD Management Service
 * Quản lý CCCD: import, blacklist, danh sách
 */

const { hashCCCDNumber } = require('../../utils/crypto-utils');

/**
 * Import batch of pre-verified CCCDs from CSV
 * @param {string} csvData - CSV file content
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<{success: boolean, imported: number, skipped: number, errors: Array}>}
 */
async function importCCCDBatch(csvData, pool, logger) {
  const results = {
    success: true,
    imported: 0,
    skipped: 0,
    errors: []
  };
  
  try {
    // Parse CSV
    const lines = csvData.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    // Validate headers
    const requiredHeaders = ['cccd_number', 'phone_number'];
    const hasRequiredHeaders = requiredHeaders.every(h => headers.includes(h));
    
    if (!hasRequiredHeaders) {
      throw new Error(`CSV phải có các cột: ${requiredHeaders.join(', ')}`);
    }
    
    const cccdIndex = headers.indexOf('cccd_number');
    const phoneIndex = headers.indexOf('phone_number');
    const fullNameIndex = headers.indexOf('full_name');
    const dobIndex = headers.indexOf('date_of_birth');
    const genderIndex = headers.indexOf('gender');
    const addressIndex = headers.indexOf('address');
    const issueDateIndex = headers.indexOf('issue_date');
    const notesIndex = headers.indexOf('notes');
    
    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim());
      const cccdNumber = values[cccdIndex];
      const phoneNumber = values[phoneIndex];
      const fullName = fullNameIndex >= 0 ? values[fullNameIndex] : null;
      const dateOfBirth = dobIndex >= 0 ? values[dobIndex] : null;
      const gender = genderIndex >= 0 ? values[genderIndex] : null;
      const address = addressIndex >= 0 ? values[addressIndex] : null;
      const issueDate = issueDateIndex >= 0 ? values[issueDateIndex] : null;
      const notes = notesIndex >= 0 ? values[notesIndex] : '';
      
      try {
        // Validate formats
        if (!/^\d{9,12}$/.test(cccdNumber)) {
          results.errors.push({ row: i + 1, cccdNumber, error: 'Số CCCD không hợp lệ' });
          results.skipped++;
          continue;
        }
        
        if (!/^0\d{9,10}$/.test(phoneNumber)) {
          results.errors.push({ row: i + 1, cccdNumber, error: 'Số điện thoại không hợp lệ' });
          results.skipped++;
          continue;
        }
        
        const cccdNumberHash = hashCCCDNumber(cccdNumber);
        
        // Check if already exists
        const existing = await pool.query(
          'SELECT id, status FROM pre_verified_cccd WHERE cccd_number_hash = $1',
          [cccdNumberHash]
        );
        
        if (existing.rows.length > 0) {
          results.errors.push({ 
            row: i + 1, 
            cccdNumber, 
            error: `Đã tồn tại với status: ${existing.rows[0].status}` 
          });
          results.skipped++;
          continue;
        }
        
        // Insert new record
        await pool.query(
          `INSERT INTO pre_verified_cccd (cccd_number, cccd_number_hash, full_name, date_of_birth, gender, address, issue_date, phone_number, status, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)`,
          [cccdNumber, cccdNumberHash, fullName, dateOfBirth, gender, address, issueDate, phoneNumber, notes]
        );
        
        results.imported++;
        
      } catch (error) {
        results.errors.push({ row: i + 1, cccdNumber, error: error.message });
        results.skipped++;
      }
    }
    
    logger.info('CCCD batch import completed', {
      imported: results.imported,
      skipped: results.skipped,
      totalErrors: results.errors.length
    });
    
    return results;
    
  } catch (error) {
    logger.error('CCCD batch import failed', { error: error.message });
    throw error;
  }
}

/**
 * Get list of pre-verified CCCDs with filters
 * @param {Object} filters - { status, limit, offset, search }
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<{records: Array, total: number}>}
 */
async function getPreVerifiedList(filters = {}, pool, logger) {
  try {
    const { status, limit = 50, offset = 0, search } = filters;
    
    let query = 'SELECT id, cccd_number_hash, cccd_number, full_name, date_of_birth, gender, address, issue_date, phone_number, status, notes, verified_at, claimed_at, created_at FROM pre_verified_cccd WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (phone_number LIKE $${paramIndex} OR cccd_number LIKE $${paramIndex} OR full_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // Get total count
    const countQuery = query.replace('SELECT id, cccd_number_hash, cccd_number, full_name, date_of_birth, gender, address, issue_date, phone_number, status, notes, verified_at, claimed_at, created_at', 'SELECT COUNT(*)');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    logger.info('Retrieved pre-verified list', {
      filters,
      count: result.rows.length,
      total
    });
    
    return {
      records: result.rows,
      total,
      limit,
      offset
    };
    
  } catch (error) {
    logger.error('Failed to get pre-verified list', { error: error.message });
    throw error;
  }
}

/**
 * Blacklist a CCCD
 * @param {number} id - pre_verified_cccd table ID
 * @param {string} reason - Blacklist reason
 * @param {number} adminId - Admin user ID
 * @param {Object} pool - PostgreSQL pool
 * @param {Object} logger - Winston logger
 * @returns {Promise<{success: boolean}>}
 */
async function blacklistCCCD(id, reason, adminId, pool, logger) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update status to blacklisted
    const result = await client.query(
      `UPDATE pre_verified_cccd 
       SET status = 'blacklisted', updated_at = NOW() 
       WHERE id = $1 AND status != 'claimed'
       RETURNING cccd_number_hash`,
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new Error('CCCD không tồn tại hoặc đã được claim');
    }
    
    const cccdNumberHash = result.rows[0].cccd_number_hash;
    
    // Log admin action
    await client.query(
      `INSERT INTO admin_action_logs (admin_id, action, resource_type, resource_id, details)
       VALUES ($1, 'blacklist', 'pre_verified_cccd', $2, $3)`,
      [adminId, id, JSON.stringify({ reason, cccdNumberHash: cccdNumberHash.slice(0, 20) + '...' })]
    );
    
    await client.query('COMMIT');
    
    logger.info('CCCD blacklisted', { id, adminId, reason });
    
    return { success: true };
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to blacklist CCCD', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  importCCCDBatch,
  getPreVerifiedList,
  blacklistCCCD
};
