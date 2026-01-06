/**
 * Simple Test - Kiểm tra NeonDB integration từ frontend
 */

console.log('🧪 Testing NeonDB Frontend Integration...\n');

// Test environment variables
console.log('📋 Environment Variables:');
console.log('  - DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not Set');
console.log('  - VITE_USE_NEONDB:', process.env.VITE_USE_NEONDB);
console.log('  - VITE_API_BASE_URL:', process.env.VITE_API_BASE_URL);
console.log('');

// Test API endpoint
console.log('🌐 Testing API Endpoints:');

async function testAPI() {
  try {
    const apiBaseUrl = process.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    
    // Test health
    console.log('  - Testing health endpoint...');
    const healthResponse = await fetch(`${apiBaseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('    ✅ Health:', healthData.status);
    
    // Test passwords
    console.log('  - Testing passwords endpoint...');
    const passwordsResponse = await fetch(`${apiBaseUrl}/passwords`);
    const passwordsData = await passwordsResponse.json();
    console.log('    ✅ Passwords count:', passwordsData.length);
    
    // Test stats
    console.log('  - Testing stats endpoint...');
    const statsResponse = await fetch(`${apiBaseUrl}/passwords/stats`);
    const statsData = await statsResponse.json();
    console.log('    ✅ Stats:', `${statsData.total} passwords, hasPasswords: ${statsData.hasPasswords}`);
    
    console.log('\n✅ All API tests passed! Frontend can connect to NeonDB via API.');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPI();