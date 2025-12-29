/**
 * Wallet Service
 * Generate and manage wallets for MetaMask-based authentication
 */

const ethers = require('ethers');
const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Generate new wallet for user
 * @returns {Object} wallet info with privateKey, address, mnemonic, publicKey
 */
function generateWallet() {
  const wallet = ethers.Wallet.createRandom();
  
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
    publicKey: wallet.signingKey.publicKey,
  };
}

/**
 * Generate QR code for wallet import (encrypted with phone number)
 * @param {string} privateKey - Wallet private key
 * @param {string} phoneNumber - User phone number (encryption key)
 * @returns {Promise<string>} Base64 QR code image
 */
async function generateWalletQR(privateKey, phoneNumber) {
  // Simple encryption: AES-256-CBC (for demo - use proper encryption in production)
  // SHA256 generates 32 bytes (256 bits) - perfect for AES-256
  const encryptionKey = crypto.createHash('sha256').update(phoneNumber).digest();
  const iv = Buffer.alloc(16, 0); // Initialization vector (should be random in production)
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // QR data format: e-gov://import?key=<encrypted_key>&hint=<phone_last4>
  const qrData = JSON.stringify({
    type: 'wallet_import',
    key: encrypted,
    hint: phoneNumber.slice(-4), // Last 4 digits for verification
    timestamp: Date.now(),
  });
  
  // Generate QR code as base64 image
  const qrCodeBase64 = await QRCode.toDataURL(qrData, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
  
  return qrCodeBase64;
}

/**
 * Decrypt private key from QR data
 * @param {string} encryptedKey - Encrypted private key
 * @param {string} phoneNumber - User phone number (decryption key)
 * @returns {string} Decrypted private key
 */
function decryptPrivateKey(encryptedKey, phoneNumber) {
  try {
    const encryptionKey = crypto.createHash('sha256').update(phoneNumber).digest();
    const iv = Buffer.alloc(16, 0);
    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
    
    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    throw new Error('Không thể giải mã private key. Vui lòng kiểm tra số điện thoại.');
  }
}

/**
 * Verify signature from MetaMask
 * @param {string} message - Original message that was signed
 * @param {string} signature - Signature from MetaMask
 * @param {string} expectedAddress - Expected wallet address
 * @returns {boolean} True if signature is valid
 */
function verifySignature(message, signature, expectedAddress) {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (err) {
    return false;
  }
}

/**
 * Generate login message for signing
 * @param {string} address - Wallet address
 * @returns {string} Message to sign
 */
function generateLoginMessage(address) {
  const timestamp = Date.now();
  const date = new Date(timestamp).toLocaleString('vi-VN');
  
  return `Đăng nhập vào hệ thống\n\nĐịa chỉ ví: ${address}\nThời gian: ${date}\nTimestamp: ${timestamp}\n\nKý tin nhắn này để xác thực danh tính.`;
}

module.exports = {
  generateWallet,
  generateWalletQR,
  decryptPrivateKey,
  verifySignature,
  generateLoginMessage,
};
