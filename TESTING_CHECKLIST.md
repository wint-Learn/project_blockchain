# ✅ Testing Checklist - DID Blockchain MVP

## Pre-requisites
- [ ] PostgreSQL đang chạy
- [ ] Database `did_db` đã được tạo
- [ ] Schema đã được import (`backend/scripts/schema.sql`)
- [ ] Backend `.env` đã cấu hình đúng
- [ ] Frontend `.env` đã cấu hình đúng

---

## 1. Backend Testing

### Start Server
```bash
cd backend
node src/server.js
```

**Expected Output:**
```
[info]: Backend running on port 3000
[info]: Connected to PostgreSQL
```

### Test Endpoints

#### 1.1 Health Check
```bash
curl http://localhost:3000/health
```
**Expected:** `{"status":"ok","timestamp":"..."}`

#### 1.2 Register DID
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "qrData": "test-cccd-001",
    "privateKey": "0x..."
  }'
```
**Expected:** `{"address":"0x...","cccdHash":"0x...","token":"..."}`

#### 1.3 Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x...",
    "message": "Login at ...",
    "signature": "0x...",
    "qrData": "test-cccd-001"
  }'
```
**Expected:** `{"token":"...","anomalyScore":0}`

#### 1.4 Get DID Info
```bash
curl http://localhost:3000/api/did/0x...
```
**Expected:** `{"address":"0x...","cccdHash":"0x...","createdAt":"..."}`

#### 1.5 Get Logs
```bash
curl http://localhost:3000/api/admin/logs?limit=5
```
**Expected:** `{"logs":[...],"count":...}`

### Check Logs
```bash
cd backend/logs
cat combined.log
cat error.log
```
**Expected:** Structured JSON logs cho mọi request

---

## 2. Frontend Testing

### Start Dev Server
```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v7.1.12  ready in 495 ms
➜  Local:   http://localhost:5173/
```

### Test Pages

#### 2.1 Home Page
- [ ] Truy cập http://localhost:5173/
- [ ] Hiển thị landing page với icon & title
- [ ] Button "Đăng ký" và "Đăng nhập" hoạt động

#### 2.2 Register Page
- [ ] Truy cập http://localhost:5173/register
- [ ] Nhập QR data: `test-cccd-register-001`
- [ ] Click "Đăng ký"
- [ ] Loading spinner hiển thị
- [ ] Toast notification "Đăng ký thành công!"
- [ ] Cảnh báo về private key hiển thị
- [ ] Redirect về Dashboard sau 3s
- [ ] **IMPORTANT:** Copy address & private key từ console log

**Console Log:**
```
Generated wallet: {
  address: "0x...",
  privateKey: "0x..."
}
```

#### 2.3 Login Page
- [ ] Truy cập http://localhost:5173/login
- [ ] Nhập:
  - Address: (từ 2.2)
  - QR Data: `test-cccd-register-001`
  - Private Key: (từ 2.2)
- [ ] Click "Đăng nhập"
- [ ] Loading spinner hiển thị
- [ ] Toast notification "Đăng nhập thành công!"
- [ ] Redirect về Dashboard

#### 2.4 Dashboard Page
- [ ] URL: http://localhost:5173/dashboard
- [ ] Hiển thị thông tin DID:
  - Address
  - CCCD Hash
  - Ngày tạo
  - Blockchain status chip
- [ ] Hiển thị bảng logs:
  - ID, Address, Action, Anomaly Score, Timestamp
  - Dữ liệu từ API
- [ ] Button "Đăng xuất" hoạt động
- [ ] Click "Đăng xuất" → Redirect về Login

#### 2.5 Private Route Protection
- [ ] Đăng xuất (nếu đang login)
- [ ] Truy cập trực tiếp http://localhost:5173/dashboard
- [ ] **Expected:** Auto redirect về /login

---

## 3. Integration Testing

### 3.1 Full Flow: Register → Login → Dashboard

**Step 1: Register**
1. Navigate to /register
2. Enter QR data: `integration-test-001`
3. Click "Đăng ký"
4. Save address & private key from console
5. Wait for redirect to Dashboard
6. Verify DID info displayed

**Step 2: Logout**
1. Click "Đăng xuất" button
2. Verify redirect to /login

**Step 3: Login**
1. Enter saved address, QR data, private key
2. Click "Đăng nhập"
3. Verify redirect to Dashboard

**Step 4: Dashboard**
1. Verify DID info matches registered data
2. Verify logs table shows "register" and "login" actions
3. Check anomaly scores (should be 0 or low)

### 3.2 Error Handling

**Invalid Login:**
- [ ] Login với wrong QR data
- [ ] **Expected:** Error toast "QR data không khớp"

**Invalid Private Key:**
- [ ] Login với wrong private key
- [ ] **Expected:** Error toast "Private key không khớp với address"

**Duplicate Register:**
- [ ] Register lại với cùng QR data
- [ ] **Expected:** Error toast "CCCD đã được đăng ký"

**Network Error:**
- [ ] Stop backend server
- [ ] Try register/login
- [ ] **Expected:** Error toast "Đăng ký/nhập thất bại"

---

## 4. Browser Testing

### 4.1 Chrome DevTools
- [ ] Mở DevTools (F12)
- [ ] Tab **Console**: Không có errors
- [ ] Tab **Network**: 
  - API calls hiển thị đúng
  - Status codes 200/201
  - Response data đúng format
- [ ] Tab **Application** → **Local Storage**:
  - `auth-storage` key tồn tại
  - `user` và `token` được persist

### 4.2 Responsive Design
- [ ] Toggle Device Toolbar (Ctrl+Shift+M)
- [ ] Test iPhone SE (375px)
- [ ] Test iPad (768px)
- [ ] Test Desktop (1920px)
- [ ] Verify layout responsive

---

## 5. Security Testing

### 5.1 Private Key Warning
- [ ] Register → Check warning alert hiển thị
- [ ] Alert text: "KHÔNG BAO GIỜ lưu private key như vậy..."

### 5.2 Token Management
- [ ] Login → Check `authToken` in localStorage
- [ ] Logout → Check `authToken` removed
- [ ] Manual remove token → Access /dashboard → Redirect to /login

### 5.3 CORS
- [ ] Backend logs show CORS headers
- [ ] No CORS errors in browser console

---

## 6. Performance Testing

### 6.1 Load Time
- [ ] Register page load < 1s
- [ ] Dashboard data load < 2s
- [ ] API response time < 500ms

### 6.2 Database Queries
- [ ] Check backend logs for query execution time
- [ ] Verify indexes used (check PostgreSQL logs)

---

## 7. Logging Testing

### 7.1 Backend Logs
```bash
# Check combined.log
tail -f backend/logs/combined.log

# Check error.log
tail -f backend/logs/error.log
```

**Verify:**
- [ ] `[info]` logs for successful requests
- [ ] `[warn]` logs for invalid data
- [ ] `[error]` logs for server errors
- [ ] Structured JSON format

### 7.2 Audit Logs (Database)
```sql
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10;
```

**Verify:**
- [ ] `register` action logged
- [ ] `login` action logged
- [ ] `anomaly_score` populated
- [ ] Timestamps correct

---

## 8. Blockchain Testing (Optional)

### 8.1 Check Contract on Amoy
- [ ] Truy cập https://amoy.polygonscan.com/address/0x95A30E65CCed6A3c0e7f18C70dc8D2A95F1d9F06
- [ ] Verify contract code
- [ ] Check recent transactions

### 8.2 Register DID on Blockchain
```bash
cd blockchain
npx hardhat run scripts/test-register.ts --network amoy
```

**Expected:** Transaction hash & DID registered

---

## 9. Documentation Testing

### 9.1 README Files
- [ ] `backend/README.md` - Instructions clear
- [ ] `blockchain/README.md` - Deployment guide accurate
- [ ] `frontend/FRONTEND_README.md` - Setup steps work
- [ ] `PROJECT_SUMMARY.md` - Accurate summary

### 9.2 Code Comments
- [ ] Backend controllers have JSDoc comments
- [ ] Frontend components have type annotations
- [ ] Utils functions documented

---

## 10. Final Checklist

### MVP Features ✅
- [x] User registration (QR data + wallet)
- [x] User login (signature verification)
- [x] DID info display
- [x] Audit logs table
- [x] Private route protection
- [x] Toast notifications
- [x] Loading states
- [x] Responsive UI
- [x] Security warnings

### Production Readiness (Optional)
- [ ] Environment variables documented
- [ ] Error boundaries
- [ ] Rate limiting tested
- [ ] Database backup strategy
- [ ] Deployment plan

---

## 📊 Test Results Summary

| Category         | Tests | Passed | Failed | Notes |
|-----------------|-------|--------|--------|-------|
| Backend API      |   5   |        |        |       |
| Frontend Pages   |   5   |        |        |       |
| Integration      |   4   |        |        |       |
| Error Handling   |   4   |        |        |       |
| Security         |   3   |        |        |       |
| Performance      |   3   |        |        |       |
| Logging          |   2   |        |        |       |
| **TOTAL**        | **26** |        |        |       |

---

## 🐛 Issues Found

| ID | Issue | Severity | Status | Notes |
|----|-------|----------|--------|-------|
|    |       |          |        |       |

---

## ✅ Sign-off

- [ ] All critical tests passed
- [ ] No blocking issues
- [ ] Documentation complete
- [ ] Ready for demo

**Tested by:** _________________  
**Date:** _________________  
**Signature:** _________________

---

## 🚀 Next Steps After Testing

1. Fix any issues found
2. Deploy to staging environment
3. User acceptance testing (UAT)
4. Production deployment
5. Monitoring & maintenance

---

**Good luck with testing! 🎯**
