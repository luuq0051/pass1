/**
 * Password Repository - Data Access Layer
 * Tách biệt database queries khỏi business logic
 */

import { DatabaseManager } from '../db/database-manager.js';
import { Logger } from '../utils/logger.js';

export class PasswordRepository {
  constructor() {
    this.db = DatabaseManager.getInstance();
    this.logger = new Logger('PasswordRepository');
  }

  /**
   * Tìm tất cả passwords với search và pagination
   * @param {string} search - Search term
   * @param {number} limit - Limit results
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Array of passwords
   */
  async findWithSearch(search = null, limit = 50, offset = 0) {
    const startTime = Date.now();
    
    try {
      let query = 'SELECT * FROM passwords';
      let params = [];

      if (search) {
        query += ' WHERE service ILIKE $1 OR username ILIKE $1';
        params.push(`%${search}%`);
      }

      query += ' ORDER BY updated_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);

      const result = await this.db.query(query, params);
      
      const duration = Date.now() - startTime;
      this.logger.logDbOperation('SELECT', 'passwords', duration, result.rows.length);
      
      return result.rows;
    } catch (error) {
      this.logger.error('Failed to find passwords with search', error);
      throw error;
    }
  }

  /**
   * Đếm số lượng passwords với search
   * @param {string} search - Search term
   * @returns {Promise<number>} Count of passwords
   */
  async countWithSearch(search = null) {
    const startTime = Date.now();
    
    try {
      let query = 'SELECT COUNT(*) as count FROM passwords';
      let params = [];

      if (search) {
        query += ' WHERE service ILIKE $1 OR username ILIKE $1';
        params.push(`%${search}%`);
      }

      const result = await this.db.query(query, params);
      
      const duration = Date.now() - startTime;
      this.logger.logDbOperation('COUNT', 'passwords', duration);
      
      return parseInt(result.rows[0].count);
    } catch (error) {
      this.logger.error('Failed to count passwords', error);
      throw error;
    }
  }

  /**
   * Tìm password theo ID
   * @param {string} id - Password ID
   * @returns {Promise<Object|null>} Password object or null
   */
  async findById(id) {
    const startTime = Date.now();
    
    try {
      const query = 'SELECT * FROM passwords WHERE id = $1';
      const result = await this.db.query(query, [id]);
      
      const duration = Date.now() - startTime;
      this.logger.logDbOperation('SELECT_BY_ID', 'passwords', duration);
      
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error('Failed to find password by ID', error, { id });
      throw error;
    }
  }

  /**
   * Tìm password theo service và username
   * @param {string} service - Service name
   * @param {string} username - Username
   * @returns {Promise<Object|null>} Password object or null
   */
  async findByServiceAndUsername(service, username) {
    const startTime = Date.now();
    
    try {
      const query = 'SELECT * FROM passwords WHERE service = $1 AND username = $2';
      const result = await this.db.query(query, [service, username]);
      
      const duration = Date.now() - startTime;
      this.logger.logDbOperation('SELECT_BY_SERVICE_USERNAME', 'passwords', duration);
      
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error('Failed to find password by service and username', error, { service, username });
      throw error;
    }
  }

  /**
   * Tạo password mới
   * @param {Object} passwordData - Password data
   * @returns {Promise<Object>} Created password
   */
  async create(passwordData) {
    const startTime = Date.now();
    
    try {
      const { service, username, password } = passwordData;
      const query = `
        INSERT INTO passwords (service, username, password, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING *
      `;
      
      const result = await this.db.query(query, [service, username, password]);
      
      const duration = Date.now() - startTime;
      this.logger.logDbOperation('INSERT', 'passwords', duration);
      
      return result.rows[0];
    } catch (error) {
      this.logger.error('Failed to create password', error, passwordData);
      throw error;
    }
  }

  /**
   * Cập nhật password
   * @param {string} id - Password ID
   * @param {Object} passwordData - Updated password data
   * @returns {Promise<Object>} Updated password
   */
  async update(id, passwordData) {
    const startTime = Date.now();
    
    try {
      const { service, username, password } = passwordData;
      const query = `
        UPDATE passwords 
        SET service = $1, username = $2, password = $3, updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `;
      
      const result = await this.db.query(query, [service, username, password, id]);
      
      const duration = Date.now() - startTime;
      this.logger.logDbOperation('UPDATE', 'passwords', duration);
      
      return result.rows[0];
    } catch (error) {
      this.logger.error('Failed to update password', error, { id, ...passwordData });
      throw error;
    }
  }

  /**
   * Xóa password
   * @param {string} id - Password ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    const startTime = Date.now();
    
    try {
      const query = 'DELETE FROM passwords WHERE id = $1';
      await this.db.query(query, [id]);
      
      const duration = Date.now() - startTime;
      this.logger.logDbOperation('DELETE', 'passwords', duration);
    } catch (error) {
      this.logger.error('Failed to delete password', error, { id });
      throw error;
    }
  }

  /**
   * Đếm tổng số passwords
   * @returns {Promise<number>} Total count
   */
  async count() {
    const startTime = Date.now();
    
    try {
      const query = 'SELECT COUNT(*) as count FROM passwords';
      const result = await this.db.query(query);
      
      const duration = Date.now() - startTime;
      this.logger.logDbOperation('COUNT_ALL', 'passwords', duration);
      
      return parseInt(result.rows[0].count);
    } catch (error) {
      this.logger.error('Failed to count all passwords', error);
      throw error;
    }
  }

  /**
   * Đếm passwords được tạo trong N ngày gần đây
   * @param {number} days - Number of days
   * @returns {Promise<number>} Recent count
   */
  async countRecent(days = 30) {
    const startTime = Date.now();
    
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM passwords 
        WHERE created_at >= NOW() - INTERVAL '${days} days'
      `;
      const result = await this.db.query(query);
      
      const duration = Date.now() - startTime;
      this.logger.logDbOperation('COUNT_RECENT', 'passwords', duration);
      
      return parseInt(result.rows[0].count);
    } catch (error) {
      this.logger.error('Failed to count recent passwords', error);
      throw error;
    }
  }

  /**
   * Lấy thống kê theo service
   * @returns {Promise<Array>} Service statistics
   */
  async getServiceStats() {
    const startTime = Date.now();
    
    try {
      const query = `
        SELECT 
          service,
          COUNT(*) as count,
          MAX(updated_at) as last_updated
        FROM passwords 
        GROUP BY service 
        ORDER BY count DESC 
        LIMIT 10
      `;
      const result = await this.db.query(query);
      
      const duration = Date.now() - startTime;
      this.logger.logDbOperation('SERVICE_STATS', 'passwords', duration);
      
      return result.rows;
    } catch (error) {
      this.logger.error('Failed to get service statistics', error);
      throw error;
    }
  }
}