# Phase 2 Testing Guide
**Pre-Verification Flow với OTP**

## ✅ Current Status
- ✅ Backend APIs implemented and running on port 3000
- ✅ Test data seeded (5 CCCD records in database)
- ✅ Verification service working (OTP generation + validation)
- ✅ Registration service updated to check verification token

## 📝 Test Data

### Valid Test CCCDs (4 available)
```
1. CCCD: 001099001234  |  Phone: 0901234567  |  Status: pending
2. CCCD: 001099005678  |  Phone: 0912345678  |  Status: pending
3. CCCD: 079099001111  |  Phone: 0934567890  |  Status: pending
4. CCCD: 079099002222  |  Phone: 0945678901  |  Status: pending
```

### Blacklisted CCCD (for negative testing)
```
CCCD: 001099009999  |  Phone: 0923456789  |  Status: blacklisted
```

### QR Code Format (for registration)
```
001099001234|001234567890||NGUYEN VAN TEST|01/01/1990|Nam|Ha Noi|01/01/2020
```

## 🧪 Manual Testing Steps

### Step 1: Request OTP
**Endpoint**: `POST /api/verify/request-otp`

**PowerShell Command**:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/verify/request-otp" `
  -Method POST `
  -Body '{"cccdNumber":"001099001234","phoneNumber":"0901234567"}' `
  -ContentType "application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Mã OTP đã được gửi đến số điện thoại của bạn.",
  "expiresAt": "2025-10-24T04:30:00.000Z"
}
```

**Get OTP from Database**:
```powershell
Push-Location "d:\hoc\DOAN\Blockchain\project_blockchain\backend"
node -e "const {Pool}=require('pg'); const pool=new Pool({connectionString:'postgres://postgres:1@localhost:5432/identity_db'}); pool.query('SELECT code FROM otp_codes ORDER BY created_at DESC LIMIT 1').then(r=>console.log('OTP:', r.rows[0].code)).finally(()=>pool.end())"
```

**Alternative - Check Backend Console** (if using npm start):
Look for SMS mock output in terminal:
```
========================================
📱 SMS MOCK (Demo Mode)
To: 0901234567
Message: Mã OTP của bạn là: 183302
Có hiệu lực trong 5 phút.
========================================
```

---

### Step 2: Verify OTP
**Endpoint**: `POST /api/verify/confirm-otp`

**PowerShell Command** (replace OTP code):
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/verify/confirm-otp" `
  -Method POST `
  -Body '{"cccdNumber":"001099001234","otp":"183302"}' `
  -ContentType "application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Xác thực thành công! Bạn có thể đăng ký DID ngay bây giờ.",
  "verificationToken": "eyJjY2NkTnVtYmVySGFzaCI6IjB4NWJmMTkxYzNlODFhZTMzMzZiLi4uIn0="
}
```

**Save the verificationToken** - you'll need it for registration!

---

### Step 3: Check Verification Status
**Endpoint**: `GET /api/verify/status/:cccdHash`

**Get CCCD Hash**:
```powershell
Push-Location "d:\hoc\DOAN\Blockchain\project_blockchain\backend"
node -e "const {hashCCCDNumber}=require('./src/utils/crypto-utils'); console.log(hashCCCDNumber('001099001234'))"
```

**PowerShell Command** (replace with actual hash):
```powershell
$cccdHash = "0x5bf191c3e81ae3336b..."
Invoke-RestMethod -Uri "http://localhost:3000/api/verify/status/$cccdHash" -Method GET
```

**Expected Response After Verification**:
```json
{
  "success": true,
  "isVerified": true,
  "status": "verified",
  "verifiedAt": "2025-10-24T04:25:00.000Z"
}
```

---

### Step 4: Register with Verification Token
**Endpoint**: `POST /api/auth/register`

**PowerShell Command**:
```powershell
# Generate a test wallet (or use existing private key)
$privateKey = "0x..." # From Ganache or ethers.Wallet.createRandom()
$qrData = "001099001234|001234567890||NGUYEN VAN TEST|01/01/1990|Nam|Ha Noi|01/01/2020"
$verificationToken = "eyJjY2NkTnVtYmVySGFzaCI6..." # From Step 2

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -Body "{`"qrData`":`"$qrData`",`"privateKey`":`"$privateKey`",`"verificationToken`":`"$verificationToken`"}" `
  -ContentType "application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "txHash": "0x...",
  "blockNumber": 15,
  "address": "0x...",
  "cccdHash": "0x..."
}
```

---

### Step 5: Verify Status Changed to 'claimed'
**PowerShell Command** (same as Step 3):
```powershell
$cccdHash = "0x5bf191c3e81ae3336b..."
Invoke-RestMethod -Uri "http://localhost:3000/api/verify/status/$cccdHash" -Method GET
```

**Expected Response**:
```json
{
  "success": true,
  "isVerified": true,
  "status": "claimed",
  "verifiedAt": "2025-10-24T04:25:00.000Z"
}
```

---

### Step 6: Try to Register Again (Should Fail)
**PowerShell Command** (same CCCD, different wallet):
```powershell
$privateKey2 = "0x..." # Different private key
$qrData = "001099001234|001234567890||NGUYEN VAN TEST|01/01/1990|Nam|Ha Noi|01/01/2020"
$verificationToken = "eyJjY2NkTnVtYmVySGFzaCI6..." # Same token

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -Body "{`"qrData`":`"$qrData`",`"privateKey`":`"$privateKey2`",`"verificationToken`":`"$verificationToken`"}" `
  -ContentType "application/json"
```

**Expected Response** (400 or 409 error):
```json
{
  "error": "Số CCCD này đã được đăng ký DID rồi",
  "code": "CCCD_ALREADY_CLAIMED"
}
```

---

## 🧪 Negative Test Cases

### Test 1: Request OTP with Unregistered CCCD
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/verify/request-otp" `
  -Method POST `
  -Body '{"cccdNumber":"999999999999","phoneNumber":"0901234567"}' `
  -ContentType "application/json"
```

**Expected**: Error - "Số CCCD này chưa được phê duyệt"

---

### Test 2: Request OTP with Blacklisted CCCD
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/verify/request-otp" `
  -Method POST `
  -Body '{"cccdNumber":"001099009999","phoneNumber":"0923456789"}' `
  -ContentType "application/json"
```

**Expected**: Error - "Số CCCD này đã bị khóa"

---

### Test 3: Verify OTP with Wrong Code
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/verify/confirm-otp" `
  -Method POST `
  -Body '{"cccdNumber":"001099001234","otp":"000000"}' `
  -ContentType "application/json"
```

**Expected**: Error - "Mã OTP không chính xác"

---

### Test 4: Verify OTP with Wrong Phone Number
```powershell
# Request OTP with correct phone
Invoke-RestMethod -Uri "http://localhost:3000/api/verify/request-otp" `
  -Method POST `
  -Body '{"cccdNumber":"001099005678","phoneNumber":"0999999999"}' `
  -ContentType "application/json"
```

**Expected**: Error - "Số điện thoại không khớp"

---

### Test 5: Register WITHOUT Verification Token (Legacy Flow)
```powershell
$privateKey = "0x..."
$qrData = "001099001234|001234567890||NGUYEN VAN TEST|01/01/1990|Nam|Ha Noi|01/01/2020"

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -Body "{`"qrData`":`"$qrData`",`"privateKey`":`"$privateKey`"}" `
  -ContentType "application/json"
```

**Expected**: Should still work (verification token is optional)

---

## 📊 Expected Database States

### After Step 1 (Request OTP):
```sql
-- otp_codes table
SELECT * FROM otp_codes WHERE cccd_number_hash = '0x5bf191c3e81ae3336b...';
-- Should show: code, phone_number, expires_at, verified=false, attempts=0

-- pre_verified_cccd table
SELECT status FROM pre_verified_cccd WHERE cccd_number_hash = '0x5bf191c3e81ae3336b...';
-- Should show: status='pending'
```

### After Step 2 (Verify OTP):
```sql
-- otp_codes table
SELECT verified FROM otp_codes WHERE cccd_number_hash = '0x5bf191c3e81ae3336b...';
-- Should show: verified=true

-- pre_verified_cccd table
SELECT status, verified_at FROM pre_verified_cccd WHERE cccd_number_hash = '0x5bf191c3e81ae3336b...';
-- Should show: status='verified', verified_at=<timestamp>
```

### After Step 4 (Register):
```sql
-- pre_verified_cccd table
SELECT status, claimed_at FROM pre_verified_cccd WHERE cccd_number_hash = '0x5bf191c3e81ae3336b...';
-- Should show: status='claimed', claimed_at=<timestamp>

-- users table
SELECT wallet_address, cccd_number_hash FROM users WHERE cccd_number_hash = '0x5bf191c3e81ae3336b...';
-- Should show: wallet_address, cccd_number_hash
```

---

## 🔍 Debugging Tips

### Check Backend Logs:
```powershell
Get-Content "d:\hoc\DOAN\Blockchain\project_blockchain\backend\logs\combined.log" -Tail 50
```

### Check Error Logs:
```powershell
Get-Content "d:\hoc\DOAN\Blockchain\project_blockchain\backend\logs\error.log" -Tail 20
```

### Check Database Connection:
```powershell
Push-Location "d:\hoc\DOAN\Blockchain\project_blockchain\backend"
node scripts/check-db.js
```

### Reset Test Data:
```powershell
Push-Location "d:\hoc\DOAN\Blockchain\project_blockchain\backend"
node scripts/seed-pre-verified.js
```

---

## 🎯 Success Criteria

Phase 2 is considered **COMPLETE** when:

- [ ] Request OTP returns success with valid CCCD + phone
- [ ] OTP is generated and stored in database (6 digits, 5min expiry)
- [ ] Verify OTP returns verificationToken after successful validation
- [ ] Check status returns correct status (pending → verified → claimed)
- [ ] Registration WITH token succeeds and marks CCCD as 'claimed'
- [ ] Registration WITHOUT token still works (backward compatibility)
- [ ] Duplicate registration with same CCCD is rejected
- [ ] Blacklisted CCCDs are rejected at OTP request
- [ ] Phone number mismatch is detected
- [ ] Wrong OTP code is rejected with attempt tracking

---

## ⏭️ Next Steps (Phase 3)

After Phase 2 testing is complete:

1. Implement Admin APIs (import CCCD CSV, view logs, manage services)
2. Create frontend verification flow (Verify.tsx page)
3. Update Register.tsx to require verification token
4. E2E testing with full user flow

**Status**: Phase 2 backend implementation ✅ COMPLETE
**Next**: Manual testing by user
