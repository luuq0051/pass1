/**
 * Database Manager - Singleton Pattern
 * Quản lý connection pool và database operations
 */

import { Pool } from 'pg';
import { Logger } from '../utils/logger.js';
import { AppError } from '../utils/app-error.js';

export class DatabaseManager {
  static instance = null;

  constructor() {
    if (DatabaseManager.instance) {
      return DatabaseManager.instance;
    }

    this.logger = new Logger('DatabaseManager');
    this.pool = null;
    this.isConnected = false;
    
    DatabaseManager.instance = this;
  }

  /**
   * Singleton getInstance method
   */
  static getInstance() {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Khởi tạo connection pool
   */
  async initialize() {
    try {
      if (this.pool) {
        this.logger.warn('Database pool already initialized');
        return;
      }

      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new AppError('DATABASE_URL environment variable is required', 500);
      }

      this.pool = new Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: false
        },
        max: parseInt(process.env.DB_POOL_MAX) || 20,
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
        acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
      });

      // Test connection
      await this.testConnection();
      
      // Setup event listeners
      this.setupEventListeners();
      
      this.isConnected = true;
      this.logger.info('Database connection pool initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize database connection pool', error);
      throw new AppError('Database initialization failed', 500, error);
    }
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as timestamp, version() as version');
      client.release();
      
      this.logger.info('Database connection test successful', {
        timestamp: result.rows[0].timestamp,
        version: result.rows[0].version.split(' ')[0] // PostgreSQL version only
      });
      
      return result.rows[0];
    } catch (error) {
      this.logger.error('Database connection test failed', error);
      throw new AppError('Database connection test failed', 500, error);
    }
  }

  /**
   * Setup event listeners cho pool
   */
  setupEventListeners() {
    this.pool.on('connect', (client) => {
      this.logger.debug('New client connected to database');
    });

    this.pool.on('acquire', (client) => {
      this.logger.trace('Client acquired from pool');
    });

    this.pool.on('remove', (client) => {
      this.logger.debug('Client removed from pool');
    });

    this.pool.on('error', (error, client) => {
      this.logger.error('Unexpected error on idle client', error);
    });
  }

  /**
   * Execute query với error handling và logging
   * @param {string} text - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async query(text, params = []) {
    const startTime = Date.now();
    let client = null;

    try {
      if (!this.pool) {
        throw new AppError('Database pool not initialized', 500);
      }

      client = await this.pool.connect();
      const result = await client.query(text, params);
      
      const duration = Date.now() - startTime;
      this.logger.debug('Query executed successfully', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        paramCount: params.length,
        rowCount: result.rowCount,
        duration: `${duration}ms`
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Query execution failed', error, {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        paramCount: params.length,
        duration: `${duration}ms`
      });
      
      // Transform database errors
      throw this.transformDatabaseError(error);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Execute transaction
   * @param {Function} callback - Transaction callback function
   * @returns {Promise<*>} Transaction result
   */
  async transaction(callback) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      this.logger.debug('Transaction started');
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      this.logger.debug('Transaction committed');
      
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Transaction rolled back', error);
      throw this.transformDatabaseError(error);
    } finally {
      client.release();
    }
  }

  /**
   * Transform database errors thành AppError
   * @param {Error} error - Database error
   * @returns {AppError} Transformed error
   */
  transformDatabaseError(error) {
    switch (error.code) {
      case '23505': // Unique violation
        return new AppError('Duplicate entry found', 409, error, 'DUPLICATE_ENTRY');
      case '23503': // Foreign key violation
        return new AppError('Invalid reference to related resource', 400, error, 'INVALID_REFERENCE');
      case '23502': // Not null violation
        return new AppError('Required field is missing', 400, error, 'MISSING_REQUIRED_FIELD');
      case '42P01': // Undefined table
        return new AppError('Database table not found', 500, error, 'TABLE_NOT_FOUND');
      case '42703': // Undefined column
        return new AppError('Database column not found', 500, error, 'COLUMN_NOT_FOUND');
      case '28P01': // Invalid password
        return new AppError('Database authentication failed', 500, error, 'AUTH_FAILED');
      case 'ECONNREFUSED':
        return new AppError('Database connection refused', 500, error, 'CONNECTION_REFUSED');
      case 'ETIMEDOUT':
        return new AppError('Database connection timeout', 500, error, 'CONNECTION_TIMEOUT');
      default:
        return new AppError('Database operation failed', 500, error, 'DATABASE_ERROR');
    }
  }

  /**
   * Get pool statistics
   * @returns {Object} Pool statistics
   */
  getPoolStats() {
    if (!this.pool) {
      return { status: 'not_initialized' };
    }

    return {
      status: 'active',
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      maxConnections: this.pool.options.max,
      isConnected: this.isConnected
    };
  }

  /**
   * Health check
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      const result = await this.testConnection();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        database: 'connected',
        responseTime: `${responseTime}ms`,
        timestamp: result.timestamp,
        poolStats: this.getPoolStats()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        poolStats: this.getPoolStats()
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async close() {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
        this.isConnected = false;
        this.logger.info('Database connection pool closed successfully');
      }
    } catch (error) {
      this.logger.error('Error closing database connection pool', error);
      throw error;
    }
  }
}