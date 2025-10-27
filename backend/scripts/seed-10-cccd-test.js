/**
 * Seed 10 CCCD mẫu mới để test đăng ký
 */

require('dotenv').config();
const { Pool } = require('pg');
const { hashCCCDNumber } = require('../src/utils/crypto-utils');

// 30 CCCD mẫu với thông tin đầy đủ
const testCCCDs = [
  { cccd: '036202012347', phone: '0901234569', fullName: 'Trần Văn C', dob: '1992-03-15', gender: 'Nam', address: 'Số 123 Đường Lê Lợi, Quận 1, TP.HCM', issueDate: '2021-05-20' },
  { cccd: '036202012348', phone: '0901234570', fullName: 'Nguyễn Thị D', dob: '1993-07-21', gender: 'Nữ', address: 'Số 456 Đường Trần Hưng Đạo, Quận 5, TP.HCM', issueDate: '2021-06-14' },
  { cccd: '036202012349', phone: '0901234571', fullName: 'Lê Văn E', dob: '1994-11-07', gender: 'Nam', address: 'Số 789 Đường Nguyễn Trãi, Quận 3, TP.HCM', issueDate: '2021-08-09' },
  { cccd: '036202012350', phone: '0901234572', fullName: 'Phạm Thị F', dob: '1995-02-13', gender: 'Nữ', address: 'Số 321 Đường Pasteur, Quận 1, TP.HCM', issueDate: '2021-09-24' },
  { cccd: '036202012351', phone: '0901234573', fullName: 'Hoàng Văn G', dob: '1996-05-29', gender: 'Nam', address: 'Số 654 Đường Võ Văn Tần, Quận 3, TP.HCM', issueDate: '2021-10-11' },
  { cccd: '036202012352', phone: '0901234574', fullName: 'Vũ Thị H', dob: '1997-09-17', gender: 'Nữ', address: 'Số 987 Đường Hai Bà Trưng, Quận 1, TP.HCM', issueDate: '2021-11-04' },
  { cccd: '036202012353', phone: '0901234575', fullName: 'Đặng Văn I', dob: '1998-12-24', gender: 'Nam', address: 'Số 147 Đường Điện Biên Phủ, Quận Bình Thạnh, TP.HCM', issueDate: '2022-01-14' },
  { cccd: '036202012354', phone: '0901234576', fullName: 'Bùi Thị K', dob: '1999-04-09', gender: 'Nữ', address: 'Số 258 Đường Cách Mạng Tháng 8, Quận 10, TP.HCM', issueDate: '2022-02-19' },
  { cccd: '036202012355', phone: '0901234577', fullName: 'Dương Văn L', dob: '2000-08-04', gender: 'Nam', address: 'Số 369 Đường Lý Thường Kiệt, Quận 11, TP.HCM', issueDate: '2022-03-17' },
  { cccd: '036202012356', phone: '0901234578', fullName: 'Phan Thị M', dob: '2001-06-11', gender: 'Nữ', address: 'Số 753 Đường Nguyễn Thị Minh Khai, Quận 3, TP.HCM', issueDate: '2022-04-21' },
  
  // 🆕 20 CCCD mới
  { cccd: '036202012357', phone: '0901234579', fullName: 'Võ Văn N', dob: '1991-01-15', gender: 'Nam', address: 'Số 111 Đường Cộng Hòa, Quận Tân Bình, TP.HCM', issueDate: '2022-05-10' },
  { cccd: '036202012358', phone: '0901234580', fullName: 'Mai Thị O', dob: '1992-02-20', gender: 'Nữ', address: 'Số 222 Đường Phan Văn Trị, Quận Gò Vấp, TP.HCM', issueDate: '2022-06-15' },
  { cccd: '036202012359', phone: '0901234581', fullName: 'Trịnh Văn P', dob: '1993-03-25', gender: 'Nam', address: 'Số 333 Đường Nguyễn Văn Linh, Quận 7, TP.HCM', issueDate: '2022-07-20' },
  { cccd: '036202012360', phone: '0901234582', fullName: 'Lý Thị Q', dob: '1994-04-30', gender: 'Nữ', address: 'Số 444 Đường Võ Thị Sáu, Quận 3, TP.HCM', issueDate: '2022-08-25' },
  { cccd: '036202012361', phone: '0901234583', fullName: 'Đinh Văn R', dob: '1995-05-05', gender: 'Nam', address: 'Số 555 Đường Lê Văn Sỹ, Quận Phú Nhuận, TP.HCM', issueDate: '2022-09-30' },
  { cccd: '036202012362', phone: '0901234584', fullName: 'Tô Thị S', dob: '1996-06-10', gender: 'Nữ', address: 'Số 666 Đường Nguyễn Đình Chiểu, Quận 1, TP.HCM', issueDate: '2022-10-05' },
  { cccd: '036202012363', phone: '0901234585', fullName: 'Hồ Văn T', dob: '1997-07-15', gender: 'Nam', address: 'Số 777 Đường Hoàng Văn Thụ, Quận Tân Bình, TP.HCM', issueDate: '2022-11-10' },
  { cccd: '036202012364', phone: '0901234586', fullName: 'Đỗ Thị U', dob: '1998-08-20', gender: 'Nữ', address: 'Số 888 Đường Nam Kỳ Khởi Nghĩa, Quận 1, TP.HCM', issueDate: '2022-12-15' },
  { cccd: '036202012365', phone: '0901234587', fullName: 'Đoàn Văn V', dob: '1999-09-25', gender: 'Nam', address: 'Số 999 Đường Xô Viết Nghệ Tĩnh, Quận Bình Thạnh, TP.HCM', issueDate: '2023-01-20' },
  { cccd: '036202012366', phone: '0901234588', fullName: 'Cao Thị W', dob: '2000-10-30', gender: 'Nữ', address: 'Số 101 Đường Trường Chinh, Quận 12, TP.HCM', issueDate: '2023-02-25' },
  
  { cccd: '036202012367', phone: '0901234589', fullName: 'Tăng Văn X', dob: '1990-11-11', gender: 'Nam', address: 'Số 202 Đường Lạc Long Quân, Quận 11, TP.HCM', issueDate: '2023-03-30' },
  { cccd: '036202012368', phone: '0901234590', fullName: 'Lương Thị Y', dob: '1991-12-16', gender: 'Nữ', address: 'Số 303 Đường Âu Cơ, Quận Tân Phú, TP.HCM', issueDate: '2023-04-05' },
  { cccd: '036202012369', phone: '0901234591', fullName: 'Hà Văn Z', dob: '1992-01-21', gender: 'Nam', address: 'Số 404 Đường Phạm Văn Đồng, Quận Thủ Đức, TP.HCM', issueDate: '2023-05-10' },
  { cccd: '036202012370', phone: '0901234592', fullName: 'Ngô Thị AA', dob: '1993-02-26', gender: 'Nữ', address: 'Số 505 Đường Quang Trung, Quận Gò Vấp, TP.HCM', issueDate: '2023-06-15' },
  { cccd: '036202012371', phone: '0901234593', fullName: 'Dương Văn BB', dob: '1994-03-31', gender: 'Nam', address: 'Số 606 Đường Kha Vạn Cân, Quận Thủ Đức, TP.HCM', issueDate: '2023-07-20' },
  { cccd: '036202012372', phone: '0901234594', fullName: 'Ong Thị CC', dob: '1995-04-05', gender: 'Nữ', address: 'Số 707 Đường Tô Hiến Thành, Quận 10, TP.HCM', issueDate: '2023-08-25' },
  { cccd: '036202012373', phone: '0901234595', fullName: 'La Văn DD', dob: '1996-05-10', gender: 'Nam', address: 'Số 808 Đường Lý Chính Thắng, Quận 3, TP.HCM', issueDate: '2023-09-30' },
  { cccd: '036202012374', phone: '0901234596', fullName: 'Từ Thị EE', dob: '1997-06-15', gender: 'Nữ', address: 'Số 909 Đường Nguyễn Thái Học, Quận 1, TP.HCM', issueDate: '2023-10-05' },
  { cccd: '036202012375', phone: '0901234597', fullName: 'Sử Văn FF', dob: '1998-07-20', gender: 'Nam', address: 'Số 110 Đường Bà Huyện Thanh Quan, Quận 3, TP.HCM', issueDate: '2023-11-10' },
  { cccd: '036202012376', phone: '0901234598', fullName: 'An Thị GG', dob: '1999-08-25', gender: 'Nữ', address: 'Số 220 Đường Tôn Thất Tùng, Quận 1, TP.HCM', issueDate: '2023-12-15' }
];

async function seedCCCDs() {
  const pool = new Pool({ connectionString: process.env.DB_CONNECTION_STRING });

  try {
    console.log('🌱 Seeding 30 CCCD mẫu...\n');
    let inserted = 0, skipped = 0;

    for (const r of testCCCDs) {
      const hash = hashCCCDNumber(r.cccd);
      const existing = await pool.query('SELECT id FROM pre_verified_cccd WHERE cccd_number = $1 OR cccd_number_hash = $2', [r.cccd, hash]);
      
      if (existing.rows.length > 0) {
        console.log(`⏭️  ${r.cccd} - ${r.fullName}: Already exists`);
        skipped++;
        continue;
      }

      await pool.query(
        `INSERT INTO pre_verified_cccd (cccd_number, cccd_number_hash, phone_number, full_name, date_of_birth, gender, address, issue_date, status, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW(), NOW())`,
        [r.cccd, hash, r.phone, r.fullName, r.dob, r.gender, r.address, r.issueDate]
      );
      console.log(`✅ ${r.cccd} - ${r.fullName}`);
      inserted++;
    }

    console.log(`\n📊 Inserted: ${inserted} | Skipped: ${skipped} | Total: ${testCCCDs.length}\n`);
    
    const all = await pool.query('SELECT id, cccd_number, full_name, phone_number, status FROM pre_verified_cccd ORDER BY id');
    console.log('📋 All CCCDs:');
    all.rows.forEach((r, i) => console.log(`   ${i+1}. ${r.cccd_number} | ${r.full_name} | ${r.phone_number} | ${r.status}`));
    
    console.log('\n✅ Ready to test! Pick any CCCD above to register.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

seedCCCDs();
