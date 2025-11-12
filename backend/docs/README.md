# Backend - DID Management System

Hệ thống backend quản lý DID (Decentralized Identity) với blockchain integration và AI anomaly detection.

## 📁 Cấu trúc thư mục

```
backend/
├── src/                    # Source code chính
│   ├── server.js          # Entry point - Express server
│   ├── middleware/        # Express middleware
│   │   ├── audit-middleware.js      # Audit logging cho admin actions
│   │   └── validation-schemas.js    # Zod schemas + validate middleware
│   ├── utils/             # Utility functions
│   │   └── crypto-utils.js          # Encryption/decryption helpers
│   └── config/            # Configuration files (reserved)
│
├── scripts/               # Database & maintenance scripts
│   ├── schema.sql        # PostgreSQL database schema
│   ├── migrate.js        # Database migration runner
│   ├── rotate-key.js     # Encryption key rotation script
│   └── sign.js           # Helper để ký message (demo)
│
├── tests/                 # Test files
│   ├── test-flow.js      # Demo end-to-end flow
│   └── test-validation.js # Test Zod validation
│
├── docs/                  # Documentation
│   ├── README.md         # Tài liệu chi tiết đầy đủ
│   ├── SUMMARY.md        # Quick reference guide
│   └── SECURITY_IMPROVEMENTS.md  # Security features documentation
│
├── .env                   # Environment variables
├── .gitignore
└── package.json
```

## 🚀 Quick Start

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình environment
Tạo file `.env`:
```bash
PORT=3000
DB_CONNECTION_STRING=postgres://postgres:1@localhost:5432/identity_db
POLYGON_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY
CONTRACT_ADDRESS=0x068F84A1FCD1ed4B6376682De85b20d7B654De2C
ENCRYPTION_KEY=your_32_byte_hex_key_here
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 3. Chạy database migration
```bash
npm run migrate
```

### 4. Khởi động server
```bash
npm start
```

### 5. Test
```bash
# Test validation
npm run test:validation

# Test flow demo
npm run test:flow
```

## 📝 NPM Scripts

- `npm start` - Khởi động server production
- `npm run dev` - Khởi động server development (giống start)
- `npm run migrate` - Chạy database migration
- `npm run rotate-key` - Script rotate encryption key
- `npm run test:flow` - Test demo flow
- `npm run test:validation` - Test Zod validation

## 📚 Documentation

Chi tiết đầy đủ xem trong thư mục `docs/`:

- **[docs/README.md](docs/README.md)** - Tài liệu đầy đủ về API, architecture, security
- **[docs/SUMMARY.md](docs/SUMMARY.md)** - Tóm tắt nhanh và quick reference
- **[docs/SECURITY_IMPROVEMENTS.md](docs/SECURITY_IMPROVEMENTS.md)** - Chi tiết về security features

## 🔒 Security Features

- ✅ CORS với whitelist origins
- ✅ Helmet security headers
- ✅ Rate limiting (100 req/15min global, 10 req/15min auth)
- ✅ Zod schema validation
- ✅ Audit logging cho admin actions
- ✅ AES-256-CBC encryption cho sensitive data
- ✅ Key rotation script

## 🏗️ Architecture

- **On-chain (Polygon Amoy):** Hash của CCCD data (public, immutable)
- **Off-chain (PostgreSQL):** Encrypted metadata (private, queryable)
- **AI Detection:** Anomaly scoring cho login patterns

## 📊 API Endpoints

- `GET /health` - Health check
- `GET /api/did/:address` - Lấy thông tin DID
- `POST /api/register` - Register DID mới
- `POST /api/login` - Login với signature
- `GET /api/logs` - Xem login logs (admin)

## 🛠️ Maintenance

### Rotate encryption key
```bash
# Generate new key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Run rotation (backup DB trước!)
npm run rotate-key OLD_KEY NEW_KEY

# Update .env với NEW_KEY
```

### View audit logs
```sql
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50;
```

## 📞 Support

Xem chi tiết tài liệu trong `docs/` hoặc liên hệ team.

---

**Version:** 1.0.0  
**Last updated:** 2025-10-23
