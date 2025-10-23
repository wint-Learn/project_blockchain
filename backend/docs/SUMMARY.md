# ✅ ĐÃ HOÀN THÀNH - Backend DID System

## 🎉 TỔNG KẾT

Đã xây dựng thành công backend theo **phương án bạn đề xuất**:

### ✅ **On-chain (Blockchain)**
- Chỉ lưu **hash** của CCCD → Công khai, bất biến, xác minh được
- Contract đã deploy và verify: `0x068F84A1FCD1ed4B6376682De85b20d7B654De2C`

### ✅ **Off-chain (PostgreSQL)**
- Lưu **encrypted metadata** (raw CCCD fields) → Riêng tư, query được
- Lưu **login logs** → Phân tích AI anomaly detection

### ✅ **AI Anomaly Detection**
- Phát hiện IP thay đổi bất thường
- Phát hiện đăng nhập tần suất cao
- Phát hiện đăng nhập giờ đêm
- Điểm anomaly score (0-1)

---

## 📁 CẤU TRÚC FILES

```
backend/
├── .env                    # Cấu hình (RPC, DB, encryption key)
├── package.json
├── server.js              # Server chính (v2 với encryption + AI)
├── crypto-utils.js        # Encryption helpers (AES-256-CBC)
├── schema.sql             # DB schema (users, login_logs, anomaly_rules)
├── migrate.js             # Script chạy migration
├── test-flow.js           # Demo script với commands
├── README.md              # Tài liệu đầy đủ
└── server-old.js          # Backup server cũ
```
```
backend/
├── .env                        # Cấu hình (RPC, DB, encryption key, CORS)
├── package.json
├── server.js                   # Server chính (đã bật CORS, Helmet, Rate limit, Zod)
├── crypto-utils.js             # Encryption helpers (AES-256-CBC)
├── validation-schemas.js       # Zod schemas + middleware validate request
├── audit-middleware.js         # Middleware audit admin actions → audit_logs
├── rotate-key.js               # Script rotate encryption key
├── schema.sql                  # DB schema (users, login_logs, anomaly_rules, audit_logs)
├── migrate.js                  # Script chạy migration
├── test-flow.js                # Demo script với commands
├── README.md                   # Tài liệu đầy đủ
└── SECURITY_IMPROVEMENTS.md    # Tóm tắt nâng cấp bảo mật
```

---

## 🚀 CÁCH SỬ DỤNG

### **1. Khởi động server**

```powershell
cd backend
npm start
```

### **2. Test health check**

```powershell
Invoke-RestMethod -Method GET http://localhost:3000/health
```

### **3. Register DID (cần ví có MATIC Amoy)**

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

### **4. Login (passwordless với signature)**

```powershell
# Tạo file ký nhanh
@'
const { Wallet } = require("ethers");
const pk = "0xYOUR_PRIVATE_KEY";
const wallet = new Wallet(pk);
const message = "Login at " + new Date().toISOString();
(async () => {
  const sig = await wallet.signMessage(message);
  console.log(JSON.stringify({ address: wallet.address, message, signature: sig }, null, 2));
})();
'@ | Out-File -Encoding utf8 sign-temp.js

node sign-temp.js

# Lấy output rồi gọi login:
$cccdData = @{
  cccd_number = "001234567890"
  name = "NGUYEN VAN A"
  dob = "1990-01-15"
  address = "123 Nguyen Hue, Q1, TPHCM"
  issued_date = "2020-01-01"
}

$loginBody = @{
  address = "0xAddressFromSignOutput"
  cccdData = $cccdData
  message = "Login at 2025-10-23T..."
  signature = "0xSignatureFromSignOutput"
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method POST http://localhost:3000/api/login `
  -ContentType "application/json" -Body $loginBody
```

### **5. Xem logs**

```powershell
# Tất cả logs
Invoke-RestMethod -Method GET "http://localhost:3000/api/logs?limit=20"

# Logs của 1 address
Invoke-RestMethod -Method GET "http://localhost:3000/api/logs?address=0xYourAddress"
```

---

## 🔒 BẢO MẬT

### **Đã có:**
### **ĐÃ CÓ:**
- ✅ Encryption AES-256-CBC cho CCCD metadata
- ✅ Hash on-chain (Keccak256)
- ✅ Signature verification via smart contract
- ✅ Anomaly detection cơ bản
- ✅ CORS (whitelist qua CORS_ORIGINS), Helmet headers, Rate limiting
- ✅ Schema validation với Zod (register/login)
- ✅ Audit logging (bảng audit_logs + middleware)
- ✅ Key rotation script (rotate-key.js)

### **Cần cải thiện (production):**
### **CẦN CẢI THIỆN (production):**
- ⚠️ KHÔNG gửi privateKey lên backend (demo only)
  → Nên: Client ký tx bằng MetaMask/WalletConnect; backend chỉ nhận txHash hoặc signedTx
- ⏳ 2FA/MFA cho thao tác nhạy cảm của admin
- ⏳ JWT/API key cho admin endpoints
- ⚠️ Rotate encryption key định kỳ

---

## 🤖 AI ANOMALY DETECTION

### **Rules hiện tại:**

| Rule | Threshold | Score | Mô tả |
|------|-----------|-------|-------|
| IP Change 24h | >3 lần | +0.4 | Đổi IP bất thường |
| Login Frequency 1h | >10 lần | +0.5 | Đăng nhập quá nhiều |
| Night Login | 0-5am VN | +0.2 | Đăng nhập giờ lạ |

**Anomaly trigger:** score ≥ 0.5

### **Nâng cấp tương lai:**
- ML model (scikit-learn, TensorFlow)
- Device fingerprinting
- Behavioral biometrics
- Geo-location mismatch
- Threat intelligence feeds

---

## 📊 DATABASE SCHEMA

### **users**
```sql
- wallet_address (unique)
- cccd_hash (match on-chain)
- encrypted_cccd_data (JSON encrypted)
- created_at, updated_at
```

### **login_logs**
```sql
- wallet_address
- ip_address, user_agent
- signature_valid, hash_match, login_success
- is_anomaly, anomaly_score, anomaly_reason
- timestamp
```

### **anomaly_rules**
```sql
- rule_name, rule_type, threshold
- is_active
```

---

## 🎯 FLOW HOÀN CHỈNH

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     │ 1. Register với raw CCCD data + privateKey
     ▼
┌──────────────────────┐
│  Backend             │
│  • Hash CCCD data    │
│  • Send tx to chain  │ ──────► Blockchain (Polygon Amoy)
│  • Encrypt metadata  │           └─► Lưu hash on-chain
│  • Save to DB        │
└──────────────────────┘
     │
     ▼
┌──────────────────────┐
│  PostgreSQL          │
│  • Encrypted CCCD    │
│  • User info         │
└──────────────────────┘

     │
     │ 2. Login với raw CCCD + signature
     ▼
┌──────────────────────┐
│  Backend             │
│  • Hash CCCD         │
│  • Compare w/ chain  │ ◄────── Blockchain
│  • Verify signature  │
│  • Log to DB         │
│  • Anomaly detection │
└──────────────────────┘
     │
     ▼
┌──────────────────────┐
│  PostgreSQL          │
│  • Login logs        │
│  • Anomaly flags     │
└──────────────────────┘
```

---

## 📝 GHI CHÚ QUAN TRỌNG

### **Về privateKey trong /api/register:**
- ⚠️ **CHỈ DÙNG ĐỂ DEMO!**
- Production cần:
  1. Client ký tx bằng MetaMask
  2. Gửi signed tx lên backend
  3. Backend broadcast tx lên chain
  4. Hoặc: Client tự gửi tx, backend chỉ index events

### **Về encryption key:**
- File `.env` có key mẫu
- Production nên:
  - Generate key mạnh: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - Lưu trong secret manager (AWS Secrets Manager, Azure Key Vault)
  - Rotate định kỳ

### **Về CCCD data format:**
- Hiện tại chấp nhận object tự do
- Nên chuẩn hóa schema:
  ```json
  {
    "cccd_number": "string (12 digits)",
    "name": "string (uppercase)",
    "dob": "YYYY-MM-DD",
    "address": "string",
    "issued_date": "YYYY-MM-DD"
  }
  ```

---

## 🚀 BƯỚC TIẾP THEO

### **Ngay lập tức:**
1. Test register với ví có MATIC
2. Test login flow
3. Trigger anomaly bằng cách login nhiều lần

### **Ngắn hạn:**
1. Chuyển sang client-side tx signing
2. Thêm CORS, rate-limit, validation
3. Viết unit tests

### **Dài hạn:**
1. ML model cho anomaly detection
2. Admin dashboard
3. WebSocket real-time alerts
4. Multi-chain support
5. DID revocation mechanism

---

## 📚 TÀI LIỆU

- **Backend README:** `backend/README.md` - Tài liệu đầy đủ
- **Test flow:** `node test-flow.js` - Demo commands
- **DB Schema:** `backend/schema.sql` - SQL chi tiết

---

## ✅ KẾT LUẬN

Hệ thống đã hoàn chỉnh theo đúng phương án bạn đề xuất:
- ✅ On-chain: Chỉ hash (công khai, xác minh được)
- ✅ Off-chain: Encrypted metadata (riêng tư, query được)
- ✅ AI: Anomaly detection cơ bản, sẵn sàng nâng cấp ML

**Phương án này RẤT TỐT** vì:
- Cân bằng privacy và transparency
- Scale tốt (off-chain query nhanh)
- AI-ready (logs đầy đủ)
- Bảo mật cao (encryption + blockchain immutability)

Chúc mừng bạn! 🎉
