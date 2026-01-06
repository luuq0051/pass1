/**
 * Neon Database Integration Test
 * Comprehensive testing cho Neon DB integration
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
 * Test configuration
 */
const TEST_CONFIG = {
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  testData: {
    service: 'Test Service',
    username: 'test@example.com',
    password: 'test_password_123',
    url: 'https://test.example.com',
    notes: 'Test password entry'
  }
};

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
 * Test utilities
 */
class TestRunner {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async runTests() {
    console.log('🧪 Running Neon DB Integration Tests');
    console.log('=====================================\n');

    for (const test of this.tests) {
      this.results.total++;
      
      try {
        console.log(`🔄 Running: ${test.name}`);
        await test.testFn();
        console.log(`✅ Passed: ${test.name}\n`);
        this.results.passed++;
      } catch (error) {
        console.log(`❌ Failed: ${test.name}`);
        console.log(`   Error: ${error.message}\n`);
        this.results.failed++;
      }
    }

    this.printSummary();
  }

  printSummary() {
    console.log('📊 Test Results Summary');
    console.log('======================');
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed. Check the logs above.');
    }
  }
}

/**
 * Test functions
 */
const tests = {
  /**
   * Test 1: Database Connection
   */
  async testConnection() {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as timestamp, version() as version');
    client.release();
    
    if (!result.rows[0]) {
      throw new Error('No response from database');
    }
    
    console.log(`   📅 Server time: ${result.rows[0].timestamp}`);
    console.log(`   🗄️  Version: ${result.rows[0].version.split(' ')[0]}`);
  },

  /**
   * Test 2: Table Structure
   */
  async testTableStructure() {
    const query = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'passwords'
      ORDER BY ordinal_position;
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      throw new Error('Passwords table not found');
    }
    
    const expectedColumns = ['id', 'service', 'username', 'password', 'url', 'notes', 'created_at', 'updated_at'];
    const actualColumns = result.rows.map(row => row.column_name);
    
    for (const col of expectedColumns) {
      if (!actualColumns.includes(col)) {
        throw new Error(`Missing column: ${col}`);
      }
    }
    
    console.log(`   📋 Found ${result.rows.length} columns`);
  },

  /**
   * Test 3: Indexes
   */
  async testIndexes() {
    const query = `
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'passwords';
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      throw new Error('No indexes found on passwords table');
    }
    
    console.log(`   📊 Found ${result.rows.length} indexes`);
    result.rows.forEach(row => {
      console.log(`      - ${row.indexname}`);
    });
  },

  /**
   * Test 4: CRUD Operations
   */
  async testCRUDOperations() {
    const testData = TEST_CONFIG.testData;
    let insertedId;

    try {
      // CREATE
      const insertQuery = `
        INSERT INTO passwords (service, username, password, url, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `;
      
      const insertResult = await pool.query(insertQuery, [
        testData.service,
        testData.username,
        testData.password,
        testData.url,
        testData.notes
      ]);
      
      insertedId = insertResult.rows[0].id;
      console.log(`   ✅ CREATE: Inserted record with ID ${insertedId}`);

      // READ
      const selectQuery = 'SELECT * FROM passwords WHERE id = $1';
      const selectResult = await pool.query(selectQuery, [insertedId]);
      
      if (selectResult.rows.length !== 1) {
        throw new Error('Failed to read inserted record');
      }
      
      console.log(`   ✅ READ: Retrieved record successfully`);

      // UPDATE
      const updateQuery = `
        UPDATE passwords 
        SET notes = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING updated_at;
      `;
      
      const newNotes = 'Updated test notes';
      const updateResult = await pool.query(updateQuery, [newNotes, insertedId]);
      
      if (updateResult.rows.length !== 1) {
        throw new Error('Failed to update record');
      }
      
      console.log(`   ✅ UPDATE: Updated record successfully`);

      // DELETE
      const deleteQuery = 'DELETE FROM passwords WHERE id = $1 RETURNING id';
      const deleteResult = await pool.query(deleteQuery, [insertedId]);
      
      if (deleteResult.rows.length !== 1) {
        throw new Error('Failed to delete record');
      }
      
      console.log(`   ✅ DELETE: Deleted record successfully`);

    } catch (error) {
      // Cleanup on error
      if (insertedId) {
        try {
          await pool.query('DELETE FROM passwords WHERE id = $1', [insertedId]);
        } catch (cleanupError) {
          console.log(`   ⚠️  Cleanup failed: ${cleanupError.message}`);
        }
      }
      throw error;
    }
  },

  /**
   * Test 5: Search Functionality
   */
  async testSearchFunctionality() {
    // Insert test data
    const testEntries = [
      { service: 'Gmail Test', username: 'test1@gmail.com', password: 'pass1' },
      { service: 'Facebook Test', username: 'test2@facebook.com', password: 'pass2' },
      { service: 'GitHub Test', username: 'test3@github.com', password: 'pass3' }
    ];

    const insertedIds = [];

    try {
      // Insert test entries
      for (const entry of testEntries) {
        const result = await pool.query(
          'INSERT INTO passwords (service, username, password) VALUES ($1, $2, $3) RETURNING id',
          [entry.service, entry.username, entry.password]
        );
        insertedIds.push(result.rows[0].id);
      }

      // Test search by service
      const searchQuery = `
        SELECT * FROM passwords 
        WHERE service ILIKE $1 OR username ILIKE $1
        ORDER BY created_at DESC
      `;
      
      const searchResult = await pool.query(searchQuery, ['%Test%']);
      
      if (searchResult.rows.length < 3) {
        throw new Error(`Expected at least 3 search results, got ${searchResult.rows.length}`);
      }
      
      console.log(`   🔍 Search returned ${searchResult.rows.length} results`);

      // Test specific search
      const gmailSearch = await pool.query(searchQuery, ['%Gmail%']);
      
      if (gmailSearch.rows.length < 1) {
        throw new Error('Gmail search returned no results');
      }
      
      console.log(`   📧 Gmail search returned ${gmailSearch.rows.length} results`);

    } finally {
      // Cleanup
      for (const id of insertedIds) {
        try {
          await pool.query('DELETE FROM passwords WHERE id = $1', [id]);
        } catch (error) {
          console.log(`   ⚠️  Failed to cleanup test entry ${id}`);
        }
      }
    }
  },

  /**
   * Test 6: Performance
   */
  async testPerformance() {
    const iterations = 100;
    const startTime = Date.now();

    // Test bulk insert performance
    const insertPromises = [];
    const insertedIds = [];

    for (let i = 0; i < iterations; i++) {
      const promise = pool.query(
        'INSERT INTO passwords (service, username, password) VALUES ($1, $2, $3) RETURNING id',
        [`Perf Test ${i}`, `user${i}@test.com`, `password${i}`]
      ).then(result => {
        insertedIds.push(result.rows[0].id);
        return result;
      });
      
      insertPromises.push(promise);
    }

    await Promise.all(insertPromises);
    
    const insertTime = Date.now() - startTime;
    console.log(`   ⚡ Inserted ${iterations} records in ${insertTime}ms`);
    console.log(`   📊 Average: ${(insertTime / iterations).toFixed(2)}ms per insert`);

    // Test bulk select performance
    const selectStartTime = Date.now();
    const selectResult = await pool.query('SELECT COUNT(*) as count FROM passwords WHERE service LIKE $1', ['Perf Test%']);
    const selectTime = Date.now() - selectStartTime;
    
    console.log(`   🔍 Count query took ${selectTime}ms`);
    console.log(`   📈 Found ${selectResult.rows[0].count} performance test records`);

    // Cleanup
    try {
      const deleteStartTime = Date.now();
      await pool.query('DELETE FROM passwords WHERE service LIKE $1', ['Perf Test%']);
      const deleteTime = Date.now() - deleteStartTime;
      console.log(`   🗑️  Cleanup took ${deleteTime}ms`);
    } catch (error) {
      console.log(`   ⚠️  Cleanup failed: ${error.message}`);
    }
  },

  /**
   * Test 7: Concurrent Operations
   */
  async testConcurrentOperations() {
    const concurrentOps = 10;
    const operations = [];

    // Create concurrent insert operations
    for (let i = 0; i < concurrentOps; i++) {
      const operation = pool.query(
        'INSERT INTO passwords (service, username, password) VALUES ($1, $2, $3) RETURNING id',
        [`Concurrent Test ${i}`, `concurrent${i}@test.com`, `pass${i}`]
      );
      operations.push(operation);
    }

    const startTime = Date.now();
    const results = await Promise.all(operations);
    const duration = Date.now() - startTime;

    console.log(`   🔄 ${concurrentOps} concurrent operations completed in ${duration}ms`);
    
    // Verify all operations succeeded
    if (results.length !== concurrentOps) {
      throw new Error(`Expected ${concurrentOps} results, got ${results.length}`);
    }

    // Cleanup
    const insertedIds = results.map(result => result.rows[0].id);
    for (const id of insertedIds) {
      try {
        await pool.query('DELETE FROM passwords WHERE id = $1', [id]);
      } catch (error) {
        console.log(`   ⚠️  Failed to cleanup concurrent test entry ${id}`);
      }
    }
  }
};

/**
 * Main test execution
 */
async function runIntegrationTests() {
  const runner = new TestRunner();

  // Add all tests
  runner.addTest('Database Connection', tests.testConnection);
  runner.addTest('Table Structure', tests.testTableStructure);
  runner.addTest('Database Indexes', tests.testIndexes);
  runner.addTest('CRUD Operations', tests.testCRUDOperations);
  runner.addTest('Search Functionality', tests.testSearchFunctionality);
  runner.addTest('Performance Test', tests.testPerformance);
  runner.addTest('Concurrent Operations', tests.testConcurrentOperations);

  try {
    await runner.runTests();
  } catch (error) {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }

  // Exit with appropriate code
  process.exit(runner.results.failed > 0 ? 1 : 0);
}

// Run tests
runIntegrationTests();