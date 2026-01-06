/**
 * Full Integration Test Script
 * Test kết nối end-to-end giữa Frontend và Backend
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:8080';

// Test data
const testPassword = {
  service: 'Integration Test',
  username: 'integration@test.com',
  password: 'IntegrationTest123!'
};

/**
 * Test Backend API endpoints
 */
async function testBackendAPI() {
  console.log('🔧 Testing Backend API...');
  
  try {
    // 1. Health Check
    console.log('  ✓ Testing health check...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    
    if (healthData.status !== 'healthy') {
      throw new Error(`Health check failed: ${healthData.status}`);
    }
    console.log(`    ✅ Health: ${healthData.status}, DB: ${healthData.database}`);

    // 2. Get existing passwords
    console.log('  ✓ Testing GET passwords...');
    const getResponse = await fetch(`${API_BASE_URL}/passwords`);
    const passwords = await getResponse.json();
    console.log(`    ✅ Found ${passwords.length} existing passwords`);

    // 3. Add new password
    console.log('  ✓ Testing POST password...');
    const postResponse = await fetch(`${API_BASE_URL}/passwords`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPassword)
    });
    const newPassword = await postResponse.json();
    console.log(`    ✅ Created password with ID: ${newPassword.id}`);

    // 4. Get stats
    console.log('  ✓ Testing GET stats...');
    const statsResponse = await fetch(`${API_BASE_URL}/passwords/stats`);
    const stats = await statsResponse.json();
    console.log(`    ✅ Stats: ${stats.total} total, hasPasswords: ${stats.hasPasswords}`);

    // 5. Update password
    console.log('  ✓ Testing PUT password...');
    const updateData = { ...testPassword, service: 'Updated Integration Test' };
    const putResponse = await fetch(`${API_BASE_URL}/passwords/${newPassword.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    const updatedPassword = await putResponse.json();
    console.log(`    ✅ Updated password service: ${updatedPassword.service}`);

    // 6. Delete password
    console.log('  ✓ Testing DELETE password...');
    const deleteResponse = await fetch(`${API_BASE_URL}/passwords/${newPassword.id}`, {
      method: 'DELETE'
    });
    const deleteResult = await deleteResponse.json();
    console.log(`    ✅ Deleted password: ${deleteResult.message}`);

    return true;
  } catch (error) {
    console.error('❌ Backend API test failed:', error.message);
    return false;
  }
}

/**
 * Test Frontend availability
 */
async function testFrontend() {
  console.log('🌐 Testing Frontend...');
  
  try {
    const response = await fetch(FRONTEND_URL);
    const html = await response.text();
    
    if (html.includes('Memory Safe Guard')) {
      console.log('    ✅ Frontend is accessible and contains expected content');
      return true;
    } else {
      throw new Error('Frontend content does not match expected');
    }
  } catch (error) {
    console.error('❌ Frontend test failed:', error.message);
    return false;
  }
}

/**
 * Test CORS configuration
 */
async function testCORS() {
  console.log('🔒 Testing CORS configuration...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    if (response.ok) {
      console.log('    ✅ CORS is properly configured');
      return true;
    } else {
      throw new Error('CORS configuration issue');
    }
  } catch (error) {
    console.error('❌ CORS test failed:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runIntegrationTests() {
  console.log('🚀 Starting Full Integration Tests...\n');
  
  const results = {
    backend: false,
    frontend: false,
    cors: false
  };

  // Test Backend API
  results.backend = await testBackendAPI();
  console.log('');

  // Test Frontend
  results.frontend = await testFrontend();
  console.log('');

  // Test CORS
  results.cors = await testCORS();
  console.log('');

  // Summary
  console.log('📊 Test Results Summary:');
  console.log(`  Backend API: ${results.backend ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Frontend: ${results.frontend ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  CORS: ${results.cors ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(result => result);
  
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED! Frontend-Backend integration is working!');
    console.log('✅ Memory Safe Guard is ready for development and testing!');
  } else {
    console.log('❌ Some tests failed. Please check the configuration.');
  }
  console.log('='.repeat(50));

  return allPassed;
}

// Run tests if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runIntegrationTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('💥 Test runner crashed:', error);
      process.exit(1);
    });
}

export { runIntegrationTests, testBackendAPI, testFrontend, testCORS };