# 📚 Service Refactoring - Migration Guide

## ✅ Cấu trúc mới đã tạo

### **1. Registration Services** (`src/services/registration/`)
- ✅ `registration.service.js` - Main orchestrator (65 dòng)
- ✅ `verification-validator.js` - Token validation (85 dòng)
- ✅ `blockchain-registrar.js` - Blockchain operations (60 dòng)
- ✅ `index.js` - Export module

**Trước:** 1 file 185 dòng → **Sau:** 3 files, mỗi file < 90 dòng

---

### **2. Verification Services** (`src/services/verification/`)
- ✅ `otp.service.js` - OTP generation & verification (165 dòng)
- ✅ `pre-verification.service.js` - Pre-verification logic (135 dòng)

**Trước:** 1 file 200 dòng → **Sau:** 2 files chuyên biệt

---

### **3. Admin Services** (`src/services/admin/`)
- ✅ `cccd-management.service.js` - Import, blacklist CCCD (185 dòng)
- ✅ `dashboard.service.js` - Statistics (80 dòng)
- ✅ `logs.service.js` - Export logs (70 dòng)

**Trước:** 1 file 350 dòng → **Sau:** 3 files theo chức năng

---

### **4. Service Management** (`src/services/service-management/`)
- ✅ `service-catalog.service.js` - Create/list services (90 dòng)
- ✅ `service-request.service.js` - User requests (140 dòng)
- ✅ `service-approval.service.js` - Admin approve/reject (150 dòng)

**Trước:** 1 file 320 dòng → **Sau:** 3 files rõ ràng

---

### **5. Shared Helpers** (`src/services/shared/`)
- ✅ `blockchain.helper.js` - Blockchain interactions (95 dòng)
- ✅ `database.helper.js` - Common DB queries (100 dòng)

**Lợi ích:** Tái sử dụng code, giảm duplicate logic

---

## 🔄 Cách Migration (2 options)

### **Option 1: Migration từ từ (Recommended)**

**Bước 1:** Giữ nguyên files cũ, test files mới
```javascript
// Test import file mới
const { registerDID } = require('./services/registration/registration.service');
```

**Bước 2:** Đổi tên files cũ (backup)
```bash
cd backend/src/services
mv registration.service.js registration.service.OLD.js
mv verification.service.js verification.service.OLD.js
mv admin.service.js admin.service.OLD.js
mv service-management.service.js service-management.service.OLD.js
```

**Bước 3:** Đổi tên wrapper files
```bash
mv verification.service.new.js verification.service.js
mv admin.service.new.js admin.service.js
mv service-management.service.new.js service-management.service.js
```

**Bước 4:** Update imports trong controllers
```javascript
// Trước
const { registerDID } = require('../services/registration.service');

// Sau (không đổi - vì wrapper file giữ nguyên tên!)
const { registerDID } = require('../services/registration.service'); // ✅ Không cần sửa!
```

**Bước 5:** Test toàn bộ hệ thống
- Đăng ký DID
- OTP verification
- Admin dashboard
- Service requests

**Bước 6:** Xóa files .OLD sau khi test thành công

---

### **Option 2: Direct replacement (Nhanh hơn nhưng rủi ro)**

```bash
cd backend/src/services

# Backup files cũ
mkdir _backup
cp *.service.js _backup/

# Replace with new wrappers
mv verification.service.new.js verification.service.js
mv admin.service.new.js admin.service.js
mv service-management.service.new.js service-management.service.js

# Restart backend
npm start
```

---

## 📝 Controllers không cần sửa gì!

Vì wrapper files giữ nguyên tên và export functions, **TẤT CẢ controllers vẫn hoạt động bình thường:**

```javascript
// auth.controller.js - KHÔNG CẦN SỬA
const { registerDID } = require('../services/registration.service'); 
// ✅ Vẫn work vì có registration/index.js

// verify.controller.js - KHÔNG CẦN SỬA
const { requestOTP, verifyOTP } = require('../services/verification.service');
// ✅ Vẫn work vì có verification.service.js wrapper

// admin.controller.js - KHÔNG CẦN SỬA
const { getDashboardStats } = require('../services/admin.service');
// ✅ Vẫn work vì có admin.service.js wrapper
```

---

## ✨ Lợi ích sau khi refactor

### **1. Code dễ đọc hơn**
- Mỗi file < 200 dòng
- Tên file rõ ràng theo chức năng
- Comments đầy đủ

### **2. Dễ maintain**
- Tìm bug nhanh (biết ngay file nào có vấn đề)
- Sửa 1 chức năng không ảnh hưởng phần khác

### **3. Dễ test**
```javascript
// Test riêng OTP service
const { generateOTP, verifyOTP } = require('./verification/otp.service');

// Test riêng blockchain
const { createDIDOnChain } = require('./shared/blockchain.helper');
```

### **4. Dễ mở rộng**
Thêm tính năng mới? Tạo file mới trong folder tương ứng:
```
services/
  registration/
    registration.service.js
    verification-validator.js
    blockchain-registrar.js
    email-sender.js            # 🆕 Thêm mới
```

### **5. Tái sử dụng code**
```javascript
// Shared helpers được dùng ở nhiều nơi
const { checkCCCDExists } = require('./shared/database.helper');
const { createDIDOnChain } = require('./shared/blockchain.helper');
```

---

## 🧪 Testing Checklist

Sau khi migration, test các flows:

- [ ] **Registration Flow**
  - [ ] Generate new wallet
  - [ ] Use existing wallet (MetaMask)
  - [ ] With pre-verification token
  - [ ] Without pre-verification

- [ ] **Verification Flow**
  - [ ] Request OTP
  - [ ] Verify OTP (correct code)
  - [ ] Verify OTP (wrong code)
  - [ ] OTP expiry
  - [ ] Max attempts

- [ ] **Admin Functions**
  - [ ] Import CCCD batch
  - [ ] Get dashboard stats
  - [ ] Export logs
  - [ ] Blacklist CCCD

- [ ] **Service Management**
  - [ ] Create service
  - [ ] List services
  - [ ] Request service
  - [ ] Approve service
  - [ ] Reject service

---

## 🚨 Troubleshooting

**Lỗi: Cannot find module**
```bash
# Check file paths
ls -la backend/src/services/registration/
ls -la backend/src/services/verification/
ls -la backend/src/services/shared/
```

**Lỗi: Function không tồn tại**
```javascript
// Check exports trong wrapper file
console.log(require('./services/verification.service'));
```

**Rollback nếu có vấn đề:**
```bash
cd backend/src/services
rm -rf registration/ verification/ admin/ service-management/ shared/
cp _backup/*.service.js ./
npm start
```

---

## 📊 So sánh Before/After

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Số files** | 4 files | 14 files | Better organization |
| **Avg file size** | 250 dòng | 100 dòng | 60% nhỏ hơn |
| **Max file size** | 350 dòng | 185 dòng | 47% giảm |
| **Code reuse** | Duplicate | Shared helpers | DRY principle |
| **Test coverage** | Khó test | Dễ test từng module | ✅ Better testability |

---

## 🎯 Next Steps

1. ✅ **Test migration** với Option 1
2. ⏳ **Viết unit tests** cho từng service module
3. ⏳ **Add JSDoc** cho tất cả functions
4. ⏳ **Setup ESLint** cho code consistency
5. ⏳ **Thêm error handling** chuẩn hóa

---

## 📞 Support

Nếu gặp vấn đề khi migration:
1. Check file `.OLD` (backup của files cũ)
2. Xem logs trong `backend/logs/`
3. Test từng service riêng lẻ
4. Rollback và thử lại

**Lưu ý:** Không xóa files .OLD cho đến khi production stable!
