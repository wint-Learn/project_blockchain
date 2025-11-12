# Phase 1 Testing Results

**Date**: 2025-10-24
**Test Type**: Regression Testing (Ensure existing flow still works after migration)

---

## Environment Status

### ✅ Backend (Port 3000)
```
- Status: Running
- RPC: http://127.0.0.1:8545 (Ganache)
- Database: PostgreSQL connected
- Contract: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
```

### ✅ Frontend (Port 5173)
```
- Status: Running  
- Vite: v7.1.12
- Warning: Node 22.10.0 (works but recommends 22.12+)
```

### ✅ Database (PostgreSQL)
```
- Tables: 11 total
  ✅ users (clean - migrated)
  ✅ login_logs (clean - migrated)
  ✅ audit_logs (from base schema)
  ✅ pre_verified_cccd (NEW - Phase C)
  ✅ otp_codes (NEW - Phase C)
  ✅ admin_users (NEW - Phase C, has default admin)
  ✅ services (NEW - Phase C, 3 demo services)
  ✅ service_requests (NEW - Phase C)
  ✅ admin_action_logs (NEW - Phase C, renamed)
  ✅ anomaly_rules (base schema)
  ✅ logs (base schema)
```

---

## Manual Test Checklist

### Test 1: Registration Flow
**URL**: http://localhost:5173/register

**Steps**:
1. Navigate to register page
2. Input QR data (use format: `cccdNumber|---|name|dob|gender|address|issueDate`)
3. Click "Đăng ký"

**Expected Results**:
- ✅ Wallet generated (address + private key)
- ✅ Success alert appears
- ✅ Private key displayed in TextField (click to select all)
- ✅ "Vào Dashboard" button visible
- ✅ Backend log shows blockchain TX
- ✅ Ganache shows new block

**DB Verification**:
```sql
SELECT wallet_address, cccd_number_hash, created_at 
FROM users 
ORDER BY created_at DESC LIMIT 1;
```

---

### Test 2: Dashboard Access
**URL**: http://localhost:5173/dashboard

**Steps**:
1. After registration, click "Vào Dashboard"
2. Verify data displays

**Expected Results**:
- ✅ DID Info section shows: Address, CCCD Hash, Public Key, Registration date
- ✅ CCCD Info section shows: CCCD number, Name, DOB, Gender, Address, Issue date
- ✅ No errors in console
- ✅ "Đăng xuất" button works

---

### Test 3: Login Flow
**URL**: http://localhost:5173/login

**Steps**:
1. Logout from Dashboard
2. Navigate to login page
3. Input QR data (same as registration)
4. Input Private Key (copied from registration)
5. Click "Đăng nhập"

**Expected Results**:
- ✅ Login successful
- ✅ Redirect to Dashboard
- ✅ Anomaly detection runs (check backend logs)
- ✅ Entry added to login_logs table

**DB Verification**:
```sql
SELECT wallet_address, action, anomaly_score, timestamp 
FROM login_logs 
ORDER BY timestamp DESC LIMIT 5;
```

---

### Test 4: Duplicate CCCD Detection
**Steps**:
1. Logout
2. Try registering with SAME QR data (same CCCD number)

**Expected Results**:
- ❌ HTTP 409 error
- ✅ Alert: "Số CCCD XXX đã được đăng ký..."
- ✅ Auto redirect to /login after 2 seconds

---

### Test 5: Admin User Seeded
**Steps**:
```sql
SELECT username, role, created_at FROM admin_users;
```

**Expected Results**:
- ✅ 1 row: username='admin', role='super_admin'
- ✅ Can use for Phase 2 admin login testing

---

### Test 6: Services Seeded
**Steps**:
```sql
SELECT id, name, category FROM services;
```

**Expected Results**:
- ✅ 3 rows:
  1. Đăng ký giấy phép kinh doanh (business)
  2. Đăng ký xe máy (transport)
  3. Khai báo y tế (health)

---

## Test Results

**Status**: ⏳ PENDING MANUAL TEST

### To Complete Testing:
1. Open browser: http://localhost:5173
2. Follow Test 1 (Registration)
3. Follow Test 2 (Dashboard)
4. Follow Test 3 (Login)
5. Follow Test 4 (Duplicate detection)
6. Update this file with ✅ or ❌ for each test

---

## Known Issues from Phase 1

### Issue 1: QR Parser Format
**Problem**: QR data might have different format (missing empty field)
**Example**: `017205001738|---|Phí Nguyên Chi|...` (missing 3rd field)
**Impact**: Parser might fail
**Fix**: Already handled in qr-parser.ts (works with any length)

### Issue 2: Node.js Version Warning
**Problem**: Vite warns about Node 22.10.0
**Impact**: Just warning, works fine
**Fix**: Optional - upgrade to Node 22.12+

---

## Phase 2 Readiness

After Phase 1 tests pass:
- ✅ Database schema ready for pre-verification
- ✅ Admin user exists for admin panel
- ✅ Services ready for service management
- 🚀 Ready to implement verification APIs

---

**Tester**: [Your Name]
**Test Date**: [Fill in after testing]
**Overall Result**: [PASS / FAIL / BLOCKED]
