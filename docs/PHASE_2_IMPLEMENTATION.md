# PHASE 2 - DỊCH VỤ CÔNG - IMPLEMENTATION GUIDE

## 🎯 Tổng Quan
Phase 2 triển khai hệ thống Dịch vụ công (Public Services) cho phép:
- **Người dân**: Gửi yêu cầu dịch vụ (đăng ký kinh doanh, đăng ký xe máy)
- **Admin**: Xem, phê duyệt, hoặc từ chối yêu cầu
- **Blockchain**: Ghi nhận dịch vụ đã được phê duyệt lên ServiceRegistry contract

## ✅ Đã Hoàn Thành

### 1. Smart Contract ✅
**File**: `blockchain/contracts/ServiceRegistry.sol`
- Contract quản lý đăng ký dịch vụ công on-chain
- **Functions**:
  - `registerService()`: Admin đăng ký dịch vụ cho user
  - `revokeService()`: Thu hồi dịch vụ
  - `getService()`: Lấy thông tin dịch vụ
  - `getUserServiceCount()`: Đếm số dịch vụ của user
  - `hasServiceType()`: Kiểm tra user có dịch vụ loại nào
- **Events**:
  - `ServiceRegistered`: Khi đăng ký dịch vụ mới
  - `ServiceApproved`: Khi admin phê duyệt
  - `ServiceRevoked`: Khi thu hồi dịch vụ
- **Admin Management**: Owner có thể add/remove admin

### 2. Deploy Module ✅
**File**: `blockchain/ignition/modules/ServiceRegistry.ts`
- Hardhat Ignition module để deploy ServiceRegistry
- Sử dụng: `npx hardhat ignition deploy ignition/modules/ServiceRegistry.ts --network localhost`

### 3. Database Migration ✅
**File**: `backend/scripts/migrate-service-requests.sql`
- Tạo bảng `service_requests`:
  ```sql
  - id (SERIAL PRIMARY KEY)
  - wallet_address (VARCHAR 42)
  - cccd_number_hash (VARCHAR 66)
  - service_type (VARCHAR 50): 'business_registration', 'vehicle_registration'
  - service_data (JSONB): Dữ liệu chi tiết dịch vụ
  - status (VARCHAR 20): 'pending', 'approved', 'rejected', 'completed'
  - rejection_reason (TEXT)
  - tx_hash (VARCHAR 66): Transaction hash on-chain
  - service_id (INTEGER): Service ID on-chain
  - approved_by (VARCHAR 42): Admin wallet
  - approved_at (TIMESTAMP)
  - created_at, updated_at
  ```
- Indexes: wallet_address, status, service_type, created_at
- Trigger: auto-update `updated_at`

**File**: `backend/scripts/run-service-migration.js`
- Script chạy migration và hiển thị schema

### 4. Backend API ✅

#### A. Request Controller
**File**: `backend/src/controllers/services/request.controller.js`

**Endpoints**:
1. **POST /api/services/request** - Gửi yêu cầu dịch vụ
   - Body: `{ walletAddress, cccdNumber, serviceType, serviceData }`
   - Validate: User đã đăng ký, CCCD hợp lệ, không có yêu cầu pending
   - Lưu vào DB với status='pending'
   
2. **GET /api/services/my-requests?walletAddress=...** - Lấy yêu cầu của user
   - Trả về: Danh sách yêu cầu + thông tin CCCD
   
3. **GET /api/services/request/:id** - Chi tiết yêu cầu
   - Trả về: Thông tin đầy đủ yêu cầu + user info

#### B. Admin Controller
**File**: `backend/src/controllers/services/admin.controller.js`

**Endpoints**:
1. **GET /api/services/admin/pending?serviceType=...** - Danh sách pending
   - Filter theo serviceType (optional)
   - Trả về: Yêu cầu chờ duyệt + thông tin user
   
2. **GET /api/services/admin/all?status=...&serviceType=...** - Tất cả yêu cầu
   - Filter theo status, serviceType
   
3. **POST /api/services/admin/approve/:id** - Phê duyệt yêu cầu
   - Body: `{ adminAddress }`
   - Validate: Admin role
   - Gọi `serviceContract.registerService()` lên blockchain
   - Cập nhật DB: status='approved', tx_hash, service_id
   
4. **POST /api/services/admin/reject/:id** - Từ chối yêu cầu
   - Body: `{ adminAddress, reason }`
   - Cập nhật DB: status='rejected', rejection_reason

#### C. Routes
**File**: `backend/src/routes/services.routes.js`
- Mount tất cả endpoints trên
- User routes: `/request`, `/my-requests`, `/request/:id`
- Admin routes: `/admin/pending`, `/admin/all`, `/admin/approve/:id`, `/admin/reject/:id`

### 5. Server Configuration ✅
**File**: `backend/src/server.js`
- **ServiceRegistry Contract Setup**:
  - Đọc ABI từ `artifacts/contracts/ServiceRegistry.sol/ServiceRegistry.json`
  - Kết nối với `process.env.SERVICE_CONTRACT_ADDRESS`
  - Lưu vào `app.locals.serviceContract`
- **Mount Routes**:
  - `app.use('/api/services', servicesRoutes)`

## 📋 Các Bước Tiếp Theo

### Bước 1: Deploy ServiceRegistry Contract
```bash
cd blockchain
npx hardhat ignition deploy ignition/modules/ServiceRegistry.ts --network localhost
```
- Copy contract address
- Thêm vào `.env`:
  ```
  SERVICE_CONTRACT_ADDRESS=0x...
  ```

### Bước 2: Chạy Migration Database
```bash
cd backend
node scripts/run-service-migration.js
```
- Kiểm tra bảng `service_requests` đã được tạo
- Verify indexes và trigger

### Bước 3: Khởi Động Backend
```bash
cd backend
npm start
```
- Kiểm tra log: "ServiceRegistry contract connected"
- Verify routes mounted: "/api/services"

### Bước 4: Frontend Implementation (PENDING)
Cần tạo các component:

#### A. Services Page (User)
**File**: `frontend/src/pages/Services.tsx`
- Form chọn loại dịch vụ:
  - Đăng ký kinh doanh: Tên doanh nghiệp, Địa chỉ, ...
  - Đăng ký xe máy: Số khung, Số máy, Màu xe, ...
- Submit → POST `/api/services/request`
- Hiển thị thông báo thành công/lỗi

#### B. My Services Page (User)
**File**: `frontend/src/pages/MyServices.tsx`
- Gọi GET `/api/services/my-requests?walletAddress=...`
- Hiển thị table:
  - Loại dịch vụ
  - Trạng thái (pending, approved, rejected)
  - Ngày gửi
  - TX Hash (nếu approved)
  - Lý do từ chối (nếu rejected)
- Badge màu: pending (warning), approved (success), rejected (error)

#### C. Admin Service Management
**File**: `frontend/src/pages/admin/ServiceRequests.tsx`
- Tabs: "Chờ duyệt" | "Tất cả"
- Table hiển thị:
  - ID, User, CCCD, Họ tên, Loại dịch vụ, Ngày gửi
  - Actions: Button "Phê duyệt" / "Từ chối"
- Modal phê duyệt:
  - Xem chi tiết service_data
  - Button "Xác nhận phê duyệt" → POST `/api/services/admin/approve/:id`
  - Hiển thị TX hash sau khi thành công
- Modal từ chối:
  - Textarea nhập lý do
  - Button "Xác nhận từ chối" → POST `/api/services/admin/reject/:id`

#### D. API Service
**File**: `frontend/src/services/api.ts`
```typescript
// User APIs
export const requestService = async (data: ServiceRequestData) => {
  return api.post('/services/request', data);
};

export const getMyServiceRequests = async (walletAddress: string) => {
  return api.get(`/services/my-requests?walletAddress=${walletAddress}`);
};

export const getServiceRequestDetail = async (id: number) => {
  return api.get(`/services/request/${id}`);
};

// Admin APIs
export const getPendingServiceRequests = async (serviceType?: string) => {
  const params = serviceType ? `?serviceType=${serviceType}` : '';
  return api.get(`/services/admin/pending${params}`);
};

export const getAllServiceRequests = async (status?: string, serviceType?: string) => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (serviceType) params.append('serviceType', serviceType);
  return api.get(`/services/admin/all?${params}`);
};

export const approveServiceRequest = async (id: number, adminAddress: string) => {
  return api.post(`/services/admin/approve/${id}`, { adminAddress });
};

export const rejectServiceRequest = async (id: number, adminAddress: string, reason: string) => {
  return api.post(`/services/admin/reject/${id}`, { adminAddress, reason });
};
```

### Bước 5: Thêm Routes Frontend
**File**: `frontend/src/App.tsx`
```tsx
import Services from './pages/Services';
import MyServices from './pages/MyServices';
import AdminServiceRequests from './pages/admin/ServiceRequests';

// User routes
<Route path="/services" element={<PrivateRoute><Services /></PrivateRoute>} />
<Route path="/my-services" element={<PrivateRoute><MyServices /></PrivateRoute>} />

// Admin routes
<Route path="/admin/services" element={<AdminRoute><AdminServiceRequests /></AdminRoute>} />
```

## 🧪 Testing Flow

### Test Case 1: Đăng Ký Kinh Doanh
1. **User gửi yêu cầu**:
   - Login với ví test: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
   - Vào `/services` → Chọn "Đăng ký kinh doanh"
   - Nhập: CCCD `036202012356`, Tên DN "Cửa hàng ABC", Địa chỉ "123 Đường X"
   - Submit → Nhận `requestId`

2. **Admin phê duyệt**:
   - Login với admin: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
   - Vào `/admin/services` → Tab "Chờ duyệt"
   - Thấy yêu cầu mới → Click "Phê duyệt"
   - Xác nhận → Blockchain TX được tạo
   - Status thay đổi: pending → approved

3. **User kiểm tra**:
   - Vào `/my-services` → Thấy status "Đã phê duyệt"
   - Click TX hash → Mở Ganache GUI xem transaction

### Test Case 2: Từ Chối Yêu Cầu
1. User gửi yêu cầu đăng ký xe máy
2. Admin từ chối với lý do "Thiếu giấy tờ chứng minh sở hữu"
3. User thấy status "Bị từ chối" + lý do

### Test Case 3: Edge Cases
1. **Spam prevention**: User gửi 2 yêu cầu cùng lúc → Lỗi 409 "Bạn đã có yêu cầu đang chờ"
2. **CCCD không tồn tại**: Gửi yêu cầu với CCCD lạ → Lỗi 404
3. **Non-admin approve**: User thường cố approve → Lỗi 403
4. **Blockchain error**: Ganache tắt → Lỗi 500 "Lỗi khi ghi lên blockchain"

## 📊 Service Data Schema

### Business Registration (service_type: 'business_registration')
```json
{
  "businessName": "Cửa hàng ABC",
  "businessAddress": "123 Đường X, Quận Y, TP Z",
  "businessType": "Hộ kinh doanh cá thể",
  "taxCode": "0123456789",
  "phoneNumber": "0901234567"
}
```

### Vehicle Registration (service_type: 'vehicle_registration')
```json
{
  "vehicleType": "Xe máy",
  "brand": "Honda",
  "model": "Wave RSX",
  "frameNumber": "ABC123XYZ",
  "engineNumber": "XYZ789ABC",
  "color": "Đen",
  "year": "2023"
}
```

## 🔐 Security Considerations
- ✅ Validate admin role trước khi approve/reject
- ✅ Spam prevention: Chỉ cho phép 1 yêu cầu pending/service_type
- ✅ CCCD verification: Kiểm tra pre_verified_cccd trước khi tạo yêu cầu
- ✅ Blockchain signature: Admin sign transaction khi approve
- ⚠️ Rate limiting: Thêm rate limit cho `/api/services/request` (max 5 requests/hour)

## 📈 Next Phase Preview

### Phase 3: Admin Improvements + AI Anomaly
- [ ] Admin logout button
- [ ] Admin dashboard với statistics
- [ ] AI Anomaly detection UI (hiển thị score, alerts)
- [ ] Real-time notifications (WebSocket hoặc polling)

## 🎥 Demo Script (cho video)
1. **Intro**: "Hệ thống dịch vụ công hybrid blockchain"
2. **User flow**: Gửi yêu cầu đăng ký kinh doanh
3. **Admin flow**: Xem yêu cầu, phê duyệt lên blockchain
4. **Ganache**: Show transaction on-chain
5. **User confirmation**: Xem status approved + TX hash
6. **Edge case**: Demo từ chối yêu cầu với lý do

## 📝 Notes
- Contract chưa deploy → Cần deploy trước khi test
- Frontend chưa implement → Ưu tiên Services.tsx và MyServices.tsx
- Admin panel đã có base structure → Thêm tab ServiceRequests
- Dashboard đã có button "Sử dụng dịch vụ công" → Link đến /services
