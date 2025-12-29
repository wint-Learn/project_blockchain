/**
 * Interface định nghĩa thông tin CCCD được sử dụng trong ứng dụng
 * Được dùng trong useAuthStore để lưu thông tin user từ backend API
 */
export interface CCCDInfo {
  fullName?: string;         // Họ và tên
  dateOfBirth?: string;      // Ngày sinh
  gender?: string;           // Giới tính
  address?: string;          // Địa chỉ thường trú
}

export interface DIDInfo {
  address: string;           // Địa chỉ ví liên kết
  publicKey: string;         // Public key
  cccdHashOnChain: string;   // CCCD hash trên blockchain
  hasMetadata: boolean;      // Có metadata hay không
  registeredAt?: string;     // Thời điểm đăng ký (optional)
}
