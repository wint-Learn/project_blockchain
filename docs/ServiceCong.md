Đã từng thiết kế và triển khai nhiều hệ thống e-Government với các tính năng như đăng ký kinh doanh và đăng ký xe máy. Dựa trên dự án DID e-Government của bạn, tôi sẽ vạch ra luồng chi tiết cho tính năng sử dụng dịch vụ công (ở mức demo) và vai trò admin, tích hợp với mô hình hybrid DID (pre-issuance bởi admin, self-management bởi người dân) mà chúng ta đã thảo luận. Tôi sẽ sử dụng Ganache cho blockchain local (như bạn đang dùng) để đảm bảo demo mượt mà, và tập trung vào các bước cụ thể để bạn dễ triển khai trong video báo cáo thầy.

### Tổng Quan Luồng
- **Mục Tiêu Demo**: Hiển thị quy trình đăng ký kinh doanh và đăng ký xe máy từ phía người dân, cùng với quản lý và phê duyệt từ phía admin, trên nền tảng blockchain với DID.
- **Vai Trò**:
  - **Người Dân**: Gửi yêu cầu dịch vụ, ký tx, theo dõi trạng thái.
  - **Admin**: Xem yêu cầu, phê duyệt/từ chối, cập nhật blockchain.
- **Tech Stack**: BE Node.js, FE React.js, Ganache (blockchain), MetaMask (ví), PostgreSQL (DB).

### Luồng Xử Lý Chi Tiết

#### **1. Chuẩn Bị Môi Trường (Trước Khi Demo)**
- **Bước 1: Khởi Động Ganache**
  - Mở terminal, chạy: `ganache --chain.chainId 80002`.
  - Ghi nhận 10 tài khoản (e.g., #0 cho admin, #1-#9 cho người dân), add vào MetaMask với mạng custom (RPC: `http://127.0.0.1:8545`, Chain ID: 80002).
- **Bước 2: Deploy Smart Contract**
  - Sử dụng Hardhat deploy `DIDRegistry.sol` (có hàm `createDID`, `logService`, `verifySignature`) với tài khoản admin (#0).
  - Xác nhận contract address trên Ganache GUI.
- **Bước 3: Seed DB**
  - Chạy seed.sql để pre-load 50 CCCD mock vào `pre_verified_cccd` (cccd_hash, sdt, status='pending').
  - Tạo table `service_requests` (id, cccd_hash, service_type, status, tx_hash).
- **Bước 4: Chạy BE và FE**
  - BE: `npm start` (Node.js server).
  - FE: `npm run start` (React app).

#### **2. Phía Người Dân: Sử Dụng Dịch Vụ Công**
##### **Dịch Vụ: Đăng Ký Kinh Doanh**
- **Bước 1: Truy Cập Trang Dịch Vụ**
  - Mở FE → Chuyển đến "Dịch Vụ Công" → Chọn "Đăng Ký Kinh Doanh".
  - Hiển thị form: CCCD, SĐT, Tên Doanh Nghiệp, Địa Chỉ Kinh Doanh.
- **Bước 2: Gửi Yêu Cầu**
  - Nhập dữ liệu (e.g., CCCD: "012345678912", SĐT: "0901234567", Tên: "Cửa Hàng A", Địa Chỉ: "123 Đường X").
  - Gửi POST /api/service/request với `{ cccd_hash, sdt, service_type: "business_registration", data: { name, address } }`.
  - BE kiểm tra `pre_verified_cccd`, gửi OTP mock (console log), và lưu vào `service_requests` (status='pending').
- **Bước 3: Theo Dõi Trạng Thái**
  - Sau gửi, chuyển sang "Theo Dõi Yêu Cầu" → Hiển thị ID yêu cầu và status (pending).
  - Đợi admin xử lý (demo chuyển sang bước admin).

##### **Dịch Vụ: Đăng Ký Xe Máy**
- **Bước 1: Truy Cập Trang Dịch Vụ**
  - Từ "Dịch Vụ Công" → Chọn "Đăng Ký Xe Máy".
  - Form: CCCD, SĐT, Số Khung, Số Máy, Màu Xe.
- **Bước 2: Gửi Yêu Cầu**
  - Nhập dữ liệu (e.g., CCCD: "012345678913", SĐT: "0901234568", Số Khung: "ABC123", Số Máy: "XYZ789", Màu: "Đen").
  - Gửi POST /api/service/request với `{ cccd_hash, sdt, service_type: "vehicle_registration", data: { frame_no, engine_no, color } }`.
  - BE lưu vào `service_requests` (status='pending').
- **Bước 3: Theo Dõi Trạng Thái**
  - Hiển thị ID yêu cầu và status (pending), đợi admin phê duyệt.

##### **Ghi Chú Người Dân**:
- Người dân không cần tạo tx ban đầu (admin làm), nhưng cần MetaMask để ký tx sau khi phê duyệt (e.g., xác nhận hoàn tất).

#### **3. Phía Admin: Quản Lý và Phê Duyệt**
- **Bước 1: Login Admin**
  - Mở FE → Chuyển đến "Admin Panel" → Connect MetaMask với tài khoản #0.
  - BE kiểm tra role='admin' từ DB, cho phép truy cập.
- **Bước 2: Xem Yêu Cầu**
  - Trang "Danh Sách Yêu Cầu" → Hiển thị table từ `service_requests` (cccd_hash, service_type, status, data).
  - Lọc: "Đăng Ký Kinh Doanh" hoặc "Đăng Ký Xe Máy".
- **Bước 3: Phê Duyệt hoặc Từ Chối**
  - Chọn yêu cầu (e.g., ID=1, "Đăng Ký Kinh Doanh").
  - **Phê Duyệt**:
    - Gửi POST /api/service/approve với `{ request_id, status: 'approved' }`.
    - BE gọi smart contract `logService` với ví admin (#0), truyền `{ cccd_hash, service_type, data }` → Tạo tx trên Ganache.
    - Cập nhật `service_requests` (status='approved', tx_hash=transaction_hash).
    - Gửi thông báo mock (console log) cho người dân.
  - **Từ Chối**:
    - Gửi POST /api/service/reject với `{ request_id, status: 'rejected', reason: "Thiếu giấy tờ" }`.
    - Cập nhật `service_requests` (status='rejected').
- **Bước 4: Theo Dõi**
  - Trang "Lịch Sử Xử Lý" → Hiển thị tất cả yêu cầu đã xử lý (approved/rejected) với tx_hash.

#### **4. Hoàn Tất và Xác Nhận (Người Dân)**
- **Bước 1: Nhận Thông Báo**
  - Người dân kiểm tra "Theo Dõi Yêu Cầu" → Status thay đổi (approved/rejected).
  - Nếu approved, hiển thị tx_hash (link đến Ganache GUI).
- **Bước 2: Xác Nhận Hoàn Tất**
  - Connect MetaMask (e.g., #1) → Sign message xác nhận (POST /api/service/confirm).
  - BE verify signature, cập nhật status='completed' trong DB.

#### **5. Tích Hợp AI Anomaly Detection**
- Trong login hoặc gửi yêu cầu, BE kiểm tra anomaly (e.g., IP lạ, giờ bất thường).
- Nếu score >0.5, gửi alert (modal FE) yêu cầu OTP bổ sung.
- Demo: Thay đổi IP (VPN) → Show warning.

### Triển Khai Chi Tiết
- **Backend (Node.js)**:
  - `/api/service/request`: Lưu yêu cầu vào DB.
  - `/api/service/approve`: Gọi `logService` với relayer (Biconomy mock).
  - `/api/service/confirm`: Verify signature.
  - Thêm anomaly check trong `/api/auth/login`.

- **Frontend (React.js)**:
  - Trang "Dịch Vụ Công": Form động (business/vehicle), nút submit.
  - Trang "Admin Panel": Table requests, nút approve/reject.
  - Tích hợp MetaMask (`ethers.js`).

- **Smart Contract (Solidity)**:
  ```solidity
  pragma solidity ^0.8.0;

  contract DIDRegistry {
      mapping(address => bytes32) public cccdHashes;
      mapping(address => string) public serviceLogs;

      function createDID(address user, bytes32 cccdHash) public {
          cccdHashes[user] = cccdHash;
      }

      function logService(address user, string memory serviceType, string memory data) public {
          serviceLogs[user] = string(abi.encodePacked(serviceType, "-", data));
      }

      function verifySignature(address user, bytes32 message, uint8 v, bytes32 r, bytes32 s) public view returns (bool) {
          return ecrecover(message, v, r, s) == user;
      }
  }
  ```

- **Test**:
  - Ganache: Xem tx khi approve/confirm.
  - DB: Kiểm tra `service_requests` sau mỗi bước.

PHASE 3 - POLISH (Nếu còn thời gian):
8. 🔄 AI Anomaly detection
9. 🧹 Cleanup unused files

