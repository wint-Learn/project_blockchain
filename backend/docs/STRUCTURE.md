# Cấu trúc Thư mục Backend - Changelog

## 📅 Ngày cập nhật: 2025-01-23

### ✨ Thay đổi

**Giai đoạn 2 (MVC Refactoring - 2025-01-23):**
- ✅ Tách server.js monolithic (304 lines) thành MVC pattern
- ✅ Tạo `src/routes/` với 4 route files (health, did, auth, admin)
- ✅ Tạo `src/controllers/` với 3 controller files (did, auth, admin)
- ✅ Server.js giờ chỉ còn ~140 lines (setup + mounting routes)
- ✅ Backward compatibility maintained cho existing API paths

**Giai đoạn 1 (Folder Restructure - 2025-01-23):**
- ✅ Tổ chức lại toàn bộ cấu trúc backend để dễ quản lý và maintain hơn
- ✅ Tạo các thư mục src/, scripts/, tests/, docs/
- ✅ Di chuyển tất cả files vào đúng thư mục

## 📁 Cấu trúc Mới

```
backend/
│
├── src/                          # 🔵 Source code chính
│   ├── server.js                # Entry point - Express server (MVC pattern)
│   ├── routes/                  # 🆕 API routes
│   │   ├── health.routes.js
│   │   ├── did.routes.js
│   │   ├── auth.routes.js
│   │   └── admin.routes.js
│   ├── controllers/             # 🆕 Business logic
│   │   ├── did.controller.js
│   │   ├── auth.controller.js
│   │   └── admin.controller.js
│   ├── middleware/              # Express middleware
│   │   ├── audit-middleware.js
│   │   └── validation-schemas.js
│   ├── utils/                   # Utility functions
│   │   └── crypto-utils.js
│   └── config/                  # (Reserved cho config files)
│
├── scripts/                      # 🔧 Database & maintenance scripts
│   ├── schema.sql
│   ├── migrate.js
│   ├── rotate-key.js
│   └── sign.js
│
├── tests/                        # 🧪 Test files
│   ├── test-flow.js
│   └── test-validation.js
│
├── docs/                         # 📚 Documentation
│   ├── README.md                # Full documentation
│   ├── SUMMARY.md               # Quick reference
│   └── SECURITY_IMPROVEMENTS.md
│
├── .env                          # Environment variables
├── .gitignore
├── package.json
├── STRUCTURE.md                  # This file
└── README.md                     # Root README (quick start)
```

## 🔄 Migration từ cấu trúc cũ

### Giai đoạn 2: MVC Refactoring (2025-01-23)

| Monolithic server.js (304 lines) | MVC Pattern |
|----------------------------------|-------------|
| `GET /health` logic | `src/routes/health.routes.js` |
| `GET /api/did/:address` logic | `src/controllers/did.controller.js` → `src/routes/did.routes.js` |
| `POST /api/register` logic | `src/controllers/auth.controller.js#register` |
| `POST /api/login` logic | `src/controllers/auth.controller.js#login` |
| `detectAnomaly()` function | `src/controllers/auth.controller.js#detectAnomaly` |
| `GET /api/logs` logic | `src/controllers/admin.controller.js#getLoginLogs` |
| *(monolithic)* | `src/server.js` (140 lines, setup + mount routes only) |

**Routes Structure:**
- `/health` → `healthRoutes` → health check
- `/api/did` → `didRoutes` → `didController.getDIDInfo`
- `/api/auth` → `authRoutes` → `authController.register`, `authController.login`
- `/api/admin` → `adminRoutes` → `adminController.getLoginLogs`

**Backward Compatibility:**
- `/api/register` → forwards to `authController.register`
- `/api/login` → forwards to `authController.login`
- `/api/logs` → forwards to `adminController.getLoginLogs`

### Giai đoạn 1: Folder Restructure (2025-01-23)

### Cấu trúc cũ → Cấu trúc mới

| Cũ (root) | Mới |
|-----------|-----|
| `server.js` | `src/server.js` |
| `audit-middleware.js` | `src/middleware/audit-middleware.js` |
| `validation-schemas.js` | `src/middleware/validation-schemas.js` |
| `crypto-utils.js` | `src/utils/crypto-utils.js` |
| `schema.sql` | `scripts/schema.sql` |
| `migrate.js` | `scripts/migrate.js` |
| `rotate-key.js` | `scripts/rotate-key.js` |
| `sign.js` | `scripts/sign.js` |
| `test-flow.js` | `tests/test-flow.js` |
| `test-validation.js` | `tests/test-validation.js` |
| `README.md` | `docs/README.md` |
| `SUMMARY.md` | `docs/SUMMARY.md` |
| `SECURITY_IMPROVEMENTS.md` | `docs/SECURITY_IMPROVEMENTS.md` |
| *(new)* | `README.md` (root quick start) |

### Files đã xóa

- ❌ `server-v2.js` (deprecated, đã merge vào server.js)
- ❌ `server-old.js` (không còn cần)

## 📝 NPM Scripts Mới

```json
{
  "start": "node src/server.js",
  "migrate": "node scripts/migrate.js",
  "rotate-key": "node scripts/rotate-key.js",
  "test:flow": "node tests/test-flow.js",
  "test:validation": "node tests/test-validation.js"
}
```

### Sử dụng

```bash
npm start              # Khởi động server
npm run migrate        # Chạy DB migration
npm run test:flow      # Test demo flow
npm run test:validation # Test Zod validation
```

## ✅ Đã test

### Giai đoạn 2: MVC Refactoring
- ✅ Server khởi động với MVC structure (`npm start`)
- ✅ Health endpoint: `GET /health` ✅
- ✅ DID endpoint: `GET /api/did/:address` ✅
- ✅ Auth routes: `/api/auth/register`, `/api/auth/login` (structured)
- ✅ Admin routes: `/api/admin/logs` (with audit middleware)
- ✅ Backward compatibility: `/api/register`, `/api/login`, `/api/logs` ✅
- ✅ All routes properly import controllers
- ✅ app.locals sharing (pool, provider, contract) works

### Giai đoạn 1: Folder Restructure
- ✅ Server khởi động thành công (`npm start`)
- ✅ Health endpoint hoạt động (`GET /health`)
- ✅ Migration script hoạt động (`npm run migrate`)
- ✅ Validation test pass (`npm run test:validation`)
- ✅ Tất cả imports đã được cập nhật đúng path

## 🎯 Lợi ích

### MVC Refactoring (Giai đoạn 2)

#### 1. **Separation of Concerns**
- Routes: Chỉ định nghĩa endpoints và middleware
- Controllers: Chứa business logic
- server.js: Chỉ setup và mount routes (từ 304 lines → 140 lines)

#### 2. **Maintainability**
- Thêm endpoint mới: Tạo method trong controller, add route trong routes file
- Debug dễ hơn: Biết chính xác file nào chứa logic
- Testing dễ hơn: Test controllers riêng, test routes riêng

#### 3. **Scalability**
- Thêm controller mới → `src/controllers/newController.js`
- Thêm route mới → `src/routes/newRoutes.js`
- Mount vào server.js: `app.use('/api/new', newRoutes)`

#### 4. **Reusability**
- Controllers có thể được reuse ở nhiều routes
- Middleware được share qua app.locals (pool, provider, contract)
- DRY principle

#### 5. **Team Collaboration**
- Developer A làm didController, Developer B làm authController
- Ít conflict trong git
- Clear ownership

### Folder Restructure (Giai đoạn 1)

### 1. **Tổ chức rõ ràng**
- Source code trong `src/`
- Scripts riêng trong `scripts/`
- Tests riêng trong `tests/`
- Docs tập trung trong `docs/`

### 2. **Dễ scale**
- Thêm middleware mới → `src/middleware/`
- Thêm utils → `src/utils/`
- Thêm config → `src/config/`
- Thêm routes → `src/routes/` (future)

### 3. **Clean root directory**
- Root chỉ còn config files (.env, package.json, README.md)
- Không bị lộn xộn với nhiều files

### 4. **IDE-friendly**
- Dễ navigate trong VS Code/IDE
- Folder structure rõ ràng
- Quick access với sidebar

### 5. **Professional structure**
- Follow best practices của Node.js projects
- Dễ onboard developers mới
- Maintainable và scalable

## 📚 Tài liệu

Chi tiết xem:
- **Quick start:** `README.md` (root)
- **Full docs:** `docs/README.md`
- **Security:** `docs/SECURITY_IMPROVEMENTS.md`

## 🚀 Next Steps (Optional)

### Đã hoàn thành ✅
1. ✅ **Thêm routes/**: Đã tách routes ra khỏi server.js
   ```
   src/routes/
   ├── health.routes.js
   ├── did.routes.js
   ├── auth.routes.js
   └── admin.routes.js
   ```

2. ✅ **Thêm controllers/**: Business logic riêng
   ```
   src/controllers/
   ├── did.controller.js
   ├── auth.controller.js
   └── admin.controller.js
   ```

### Có thể làm thêm (Future)

3. **Thêm models/**: Database models (ORM pattern)
   ```
   src/models/
   ├── User.js
   └── LoginLog.js
   ```

4. **Nodemon cho dev**: Auto-restart khi code thay đổi
   ```bash
   npm install --save-dev nodemon
   # package.json: "dev": "nodemon src/server.js"
   ```

5. **Unit tests**: Test riêng từng controller
   ```
   tests/unit/
   ├── did.controller.test.js
   ├── auth.controller.test.js
   └── admin.controller.test.js
   ```

6. **API versioning**: Cho phép multiple API versions
   ```
   src/routes/v1/
   src/routes/v2/
   ```

---

**Hoàn thành bởi:** GitHub Copilot  
**Ngày:** 2025-10-23
