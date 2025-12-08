Mô hình MVC


Kiến trúc hệ thống

@startuml

actor "Người dùng\n(công dân)" as Citizen
actor "Quản trị viên" as Admin

node "Trình duyệt Web\nReact + MetaMask" as FE
node "Backend API\nNode.js / Express" as BE {
  component "Auth Module\n(Đăng ký, Đăng nhập,\nLiên kết ví)" as Auth
  component "OTP Module\n(Sinh & xác thực OTP,\nBảng otp_codes)" as OTP
  component "AI Risk Module\n(Phát hiện đăng nhập\nbất thường)" as AIMod
  component "Service Module\n(Dịch vụ công,\nYêu cầu dịch vụ)" as ServiceMod
}

database "CSDL quan hệ\nPostgreSQL" as DB
cloud "Blockchain\n(Ganache / Testnet)" as BC
cloud "Dịch vụ\n(IP Geolocation\nip-api.com)" as GEO

Citizen --> FE
Admin --> FE

FE --> BE : HTTPS / REST API\n(JSON)
FE --> BC : Ký message,\ntransaction qua MetaMask

BE --> DB : SQL (pg driver)
BE --> BC : RPC (ethers.js)

Auth --> OTP : Yêu cầu tạo / kiểm tra OTP
OTP --> DB : Lưu & đọc mã OTP

Auth --> AIMod : Gửi dữ liệu login\nđể tính risk_score
AIMod --> DB : Đọc lịch sử login\nlưu risk_score

ServiceMod --> DB : Đọc/ghi services,\nservice_requests

AIMod --> GEO : Tra cứu IP -> location\n(khi cần)

@enduml

