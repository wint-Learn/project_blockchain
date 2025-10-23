// crypto-utils.js - Encryption helpers cho CCCD metadata
const crypto = require('crypto');

// Lấy key từ .env (nên dùng key mạnh 32 bytes)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt dữ liệu (CCCD metadata)
 * @param {string} text - Raw data cần encrypt
 * @returns {string} - Format: iv:encryptedData (hex)
 */
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'),
    iv
  );
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt dữ liệu
 * @param {string} text - Format: iv:encryptedData
 * @returns {string} - Raw data
 */
function decrypt(text) {
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'),
    iv
  );
  
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Hash CCCD data (để lưu on-chain)
 * @param {object} cccdData - {cccd_number, name, dob, ...}
 * @returns {string} - Keccak256 hash
 */
function hashCCCD(cccdData) {
  const ethers = require('ethers');
  // Chuẩn hóa data trước khi hash
  const normalized = JSON.stringify(cccdData, Object.keys(cccdData).sort());
  return ethers.keccak256(ethers.toUtf8Bytes(normalized));
}

module.exports = { encrypt, decrypt, hashCCCD };
