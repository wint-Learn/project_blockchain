# 🚀 Quick Start Guide - DID Blockchain

Hướng dẫn nhanh để chạy dự án trong 5 phút.

---

## Yêu cầu

- Node.js 18+ (hiện tại: 22.10.0)
- PostgreSQL 14+
- Git

---

## Bước 1: Clone & Setup Database (2 phút)

```bash
# Clone repo (nếu chưa có)
git clone https://github.com/Win-tenh/project_blockchain.git
cd project_blockchain

# Tạo database
psql -U postgres
CREATE DATABASE did_db;
\q

# Import schema
psql -U postgres -d did_db -f db/schema.sql
# Hoặc:
cd backend
psql -U postgres -d did_db -f scripts/schema.sql
```

---

## Bước 2: Start Backend (1 phút)

```bash
cd backend

# Cài dependencies (lần đầu)
npm install

# Tạo file .env (nếu chưa có)
cat > .env << EOL
PORT=3000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/did_db
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=0xYourPrivateKey
CONTRACT_ADDRESS=0x95A30E65CCed6A3c0e7f18C70dc8D2A95F1d9F06
JWT_SECRET=your-jwt-secret-change-this
ENCRYPTION_KEY=your-32-byte-encryption-key-here-change-this
EOL

# Start server
node src/server.js
```

**Expected:**
```
[info]: Backend running on port 3000
[info]: Connected to PostgreSQL
```

✅ Backend ready tại http://localhost:3000

---

## Bước 3: Start Frontend (1 phút)

Mở terminal mới:

```bash
cd frontend

# Cài dependencies (lần đầu)
npm install

# Tạo file .env (nếu chưa có)
echo "VITE_API_URL=http://localhost:3000/api" > .env

# Start dev server
npm run dev
```

**Expected:**
```
VITE v7.1.12  ready in 495 ms
➜  Local:   http://localhost:5173/
```

✅ Frontend ready tại http://localhost:5173

---

## Bước 4: Test Flow (1 phút)

### 1. Register
1. Mở http://localhost:5173/register
2. Nhập QR data: `quickstart-test-001`
3. Click **Đăng ký**
4. **IMPORTANT:** Copy address & private key từ console log (F12)
5. Đợi redirect về Dashboard

### 2. Logout
1. Click **Đăng xuất** ở Dashboard
2. Redirect về Login

### 3. Login
1. Nhập:
   - Address: (từ bước Register)
   - QR Data: `quickstart-test-001`
   - Private Key: (từ bước Register)
2. Click **Đăng nhập**
3. Redirect về Dashboard

### 4. Dashboard
1. Xem thông tin DID
2. Xem bảng logs
3. ✅ Done!

---

## Troubleshooting

### Backend không start

**Lỗi:** `Error: connect ECONNREFUSED ::1:5432`
```bash
# Kiểm tra PostgreSQL
sudo systemctl status postgresql  # Linux
brew services list  # macOS

# Start PostgreSQL nếu chưa chạy
sudo systemctl start postgresql  # Linux
brew services start postgresql  # macOS
```

**Lỗi:** `database "did_db" does not exist`
```bash
psql -U postgres -c "CREATE DATABASE did_db;"
psql -U postgres -d did_db -f backend/scripts/schema.sql
```

### Frontend không start

**Lỗi:** `Cannot find module 'ethers'`
```bash
cd frontend
npm install
```

**Lỗi:** Node version warning
```
# Ignore warning (vẫn chạy được)
# Hoặc upgrade Node:
nvm install 22.12
nvm use 22.12
```

### API calls failed

**Lỗi:** `Network Error` hoặc CORS
```bash
# Check backend đang chạy
curl http://localhost:3000/health

# Check CORS config trong backend/src/server.js
# Đảm bảo VITE_API_URL trong frontend/.env đúng
```

---

## Scripts Hữu Ích

```bash
# Backend
cd backend
npm run test          # (nếu có tests)
node src/server.js    # Start server

# Frontend
cd frontend
npm run dev           # Dev server
npm run build         # Build production
npm run preview       # Preview build

# Database
psql -U postgres -d did_db
\dt                   # List tables
SELECT * FROM users;
SELECT * FROM audit_logs;
```

---

## File Paths Chính

```
project_blockchain/
├── backend/
│   ├── src/server.js          # Entry point
│   ├── .env                   # Config (tự tạo)
│   └── logs/                  # Winston logs
├── frontend/
│   ├── src/App.tsx            # Router
│   ├── .env                   # Config (tự tạo)
│   └── src/pages/             # Pages
└── db/schema.sql              # Database schema
```

---

## URLs Quan Trọng

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health
- **Blockchain Explorer**: https://amoy.polygonscan.com/address/0x95A30E65CCed6A3c0e7f18C70dc8D2A95F1d9F06

---

## Environment Variables Mẫu

### Backend `.env`
```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/did_db
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=0x1234567890abcdef...  # Thay bằng private key thật
CONTRACT_ADDRESS=0x95A30E65CCed6A3c0e7f18C70dc8D2A95F1d9F06
JWT_SECRET=my-super-secret-jwt-key-change-this-in-production
ENCRYPTION_KEY=12345678901234567890123456789012  # 32 bytes
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:3000/api
```

---

## Next Steps

Sau khi test thành công:
1. Đọc `PROJECT_SUMMARY.md` để hiểu toàn bộ hệ thống
2. Đọc `TESTING_CHECKLIST.md` để test chi tiết hơn
3. Đọc các README trong từng folder (backend, frontend, blockchain)

---

## Support

Nếu gặp vấn đề:
1. Check `backend/logs/error.log`
2. Check browser console (F12)
3. Check PostgreSQL logs
4. Xem `TESTING_CHECKLIST.md` section Troubleshooting

---

**Happy coding! 🚀**
