#!/usr/bin/env node
/**
 * Interactive script to add CCCD to pre_verified_cccd table
 * Usage: node scripts/add-cccd-interactive.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const crypto = require('crypto');
const readline = require('readline');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:1@localhost:5432/identity_db'
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function addCCCD() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('📝 THÊM CCCD VÀO HỆ THỐNG');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // 1. Input CCCD info
    const cccdNumber = await question('1️⃣  Số CCCD (12 số): ');
    if (!/^\d{12}$/.test(cccdNumber)) {
      console.log('❌ CCCD phải có đúng 12 chữ số!');
      process.exit(1);
    }

    const phoneNumber = await question('2️⃣  Số điện thoại: ');
    if (!/^0\d{9,10}$/.test(phoneNumber)) {
      console.log('❌ Số điện thoại không hợp lệ!');
      process.exit(1);
    }

    const fullName = await question('3️⃣  Họ và tên: ');
    const dateOfBirth = await question('4️⃣  Ngày sinh (YYYY-MM-DD): ');
    const gender = await question('5️⃣  Giới tính (Nam/Nữ): ');
    const address = await question('6️⃣  Địa chỉ: ');
    const issueDate = await question('7️⃣  Ngày cấp (YYYY-MM-DD): ');
    const placeOfOrigin = await question('8️⃣  Quê quán (optional): ');
    const placeOfResidence = await question('9️⃣  Nơi thường trú (optional): ');

    // 2. Calculate hash (SHA256)
    const cccdHash = '0x' + crypto.createHash('sha256').update(cccdNumber).digest('hex');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 XÁC NHẬN THÔNG TIN');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`CCCD:           ${cccdNumber}`);
    console.log(`CCCD Hash:      ${cccdHash.substring(0, 20)}...`);
    console.log(`Phone:          ${phoneNumber}`);
    console.log(`Họ tên:         ${fullName}`);
    console.log(`Ngày sinh:      ${dateOfBirth}`);
    console.log(`Giới tính:      ${gender}`);
    console.log(`Địa chỉ:        ${address}`);
    console.log(`Ngày cấp:       ${issueDate}`);
    console.log(`Quê quán:       ${placeOfOrigin || '(trống)'}`);
    console.log(`Nơi thường trú: ${placeOfResidence || '(trống)'}`);
    console.log('═══════════════════════════════════════════════════════\n');

    const confirm = await question('⚠️  Xác nhận thêm vào database? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Đã hủy!');
      process.exit(0);
    }

    // 3. Check if exists
    const checkResult = await pool.query(
      'SELECT id, status FROM pre_verified_cccd WHERE cccd_number_hash = $1',
      [cccdHash]
    );

    if (checkResult.rows.length > 0) {
      console.log(`\n⚠️  CCCD đã tồn tại (ID: ${checkResult.rows[0].id}, Status: ${checkResult.rows[0].status})`);
      const update = await question('Cập nhật thông tin? (yes/no): ');
      
      if (update.toLowerCase() === 'yes') {
        await pool.query(`
          UPDATE pre_verified_cccd
          SET
            phone_number = $1,
            full_name = $2,
            date_of_birth = $3,
            gender = $4,
            address = $5,
            issue_date = $6,
            place_of_origin = $7,
            place_of_residence = $8,
            updated_at = NOW()
          WHERE cccd_number_hash = $9
        `, [
          phoneNumber,
          fullName,
          dateOfBirth,
          gender,
          address,
          issueDate,
          placeOfOrigin || null,
          placeOfResidence || null,
          cccdHash
        ]);
        
        console.log('✅ Đã cập nhật thông tin!');
      } else {
        console.log('❌ Đã hủy!');
      }
    } else {
      // 4. Insert new record
      await pool.query(`
        INSERT INTO pre_verified_cccd (
          cccd_number_hash,
          phone_number,
          status,
          full_name,
          date_of_birth,
          gender,
          address,
          issue_date,
          place_of_origin,
          place_of_residence,
          notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        cccdHash,
        phoneNumber,
        'pending',
        fullName,
        dateOfBirth,
        gender,
        address,
        issueDate,
        placeOfOrigin || null,
        placeOfResidence || null,
        `Added via interactive script at ${new Date().toISOString()}`
      ]);

      console.log('\n✅ Đã thêm CCCD thành công!');
    }

    // 5. Display result
    const result = await pool.query(`
      SELECT 
        id, 
        phone_number, 
        full_name, 
        status,
        LEFT(cccd_number_hash, 20) as hash_prefix
      FROM pre_verified_cccd 
      WHERE cccd_number_hash = $1
    `, [cccdHash]);

    console.log('\n📊 Thông tin trong database:');
    console.table(result.rows);

    console.log('\n🎯 Test với:');
    console.log(`   CCCD: ${cccdNumber}`);
    console.log(`   Phone: ${phoneNumber}`);
    console.log(`   URL: http://localhost:5173/verify`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
    await pool.end();
  }
}

addCCCD();
