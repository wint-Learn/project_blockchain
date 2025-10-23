# Security Improvements Implementation Summary

## ✅ Hoàn thành tất cả 5/6 yêu cầu bảo mật

### 1. ✅ Security Packages (COMPLETED)

**Đã cài đặt:**
- `cors@2.8.5` - Cross-Origin Resource Sharing
- `express-rate-limit@8.1.0` - Rate limiting middleware
- `helmet@8.1.0` - Security headers
- `zod@4.1.12` - Schema validation

```bash
npm install cors express-rate-limit helmet zod
```

---

### 2. ✅ Schema Validation (COMPLETED)

**File:** `validation-schemas.js`

**Schemas đã tạo:**
- `cccdDataSchema` - Validate CCCD object (12-digit number, name, DOB format YYYY-MM-DD, address)
- `registerSchema` - Validate /api/register body (cccdData + privateKey)
- `loginSchema` - Validate /api/login body (address, cccdData, message, signature)

**Middleware:**
```javascript
validateRequest(schema) // Tự động validate và trả 400 Bad Request nếu invalid
```

**Ví dụ error response:**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "cccdData.cccd_number",
      "message": "CCCD number must be exactly 12 characters"
    }
  ]
}
```

**Áp dụng vào endpoints:**
```javascript
app.post('/api/register', authLimiter, validateRequest(registerSchema), async (req, res) => {...})
app.post('/api/login', authLimiter, validateRequest(loginSchema), async (req, res) => {...})
```

---

### 3. ⏳ Client-Side Signing (PENDING)

**Trạng thái:** Chưa thực hiện (privateKey vẫn được gửi lên backend - chỉ để demo)

**Plan để implement:**

#### Option 1: MetaMask Integration (Recommended)
```javascript
// Frontend code
async function registerWithMetaMask(cccdData) {
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  const wallet = accounts[0];
  
  // Hash CCCD data
  const cccdHash = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(JSON.stringify(cccdData))
  );
  
  // Create transaction
  const tx = await contract.populateTransaction.createDID(cccdHash, publicKey);
  
  // Sign transaction with MetaMask
  const signedTx = await ethereum.request({
    method: 'eth_sendTransaction',
    params: [{ from: wallet, to: contract.address, data: tx.data }]
  });
  
  // Send to backend (chỉ gửi txHash + cccdData để encrypt metadata)
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: wallet,
      txHash: signedTx,
      cccdData: cccdData // backend sẽ encrypt và lưu
    })
  });
}
```

#### Backend changes cần thiết:
```javascript
app.post('/api/register', authLimiter, validateRequest(newRegisterSchema), async (req, res) => {
  const { walletAddress, txHash, cccdData } = req.body;
  
  // 1. Verify transaction on-chain
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt || receipt.status !== 1) {
    return res.status(400).json({ error: 'Transaction failed or not found' });
  }
  
  // 2. Verify transaction called createDID
  const logs = receipt.logs.find(log => log.address === contractAddress);
  // ... parse logs to verify cccdHash matches
  
  // 3. Encrypt metadata và lưu DB
  const encryptedData = encrypt(JSON.stringify(cccdData));
  await pool.query(
    'INSERT INTO users (wallet_address, cccd_hash, encrypted_cccd_data) VALUES ($1, $2, $3)',
    [walletAddress.toLowerCase(), cccdHash, encryptedData]
  );
  
  res.json({ success: true, txHash });
});
```

---

### 4. ✅ Security Middleware (COMPLETED)

**File:** `server.js`

#### CORS Configuration:
```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',') 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

**Config trong .env:**
```bash
CORS_ORIGINS=http://localhost:3001,https://yourdomain.com
```

#### Helmet (Security Headers):
```javascript
app.use(helmet()); // Tự động thêm các headers:
// - X-Content-Type-Options: nosniff
// - X-Frame-Options: DENY
// - Strict-Transport-Security
// - X-XSS-Protection
// - Content-Security-Policy
```

#### Rate Limiting:
```javascript
// Global rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 min per IP
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Stricter limit cho auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // chỉ 10 login/register per 15 min
  skipSuccessfulRequests: true // chỉ đếm failed requests
});

// Apply vào sensitive endpoints
app.post('/api/register', authLimiter, ...);
app.post('/api/login', authLimiter, ...);
```

**Test rate limiting:**
```powershell
# Gửi 11 requests liên tiếp → request thứ 11 sẽ bị 429 Too Many Requests
1..11 | ForEach-Object { 
  Invoke-RestMethod -Method GET http://localhost:3000/health 
}
```

---

### 5. ✅ Key Rotation (COMPLETED)

**File:** `rotate-key.js`

**Tính năng:**
- Đọc tất cả `encrypted_cccd_data` từ DB
- Decrypt với old key
- Re-encrypt với new key
- Update database atomically
- Progress tracking với success/failed count

**Usage:**
```powershell
# 1. Backup database
pg_dump "postgres://postgres:1@localhost:5432/identity_db" > backup.sql

# 2. Generate new key (32 bytes hex = 64 chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: f1e2d3c4b5a69780123456789abcdef0123456789abcdef0123456789abcdef

# 3. Tắt backend server (tránh race condition)

# 4. Run rotation script
node rotate-key.js OLD_KEY NEW_KEY

# 5. Update .env
# ENCRYPTION_KEY=f1e2d3c4b5a69780123456789abcdef0123456789abcdef0123456789abcdef

# 6. Restart server
npm start
```

**Output mẫu:**
```
🔄 Bắt đầu key rotation...

📊 Tìm thấy 10 users với encrypted data

🔍 Testing old key với first record...
✅ Old key hợp lệ!

🔄 Đang re-encrypt data...

  ✅ Progress: 10/10 users

📊 KẾT QUẢ:
   - Thành công: 10 users
   - Thất bại: 0 users

✅ Key rotation hoàn tất!
```

**Best practices:**
- Rotate key mỗi 3-6 tháng
- Luôn backup DB trước khi rotate
- Test với staging environment trước
- Chạy trong maintenance window (tắt server)
- Monitor logs sau khi restart

---

### 6. ✅ Audit Logging (COMPLETED)

**Files:** 
- `audit-middleware.js` - Middleware tự động log
- `schema.sql` - Thêm table `audit_logs`

**Database Schema:**
```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  admin_address TEXT,              -- Admin wallet address
  action_type TEXT NOT NULL,       -- 'view_logs', 'rotate_key', 'modify_user'
  target_resource TEXT,            -- Wallet address hoặc resource ID
  details JSONB,                   -- Metadata (query params, old/new values)
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

**Middleware sử dụng:**
```javascript
// Tự động log mỗi khi admin xem logs
app.get('/api/logs', 
  auditMiddleware('view_logs', (req) => req.query.address || 'all'), 
  async (req, res) => {...}
);
```

**Custom logging:**
```javascript
const { logAuditAction } = require('./audit-middleware');

// Trong endpoint
await logAuditAction(pool, {
  adminAddress: req.headers['x-admin-address'],
  actionType: 'rotate_key',
  targetResource: 'all_users',
  details: { recordsUpdated: 10, oldKeyHint: 'a1b2c3...' },
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
  success: true
});
```

**Queries hữu ích:**
```sql
-- Xem tất cả audit logs
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50;

-- Admin nào xem logs nhiều nhất
SELECT admin_address, COUNT(*) as view_count
FROM audit_logs
WHERE action_type = 'view_logs'
GROUP BY admin_address
ORDER BY view_count DESC;

-- Failed actions trong 24h
SELECT * FROM audit_logs
WHERE success = false
AND timestamp > NOW() - INTERVAL '24 hours';

-- Timeline của 1 admin
SELECT timestamp, action_type, target_resource, details
FROM audit_logs
WHERE admin_address = '0xYourAddress'
ORDER BY timestamp DESC;
```

---

## 📊 Tổng kết

| Task | Status | Files Created/Modified |
|------|--------|------------------------|
| Security Packages | ✅ | `package.json` |
| Schema Validation | ✅ | `validation-schemas.js`, `server.js` |
| Client-Side Signing | ⏳ | (Pending - requires frontend) |
| Security Middleware | ✅ | `server.js`, `.env` |
| Key Rotation | ✅ | `rotate-key.js` |
| Audit Logging | ✅ | `audit-middleware.js`, `schema.sql`, `server.js` |

**Tỷ lệ hoàn thành:** 5/6 = **83%**

**Còn thiếu:** Client-side signing (cần tích hợp với frontend/MetaMask)

---

## 🧪 Testing Checklist

### ✅ Tests đã pass:

1. **Server starts without errors**
   ```bash
   npm start
   # ✅ Backend running on port 3000
   # ✅ Connected to PostgreSQL
   ```

2. **Health endpoint works**
   ```powershell
   Invoke-RestMethod -Method GET http://localhost:3000/health
   # ✅ Returns { ok: true, network: {...} }
   ```

3. **Database migration successful**
   ```bash
   node migrate.js
   # ✅ audit_logs table created
   ```

### 🔄 Tests cần làm:

1. **Rate limiting**
   ```powershell
   # Gửi >10 requests vào /api/login
   # Expected: Request thứ 11 trả về 429 Too Many Requests
   ```

2. **Schema validation**
   ```powershell
   # Gửi invalid CCCD number (không đủ 12 số)
   $body = @{ cccdData = @{ cccd_number = "123" } } | ConvertTo-Json
   Invoke-RestMethod -Method POST http://localhost:3000/api/register -Body $body
   # Expected: 400 Bad Request với validation errors
   ```

3. **CORS**
   ```javascript
   // Từ browser với origin không trong whitelist
   fetch('http://localhost:3000/health', { mode: 'cors' })
   // Expected: CORS error
   ```

4. **Audit logging**
   ```powershell
   # Xem logs
   Invoke-RestMethod -Method GET http://localhost:3000/api/logs
   
   # Check audit_logs table
   psql -c "SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 5"
   # Expected: có record với action_type = 'view_logs'
   ```

5. **Key rotation**
   ```powershell
   # Tạo test user trước, sau đó rotate key
   node rotate-key.js OLD_KEY NEW_KEY
   # Expected: User vẫn login được sau khi rotate
   ```

---

## 📝 Environment Variables Mới

Thêm vào `.env`:

```bash
# CORS origins (ngăn cách bằng dấu phẩy)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://yourdomain.com
```

---

## 🚀 Next Steps

1. **Deploy to production:**
   - Cấu hình CORS_ORIGINS cho production domain
   - Giảm rate limit nếu cần (cho production traffic)
   - Setup monitoring cho audit_logs (alert nếu có failed actions)

2. **Implement client-side signing:**
   - Tạo frontend với MetaMask integration
   - Refactor /api/register để nhận signed tx
   - Remove privateKey parameter hoàn toàn

3. **Advanced security:**
   - JWT authentication cho admin endpoints
   - 2FA/MFA cho sensitive operations
   - IP whitelist cho admin access
   - Automated key rotation scheduler

4. **Monitoring:**
   - Grafana dashboard cho audit_logs
   - Alert khi có anomaly spike
   - Rate limit metrics tracking

---

**Ngày hoàn thành:** 2025-01-23  
**Người thực hiện:** GitHub Copilot  
**Thời gian:** ~30 phút  
**Lines of code:** ~500 LOC
