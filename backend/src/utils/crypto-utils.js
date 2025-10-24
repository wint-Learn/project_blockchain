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
 * Extract CCCD number from QR data
 * @param {string} qrData - Raw QR data: "cccd_number|old_number||name|dob|gender|address|issue_date"
 * @returns {string} - CCCD number (field đầu tiên)
 */
function extractCCCDNumber(qrData) {
  const fields = qrData.split('|');
  return fields[0] || '';
}

/**
 * Hash CCCD number only (để check duplicate)
 * @param {string} cccdNumber - CCCD number
 * @returns {string} - Keccak256 hash of CCCD number
 */
function hashCCCDNumber(cccdNumber) {
  const ethers = require('ethers');
  return ethers.keccak256(ethers.toUtf8Bytes(cccdNumber));
}

/**
 * Hash full QR data (để lưu on-chain - có thể update khi thông tin thay đổi)
 * @param {string} qrData - Raw QR data string from CCCD
 * @returns {string} - Keccak256 hash
 */
function hashCCCD(qrData) {
  const ethers = require('ethers');
  // Hash raw QR data string directly
  return ethers.keccak256(ethers.toUtf8Bytes(qrData));
}

module.exports = { encrypt, decrypt, hashCCCD, hashCCCDNumber, extractCCCDNumber };
