/**
 * Script để rotate encryption key
 * Đọc tất cả encrypted_cccd_data từ DB, decrypt với old key, re-encrypt với new key
 * 
 * ⚠️  QUAN TRỌNG:
 * - Backup database trước khi chạy script này
 * - Script này sẽ update tất cả records, có thể mất thời gian với DB lớn
 * - Nên chạy trong maintenance window (tắt server để tránh race condition)
 * 
 * Usage:
 * 1. Backup database:
 *    pg_dump "postgres://postgres:1@localhost:5432/identity_db" > backup.sql
 * 
 * 2. Generate new key:
 *    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * 
 * 3. Chạy script với old và new key:
 *    node rotate-key.js OLD_KEY NEW_KEY
 * 
 * 4. Update .env file với NEW_KEY
 * 
 * 5. Restart server
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');
const crypto = require('crypto');

// Encryption functions (copy từ crypto-utils.js nhưng nhận key làm parameter)
function decrypt(text, encryptionKey) {
  const [ivHex, encrypted] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = Buffer.from(encryptionKey, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function encrypt(text, encryptionKey) {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(encryptionKey, 'hex');
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

async function rotateKey(oldKey, newKey) {
  const pool = new Pool({ connectionString: process.env.DB_CONNECTION_STRING });
  
  try {
    console.log('🔄 Bắt đầu key rotation...\n');
    
    // Validate keys
    if (oldKey.length !== 64 || newKey.length !== 64) {
      throw new Error('Keys phải là 32-byte hex strings (64 characters)');
    }
    
    // Get all users with encrypted data
    const result = await pool.query(
      'SELECT id, wallet_address, encrypted_cccd_data FROM users WHERE encrypted_cccd_data IS NOT NULL'
    );
    
    const users = result.rows;
    console.log(`📊 Tìm thấy ${users.length} users với encrypted data\n`);
    
    if (users.length === 0) {
      console.log('✅ Không có data cần rotate. Có thể update .env với new key.');
      return;
    }
    
    // Test decrypt 1 record với old key để verify
    console.log('🔍 Testing old key với first record...');
    try {
      const testDecrypted = decrypt(users[0].encrypted_cccd_data, oldKey);
      JSON.parse(testDecrypted); // verify JSON valid
      console.log('✅ Old key hợp lệ!\n');
    } catch (error) {
      throw new Error(`❌ Old key không decrypt được data: ${error.message}`);
    }
    
    // Rotate từng record
    console.log('🔄 Đang re-encrypt data...\n');
    let success = 0;
    let failed = 0;
    
    for (const user of users) {
      try {
        // Decrypt with old key
        const decryptedData = decrypt(user.encrypted_cccd_data, oldKey);
        
        // Re-encrypt with new key
        const reencryptedData = encrypt(decryptedData, newKey);
        
        // Update database
        await pool.query(
          'UPDATE users SET encrypted_cccd_data = $1, updated_at = NOW() WHERE id = $2',
          [reencryptedData, user.id]
        );
        
        success++;
        process.stdout.write(`\r  ✅ Progress: ${success}/${users.length} users`);
      } catch (error) {
        failed++;
        console.error(`\n  ❌ Failed for ${user.wallet_address}: ${error.message}`);
      }
    }
    
    console.log('\n\n📊 KẾT QUẢ:');
    console.log(`   - Thành công: ${success} users`);
    console.log(`   - Thất bại: ${failed} users`);
    
    if (failed === 0) {
      console.log('\n✅ Key rotation hoàn tất!');
      console.log('\n📝 NEXT STEPS:');
      console.log('   1. Update .env file:');
      console.log(`      ENCRYPTION_KEY=${newKey}`);
      console.log('   2. Restart server: npm start');
      console.log('   3. Test login/register để verify new key hoạt động');
    } else {
      console.log('\n⚠️  Có lỗi xảy ra, check logs và retry failed records');
    }
    
  } catch (error) {
    console.error('\n❌ LỖI:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.log('❌ Usage: node rotate-key.js <OLD_KEY> <NEW_KEY>');
    console.log('\nExample:');
    console.log('  node rotate-key.js \\');
    console.log('    a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456 \\');
    console.log('    f1e2d3c4b5a69780123456789abcdef0123456789abcdef0123456789abcdef');
    console.log('\nGenerate new key:');
    console.log('  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
  }
  
  const [oldKey, newKey] = args;
  rotateKey(oldKey, newKey);
}

module.exports = { rotateKey };
