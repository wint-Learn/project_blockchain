require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const ethers = require('ethers');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { encrypt, decrypt, hashCCCD } = require('./utils/crypto-utils');
const { registerSchema, loginSchema, validateRequest } = require('./middleware/validation-schemas');
const { auditMiddleware } = require('./middleware/audit-middleware');

const app = express();
const port = process.env.PORT || 3000;

// ============ SECURITY MIDDLEWARE ============

// Helmet: Bảo vệ với các HTTP headers tốt nhất
app.use(helmet());

// CORS: Chỉ cho phép origins được trust
const corsOptions = {
  origin: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',') 
    : ['http://localhost:3000', 'http://localhost:3001'], // default cho dev
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting: Giới hạn số requests từ 1 IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit mỗi IP 100 requests/15 phút
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});
app.use(limiter);

// Rate limit riêng cho sensitive endpoints (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // chỉ 10 login/register attempts per 15 phút
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // chỉ đếm failed requests
});

// Body parser
app.use(bodyParser.json());

// PostgreSQL
const pool = new Pool({ connectionString: process.env.DB_CONNECTION_STRING });

// Store pool in app.locals cho audit middleware
app.locals.pool = pool;

// Blockchain setup
const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
const contractAddress = process.env.CONTRACT_ADDRESS;

let abi;
const DID_JSON_PATH = path.resolve(__dirname, '../../blockchain/artifacts/contracts/DIDRegistry.sol/DIDRegistry.json');
try {
  if (fs.existsSync(DID_JSON_PATH)) {
    abi = require(DID_JSON_PATH).abi;
  } else {
    throw new Error('ABI not found');
  }
} catch (_e) {
  abi = [
    'function createDID(string _cccdHash, bytes _publicKey) public',
    'function verifySignature(address user, bytes32 messageHash, bytes signature) public pure returns (bool)',
    'function publicKeys(address) view returns (bytes)',
    'function cccdHashes(address) view returns (string)'
  ];
}

const contract = new ethers.Contract(contractAddress, abi, provider);

// ============ HEALTH CHECK ============
app.get('/health', async (_req, res) => {
  try {
    const net = await provider.getNetwork();
    res.json({ ok: true, network: { name: net.name, chainId: Number(net.chainId) } });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ============ ĐỌC DID INFO ============
app.get('/api/did/:address', async (req, res) => {
  try {
    const addr = req.params.address;
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
    res.status(500).json({ error: error.message });
  }
});

// ============ REGISTER DID (Phương án mới) ============
// Flow: Client gửi raw CCCD data → Backend hash → Lưu hash on-chain + encrypt metadata off-chain
app.post('/api/register', authLimiter, validateRequest(registerSchema), async (req, res) => {
  try {
    const { cccdData, privateKey } = req.body;
    // cccdData đã được validated bởi Zod middleware
    // NOTE: privateKey sẽ được loại bỏ trong tương lai, chuyển sang client-side signing
    
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // 1) Hash CCCD data (chuẩn hóa)
    const cccdHash = hashCCCD(cccdData);
    
    // 2) Gửi tx lên blockchain (lưu hash on-chain)
    const tx = await contract.connect(wallet).createDID(cccdHash, wallet.publicKey);
    const receipt = await tx.wait();
    
    // 3) Encrypt metadata và lưu off-chain (PostgreSQL)
    const encryptedData = encrypt(JSON.stringify(cccdData));
    await pool.query(
      `INSERT INTO users (wallet_address, cccd_hash, encrypted_cccd_data) 
       VALUES ($1, $2, $3)
       ON CONFLICT (wallet_address) DO UPDATE 
       SET cccd_hash = $2, encrypted_cccd_data = $3, updated_at = NOW()`,
      [wallet.address.toLowerCase(), cccdHash, encryptedData]
    );
    
    res.json({ 
      success: true, 
      txHash: tx.hash, 
      blockNumber: receipt.blockNumber,
      walletAddress: wallet.address,
      cccdHash
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ LOGIN (Verify hash + signature) ============
// Flow: User gửi raw CCCD data + message + signature
// → Backend hash CCCD → So với on-chain → Verify signature → Log vào DB
app.post('/api/login', authLimiter, validateRequest(loginSchema), async (req, res) => {
  try {
    const { address, cccdData, message, signature } = req.body;
    // Tất cả params đã được validated bởi Zod middleware
    
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // 1) Hash CCCD data do user cung cấp
    const cccdHash = hashCCCD(cccdData);
    
    // 2) Lấy hash on-chain
    const hashOnChain = await contract.cccdHashes(address);
    const hashMatch = (cccdHash === hashOnChain);
    
    // 3) Verify signature
    const messageHash = ethers.hashMessage(message);
    const signatureValid = await contract.verifySignature(address, messageHash, signature);
    
    // 4) Kết luận
    const loginSuccess = hashMatch && signatureValid;
    
    // 5) Log vào DB
    const logResult = await pool.query(
      `INSERT INTO login_logs 
       (wallet_address, ip_address, user_agent, signature_valid, hash_match, login_success, message_signed)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [address.toLowerCase(), ip, userAgent, signatureValid, hashMatch, loginSuccess, message]
    );
    
    // 6) Check anomaly cơ bản (AI sẽ nâng cấp sau)
    const anomalyCheck = await detectAnomaly(address.toLowerCase(), ip);
    if (anomalyCheck.isAnomaly) {
      await pool.query(
        `UPDATE login_logs SET is_anomaly = true, anomaly_score = $1, anomaly_reason = $2 WHERE id = $3`,
        [anomalyCheck.score, anomalyCheck.reason, logResult.rows[0].id]
      );
    }
    
    if (loginSuccess) {
      res.json({ 
        success: true, 
        message: 'Đăng nhập thành công',
        anomaly: anomalyCheck.isAnomaly ? anomalyCheck.reason : null
      });
    } else {
      res.status(401).json({ 
        success: false, 
        error: 'Xác thực thất bại',
        details: { signatureValid, hashMatch }
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ANOMALY DETECTION (Cơ bản) ============
async function detectAnomaly(walletAddress, currentIp) {
  try {
    // Rule 1: IP thay đổi trong 24h
    const ipChangeResult = await pool.query(
      `SELECT COUNT(DISTINCT ip_address) as ip_count
       FROM login_logs
       WHERE wallet_address = $1 
       AND timestamp > NOW() - INTERVAL '24 hours'`,
      [walletAddress]
    );
    const ipCount = parseInt(ipChangeResult.rows[0]?.ip_count || 0);
    
    // Rule 2: Tần suất đăng nhập trong 1h
    const freqResult = await pool.query(
      `SELECT COUNT(*) as login_count
       FROM login_logs
       WHERE wallet_address = $1
       AND timestamp > NOW() - INTERVAL '1 hour'`,
      [walletAddress]
    );
    const loginCount = parseInt(freqResult.rows[0]?.login_count || 0);
    
    // Tính điểm anomaly
    let score = 0;
    const reasons = [];
    
    if (ipCount > 3) {
      score += 0.4;
      reasons.push(`IP thay đổi ${ipCount} lần trong 24h`);
    }
    
    if (loginCount > 10) {
      score += 0.5;
      reasons.push(`Đăng nhập ${loginCount} lần trong 1h`);
    }
    
    // Giờ đêm (0-5am VN = UTC+7)
    const hour = new Date().getUTCHours();
    const vnHour = (hour + 7) % 24;
    if (vnHour >= 0 && vnHour < 5) {
      score += 0.2;
      reasons.push('Đăng nhập vào giờ đêm (0-5am)');
    }
    
    return {
      isAnomaly: score >= 0.5,
      score: Math.min(score, 1.0),
      reason: reasons.join(', ') || null
    };
  } catch (error) {
    console.error('Anomaly detection error:', error);
    return { isAnomaly: false, score: 0, reason: null };
  }
}

// ============ XEM LOGS (Admin) ============
// Audit: Tự động log mỗi lần admin xem logs
app.get('/api/logs', auditMiddleware('view_logs', (req) => req.query.address || 'all'), async (req, res) => {
  try {
    const { address, limit = 50 } = req.query;
    
    let query = `
      SELECT id, wallet_address, ip_address, login_success, is_anomaly, anomaly_reason, timestamp
      FROM login_logs
    `;
    const params = [];
    
    if (address) {
      query += ' WHERE wallet_address = $1';
      params.push(address.toLowerCase());
    }
    
    query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    res.json({ logs: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => console.log(`Backend running on port ${port}`));
