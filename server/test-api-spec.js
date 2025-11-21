/**
 * API Specification Validation Script
 *
 * This script tests the OpenAPI specification against the actual API endpoints
 * to ensure documentation accuracy and functionality.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'http://localhost:3001';
const LEGACY_API_URL = 'http://localhost:3001/api';
const OPENAPI_FILE = path.join(__dirname, 'openapi.yaml');

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: [],
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

/**
 * Log test result with color
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Execute API test
 */
async function testApi(name, method, url, data = null, expectedStatus = 200, description = '') {
  testResults.total++;

  try {
    log(`\n🧪 Testing: ${name}`, 'blue');
    if (description) log(`   Description: ${description}`, 'blue');
    log(`   ${method.toUpperCase()} ${url}`, 'blue');

    const config = {
      method,
      url,
      timeout: 10000,
      validateStatus: () => true, // Don't throw on any status code
    };

    if (data) {
      config.data = data;
      config.headers = { 'Content-Type': 'application/json' };
    }

    const startTime = Date.now();
    const response = await axios(config);
    const endTime = Date.now();

    const success = response.status === expectedStatus;

    if (success) {
      testResults.passed++;
      log(`   ✅ PASSED (${response.status}) - ${endTime - startTime}ms`, 'green');

      // Log response structure
      if (response.data) {
        const hasSuccess = 'success' in response.data;
        const hasData = 'data' in response.data;
        const hasError = 'error' in response.data;

        log(`   📊 Response structure: success:${hasSuccess} data:${hasData} error:${hasError}`, 'blue');
      }
    } else {
      testResults.failed++;
      log(`   ❌ FAILED - Expected ${expectedStatus}, got ${response.status}`, 'red');
      log(`   Response: ${JSON.stringify(response.data, null, 2)}`, 'red');
    }

    testResults.details.push({
      name,
      method,
      url,
      expectedStatus,
      actualStatus: response.status,
      success,
      responseTime: endTime - startTime,
      description,
    });

    return { success, response };

  } catch (error) {
    testResults.failed++;
    log(`   ❌ ERROR - ${error.message}`, 'red');

    testResults.details.push({
      name,
      method,
      url,
      expectedStatus,
      actualStatus: 'ERROR',
      success: false,
      error: error.message,
      description,
    });

    return { success: false, error };
  }
}

/**
 * Test NASA API Proxy endpoints
 */
async function testNasaApiProxy() {
  log('\n🚀 Testing NASA API Proxy Endpoints', 'yellow');

  // Test APOD endpoint
  await testApi(
    'NASA APOD via Proxy',
    'GET',
    `${LEGACY_API_URL}/nasa/planetary/apod`,
    null,
    200,
    'Get Astronomy Picture of the Day through proxy',
  );

  // Test APOD with date
  await testApi(
    'NASA APOD with Date',
    'GET',
    `${LEGACY_API_URL}/nasa/planetary/apod?date=2024-01-01`,
    null,
    200,
    'Get APOD for specific date',
  );

  // Test NEO browse
  await testApi(
    'NASA NEO Browse',
    'GET',
    `${LEGACY_API_URL}/nasa/neo/rest/v1/neo/browse?page=0&size=5`,
    null,
    200,
    'Browse Near Earth Objects',
  );

  // Test Mars Rover photos
  await testApi(
    'NASA Mars Photos',
    'GET',
    `${LEGACY_API_URL}/nasa/mars-photos/api/v1/rovers/curiosity/photos?sol=1000&page=1`,
    null,
    200,
    'Get Mars Rover photos',
  );

  // Test invalid endpoint
  await testApi(
    'Invalid NASA Endpoint',
    'GET',
    `${LEGACY_API_URL}/nasa/invalid/endpoint`,
    null,
    404,
    'Test error handling for invalid endpoints',
  );
}

/**
 * Test Resource Navigator endpoints
 */
async function testResourceNavigator() {
  log('\n📚 Testing Resource Navigator Endpoints', 'yellow');

  // Test getting saved items
  await testApi(
    'Get Saved Items',
    'GET',
    `${LEGACY_API_URL}/resources/saved`,
    null,
    200,
    'Retrieve all saved items',
  );

  // Test getting saved items with filters
  await testApi(
    'Get Saved Items with Filters',
    'GET',
    `${LEGACY_API_URL}/resources/saved?type=APOD&limit=10&offset=0`,
    null,
    200,
    'Retrieve saved items with type filter and pagination',
  );

  // Test saving a new item
  const testItem = {
    id: `test-item-${Date.now()}`,
    type: 'APOD',
    title: 'Test Galaxy Image',
    url: 'https://apod.nasa.gov/apod/image/2401/test.jpg',
    category: 'astronomy',
    description: 'A test image for API validation',
  };

  await testApi(
    'Save New Item',
    'POST',
    `${LEGACY_API_URL}/resources/saved`,
    testItem,
    201,
    'Create a new saved item',
  );

  // Test saving search query
  const searchQuery = {
    query_string: 'test mars rover images',
  };

  await testApi(
    'Save Search Query',
    'POST',
    `${LEGACY_API_URL}/resources/search`,
    searchQuery,
    201,
    'Log a search query for analytics',
  );

  // Test validation error
  await testApi(
    'Invalid Saved Item',
    'POST',
    `${LEGACY_API_URL}/resources/saved`,
    { invalid: 'data' },
    400,
    'Test validation with invalid data',
  );
}

/**
 * Test Version 1 API endpoints
 */
async function testVersion1Api() {
  log('\n🔢 Testing Version 1 API Endpoints', 'yellow');

  // Test v1 APOD endpoint
  await testApi(
    'V1 NASA APOD',
    'GET',
    `${API_BASE_URL}/api/v1/nasa/apod`,
    null,
    200,
    'Get APOD through versioned API',
  );

  // Test v1 NEO browse
  await testApi(
    'V1 NASA NEO Browse',
    'GET',
    `${API_BASE_URL}/api/v1/nasa/neo/browse?page=0&size=5`,
    null,
    200,
    'Browse NEOs through versioned API',
  );
}

/**
 * Test System endpoints
 */
async function testSystemEndpoints() {
  log('\n🏥 Testing System Endpoints', 'yellow');

  // Test health check
  await testApi(
    'Health Check',
    'GET',
    `${API_BASE_URL}/health`,
    null,
    200,
    'Basic health check endpoint',
  );

  // Test not implemented endpoints
  const notImplementedEndpoints = [
    { method: 'POST', url: `${API_BASE_URL}/api/v1/auth/login`, data: { email: 'test@test.com', password: 'test' } },
    {
      method: 'POST',
      url: `${API_BASE_URL}/api/v1/auth/register`,
      data: { email: 'test@test.com', password: 'test123', username: 'test' },
    },
    { method: 'GET', url: `${API_BASE_URL}/api/v1/users/profile` },
    { method: 'GET', url: `${API_BASE_URL}/api/v1/users/favorites` },
    { method: 'GET', url: `${API_BASE_URL}/api/v1/search?q=test` },
  ];

  for (const endpoint of notImplementedEndpoints) {
    await testApi(
      `Not Implemented: ${endpoint.method} ${endpoint.url.split('/').pop()}`,
      endpoint.method,
      endpoint.url,
      endpoint.data || null,
      501,
      'Endpoint should return 501 Not Implemented',
    );
  }
}

/**
 * Validate OpenAPI specification file
 */
function validateOpenApiSpec() {
  log('\n📋 Validating OpenAPI Specification File', 'yellow');

  try {
    const specContent = fs.readFileSync(OPENAPI_FILE, 'utf8');

    // Basic validation checks
    const hasInfo = specContent.includes('info:');
    const hasPaths = specContent.includes('paths:');
    const hasComponents = specContent.includes('components:');
    const hasServers = specContent.includes('servers:');

    if (hasInfo && hasPaths && hasComponents && hasServers) {
      log('   ✅ OpenAPI file structure is valid', 'green');
      testResults.passed++;
    } else {
      log('   ❌ OpenAPI file structure is invalid', 'red');
      testResults.failed++;
    }

    testResults.total++;

    // Count documented endpoints
    const pathMatches = specContent.match(/^\s*\/\w+:$/gm);
    const endpointCount = pathMatches ? pathMatches.length : 0;
    log(`   📊 Found ${endpointCount} documented paths in OpenAPI spec`, 'blue');

  } catch (error) {
    log(`   ❌ Error reading OpenAPI file: ${error.message}`, 'red');
    testResults.failed++;
    testResults.total++;
  }
}

/**
 * Print test summary
 */
function printSummary() {
  log(`\n${'='.repeat(60)}`, 'blue');
  log('📊 API SPECIFICATION VALIDATION SUMMARY', 'blue');
  log('='.repeat(60), 'blue');

  log(`Total Tests: ${testResults.total}`, 'blue');
  log(`✅ Passed: ${testResults.passed}`, 'green');
  log(`❌ Failed: ${testResults.failed}`, 'red');

  const successRate = testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(1) : 0;
  log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');

  if (testResults.failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    testResults.details
      .filter(test => !test.success)
      .forEach(test => {
        log(`   • ${test.name} - ${test.error || `Expected ${test.expectedStatus}, got ${test.actualStatus}`}`, 'red');
      });
  }

  log('\n📝 Test Details:', 'blue');
  testResults.details.forEach(test => {
    const status = test.success ? '✅' : '❌';
    const time = test.responseTime || 'N/A';
    log(`   ${status} ${test.name} (${test.method} ${test.url.split('/').pop()}) - ${time}ms`, 'blue');
  });

  log('\n🔗 API Documentation URLs:', 'blue');
  log('   • Swagger UI: http://localhost:3001/api-docs', 'blue');
  log('   • Health Check: http://localhost:3001/health', 'blue');

  log(`\n${'='.repeat(60)}`, 'blue');
}

/**
 * Main test execution
 */
async function runTests() {
  log('🚀 Starting NASA System 6 Portal API Validation', 'yellow');
  log(`   Target Server: ${API_BASE_URL}`, 'blue');
  log(`   OpenAPI Spec: ${OPENAPI_FILE}`, 'blue');

  // Check if server is running
  try {
    await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    log('   ✅ Server is running', 'green');
  } catch (error) {
    log('   ❌ Server is not running or not accessible', 'red');
    log('   Please start the server with: npm start', 'yellow');
    log(`   Error: ${error.message}`, 'red');
    process.exit(1);
  }

  // Run all test suites
  validateOpenApiSpec();
  await testSystemEndpoints();
  await testNasaApiProxy();
  await testResourceNavigator();
  await testVersion1Api();

  // Print final summary
  printSummary();

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n\n⚠️  Tests interrupted by user', 'yellow');
  printSummary();
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    log(`\n❌ Unexpected error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runTests, testApi, testResults };