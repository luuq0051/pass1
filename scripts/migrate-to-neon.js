/**
 * Migration Script: IndexedDB to Neon Database
 * Chuyển dữ liệu từ IndexedDB sang Neon PostgreSQL
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

/**
 * Database connection
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Sample data cho testing (nếu IndexedDB trống)
 */
const SAMPLE_PASSWORDS = [
  {
    service: 'Gmail',
    username: 'user@gmail.com',
    password: 'sample_password_123',
    url: 'https://gmail.com',
    notes: 'Email chính của tôi'
  },
  {
    service: 'Facebook',
    username: 'user@facebook.com',
    password: 'fb_password_456',
    url: 'https://facebook.com',
    notes: 'Tài khoản mạng xã hội'
  },
  {
    service: 'GitHub',
    username: 'developer',
    password: 'github_token_789',
    url: 'https://github.com',
    notes: 'Tài khoản phát triển'
  },
  {
    service: 'Netflix',
    username: 'family@email.com',
    password: 'netflix_pass_2024',
    url: 'https://netflix.com',
    notes: 'Tài khoản gia đình'
  }
];

/**
 * Tạo bảng passwords nếu chưa tồn tại
 */
async function createPasswordsTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS passwords (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      service VARCHAR(255) NOT NULL,
      username VARCHAR(255) NOT NULL,
      password TEXT NOT NULL,
      url VARCHAR(500),
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(service, username)
    );

    -- Tạo indexes cho performance
    CREATE INDEX IF NOT EXISTS idx_passwords_service ON passwords(service);
    CREATE INDEX IF NOT EXISTS idx_passwords_username ON passwords(username);
    CREATE INDEX IF NOT EXISTS idx_passwords_updated_at ON passwords(updated_at DESC);

    -- Trigger cho updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    DROP TRIGGER IF EXISTS update_passwords_updated_at ON passwords;
    CREATE TRIGGER update_passwords_updated_at 
        BEFORE UPDATE ON passwords 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `;

  try {
    await pool.query(createTableQuery);
    console.log('✅ Passwords table created successfully');
  } catch (error) {
    console.error('❌ Error creating passwords table:', error.message);
    throw error;
  }
}

/**
 * Kiểm tra kết nối database
 */
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as timestamp, version() as version');
    client.release();
    
    console.log('✅ Database connection successful');
    console.log(`📅 Server time: ${result.rows[0].timestamp}`);
    console.log(`🗄️  PostgreSQL version: ${result.rows[0].version.split(' ')[0]}`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Migrate sample data to Neon DB
 */
async function migrateSampleData() {
  try {
    console.log('🔄 Starting sample data migration...');

    // Kiểm tra xem đã có data chưa
    const existingData = await pool.query('SELECT COUNT(*) as count FROM passwords');
    const existingCount = parseInt(existingData.rows[0].count);

    if (existingCount > 0) {
      console.log(`📊 Found ${existingCount} existing passwords in database`);
      
      // Hiển thị existing data
      const passwords = await pool.query('SELECT service, username, created_at FROM passwords ORDER BY created_at DESC');
      console.log('📋 Existing passwords:');
      passwords.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.service} (${row.username}) - ${row.created_at.toLocaleDateString()}`);
      });
      
      return;
    }

    // Insert sample data
    console.log('📝 Inserting sample passwords...');
    
    for (const passwordData of SAMPLE_PASSWORDS) {
      try {
        const insertQuery = `
          INSERT INTO passwords (service, username, password, url, notes) 
          VALUES ($1, $2, $3, $4, $5) 
          RETURNING id, service, username
        `;
        
        const result = await pool.query(insertQuery, [
          passwordData.service,
          passwordData.username,
          passwordData.password,
          passwordData.url,
          passwordData.notes
        ]);

        console.log(`   ✅ Added: ${result.rows[0].service} (${result.rows[0].username})`);
      } catch (error) {
        if (error.code === '23505') { // Unique violation
          console.log(`   ⚠️  Skipped duplicate: ${passwordData.service} (${passwordData.username})`);
        } else {
          throw error;
        }
      }
    }

    // Verify migration
    const finalCount = await pool.query('SELECT COUNT(*) as count FROM passwords');
    console.log(`✅ Migration completed! Total passwords: ${finalCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

/**
 * Get migration statistics
 */
async function getMigrationStats() {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_passwords,
        COUNT(DISTINCT service) as unique_services,
        MIN(created_at) as oldest_password,
        MAX(created_at) as newest_password
      FROM passwords
    `);

    const serviceStats = await pool.query(`
      SELECT service, COUNT(*) as count 
      FROM passwords 
      GROUP BY service 
      ORDER BY count DESC
    `);

    console.log('\n📊 Migration Statistics:');
    console.log(`   Total passwords: ${stats.rows[0].total_passwords}`);
    console.log(`   Unique services: ${stats.rows[0].unique_services}`);
    console.log(`   Oldest password: ${stats.rows[0].oldest_password?.toLocaleDateString() || 'N/A'}`);
    console.log(`   Newest password: ${stats.rows[0].newest_password?.toLocaleDateString() || 'N/A'}`);
    
    console.log('\n📋 Services breakdown:');
    serviceStats.rows.forEach(row => {
      console.log(`   ${row.service}: ${row.count} password(s)`);
    });

  } catch (error) {
    console.error('❌ Error getting statistics:', error.message);
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Memory Safe Guard - Neon DB Migration');
  console.log('==========================================\n');

  try {
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Cannot connect to database');
    }

    // Create table structure
    await createPasswordsTable();

    // Migrate data
    await migrateSampleData();

    // Show statistics
    await getMigrationStats();

    console.log('\n✅ Migration completed successfully!');
    console.log('🔗 You can now use the Neon database in your application.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * CLI argument handling
 */
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'stats':
    // Chỉ hiển thị statistics
    testConnection()
      .then(() => getMigrationStats())
      .finally(() => pool.end());
    break;
  
  case 'reset':
    // Reset database (xóa tất cả data)
    console.log('⚠️  Resetting database...');
    pool.query('DELETE FROM passwords')
      .then(() => console.log('✅ Database reset completed'))
      .then(() => runMigration())
      .catch(error => {
        console.error('❌ Reset failed:', error.message);
        process.exit(1);
      });
    break;
  
  default:
    // Default migration
    runMigration();
}