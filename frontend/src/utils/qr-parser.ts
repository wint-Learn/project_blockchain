/**
 * Parse QR data từ CCCD Việt Nam
 * Format chuẩn: 001203045373|---||Nguyễn Quang Thắng|06122003|Nam|Dược Thương, Tiên Dược, Sóc Sơn, Hà Nội|25042021
 * 
 * Các trường (phân tách bởi |):
 * 0: Số CCCD (12 chữ số)
 * 1: Số cũ (nếu có, thường là ---)
 * 2: ? (thường rỗng)
 * 3: Họ và tên
 * 4: Ngày sinh (ddmmyyyy)
 * 5: Giới tính
 * 6: Địa chỉ thường trú
 * 7: Ngày cấp (ddmmyyyy)
 */

export interface CCCDInfo {
  cccdNumber: string;       // Số CCCD
  oldNumber?: string;        // Số CMND cũ (nếu có)
  fullName: string;          // Họ và tên
  dateOfBirth: string;       // Ngày sinh (formatted)
  gender: string;            // Giới tính
  address: string;           // Địa chỉ thường trú
  issueDate: string;         // Ngày cấp (formatted)
  raw: string;               // QR data gốc (để hash)
}

/**
 * Parse ngày tháng từ format ddmmyyyy sang dd/mm/yyyy
 */
const parseDate = (dateStr: string): string => {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  
  const day = dateStr.substring(0, 2);
  const month = dateStr.substring(2, 4);
  const year = dateStr.substring(4, 8);
  
  return `${day}/${month}/${year}`;
};

/**
 * Parse QR data từ CCCD
 * @param qrData - Chuỗi QR data từ CCCD (các trường phân tách bởi |)
 * @returns CCCDInfo object hoặc null nếu parse thất bại
 */
export const parseQRData = (qrData: string): CCCDInfo | null => {
  if (!qrData || typeof qrData !== 'string') {
    console.error('Invalid QR data: empty or not a string');
    return null;
  }

  try {
    // Split bởi dấu | (pipe)
    const parts = qrData.split('|');

    // Cần ít nhất 8 phần để parse đầy đủ
    if (parts.length < 8) {
      console.warn('QR data has less than 8 parts, may be incomplete');
      // Vẫn cố gắng parse với dữ liệu có sẵn
    }

    const cccdInfo: CCCDInfo = {
      cccdNumber: parts[0] || '',
      oldNumber: parts[1] && parts[1] !== '---' ? parts[1] : undefined,
      fullName: parts[3] || '',
      dateOfBirth: parseDate(parts[4] || ''),
      gender: parts[5] || '',
      address: parts[6] || '',
      issueDate: parseDate(parts[7] || ''),
      raw: qrData,
    };

    // Validate số CCCD (12 chữ số hoặc 9 chữ số cho CMND cũ)
    if (cccdInfo.cccdNumber && !/^\d{9,12}$/.test(cccdInfo.cccdNumber)) {
      console.warn('CCCD number format may be invalid:', cccdInfo.cccdNumber);
    }

    return cccdInfo;
  } catch (error) {
    console.error('Error parsing QR data:', error);
    return null;
  }
};

/**
 * Validate QR data có đúng format không
 */
export const isValidQRFormat = (qrData: string): boolean => {
  if (!qrData) return false;
  
  const parts = qrData.split('|');
  
  // Phải có ít nhất 8 phần và phần đầu là số CCCD
  return parts.length >= 8 && /^\d{9,12}$/.test(parts[0]);
};

/**
 * Mask thông tin nhạy cảm để hiển thị
 */
export const maskCCCDNumber = (cccdNumber: string): string => {
  if (!cccdNumber || cccdNumber.length < 4) return cccdNumber;
  
  const visibleStart = cccdNumber.substring(0, 3);
  const visibleEnd = cccdNumber.substring(cccdNumber.length - 3);
  const masked = '*'.repeat(cccdNumber.length - 6);
  
  return `${visibleStart}${masked}${visibleEnd}`;
};

/**
 * Mask họ tên (chỉ hiển thị họ và chữ cái đầu của tên)
 */
export const maskFullName = (fullName: string): string => {
  if (!fullName) return fullName;
  
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName;
  
  const lastName = parts[parts.length - 1];
  const firstName = parts[0];
  const middleCount = parts.length - 2;
  
  return `${firstName} ${'*'.repeat(middleCount > 0 ? 3 : 0)} ${lastName}`;
};
