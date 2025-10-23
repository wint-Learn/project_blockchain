// test-flow.js - Demo flow: Register → Login → Check logs
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Wallet } = require('ethers');

const API_BASE = 'http://localhost:3000';

// CCCD data mẫu (giả lập)
const SAMPLE_CCCD = {
  cccd_number: "001234567890",
  name: "NGUYEN VAN A",
  dob: "1990-01-15",
  address: "123 Nguyen Hue, Q1, TPHCM",
  issued_date: "2020-01-01"
};

async function testFlow() {
  console.log('🚀 BẮT ĐẦU TEST FLOW\n');
  
  // 1) Tạo ví test
  const wallet = Wallet.createRandom();
  console.log('👛 Ví test được tạo:');
  console.log(`   Address: ${wallet.address}`);
  console.log(`   Private Key: ${wallet.privateKey}\n`);
  
  // Lưu ý: Ví này chưa có MATIC, không thể gửi tx thật
  // Để test register thật, dùng private key có MATIC Amoy
  
  console.log('⚠️  LƯU Ý: Ví mới tạo chưa có MATIC Amoy');
  console.log('   Để test register thật, thay privateKey bằng ví có MATIC\n');
  
  // 2) Test register (sẽ fail vì không có MATIC, nhưng xem được flow)
  console.log('📝 BƯỚC 1: REGISTER DID');
  console.log('   CCCD Data:', JSON.stringify(SAMPLE_CCCD, null, 2));
  console.log('\n   Lệnh PowerShell để test (thay PRIVATE_KEY):');
  console.log(`
$cccdData = @{
  cccd_number = "001234567890"
  name = "NGUYEN VAN A"
  dob = "1990-01-15"
  address = "123 Nguyen Hue, Q1, TPHCM"
  issued_date = "2020-01-01"
} | ConvertTo-Json

$body = @{
  cccdData = ($cccdData | ConvertFrom-Json)
  privateKey = "YOUR_PRIVATE_KEY_WITH_MATIC"
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method POST http://localhost:3000/api/register \`
  -ContentType "application/json" -Body $body
  `);
  
  // 3) Ký message cho login
  console.log('\n\n🔐 BƯỚC 2: KÝ MESSAGE ĐỂ LOGIN');
  const message = "Login at " + new Date().toISOString();
  const signature = await wallet.signMessage(message);
  
  console.log(`   Message: ${message}`);
  console.log(`   Signature: ${signature}`);
  
  console.log('\n   Lệnh PowerShell để login (sau khi register):');
  console.log(`
$cccdData = @{
  cccd_number = "001234567890"
  name = "NGUYEN VAN A"
  dob = "1990-01-15"
  address = "123 Nguyen Hue, Q1, TPHCM"
  issued_date = "2020-01-01"
}

$loginBody = @{
  address = "${wallet.address}"
  cccdData = $cccdData
  message = "${message}"
  signature = "${signature}"
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method POST http://localhost:3000/api/login \`
  -ContentType "application/json" -Body $loginBody
  `);
  
  // 4) Xem logs
  console.log('\n\n📊 BƯỚC 3: XEM LOGS');
  console.log(`   Lệnh PowerShell:`);
  console.log(`
# Xem tất cả logs
Invoke-RestMethod -Method GET "http://localhost:3000/api/logs?limit=10"

# Xem logs của 1 address
Invoke-RestMethod -Method GET "http://localhost:3000/api/logs?address=${wallet.address}"
  `);
  
  console.log('\n\n✅ TEST FLOW HOÀN TẤT!');
  console.log('\n💡 HƯỚNG DẪN THỰC TẾ:');
  console.log('   1. Dùng private key CÓ MATIC Amoy để register');
  console.log('   2. Sau khi register, dùng cùng ví đó để login');
  console.log('   3. Thử đăng nhập nhiều lần để trigger anomaly detection');
  console.log('   4. Xem logs qua API /api/logs\n');
}

testFlow().catch(console.error);
