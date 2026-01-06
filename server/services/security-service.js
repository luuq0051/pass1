/**
 * Security Service - Bảo mật và mã hóa
 * Xử lý encryption, audit logging và security events
 */

import crypto from 'crypto';
import { Logger } from '../utils/logger.js';

export class SecurityService {
  constructor() {
    this.logger = new Logger('SecurityService');
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
    
    // Lấy encryption key từ environment hoặc tạo mới
    this.encryptionKey = this.getOrCreateEncryptionKey();
  }

  /**
   * Lấy hoặc tạo encryption key
   * @returns {Buffer} Encryption key
   */
  getOrCreateEncryptionKey() {
    const keyFromEnv = process.env.ENCRYPTION_KEY;
    
    if (keyFromEnv) {
      return Buffer.from(keyFromEnv, 'hex');
    }
    
    // Tạo key mới (chỉ cho development)
    if (process.env.NODE_ENV === 'development') {
      const newKey = crypto.randomBytes(this.keyLength);
      this.logger.warn('Generated new encryption key for development', {
        key: newKey.toString('hex')
      });
      return newKey;
    }
    
    throw new Error('ENCRYPTION_KEY environment variable is required in production');
  }

  /**
   * Mã hóa password data (nếu cần)
   * Note: Hiện tại chỉ return data gốc, có thể implement encryption sau
   * @param {Object} passwordData - Password data to encrypt
   * @returns {Promise<Object>} Encrypted password data
   */
  async encryptPasswordData(passwordData) {
    try {
      // TODO: Implement actual encryption if needed
      // Hiện tại return data gốc vì frontend đã handle encryption
      
      this.logger.debug('Password data processed for storage', {
        service: passwordData.service,
        username: passwordData.username,
        hasPassword: !!passwordData.password
      });
      
      return passwordData;
    } catch (error) {
      this.logger.error('Failed to encrypt password data', error);
      throw error;
    }
  }

  /**
   * Giải mã password data (nếu cần)
   * @param {Object} encryptedData - Encrypted password data
   * @returns {Promise<Object>} Decrypted password data
   */
  async decryptPasswordData(encryptedData) {
    try {
      // TODO: Implement actual decryption if needed
      return encryptedData;
    } catch (error) {
      this.logger.error('Failed to decrypt password data', error);
      throw error;
    }
  }

  /**
   * Mã hóa string
   * @param {string} text - Text to encrypt
   * @returns {string} Encrypted text with IV and tag
   */
  encrypt(text) {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey, { iv });
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Combine IV + tag + encrypted data
      return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw error;
    }
  }

  /**
   * Giải mã string
   * @param {string} encryptedText - Encrypted text with IV and tag
   * @returns {string} Decrypted text
   */
  decrypt(encryptedText) {
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const tag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey, { iv });
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw error;
    }
  }

  /**
   * Hash password với salt
   * @param {string} password - Password to hash
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    try {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
      return `${salt}:${hash}`;
    } catch (error) {
      this.logger.error('Password hashing failed', error);
      throw error;
    }
  }

  /**
   * Verify password hash
   * @param {string} password - Plain password
   * @param {string} hashedPassword - Hashed password
   * @returns {Promise<boolean>} Verification result
   */
  async verifyPassword(password, hashedPassword) {
    try {
      const [salt, hash] = hashedPassword.split(':');
      const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
      return hash === verifyHash;
    } catch (error) {
      this.logger.error('Password verification failed', error);
      return false;
    }
  }

  /**
   * Generate secure random password
   * @param {number} length - Password length
   * @param {Object} options - Password options
   * @returns {string} Generated password
   */
  generateSecurePassword(length = 16, options = {}) {
    const {
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      excludeSimilar = true
    } = options;

    let charset = '';
    
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (excludeSimilar) {
      charset = charset.replace(/[0O1lI]/g, '');
    }

    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }

    this.logger.debug('Secure password generated', { length });
    return password;
  }

  /**
   * Log audit event
   * @param {string} event - Event type
   * @param {Object} details - Event details
   */
  async logAuditEvent(event, details = {}) {
    try {
      const auditLog = {
        event,
        timestamp: new Date().toISOString(),
        details,
        sessionId: details.sessionId || 'unknown',
        userAgent: details.userAgent || 'unknown',
        ip: details.ip || 'unknown'
      };

      // Log to console (có thể extend để lưu vào database)
      this.logger.info(`Audit Event: ${event}`, auditLog);
      
      // TODO: Implement audit log storage to database if needed
    } catch (error) {
      this.logger.error('Failed to log audit event', error, { event, details });
    }
  }

  /**
   * Validate request rate limiting
   * @param {string} identifier - Request identifier (IP, user ID, etc.)
   * @param {number} maxRequests - Max requests per window
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} Whether request is allowed
   */
  validateRateLimit(identifier, maxRequests = 100, windowMs = 60000) {
    // TODO: Implement rate limiting logic
    // Có thể sử dụng Redis hoặc in-memory store
    
    this.logger.debug('Rate limit check', { identifier, maxRequests, windowMs });
    return true; // Placeholder
  }

  /**
   * Sanitize input để tránh XSS
   * @param {string} input - Input string
   * @returns {string} Sanitized string
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }
}