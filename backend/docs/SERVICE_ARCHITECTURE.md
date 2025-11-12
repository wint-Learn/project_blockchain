# 🏗️ Backend Services Architecture (Refactored)

## 📁 Cấu trúc thư mục mới

```
backend/src/services/
├── registration/
│   ├── index.js                        # Main entry point
│   ├── registration.service.js         # Orchestrator chính (65 lines)
│   ├── verification-validator.js       # Validate pre-verification token (85 lines)
│   └── blockchain-registrar.js         # Blockchain DID registration (60 lines)
│
├── verification/
│   ├── otp.service.js                  # OTP generation & verification (165 lines)
│   └── pre-verification.service.js     # Pre-verification checks (135 lines)
│
├── admin/
│   ├── cccd-management.service.js      # CCCD import, blacklist (185 lines)
│   ├── dashboard.service.js            # Statistics & analytics (80 lines)
│   └── logs.service.js                 # Export logs (70 lines)
│
├── service-management/
│   ├── service-catalog.service.js      # Create/list services (90 lines)
│   ├── service-request.service.js      # User requests (140 lines)
│   └── service-approval.service.js     # Admin approve/reject (150 lines)
│
├── shared/
│   ├── blockchain.helper.js            # Blockchain utilities (95 lines)
│   └── database.helper.js              # Database utilities (100 lines)
│
├── verification.service.js             # Wrapper (backward compat)
├── admin.service.js                    # Wrapper (backward compat)
├── service-management.service.js       # Wrapper (backward compat)
│
└── [OLD FILES - will be deprecated]
    ├── registration.service.js         # 185 lines → Refactored ✅
    ├── verification.service.js         # 200 lines → Refactored ✅
    ├── admin.service.js                # 350 lines → Refactored ✅
    └── service-management.service.js   # 320 lines → Refactored ✅
```

---

## 🔄 Data Flow Diagrams

### **1. Registration Flow**

```
┌─────────────────┐
│ auth.controller │
└────────┬────────┘
         │ registerDID()
         ▼
┌────────────────────────────────────┐
│ registration/registration.service  │◄─── Main Orchestrator
└────┬───────────────────────┬───────┘
     │                       │
     │ validateToken()       │ preparePublicKey()
     ▼                       ▼
┌─────────────────────┐  ┌──────────────────────┐
│ verification-       │  │ blockchain-          │
│ validator.js        │  │ registrar.js         │
└─────────────────────┘  └──────┬───────────────┘
                                │ createDIDOnChain()
                                ▼
                         ┌──────────────────┐
                         │ shared/          │
                         │ blockchain.      │
                         │ helper.js        │
                         └──────────────────┘
```

### **2. Verification Flow**

```
┌──────────────────┐
│ verify.controller│
└────────┬─────────┘
         │ requestOTP()
         ▼
┌─────────────────────────────────┐
│ verification.service (wrapper)  │
└────────┬────────────────────────┘
         │
         ├─► checkPreVerification() ─┐
         │                           │
         └─► requestOTP() ───────────┤
                                     ▼
                          ┌──────────────────────┐
                          │ verification/        │
                          │ otp.service.js       │
                          └──────────────────────┘
                          
         verifyOTP()
         ▼
┌─────────────────────────────────┐
│ verification.service (wrapper)  │
└────────┬────────────────────────┘
         │
         ├─► verifyOTP() ───────────┐
         │                          │
         ├─► updateStatus() ────────┤
         │                          │
         └─► getCitizenInfo() ──────┤
                                    ▼
                         ┌──────────────────────┐
                         │ verification/        │
                         │ pre-verification.    │
                         │ service.js           │
                         └──────────────────────┘
```

### **3. Admin Flow**

```
┌───────────────────┐
│ admin.controller  │
└────────┬──────────┘
         │
         ├─► importCCCDBatch()
         ├─► getDashboardStats()
         ├─► exportLogs()
         └─► blacklistCCCD()
                │
                ▼
┌────────────────────────────┐
│ admin.service (wrapper)    │
└────────┬───────────────────┘
         │
         ├─────────────────────┐
         │                     │
         ▼                     ▼
┌─────────────────┐   ┌───────────────┐   ┌──────────────┐
│ admin/          │   │ admin/        │   │ admin/       │
│ cccd-           │   │ dashboard.    │   │ logs.        │
│ management.     │   │ service.js    │   │ service.js   │
│ service.js      │   └───────────────┘   └──────────────┘
└─────────────────┘
```

---

## 📦 Module Dependencies

### **Shared Modules (Được dùng bởi nhiều services)**

```
shared/blockchain.helper.js
├── Used by: registration/blockchain-registrar.js
└── Used by: service-management/service-approval.service.js

shared/database.helper.js
├── Used by: registration/registration.service.js
├── Used by: verification/pre-verification.service.js
└── Used by: admin/cccd-management.service.js
```

### **No Circular Dependencies** ✅
- Shared helpers không import từ business logic
- Business logic có thể import shared helpers
- Wrapper files chỉ re-export, không có logic

---

## 🎯 Separation of Concerns

| Layer | Responsibility | Files |
|-------|---------------|-------|
| **Orchestration** | Coordinate workflow | `registration.service.js` |
| **Business Logic** | Domain-specific rules | `verification-validator.js`, `otp.service.js` |
| **Data Access** | Database operations | `database.helper.js` |
| **Blockchain** | Smart contract calls | `blockchain.helper.js` |
| **Wrappers** | Backward compatibility | `*.service.js` (root level) |

---

## 🔧 Testing Strategy

### **Unit Tests** (Test từng module riêng)
```javascript
// tests/services/verification/otp.service.test.js
const { generateOTP, verifyOTP } = require('../../../src/services/verification/otp.service');

describe('OTP Service', () => {
  test('generateOTP returns 6 digits', () => {
    const otp = generateOTP();
    expect(otp).toMatch(/^\d{6}$/);
  });
});
```

### **Integration Tests** (Test toàn bộ flow)
```javascript
// tests/integration/registration.test.js
const { registerDID } = require('../../src/services/registration');

describe('Registration Flow', () => {
  test('should register DID with pre-verification', async () => {
    // Test complete flow
  });
});
```

---

## 🚀 Performance Benefits

### **Before Refactoring:**
- Load entire 350-line file cho 1 function
- Duplicate code trong nhiều files
- Khó cache specific modules

### **After Refactoring:**
- Load chỉ modules cần thiết
- Shared helpers → DRY principle
- Better module caching by Node.js

**Example:**
```javascript
// Before: Load 350 lines
const { exportLogs } = require('./services/admin.service'); // Loads everything

// After: Load chỉ 70 lines
const { exportLogs } = require('./services/admin/logs.service'); // Targeted
```

---

## 📝 Code Style Guidelines

### **Naming Conventions:**
- Services: `[feature].service.js`
- Helpers: `[type].helper.js`
- Folders: `kebab-case`
- Functions: `camelCase`

### **File Structure:**
```javascript
/**
 * [Service Name]
 * [Description]
 */

// 1. Imports
const { dependency } = require('...');

// 2. Helper functions (private)
function helperFunction() {}

// 3. Main exported functions
async function mainFunction() {}

// 4. Exports
module.exports = {
  mainFunction
};
```

---

## 🔄 Migration Checklist

- [x] Create new folder structure
- [x] Create shared helpers
- [x] Refactor registration services
- [x] Refactor verification services
- [x] Refactor admin services
- [x] Refactor service-management services
- [x] Create wrapper files for backward compatibility
- [x] Write migration guide
- [ ] Test all flows
- [ ] Update controllers (if needed)
- [ ] Remove old files
- [ ] Update documentation

---

## 📚 Further Improvements

1. **Add TypeScript** - Type safety
2. **Add Dependency Injection** - Better testability
3. **Add Error Classes** - Standardized errors
4. **Add Middleware** - Input validation
5. **Add Caching** - Redis for frequent queries
6. **Add Logging** - Winston structured logging

---

## 🎓 Learning Resources

**Design Patterns Used:**
- ✅ Single Responsibility Principle
- ✅ Don't Repeat Yourself (DRY)
- ✅ Separation of Concerns
- ✅ Facade Pattern (wrapper files)
- ✅ Helper/Utility Pattern (shared/)

**Best Practices:**
- Small, focused modules (< 200 lines)
- Clear naming conventions
- Comprehensive documentation
- No circular dependencies
- Easy to test and maintain
