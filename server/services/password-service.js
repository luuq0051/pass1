/**
 * Password Service - Business Logic Layer
 * Tách biệt database operations và business rules
 */

import { DatabaseManager } from '../db/database-manager.js';
import { PasswordRepository } from '../repositories/password-repository.js';
import { SecurityService } from './security-service.js';
import { AppError } from '../utils/app-error.js';

export class PasswordService {
  constructor() {
    this.passwordRepository = new PasswordRepository();
    this.securityService = new SecurityService();
  }

  /**
   * Lấy danh sách passwords với phân trang và tìm kiếm
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} Paginated results
   */
  async getPasswords({ search, page = 1, limit = 50 }) {
    try {
      const offset = (page - 1) * limit;
      
      const [passwords, total] = await Promise.all([
        this.passwordRepository.findWithSearch(search, limit, offset),
        this.passwordRepository.countWithSearch(search)
      ]);

      return {
        data: passwords,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new AppError('Failed to retrieve passwords', 500, error);
    }
  }

  /**
   * Tạo password mới
   * @param {Object} passwordData - Password data
   * @returns {Promise<Object>} Created password
   */
  async createPassword(passwordData) {
    try {
      // Kiểm tra trùng lặp service + username
      const existing = await this.passwordRepository.findByServiceAndUsername(
        passwordData.service, 
        passwordData.username
      );

      if (existing) {
        throw new AppError('Password entry already exists for this service and username', 409);
      }

      // Mã hóa password trước khi lưu (nếu cần)
      const encryptedData = await this.securityService.encryptPasswordData(passwordData);
      
      const newPassword = await this.passwordRepository.create(encryptedData);
      
      // Log audit trail
      await this.securityService.logAuditEvent('PASSWORD_CREATED', {
        passwordId: newPassword.id,
        service: newPassword.service
      });

      return newPassword;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create password', 500, error);
    }
  }

  /**
   * Cập nhật password
   * @param {string} id - Password ID
   * @param {Object} passwordData - Updated password data
   * @returns {Promise<Object>} Updated password
   */
  async updatePassword(id, passwordData) {
    try {
      const existingPassword = await this.passwordRepository.findById(id);
      if (!existingPassword) {
        throw new AppError('Password not found', 404);
      }

      // Mã hóa password mới
      const encryptedData = await this.securityService.encryptPasswordData(passwordData);
      
      const updatedPassword = await this.passwordRepository.update(id, encryptedData);
      
      // Log audit trail
      await this.securityService.logAuditEvent('PASSWORD_UPDATED', {
        passwordId: id,
        service: updatedPassword.service
      });

      return updatedPassword;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update password', 500, error);
    }
  }

  /**
   * Xóa password
   * @param {string} id - Password ID
   * @returns {Promise<void>}
   */
  async deletePassword(id) {
    try {
      const existingPassword = await this.passwordRepository.findById(id);
      if (!existingPassword) {
        throw new AppError('Password not found', 404);
      }

      await this.passwordRepository.delete(id);
      
      // Log audit trail
      await this.securityService.logAuditEvent('PASSWORD_DELETED', {
        passwordId: id,
        service: existingPassword.service
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete password', 500, error);
    }
  }

  /**
   * Lấy thống kê passwords
   * @returns {Promise<Object>} Statistics
   */
  async getStats() {
    try {
      const [total, recentCount, serviceStats] = await Promise.all([
        this.passwordRepository.count(),
        this.passwordRepository.countRecent(30), // 30 days
        this.passwordRepository.getServiceStats()
      ]);

      return {
        total,
        recentCount,
        hasPasswords: total > 0,
        serviceStats,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new AppError('Failed to get statistics', 500, error);
    }
  }
}