/**
 * Test Frontend UI và Console
 * Kiểm tra giao diện và console logs của Memory Safe Guard
 */

import puppeteer from 'puppeteer';

async function testFrontendUI() {
  console.log('🎭 Testing Frontend UI với Puppeteer...\n');

  let browser;
  try {
    // Khởi động browser
    browser = await puppeteer.launch({ 
      headless: false, // Hiển thị browser
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Lắng nghe console logs
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
      console.log(`📝 Console [${msg.type()}]:`, msg.text());
    });

    // Lắng nghe errors
    page.on('pageerror', error => {
      console.error('❌ Page Error:', error.message);
    });

    // Truy cập trang
    console.log('🌐 Navigating to http://localhost:8080...');
    await page.goto('http://localhost:8080', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Chờ trang load
    await page.waitForTimeout(3000);

    // Kiểm tra title
    const title = await page.title();
    console.log('📄 Page Title:', title);

    // Kiểm tra các elements chính
    console.log('\n🔍 Checking UI Elements:');
    
    // Kiểm tra header
    const headerExists = await page.$('h1, h2, [data-testid="app-title"]') !== null;
    console.log('  - Header/Title:', headerExists ? '✅ Found' : '❌ Not found');

    // Kiểm tra password form
    const formExists = await page.$('form, [data-testid="password-form"]') !== null;
    console.log('  - Password Form:', formExists ? '✅ Found' : '❌ Not found');

    // Kiểm tra buttons
    const buttonsCount = await page.$$eval('button', buttons => buttons.length);
    console.log('  - Buttons Count:', buttonsCount);

    // Kiểm tra inputs
    const inputsCount = await page.$$eval('input', inputs => inputs.length);
    console.log('  - Inputs Count:', inputsCount);

    // Lấy text content của trang
    const bodyText = await page.$eval('body', el => el.textContent);
    const hasPasswordText = bodyText.includes('mật khẩu') || bodyText.includes('password');
    console.log('  - Contains Password Text:', hasPasswordText ? '✅ Yes' : '❌ No');

    // Kiểm tra có loading state không
    const hasLoading = bodyText.includes('Loading') || bodyText.includes('Đang tải');
    console.log('  - Has Loading State:', hasLoading ? '✅ Yes' : '❌ No');

    // Kiểm tra có error không
    const hasError = bodyText.includes('Error') || bodyText.includes('Lỗi');
    console.log('  - Has Error:', hasError ? '❌ Yes' : '✅ No');

    // Chụp screenshot
    await page.screenshot({ 
      path: 'frontend-screenshot.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved as: frontend-screenshot.png');

    // Tóm tắt console logs
    console.log('\n📊 Console Logs Summary:');
    const logTypes = consoleLogs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(logTypes).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count} messages`);
    });

    // Hiển thị một số logs quan trọng
    const importantLogs = consoleLogs.filter(log => 
      log.text.includes('error') || 
      log.text.includes('NeonDB') || 
      log.text.includes('service') ||
      log.type === 'error'
    );

    if (importantLogs.length > 0) {
      console.log('\n🔍 Important Console Messages:');
      importantLogs.forEach(log => {
        console.log(`  [${log.type}] ${log.text}`);
      });
    }

    console.log('\n✅ Frontend UI Test Completed!');
    console.log('Browser window is open for manual inspection...');
    
    // Giữ browser mở để kiểm tra manual
    console.log('\nPress Ctrl+C to close browser and exit...');
    await new Promise(() => {}); // Keep running

  } catch (error) {
    console.error('❌ Frontend UI Test Failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Chạy test
testFrontendUI();