# 🔐 Backend - DID Management System

Hệ thống quản lý DID (Decentralized Identity) với blockchain integration và AI anomaly detection.

## 🎯 Kiến trúc

### **On-chain (Polygon Amoy)**
- Lưu **hash** của CCCD data → Công khai, bất biến, xác minh được
- Contract: `DIDRegistry` tại `0x068F84A1FCD1ed4B6376682De85b20d7B654De2C`

### **Off-chain (PostgreSQL)**
- Lưu **encrypted metadata** (raw CCCD fields) → Riêng tư, query được
- Lưu **login logs** → Phân tích AI anomaly detection

### **Flow chính**

#### 1️⃣ **Register DID**
```
User → Backend → Hash CCCD data → Send tx to blockchain (lưu hash)
                ↓
              Encrypt metadata → Lưu PostgreSQL
```

#### 2️⃣ **Login (Passwordless)**
```
User → Gửi: raw CCCD data + message + signature
     ↓
Backend → Hash CCCD data → So sánh với hash on-chain
        → Verify signature
        → Log vào DB + Anomaly detection
        → Trả kết quả
```

## 🗂️ Database Schema

### **users** - Lưu encrypted CCCD metadata
```sql
- wallet_address (unique)
- cccd_hash (match với on-chain)
- encrypted_cccd_data (JSON encrypted)
- created_at, updated_at
```

### **login_logs** - Log đăng nhập cho AI
```sql
- wallet_address
- ip_address, user_agent
- signature_valid, hash_match, login_success
- is_anomaly, anomaly_score, anomaly_reason
- timestamp
```

### **anomaly_rules** - Rules cho AI detection
```sql
- rule_name (ip_change_24h, login_frequency_1h, night_login)
- rule_type, threshold
- is_active
```

## 🚀 Cài đặt

### 1. Cài dependencies
```powershell
cd backend
npm install
```

### 2. Cấu hình `.env`
```env
PORT=3000
DB_CONNECTION_STRING=postgres://user:pass@localhost:5432/identity_db
POLYGON_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY
CONTRACT_ADDRESS=0x068F84A1FCD1ed4B6376682De85b20d7B654De2C
ENCRYPTION_KEY=your-32-byte-hex-key
```

### 3. Tạo database
```powershell
# Tạo database trong PostgreSQL
createdb identity_db

# Chạy migration
node migrate.js
```

### 4. Chạy server
```powershell
npm start
```

## 📡 API Endpoints

### **GET /health**
Kiểm tra kết nối blockchain và server status.

```powershell
Invoke-RestMethod -Method GET http://localhost:3000/health
```

Response:
```json
{
  "ok": true,
  "network": { "name": "matic-amoy", "chainId": 80002 }
}
```

### **GET /api/did/:address**
Lấy thông tin DID (on-chain + off-chain).

```powershell
Invoke-RestMethod -Method GET "http://localhost:3000/api/did/0xYourAddress"
```

Response:
```json
{
  "address": "0x...",
  "publicKey": "0x04...",
  "cccdHashOnChain": "0x123...",
  "hasMetadata": true,
  "registeredAt": "2025-10-23T..."
}
```

### **POST /api/register**
Đăng ký DID mới (lưu hash on-chain + encrypt metadata off-chain).

⚠️ **Bảo mật:** Demo này gửi privateKey lên server - chỉ dùng cho test! Production nên ký tx ở client.

```powershell
$cccdData = @{
  cccd_number = "001234567890"
  name = "NGUYEN VAN A"
  dob = "1990-01-15"
  address = "123 Nguyen Hue, Q1, TPHCM"
  issued_date = "2020-01-01"
}

$body = @{
  cccdData = $cccdData
  privateKey = "0xYOUR_PRIVATE_KEY_WITH_MATIC"
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method POST http://localhost:3000/api/register `
  -ContentType "application/json" -Body $body
```

Response:
```json
{
  "success": true,
  "txHash": "0xabc...",
  "blockNumber": 12345,
  "walletAddress": "0x...",
  "cccdHash": "0x..."
}
```

### **POST /api/login**
Đăng nhập passwordless (verify hash + signature).

```powershell
# Bước 1: Ký message (dùng ví có DID đã register)
$message = "Login at " + (Get-Date -Format o)
# ... ký message bằng ethers/MetaMask ...

# Bước 2: Gọi API login
$cccdData = @{
  cccd_number = "001234567890"
  name = "NGUYEN VAN A"
  dob = "1990-01-15"
  address = "123 Nguyen Hue, Q1, TPHCM"
  issued_date = "2020-01-01"
}

$loginBody = @{
  address = "0xYourAddress"
  cccdData = $cccdData
  message = $message
  signature = "0xSignatureFromWallet"
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method POST http://localhost:3000/api/login `
  -ContentType "application/json" -Body $loginBody
```

Response (success):
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "anomaly": null
}
```

Response (anomaly detected):
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "anomaly": "IP thay đổi 5 lần trong 24h, Đăng nhập 12 lần trong 1h"
}
```

Response (fail):
```json
{
  "success": false,
  "error": "Xác thực thất bại",
  "details": { "signatureValid": false, "hashMatch": true }
}
```

### **GET /api/logs**
Xem logs đăng nhập (admin).

```powershell
# Xem tất cả logs
Invoke-RestMethod -Method GET "http://localhost:3000/api/logs?limit=10"

# Xem logs của 1 address
Invoke-RestMethod -Method GET "http://localhost:3000/api/logs?address=0xYourAddress"
```

Response:
```json
{
  "logs": [
    {
      "id": 1,
      "wallet_address": "0x...",
      "ip_address": "192.168.1.1",
      "login_success": true,
      "is_anomaly": false,
      "anomaly_reason": null,
      "timestamp": "2025-10-23T..."
    }
  ],
  "count": 1
}
```

## 🤖 AI Anomaly Detection

### **Các rules hiện tại:**

1. **IP Change (24h):** Nếu đổi IP >3 lần trong 24h → score +0.4
2. **High Frequency (1h):** Nếu đăng nhập >10 lần trong 1h → score +0.5
3. **Night Login (0-5am VN):** Đăng nhập giờ đêm → score +0.2

**Threshold:** score ≥ 0.5 → đánh dấu anomaly

### **Nâng cấp tương lai:**
- ML model dựa trên lịch sử (scikit-learn, TensorFlow)
- Phát hiện device fingerprint mới
- Behavioral biometrics (typing speed, mouse pattern)
- Geo-location mismatch detection
- Integration với threat intelligence feeds

## 🔒 Bảo mật

### **Đã triển khai:**
- ✅ Encryption AES-256-CBC cho CCCD metadata
- ✅ Hash on-chain (Keccak256) không reverse được
- ✅ Signature verification bằng smart contract
- ✅ **CORS** với whitelist origins (config qua `.env`)
- ✅ **Helmet** security headers (XSS, CSP, HSTS...)
- ✅ **Rate limiting**: 100 req/15min (general), 10 req/15min (auth endpoints)
- ✅ **Schema validation** với Zod cho request body
- ✅ **Audit logging** cho admin actions (tự động log mỗi khi xem logs)
- ✅ **Key rotation script** (`rotate-key.js`) để đổi encryption key định kỳ

### **Middleware đang hoạt động:**
```javascript
// server.js
app.use(helmet());                      // Security headers
app.use(cors(corsOptions));              // CORS với whitelist
app.use(limiter);                        // Global rate limit (100/15min)
app.use(authLimiter);                    // Auth rate limit (10/15min)
app.use(validateRequest(schema));        // Zod validation
app.use(auditMiddleware('action_type')); // Audit logging
```

### **Cách sử dụng:**

**1. Configure CORS origins** (`.env`):
```bash
CORS_ORIGINS=http://localhost:3001,https://yourdomain.com
```

**2. Rotate encryption key** (recommended every 3-6 months):
```powershell
# Backup database
pg_dump "postgres://postgres:1@localhost:5432/identity_db" > backup.sql

# Generate new key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Rotate (tắt server trước)
node rotate-key.js OLD_KEY NEW_KEY

# Update .env với NEW_KEY và restart server
```

**3. Monitor audit logs**:
```sql
-- Xem tất cả admin actions
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50;

-- Admin nào xem logs nhiều nhất
SELECT admin_address, COUNT(*) as action_count
FROM audit_logs
WHERE action_type = 'view_logs'
GROUP BY admin_address
ORDER BY action_count DESC;
```

### **Cần cải thiện thêm:**
- ⏳ Không gửi privateKey lên backend (đang là demo pattern)
  - → Chuyển sang client-side signing với MetaMask/WalletConnect
  - → Backend chỉ nhận signed transaction và broadcast
- ⏳ 2FA/MFA cho các thao tác nhạy cảm (admin actions)
- ⏳ JWT authentication cho admin endpoints
- ⏳ API key rotation cho third-party integrations

## 📊 Monitoring & Analytics

### **Queries hữu ích:**

```sql
-- Top 10 users có nhiều login nhất
SELECT wallet_address, COUNT(*) as login_count
FROM login_logs
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY wallet_address
ORDER BY login_count DESC
LIMIT 10;

-- Tỉ lệ login thành công/thất bại
SELECT 
  login_success,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM login_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY login_success;

-- Anomalies trong 24h
SELECT wallet_address, ip_address, anomaly_reason, timestamp
FROM login_logs
WHERE is_anomaly = true
AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;
```

## 🧪 Testing

### **Test flow tự động:**
```powershell
node test-flow.js
```

### **Test thủ công:**
1. Register DID với ví có MATIC
2. Login với cùng ví đó
3. Thử login nhiều lần liên tiếp → trigger anomaly
4. Đổi IP (VPN) và login → trigger anomaly
5. Xem logs qua `/api/logs`

## 📚 Tài liệu tham khảo

- [Ethereum Signature Verification](https://docs.ethers.org/v6/api/crypto/#Signature)
- [PostgreSQL Encryption (pgcrypto)](https://www.postgresql.org/docs/current/pgcrypto.html)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [AI Anomaly Detection Techniques](https://www.elastic.co/what-is/machine-learning-anomaly-detection)

## 🚧 Roadmap

- [ ] Chuyển sang client-side tx signing (MetaMask integration)
- [ ] Thêm ML model cho anomaly detection
- [ ] Admin dashboard (React/Vue)
- [ ] WebSocket real-time alerts
- [ ] Multi-chain support (Ethereum, BSC, Polygon Mainnet)
- [ ] DID revocation mechanism
- [ ] Backup/recovery flow cho lost keys
