/**
 * Test Frontend Integration với NeonDB
 * Kiểm tra xem frontend có đang sử dụng NeonDB service không
 */

import { configurationService } from '../src/lib/config/index.js';
import { ServiceFactory } from '../src/lib/services/service-factory.js';

async function testFrontendNeonIntegration() {
  console.log('🧪 Testing Frontend NeonDB Integration...\n');

  try {
    // 1. Kiểm tra configuration
    console.log('📋 Configuration Check:');
    const serviceInfo = ServiceFactory.getServiceInfo();
    console.log('  - Detected Type:', serviceInfo.detectedType);
    console.log('  - Has Neon Config:', serviceInfo.hasNeonConfig);
    console.log('  - Force NeonDB:', serviceInfo.forceNeonDB);
    console.log('  - API Base URL:', serviceInfo.apiBaseUrl);
    console.log('  - Enable API Sync:', serviceInfo.enableApiSync);
    console.log('');

    // 2. Tạo service instance
    console.log('🏭 Service Factory Test:');
    const service = ServiceFactory.getDefaultPasswordService();
    console.log('  - Service Type:', service.constructor.name);
    console.log('  - Is NeonPasswordService:', service.constructor.name === 'NeonPasswordService');
    console.log('');

    // 3. Test health check nếu là NeonPasswordService
    if (service.constructor.name === 'NeonPasswordService') {
      console.log('🏥 Health Check Test:');
      const isHealthy = await service.healthCheck();
      console.log('  - NeonDB Health:', isHealthy ? '✅ Healthy' : '❌ Unhealthy');
      console.log('');

      // 4. Test basic operations
      console.log('🔧 Basic Operations Test:');
      
      // Get stats
      const stats = await service.getStats();
      console.log('  - Current Password Count:', stats.total);
      console.log('  - Has Passwords:', stats.hasPasswords);
      
      // Get all passwords
      const passwords = await service.getAllPasswords();
      console.log('  - Retrieved Passwords:', passwords.length);
      
      if (passwords.length > 0) {
        console.log('  - Sample Password:');
        console.log('    * Service:', passwords[0].service);
        console.log('    * Username:', passwords[0].username);
        console.log('    * Created:', passwords[0].createdAt);
      }
      console.log('');
    }

    console.log('✅ Frontend NeonDB Integration Test Completed Successfully!');
    
  } catch (error) {
    console.error('❌ Frontend NeonDB Integration Test Failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Chạy test
testFrontendNeonIntegration();