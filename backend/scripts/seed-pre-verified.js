/**
 * Seed Pre-Verified CCCD Data
 * Thêm dữ liệu CCCD mẫu vào bảng pre_verified_cccd để test
 */

const { Pool } = require('pg');
const { hashCCCDNumber } = require('../src/utils/crypto-utils');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING || 'postgres://postgres:1@localhost:5432/identity_db'
});

// Test CCCD data - Các số CCCD giả lập để test
const testCCCDs = [
  // Original 5 test users
  {
    cccdNumber: '001099001234',
    phoneNumber: '0901234567',
    fullName: 'Nguyễn Văn A',
    dateOfBirth: '1990-01-15',
    gender: 'Nam',
    address: 'Số 123, Đường ABC, Phường XYZ, Quận 1, TP.HCM',
    issueDate: '2020-01-01',
    notes: 'Test user 1 - Valid for registration'
  },
  {
    cccdNumber: '001099005678',
    phoneNumber: '0912345678',
    fullName: 'Trần Thị B',
    dateOfBirth: '1995-05-20',
    gender: 'Nữ',
    address: 'Số 456, Đường DEF, Phường UVW, Quận 3, TP.HCM',
    issueDate: '2021-06-15',
    notes: 'Test user 2 - Valid for registration'
  },
  {
    cccdNumber: '001099009999',
    phoneNumber: '0923456789',
    fullName: 'Lê Văn C',
    dateOfBirth: '1988-12-10',
    gender: 'Nam',
    address: 'Số 789, Đường GHI, Phường RST, Quận 5, TP.HCM',
    issueDate: '2019-03-20',
    notes: 'Test user 3 - Blacklisted example'
  },
  {
    cccdNumber: '079099001111',
    phoneNumber: '0934567890',
    fullName: 'Phạm Thị D',
    dateOfBirth: '1992-08-25',
    gender: 'Nữ',
    address: 'Số 321, Đường JKL, Phường MNO, Quận 7, TP.HCM',
    issueDate: '2020-09-10',
    notes: 'Test user 4 - Valid for registration'
  },
  {
    cccdNumber: '079099002222',
    phoneNumber: '0945678901',
    fullName: 'Hoàng Văn E',
    dateOfBirth: '1985-03-30',
    gender: 'Nam',
    address: 'Số 654, Đường PQR, Phường STU, Quận 10, TP.HCM',
    issueDate: '2018-11-05',
    notes: 'Test user 5 - Valid for registration'
  },
  
  // Additional 30 test users
  {
    cccdNumber: '001099001001',
    phoneNumber: '0901111001',
    fullName: 'Nguyễn Thị Lan',
    dateOfBirth: '1991-03-12',
    gender: 'Nữ',
    address: 'Số 10, Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM',
    issueDate: '2020-05-15',
    notes: 'Test user 6'
  },
  {
    cccdNumber: '001099001002',
    phoneNumber: '0901111002',
    fullName: 'Trần Văn Minh',
    dateOfBirth: '1989-07-22',
    gender: 'Nam',
    address: 'Số 25, Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
    issueDate: '2019-08-10',
    notes: 'Test user 7'
  },
  {
    cccdNumber: '001099001003',
    phoneNumber: '0901111003',
    fullName: 'Lê Thị Hoa',
    dateOfBirth: '1993-11-05',
    gender: 'Nữ',
    address: 'Số 42, Đường Pasteur, Phường Bến Nghé, Quận 1, TP.HCM',
    issueDate: '2021-02-20',
    notes: 'Test user 8'
  },
  {
    cccdNumber: '001099001004',
    phoneNumber: '0901111004',
    fullName: 'Phạm Văn Thành',
    dateOfBirth: '1987-04-18',
    gender: 'Nam',
    address: 'Số 88, Đường Đồng Khởi, Phường Bến Nghé, Quận 1, TP.HCM',
    issueDate: '2018-12-05',
    notes: 'Test user 9'
  },
  {
    cccdNumber: '001099001005',
    phoneNumber: '0901111005',
    fullName: 'Hoàng Thị Mai',
    dateOfBirth: '1994-09-30',
    gender: 'Nữ',
    address: 'Số 15, Đường Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP.HCM',
    issueDate: '2022-01-15',
    notes: 'Test user 10'
  },
  {
    cccdNumber: '079099003001',
    phoneNumber: '0902222001',
    fullName: 'Vũ Văn Hùng',
    dateOfBirth: '1986-02-14',
    gender: 'Nam',
    address: 'Số 33, Đường Trần Hưng Đạo, Phường Cầu Ông Lãnh, Quận 1, TP.HCM',
    issueDate: '2019-06-20',
    notes: 'Test user 11'
  },
  {
    cccdNumber: '079099003002',
    phoneNumber: '0902222002',
    fullName: 'Đỗ Thị Nga',
    dateOfBirth: '1992-06-25',
    gender: 'Nữ',
    address: 'Số 77, Đường Lý Tự Trọng, Phường Bến Nghé, Quận 1, TP.HCM',
    issueDate: '2020-11-10',
    notes: 'Test user 12'
  },
  {
    cccdNumber: '079099003003',
    phoneNumber: '0902222003',
    fullName: 'Bùi Văn Đức',
    dateOfBirth: '1990-12-08',
    gender: 'Nam',
    address: 'Số 55, Đường Võ Văn Tần, Phường 6, Quận 3, TP.HCM',
    issueDate: '2021-04-25',
    notes: 'Test user 13'
  },
  {
    cccdNumber: '079099003004',
    phoneNumber: '0902222004',
    fullName: 'Ngô Thị Hương',
    dateOfBirth: '1988-08-17',
    gender: 'Nữ',
    address: 'Số 99, Đường Nam Kỳ Khởi Nghĩa, Phường 7, Quận 3, TP.HCM',
    issueDate: '2019-09-15',
    notes: 'Test user 14'
  },
  {
    cccdNumber: '079099003005',
    phoneNumber: '0902222005',
    fullName: 'Đinh Văn Phong',
    dateOfBirth: '1991-05-03',
    gender: 'Nam',
    address: 'Số 21, Đường Điện Biên Phủ, Phường Đa Kao, Quận 1, TP.HCM',
    issueDate: '2020-07-30',
    notes: 'Test user 15'
  },
  {
    cccdNumber: '036202001001',
    phoneNumber: '0903333001',
    fullName: 'Trịnh Thị Thu',
    dateOfBirth: '1995-01-20',
    gender: 'Nữ',
    address: 'Số 12, Đường Cách Mạng Tháng 8, Phường 6, Quận 3, TP.HCM',
    issueDate: '2021-08-15',
    notes: 'Test user 16'
  },
  {
    cccdNumber: '036202001002',
    phoneNumber: '0903333002',
    fullName: 'Lý Văn Tài',
    dateOfBirth: '1989-10-11',
    gender: 'Nam',
    address: 'Số 45, Đường Nguyễn Đình Chiểu, Phường Đa Kao, Quận 1, TP.HCM',
    issueDate: '2019-11-20',
    notes: 'Test user 17'
  },
  {
    cccdNumber: '036202001003',
    phoneNumber: '0903333003',
    fullName: 'Phan Thị Linh',
    dateOfBirth: '1993-04-28',
    gender: 'Nữ',
    address: 'Số 67, Đường Trương Định, Phường 6, Quận 3, TP.HCM',
    issueDate: '2020-03-12',
    notes: 'Test user 18'
  },
  {
    cccdNumber: '036202001004',
    phoneNumber: '0903333004',
    fullName: 'Dương Văn Tuấn',
    dateOfBirth: '1987-07-15',
    gender: 'Nam',
    address: 'Số 34, Đường Cao Thắng, Phường 5, Quận 3, TP.HCM',
    issueDate: '2018-10-08',
    notes: 'Test user 19'
  },
  {
    cccdNumber: '036202001005',
    phoneNumber: '0903333005',
    fullName: 'Võ Thị Kim',
    dateOfBirth: '1994-11-22',
    gender: 'Nữ',
    address: 'Số 56, Đường Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM',
    issueDate: '2021-12-01',
    notes: 'Test user 20'
  },
  {
    cccdNumber: '024099004001',
    phoneNumber: '0904444001',
    fullName: 'Mai Văn Long',
    dateOfBirth: '1986-03-09',
    gender: 'Nam',
    address: 'Số 78, Đường Hoàng Văn Thụ, Phường 8, Quận Phú Nhuận, TP.HCM',
    issueDate: '2019-04-18',
    notes: 'Test user 21'
  },
  {
    cccdNumber: '024099004002',
    phoneNumber: '0904444002',
    fullName: 'Châu Thị Bích',
    dateOfBirth: '1992-08-14',
    gender: 'Nữ',
    address: 'Số 90, Đường Phan Đăng Lưu, Phường 6, Quận Phú Nhuận, TP.HCM',
    issueDate: '2020-09-22',
    notes: 'Test user 22'
  },
  {
    cccdNumber: '024099004003',
    phoneNumber: '0904444003',
    fullName: 'Hồ Văn Kiên',
    dateOfBirth: '1990-12-30',
    gender: 'Nam',
    address: 'Số 111, Đường Nguyễn Văn Trỗi, Phường 11, Quận Phú Nhuận, TP.HCM',
    issueDate: '2021-05-17',
    notes: 'Test user 23'
  },
  {
    cccdNumber: '024099004004',
    phoneNumber: '0904444004',
    fullName: 'Tô Thị Loan',
    dateOfBirth: '1988-05-06',
    gender: 'Nữ',
    address: 'Số 23, Đường Huỳnh Văn Bánh, Phường 12, Quận Phú Nhuận, TP.HCM',
    issueDate: '2019-07-25',
    notes: 'Test user 24'
  },
  {
    cccdNumber: '024099004005',
    phoneNumber: '0904444005',
    fullName: 'Lâm Văn Hải',
    dateOfBirth: '1991-09-18',
    gender: 'Nam',
    address: 'Số 44, Đường Phan Xích Long, Phường 2, Quận Phú Nhuận, TP.HCM',
    issueDate: '2020-12-30',
    notes: 'Test user 25'
  },
  {
    cccdNumber: '048099005001',
    phoneNumber: '0905555001',
    fullName: 'Từ Thị Hạnh',
    dateOfBirth: '1993-02-11',
    gender: 'Nữ',
    address: 'Số 66, Đường Cộng Hòa, Phường 13, Quận Tân Bình, TP.HCM',
    issueDate: '2021-03-10',
    notes: 'Test user 26'
  },
  {
    cccdNumber: '048099005002',
    phoneNumber: '0905555002',
    fullName: 'Cao Văn Đạt',
    dateOfBirth: '1987-06-23',
    gender: 'Nam',
    address: 'Số 88, Đường Lý Thường Kiệt, Phường 7, Quận Tân Bình, TP.HCM',
    issueDate: '2018-11-28',
    notes: 'Test user 27'
  },
  {
    cccdNumber: '048099005003',
    phoneNumber: '0905555003',
    fullName: 'Đặng Thị Yến',
    dateOfBirth: '1994-10-07',
    gender: 'Nữ',
    address: 'Số 123, Đường Trường Chinh, Phường 12, Quận Tân Bình, TP.HCM',
    issueDate: '2021-09-05',
    notes: 'Test user 28'
  },
  {
    cccdNumber: '048099005004',
    phoneNumber: '0905555004',
    fullName: 'Huỳnh Văn Bảo',
    dateOfBirth: '1989-01-25',
    gender: 'Nam',
    address: 'Số 45, Đường Lạc Long Quân, Phường 5, Quận 11, TP.HCM',
    issueDate: '2019-12-14',
    notes: 'Test user 29'
  },
  {
    cccdNumber: '048099005005',
    phoneNumber: '0905555005',
    fullName: 'Kiều Thị Phượng',
    dateOfBirth: '1992-04-19',
    gender: 'Nữ',
    address: 'Số 67, Đường Lý Thái Tổ, Phường 9, Quận 10, TP.HCM',
    issueDate: '2020-06-08',
    notes: 'Test user 30'
  },
  {
    cccdNumber: '052099006001',
    phoneNumber: '0906666001',
    fullName: 'Ông Văn Sơn',
    dateOfBirth: '1986-08-02',
    gender: 'Nam',
    address: 'Số 89, Đường 3 Tháng 2, Phường 11, Quận 10, TP.HCM',
    issueDate: '2019-02-20',
    notes: 'Test user 31'
  },
  {
    cccdNumber: '052099006002',
    phoneNumber: '0906666002',
    fullName: 'Quách Thị Tuyết',
    dateOfBirth: '1993-12-16',
    gender: 'Nữ',
    address: 'Số 101, Đường Sư Vạn Hạnh, Phường 12, Quận 10, TP.HCM',
    issueDate: '2021-07-12',
    notes: 'Test user 32'
  },
  {
    cccdNumber: '052099006003',
    phoneNumber: '0906666003',
    fullName: 'Tạ Văn Công',
    dateOfBirth: '1990-05-29',
    gender: 'Nam',
    address: 'Số 33, Đường Nguyễn Chí Thanh, Phường 9, Quận 5, TP.HCM',
    issueDate: '2020-10-25',
    notes: 'Test user 33'
  },
  {
    cccdNumber: '052099006004',
    phoneNumber: '0906666004',
    fullName: 'Ứng Thị Vân',
    dateOfBirth: '1988-11-12',
    gender: 'Nữ',
    address: 'Số 55, Đường Trần Hưng Đạo, Phường 2, Quận 5, TP.HCM',
    issueDate: '2019-05-30',
    notes: 'Test user 34'
  },
  {
    cccdNumber: '052099006005',
    phoneNumber: '0906666005',
    fullName: 'Xa Văn Hiếu',
    dateOfBirth: '1991-07-04',
    gender: 'Nam',
    address: 'Số 77, Đường Nguyễn Trãi, Phường 3, Quận 5, TP.HCM',
    issueDate: '2020-08-18',
    notes: 'Test user 35'
  }
];

async function seedPreVerifiedCCCD() {
  console.log('🌱 Starting pre-verified CCCD seed...\n');
  
  try {
    // Clear existing test data
    console.log('🧹 Cleaning existing test data...');
    await pool.query('DELETE FROM otp_codes');
    await pool.query('DELETE FROM pre_verified_cccd');
    console.log('✅ Test data cleaned\n');
    
    // Insert test CCCDs
    console.log('📝 Inserting test CCCD data...');
    
    for (const testCCCD of testCCCDs) {
      const cccdNumberHash = hashCCCDNumber(testCCCD.cccdNumber);
      
      // Determine initial status
      let status = 'pending';
      if (testCCCD.cccdNumber === '001099009999') {
        status = 'blacklisted'; // Blacklist test case
      }
      
      await pool.query(
        `INSERT INTO pre_verified_cccd 
         (cccd_number, cccd_number_hash, phone_number, full_name, date_of_birth, gender, 
          address, issue_date, status, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [
          testCCCD.cccdNumber,
          cccdNumberHash, 
          testCCCD.phoneNumber, 
          testCCCD.fullName,
          testCCCD.dateOfBirth,
          testCCCD.gender,
          testCCCD.address,
          testCCCD.issueDate,
          status, 
          testCCCD.notes
        ]
      );
      
      console.log(`✅ Added: ${testCCCD.cccdNumber} | ${testCCCD.phoneNumber} | Status: ${status}`);
      console.log(`   Hash: ${cccdNumberHash.slice(0, 20)}...`);
      console.log(`   Notes: ${testCCCD.notes}\n`);
    }
    
    // Verify insertion
    const result = await pool.query('SELECT COUNT(*) FROM pre_verified_cccd');
    console.log(`\n✅ Seed completed! Total records: ${result.rows[0].count}`);
    
    // Display summary
    console.log('\n📊 Summary by status:');
    const summary = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM pre_verified_cccd 
      GROUP BY status 
      ORDER BY status
    `);
    
    summary.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count}`);
    });
    
    console.log('\n🎯 Testing Instructions:');
    console.log('1. Use any CCCD number above with matching phone number');
    console.log('2. Call POST /api/verify/request-otp with cccdNumber + phoneNumber');
    console.log('3. Check backend console for OTP code (mock SMS)');
    console.log('4. Call POST /api/verify/confirm-otp with OTP');
    console.log('5. Receive verificationToken');
    console.log('6. Use token in POST /api/auth/register\n');
    
    console.log('📝 Example CCCD for QR code (pipe-separated format):');
    console.log(`${testCCCDs[0].cccdNumber}|001234567890||NGUYEN VAN TEST|01/01/1990|Nam|Ha Noi|01/01/2020\n`);
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run seed
seedPreVerifiedCCCD()
  .then(() => {
    console.log('✅ Seed script completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Seed script failed:', err);
    process.exit(1);
  });
