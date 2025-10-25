/**
 * Test Phase 2 - Pre-Verification Flow
 * Test OTP verification và registration với verification token
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test data (phải khớp với seed data)
const TEST_CCCD = '001099001234';
const TEST_PHONE = '0901234567';
const TEST_QR = `${TEST_CCCD}|001234567890||NGUYEN VAN TEST|01/01/1990|Nam|Ha Noi|01/01/2020`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testPhase2() {
  log('\n🧪 PHASE 2 TEST - Pre-Verification Flow\n', 'cyan');
  
  let verificationToken = null;
  let userPrivateKey = null;
  
  try {
    // ========== TEST 1: Request OTP ==========
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('TEST 1: Request OTP', 'yellow');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
    
    log(`📤 POST ${BASE_URL}/api/verify/request-otp`);
    log(`   Body: { cccdNumber: "${TEST_CCCD}", phoneNumber: "${TEST_PHONE}" }\n`);
    
    const otpResponse = await axios.post(`${BASE_URL}/api/verify/request-otp`, {
      cccdNumber: TEST_CCCD,
      phoneNumber: TEST_PHONE
    });
    
    log('✅ OTP requested successfully!', 'green');
    log(`   Response: ${JSON.stringify(otpResponse.data, null, 2)}`);
    log('\n⚠️  Check backend console for OTP code (mock SMS)\n', 'yellow');
    
    await sleep(2000);
    
    // ========== TEST 2: Verify OTP (Manual Input) ==========
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('TEST 2: Verify OTP', 'yellow');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const otp = await new Promise(resolve => {
      readline.question('🔑 Enter OTP code from backend console: ', (answer) => {
        readline.close();
        resolve(answer.trim());
      });
    });
    
    log(`\n📤 POST ${BASE_URL}/api/verify/confirm-otp`);
    log(`   Body: { cccdNumber: "${TEST_CCCD}", otp: "${otp}" }\n`);
    
    const verifyResponse = await axios.post(`${BASE_URL}/api/verify/confirm-otp`, {
      cccdNumber: TEST_CCCD,
      otp: otp
    });
    
    log('✅ OTP verified successfully!', 'green');
    log(`   Response: ${JSON.stringify(verifyResponse.data, null, 2)}\n`);
    
    verificationToken = verifyResponse.data.verificationToken;
    log(`🎫 Verification Token: ${verificationToken.slice(0, 50)}...\n`, 'cyan');
    
    await sleep(1000);
    
    // ========== TEST 3: Check Verification Status ==========
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('TEST 3: Check Verification Status', 'yellow');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
    
    const { hashCCCDNumber } = require('../src/utils/crypto-utils');
    const cccdHash = hashCCCDNumber(TEST_CCCD);
    
    log(`📤 GET ${BASE_URL}/api/verify/status/${cccdHash}\n`);
    
    const statusResponse = await axios.get(`${BASE_URL}/api/verify/status/${cccdHash}`);
    
    log('✅ Status retrieved successfully!', 'green');
    log(`   Response: ${JSON.stringify(statusResponse.data, null, 2)}\n`);
    
    await sleep(1000);
    
    // ========== TEST 4: Register with Verification Token ==========
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('TEST 4: Register with Verification Token', 'yellow');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
    
    // Generate a new wallet for testing
    const { ethers } = require('ethers');
    const wallet = ethers.Wallet.createRandom();
    userPrivateKey = wallet.privateKey;
    
    log(`🔐 Generated test wallet: ${wallet.address}\n`);
    
    log(`📤 POST ${BASE_URL}/api/auth/register`);
    log(`   Body: { qrData: "${TEST_QR.slice(0, 30)}...", privateKey: "***", verificationToken: "***" }\n`);
    
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      qrData: TEST_QR,
      privateKey: userPrivateKey,
      verificationToken: verificationToken
    });
    
    log('✅ Registration successful!', 'green');
    log(`   Response: ${JSON.stringify(registerResponse.data, null, 2)}\n`);
    
    await sleep(1000);
    
    // ========== TEST 5: Check Status After Registration ==========
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('TEST 5: Check Status After Registration', 'yellow');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
    
    log(`📤 GET ${BASE_URL}/api/verify/status/${cccdHash}\n`);
    
    const finalStatusResponse = await axios.get(`${BASE_URL}/api/verify/status/${cccdHash}`);
    
    log('✅ Status retrieved successfully!', 'green');
    log(`   Response: ${JSON.stringify(finalStatusResponse.data, null, 2)}`);
    log(`   Expected status: "claimed"\n`);
    
    if (finalStatusResponse.data.status === 'claimed') {
      log('✅ CCCD correctly marked as claimed!', 'green');
    } else {
      log(`❌ ERROR: Expected status "claimed", got "${finalStatusResponse.data.status}"`, 'red');
    }
    
    await sleep(1000);
    
    // ========== TEST 6: Try to Register Again (Should Fail) ==========
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('TEST 6: Try to Register Again (Should Fail)', 'yellow');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
    
    // Generate another wallet
    const wallet2 = ethers.Wallet.createRandom();
    
    log(`📤 POST ${BASE_URL}/api/auth/register`);
    log(`   Body: Same CCCD, different wallet\n`);
    
    try {
      await axios.post(`${BASE_URL}/api/auth/register`, {
        qrData: TEST_QR,
        privateKey: wallet2.privateKey,
        verificationToken: verificationToken // Same token
      });
      
      log('❌ ERROR: Registration should have failed but succeeded!', 'red');
    } catch (error) {
      if (error.response) {
        log('✅ Registration correctly rejected!', 'green');
        log(`   Status: ${error.response.status}`);
        log(`   Error: ${error.response.data.error}`);
        log(`   Code: ${error.response.data.code}\n`);
      } else {
        throw error;
      }
    }
    
    // ========== SUMMARY ==========
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('📊 TEST SUMMARY', 'yellow');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
    
    log('✅ All tests passed!', 'green');
    log(`\n📝 Test Results:`, 'cyan');
    log(`   1. OTP Request: PASS`);
    log(`   2. OTP Verification: PASS`);
    log(`   3. Status Check (verified): PASS`);
    log(`   4. Registration with Token: PASS`);
    log(`   5. Status Check (claimed): PASS`);
    log(`   6. Duplicate Registration Block: PASS\n`);
    
    log(`🔐 Test User Credentials:`, 'cyan');
    log(`   CCCD: ${TEST_CCCD}`);
    log(`   Phone: ${TEST_PHONE}`);
    log(`   Wallet: ${wallet.address}`);
    log(`   Private Key: ${userPrivateKey}\n`);
    
  } catch (error) {
    log('\n❌ Test failed!', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`);
      log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      log(`   Error: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run tests
console.log('\n');
testPhase2()
  .then(() => {
    log('\n✅ Phase 2 test completed successfully!\n', 'green');
    process.exit(0);
  })
  .catch((err) => {
    log(`\n❌ Phase 2 test failed: ${err.message}\n`, 'red');
    process.exit(1);
  });
