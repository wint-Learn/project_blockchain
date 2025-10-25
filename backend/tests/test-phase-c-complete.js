/**
 * Phase C Complete End-to-End Test
 * Tests full user journey: Verify → Register → Request Service → Admin Approve
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const BASE_URL = 'http://localhost:3000/api';

// Test data
const testData = {
  cccdNumber: '036202012345',
  phoneNumber: '0987654321',
  fullName: 'Nguyễn Văn Test',
  dateOfBirth: '1990-01-15',
  gender: 'Nam',
  address: '123 Test Street, Hanoi',
  issueDate: '2020-01-01',
  password: 'Test@123456',
  serviceId: 1, // Business license service
  otp: '', // Will be filled from console
  verificationToken: '',
  userAddress: '',
  adminToken: '',
  requestId: 0,
};

// Helper function to make HTTP requests
async function makeRequest(method, endpoint, data = null, headers = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  const text = await response.text();
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse response:', text);
    throw new Error(`Invalid JSON response: ${text}`);
  }
}

// Helper to wait for user input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Test steps
const tests = [
  {
    name: '1. Request OTP for CCCD verification',
    run: async () => {
      const response = await makeRequest('POST', '/verify/request-otp', {
        cccdNumber: testData.cccdNumber,
        phoneNumber: testData.phoneNumber,
      });

      if (response.success) {
        console.log('✅ OTP sent successfully');
        console.log('📱 Check console for OTP (in production: check SMS)');
        
        // In real test, OTP would be sent via SMS
        // For testing, we'll use the one printed in backend console
        testData.otp = await prompt('\n🔑 Enter OTP from backend console: ');
        return true;
      }
      
      throw new Error(response.message || 'Failed to send OTP');
    },
  },

  {
    name: '2. Verify OTP and get verification token',
    run: async () => {
      const response = await makeRequest('POST', '/verify/confirm-otp', {
        cccdNumber: testData.cccdNumber,
        otp: testData.otp.trim(),
      });

      if (response.success && response.verificationToken) {
        testData.verificationToken = response.verificationToken;
        console.log('✅ OTP verified, token received');
        console.log('🎫 Verification Token:', testData.verificationToken.substring(0, 50) + '...');
        return true;
      }

      throw new Error(response.message || 'Failed to verify OTP');
    },
  },

  {
    name: '3. Register DID with verification token',
    run: async () => {
      const response = await makeRequest('POST', '/auth/register', {
        cccdNumber: testData.cccdNumber,
        fullName: testData.fullName,
        dateOfBirth: testData.dateOfBirth,
        gender: testData.gender,
        address: testData.address,
        issueDate: testData.issueDate,
        password: testData.password,
        verificationToken: testData.verificationToken,
      });

      if (response.success && response.user) {
        testData.userAddress = response.user.address;
        console.log('✅ DID registered successfully');
        console.log('🏠 User Address:', testData.userAddress);
        return true;
      }

      throw new Error(response.message || 'Failed to register DID');
    },
  },

  {
    name: '4. Login and get token',
    run: async () => {
      const response = await makeRequest('POST', '/auth/login', {
        cccdNumber: testData.cccdNumber,
        password: testData.password,
      });

      if (response.success && response.user) {
        console.log('✅ Login successful');
        console.log('👤 User:', response.user.fullName);
        return true;
      }

      throw new Error(response.message || 'Failed to login');
    },
  },

  {
    name: '5. List available services',
    run: async () => {
      const response = await makeRequest('GET', '/services');

      if (response.success && response.services) {
        console.log(`✅ Found ${response.services.length} services`);
        response.services.forEach((service) => {
          console.log(`  - ${service.name} (ID: ${service.id})`);
        });
        return true;
      }

      throw new Error('Failed to list services');
    },
  },

  {
    name: '6. Request a service (Business License)',
    run: async () => {
      const response = await makeRequest('POST', `/services/${testData.serviceId}/request`, {
        userAddress: testData.userAddress,
        requestData: {
          businessName: 'Test Company Ltd',
          businessType: 'Software Development',
          registeredCapital: '1,000,000,000 VND',
        },
      });

      if (response.success && response.request) {
        testData.requestId = response.request.id;
        console.log('✅ Service requested successfully');
        console.log('📋 Request ID:', testData.requestId);
        return true;
      }

      throw new Error(response.message || 'Failed to request service');
    },
  },

  {
    name: '7. View user services (should show pending request)',
    run: async () => {
      const response = await makeRequest('GET', `/services/my-services?userAddress=${testData.userAddress}`);

      if (response.success && response.requests) {
        console.log(`✅ Found ${response.requests.length} service requests`);
        response.requests.forEach((req) => {
          console.log(`  - ${req.serviceName}: ${req.status}`);
        });
        return true;
      }

      throw new Error('Failed to get user services');
    },
  },

  {
    name: '8. Admin login',
    run: async () => {
      const response = await makeRequest('POST', '/admin/login', {
        username: 'admin',
        password: 'admin123',
      });

      if (response.success && response.token) {
        testData.adminToken = response.token;
        console.log('✅ Admin login successful');
        console.log('🔐 Admin Token:', testData.adminToken);
        return true;
      }

      throw new Error(response.message || 'Admin login failed');
    },
  },

  {
    name: '9. Admin view dashboard stats',
    run: async () => {
      const response = await makeRequest('GET', '/admin/stats', null, {
        Authorization: `Bearer ${testData.adminToken}`,
      });

      if (response.success && response.stats) {
        console.log('✅ Dashboard stats retrieved');
        console.log('📊 Total DIDs:', response.stats.totalDIDs);
        console.log('📊 Service Requests:', JSON.stringify(response.stats.serviceRequests));
        return true;
      }

      throw new Error('Failed to get dashboard stats');
    },
  },

  {
    name: '10. Admin approve service request',
    run: async () => {
      const response = await makeRequest(
        'PUT',
        `/services/admin/requests/${testData.requestId}/approve`,
        {
          adminNotes: 'Hồ sơ hợp lệ, đã duyệt',
        },
        {
          Authorization: `Bearer ${testData.adminToken}`,
        }
      );

      if (response.success) {
        console.log('✅ Service request approved');
        return true;
      }

      throw new Error(response.message || 'Failed to approve request');
    },
  },

  {
    name: '11. Verify service status changed to approved',
    run: async () => {
      const response = await makeRequest('GET', `/services/my-services?userAddress=${testData.userAddress}`);

      if (response.success && response.requests) {
        const approvedRequest = response.requests.find((req) => req.id === testData.requestId);
        
        if (approvedRequest && approvedRequest.status === 'approved') {
          console.log('✅ Service status confirmed: APPROVED');
          console.log('📝 Admin notes:', approvedRequest.adminNotes);
          return true;
        }

        throw new Error('Service status not updated to approved');
      }

      throw new Error('Failed to verify service status');
    },
  },
];

// Run all tests
async function runTests() {
  console.log('🚀 Phase C Complete End-to-End Test\n');
  console.log('⚠️  Make sure:');
  console.log('   - Backend is running on http://localhost:3000');
  console.log('   - Database has pre-verified CCCD: 036202012345');
  console.log('   - Service ID 1 exists (Business License)\n');

  const proceed = await prompt('Press ENTER to start tests... ');

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST ${i + 1}/${tests.length}: ${test.name}`);
    console.log('='.repeat(60));

    try {
      await test.run();
      passed++;
    } catch (error) {
      console.error('❌ FAILED:', error.message);
      failed++;
      
      const continueTests = await prompt('\nContinue with remaining tests? (y/n): ');
      if (continueTests.toLowerCase() !== 'y') {
        break;
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}/${tests.length}`);
  console.log(`❌ Failed: ${failed}/${tests.length}`);
  console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  
  if (passed === tests.length) {
    console.log('\n🎉 ALL TESTS PASSED! Phase C implementation is complete!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review and fix issues.');
  }

  rl.close();
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Test runner error:', error);
  rl.close();
  process.exit(1);
});
