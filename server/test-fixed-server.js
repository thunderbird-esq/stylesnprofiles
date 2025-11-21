#!/usr/bin/env node

/**
 * Test script to verify that all API endpoints work without crashing
 * This script validates the fixes applied to the enhanced-server.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

const testEndpoint = async (method, url, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);

    return {
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      error: error.response?.data || error.message,
    };
  }
};

const runTests = async () => {
  console.log('🧪 Testing Enhanced Server API Endpoints...\n');

  const tests = [
    {
      name: 'Health Check',
      method: 'GET',
      url: '/health',
      expectedStatus: 200,
    },
    {
      name: 'APOD Endpoint (Public)',
      method: 'GET',
      url: '/api/v1/nasa/apod',
      expectedStatus: 200,
    },
    {
      name: 'Search Endpoint',
      method: 'GET',
      url: '/api/v1/search?q=mars',
      expectedStatus: 200,
    },
    {
      name: 'Protected Profile (No Auth)',
      method: 'GET',
      url: '/api/v1/users/profile',
      expectedStatus: 401,
    },
    {
      name: 'Registration Validation (Invalid)',
      method: 'POST',
      url: '/api/v1/auth/register',
      data: { email: 'invalid', password: '123' },
      expectedStatus: 400,
    },
    {
      name: 'Login Validation (Invalid)',
      method: 'POST',
      url: '/api/v1/auth/login',
      data: { email: 'invalid-email' },
      expectedStatus: 400,
    },
    {
      name: 'Protected NASA Endpoint (No Auth)',
      method: 'GET',
      url: '/api/v1/nasa/neo/browse',
      expectedStatus: 401,
    },
    {
      name: '404 Handling',
      method: 'GET',
      url: '/api/v1/nonexistent',
      expectedStatus: 404,
    },
    {
      name: 'Mars Photos Validation (Invalid Rover)',
      method: 'GET',
      url: '/api/v1/nasa/mars/photos/invalidrover',
      expectedStatus: 401, // Will fail auth first
    },
    {
      name: 'Favorites (No Auth)',
      method: 'GET',
      url: '/api/v1/users/favorites',
      expectedStatus: 401,
    },
    {
      name: 'Collections (No Auth)',
      method: 'GET',
      url: '/api/v1/users/collections',
      expectedStatus: 401,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`🔍 Testing: ${test.name}`);

    try {
      const result = await testEndpoint(test.method, test.url, test.data);

      if (result.status === test.expectedStatus) {
        console.log(`✅ PASSED - Status: ${result.status}`);
        passed++;
      } else {
        console.log(`❌ FAILED - Expected: ${test.expectedStatus}, Got: ${result.status}`);
        if (!result.success) {
          console.log(`   Error: ${JSON.stringify(result.error, null, 2)}`);
        }
        failed++;
      }
    } catch (error) {
      console.log(`💥 CRASHED - ${error.message}`);
      failed++;
    }

    console.log(''); // Empty line for readability
  }

  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Server is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some tests failed. Please check the server configuration.');
    process.exit(1);
  }
};

// Check if server is running first
const checkServer = async () => {
  try {
    await axios.get(`${BASE_URL}/health`);
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first:');
    console.log('   PORT=3002 node enhanced-server.js');
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
};

const main = async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }

  await runTests();
};

main().catch(console.error);