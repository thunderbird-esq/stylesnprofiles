#!/usr/bin/env node

/**
 * Real API Test Script
 *
 * This script tests the actual NASA API connectivity to verify that
 * the core functionality is working correctly. It runs outside of Jest
 * to avoid CORS restrictions in the testing environment.
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

// Test data for logging
const testResults = {
  serverHealth: false,
  apodApi: false,
  proxyWorking: false,
  error: null,
};

async function testServerHealth() {
  try {
    console.log('🔍 Testing server health...');
    const response = await axios.get(`${API_BASE_URL}/health`);

    if (response.status === 200) {
      console.log('✅ Server is healthy:', response.data);
      testResults.serverHealth = true;
      return true;
    }
    throw new Error(`Health check returned status: ${response.status}`);
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    testResults.error = error.message;
    return false;
  }
}

async function testApodApi() {
  try {
    console.log('🔍 Testing NASA APOD API through proxy...');

    // Test the proxy endpoint
    const response = await axios.get(`${API_BASE_URL}/api/nasa/planetary/apod`);

    if (response.status === 200 && response.data) {
      const apodData = response.data;

      // Verify required fields
      const requiredFields = ['title', 'date', 'explanation', 'url', 'media_type'];
      const hasAllFields = requiredFields.every(field => apodData[field]);

      if (hasAllFields) {
        console.log('✅ NASA APOD API working correctly!');
        console.log('📸 Title:', apodData.title);
        console.log('📅 Date:', apodData.date);
        console.log('🎬 Media Type:', apodData.media_type);
        console.log('🔗 URL:', apodData.url);
        console.log('📝 Explanation:', `${apodData.explanation.substring(0, 100)}...`);

        if (apodData.copyright) {
          console.log('©️ Copyright:', apodData.copyright);
        }

        testResults.apodApi = true;
        testResults.proxyWorking = true;
        return true;
      } else {
        throw new Error('Missing required fields in API response');
      }
    }
    throw new Error(`API returned status: ${response.status}`);
  } catch (error) {
    console.error('❌ NASA APOD API test failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
    testResults.error = error.message;
    return false;
  }
}

async function testDateSpecificApod() {
  try {
    console.log('🔍 Testing NASA APOD API with specific date...');

    // Test with a specific date
    const response = await axios.get(`${API_BASE_URL}/api/nasa/planetary/apod?date=2024-01-01`);

    if (response.status === 200 && response.data) {
      console.log('✅ Date-specific APOD API working!');
      console.log('📅 Requested date: 2024-01-01');
      console.log('📸 Received date:', response.data.date);
      console.log('📸 Title:', response.data.title);

      return true;
    }
    throw new Error(`API returned status: ${response.status}`);
  } catch (error) {
    console.error('❌ Date-specific APOD API test failed:', error.message);
    testResults.error = error.message;
    return false;
  }
}

async function main() {
  console.log('🚀 Starting NASA API Real Connectivity Tests\n');
  console.log('📋 This test verifies that:');
  console.log('   1. The server is running and healthy');
  console.log('   2. The NASA API proxy is working');
  console.log('   3. Real NASA data can be retrieved');
  console.log('');

  const healthOk = await testServerHealth();
  if (!healthOk) {
    console.log('\n💡 Make sure the server is running with:');
    console.log('   cd server && npm start');
    process.exit(1);
  }

  console.log('');
  const apodOk = await testApodApi();

  if (apodOk) {
    console.log('');
    await testDateSpecificApod();
  }

  console.log('\n📊 Test Results Summary:');
  console.log('   Server Health:', testResults.serverHealth ? '✅ PASS' : '❌ FAIL');
  console.log('   NASA APOD API:', testResults.apodApi ? '✅ PASS' : '❌ FAIL');
  console.log('   Proxy Working:', testResults.proxyWorking ? '✅ PASS' : '❌ FAIL');

  if (testResults.error) {
    console.log('   Last Error:', testResults.error);
  }

  console.log('\n🎯 Core Functionality Status:');
  if (testResults.serverHealth && testResults.apodApi) {
    console.log('✅ CORE FUNCTIONALITY IS WORKING!');
    console.log('   The NASA API integration is functional.');
    console.log('   Unit tests should pass with real database connections.');
    console.log('   Real API calls work through the proxy.');
    process.exit(0);
  } else {
    console.log('❌ CORE FUNCTIONALITY IS BROKEN!');
    console.log('   Check the server logs for issues.');
    console.log('   Verify NASA_API_KEY is set in server/.env');
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { testServerHealth, testApodApi, testDateSpecificApod };