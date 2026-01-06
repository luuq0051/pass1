#!/usr/bin/env node
/**
 * Safe Cleanup Script cho Memory Safe Guard
 * Kiểm tra dependencies trước khi xóa files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files cần xóa (đã verify không được sử dụng)
const UNUSED_HOOKS = [
  'src/hooks/use-passwords-neon.ts',
  'src/hooks/use-toast-notifications-improved.ts',
  'src/hooks/use-toast-performance.ts',
  'src/hooks/use-render-performance.ts',
  'src/hooks/use-form-recovery.ts'
];

// Documentation files cần xóa
const DOC_FILES = [
  'CODE_IMPROVEMENTS_SUMMARY.md',
  'CODE_QUALITY_ANALYSIS_2025.md',
  'CODE_QUALITY_IMPROVEMENTS_SUMMARY.md',
  'COMPLETE_ERROR_FIX_SUMMARY.md',
  'CONFIG_QUALITY_IMPROVEMENTS_SUMMARY.md',
  'CONFIG_QUALITY_REFACTORING_FINAL_SUMMARY.md',
  'CONFIG_REFACTORING_SUMMARY.md',
  'CONFIGURATION_REFACTORING_SUMMARY.md',
  'DATABASE_IMPROVEMENTS_SUMMARY.md',
  'FINAL_DEPLOYMENT_SUMMARY.md',
  'FINAL_TOAST_FIX_SUMMARY.md',
  'FORM_STATE_REFACTORING_SUMMARY.md',
  'GITHUB_UPLOAD_SUCCESS.md',
  'HOOKS_CODE_QUALITY_ANALYSIS.md',
  'HOOKS_REFACTORING_SUMMARY.md',
  'HOOKS_UPLOAD_SUMMARY.md',
  'HTML_VALIDATOR_REFACTORING_SUMMARY.md',
  'IMPROVEMENTS_ANALYSIS.md',
  'NETLIFY_CONFIG_FIX_SUMMARY.md',
  'NETLIFY_DEPLOY_FIX_SUMMARY.md',
  'NETLIFY_DEPLOYMENT_STATUS.md',
  'NETLIFY_DIRECT_DEPLOY_GUIDE.md',
  'NETLIFY_ENV_SETUP.md',
  'OPTIMIZATION_SUMMARY.md',
  'READY_TO_DEPLOY.md',
  'REFACTORING_IMPLEMENTATION_SUMMARY.md',
  'SETUP_TEST_IMPROVEMENTS.md',
  'SUPABASE_INTEGRATION_SUMMARY.md',
  'SUPABASE_INTEGRATION_TEST_REPORT.md',
  'SUPABASE_SERVICE_IMPROVEMENTS.md',
  'SUPABASE_SETUP.md',
  'SYNC_SETUP_GUIDE.md',
  'TOAST_REFACTORING_FINAL_REPORT.md',
  'TOAST_SYSTEM_FIX_SUMMARY.md',
  'TOAST_SYSTEM_MIGRATION_GUIDE.md'
];

// Directories cần xóa
const UNUSED_DIRS = [
  'server',
  'database'
];

// Misc files
const MISC_FILES = [
  'memory-safe-guard-source.zip',
  'memory-safe-guard.bundle',
  'server_pid.txt',
  'clear-cache.bat',
  'nginx.conf',
  'dockerfile',
  'validate-html.js'
];

/**
 * Kiểm tra xem file có được import trong codebase không
 */
function checkFileUsage(filePath) {
  try {
    const fileName = path.basename(filePath, '.ts');
    const hookName = fileName.replace('use-', '');
    
    // Search for imports
    const result = execSync(`grep -r "from.*${fileName}" src/ || true`, { encoding: 'utf8' });
    const result2 = execSync(`grep -r "${hookName}" src/ || true`, { encoding: 'utf8' });
    
    return result.trim() !== '' || result2.trim() !== '';
  } catch (error) {
    console.warn(`Warning: Could not check usage for ${filePath}`);
    return false;
  }
}

/**
 * Backup trước khi cleanup
 */
function createBackup() {
  console.log('🔄 Creating backup...');
  try {
    execSync('git add . && git commit -m "Backup before safe cleanup"', { stdio: 'inherit' });
    console.log('✅ Backup created successfully');
  } catch (error) {
    console.log('ℹ️  No changes to backup or already committed');
  }
}

/**
 * Xóa file an toàn
 */
function safeDelete(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✅ Deleted: ${filePath}`);
    return true;
  } else {
    console.log(`ℹ️  Not found: ${filePath}`);
    return false;
  }
}

/**
 * Xóa directory an toàn
 */
function safeDeleteDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`✅ Deleted directory: ${dirPath}`);
    return true;
  } else {
    console.log(`ℹ️  Directory not found: ${dirPath}`);
    return false;
  }
}

/**
 * Main cleanup function
 */
function runCleanup() {
  console.log('🧹 Starting Safe Cleanup for Memory Safe Guard\n');
  
  // 1. Create backup
  createBackup();
  
  // 2. Check và xóa unused hooks
  console.log('\n📁 Cleaning unused hooks...');
  let deletedHooks = 0;
  for (const hookFile of UNUSED_HOOKS) {
    if (checkFileUsage(hookFile)) {
      console.log(`⚠️  Skipping ${hookFile} - still in use`);
    } else {
      if (safeDelete(hookFile)) deletedHooks++;
    }
  }
  
  // 3. Xóa test file của use-password-form nếu hook đã bị xóa
  if (!fs.existsSync('src/hooks/use-password-form.ts')) {
    safeDelete('src/hooks/__tests__/use-password-form.test.ts');
  }
  
  // 4. Xóa documentation files
  console.log('\n📄 Cleaning documentation files...');
  let deletedDocs = 0;
  for (const docFile of DOC_FILES) {
    if (safeDelete(docFile)) deletedDocs++;
  }
  
  // 5. Xóa unused directories
  console.log('\n📂 Cleaning unused directories...');
  let deletedDirs = 0;
  for (const dir of UNUSED_DIRS) {
    if (safeDeleteDir(dir)) deletedDirs++;
  }
  
  // 6. Xóa misc files
  console.log('\n🗂️  Cleaning misc files...');
  let deletedMisc = 0;
  for (const miscFile of MISC_FILES) {
    if (safeDelete(miscFile)) deletedMisc++;
  }
  
  // 7. Test build
  console.log('\n🔨 Testing build...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build successful!');
  } catch (error) {
    console.error('❌ Build failed! Please check for issues.');
    process.exit(1);
  }
  
  // Summary
  console.log('\n📊 Cleanup Summary:');
  console.log(`   Hooks deleted: ${deletedHooks}`);
  console.log(`   Docs deleted: ${deletedDocs}`);
  console.log(`   Directories deleted: ${deletedDirs}`);
  console.log(`   Misc files deleted: ${deletedMisc}`);
  console.log('\n✅ Safe cleanup completed successfully!');
  console.log('💡 Tip: Run "git status" to review changes');
}

// Run cleanup
if (require.main === module) {
  runCleanup();
}

module.exports = { runCleanup };