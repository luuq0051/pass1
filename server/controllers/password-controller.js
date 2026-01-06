/**
 * Password Controller - Tách biệt business logic
 * Áp dụng Single Responsibility Principle
 */

import { PasswordService } from '../services/password-service.js';
import { ValidationService } from '../services/validation-service.js';
import { ResponseHelper } from '../utils/response-helper.js';
import { Logger } from '../utils/logger.js';

export class PasswordController {
  constructor() {
    this.passwordService = new PasswordService();
    this.validationService = new ValidationService();
    this.logger = new Logger('PasswordController');
  }

  /**
   * Lấy danh sách passwords với tìm kiếm
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getPasswords(req, res) {
    try {
      const { search, page = 1, limit = 50 } = req.query;
      
      // Validate và sanitize input
      const validatedParams = this.validationService.validateSearchParams({
        search,
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100) // Giới hạn max 100 records
      });

      const result = await this.passwordService.getPasswords(validatedParams);
      
      this.logger.info('Passwords retrieved successfully', { 
        count: result.data.length,
        search: validatedParams.search 
      });

      return ResponseHelper.success(res, result);
    } catch (error) {
      this.logger.error('Failed to get passwords', error);
      return ResponseHelper.error(res, error);
    }
  }

  /**
   * Thêm password mới
   * @param {Request} req - Express request object  
   * @param {Response} res - Express response object
   */
  async createPassword(req, res) {
    try {
      const passwordData = this.validationService.validatePasswordData(req.body);
      
      const newPassword = await this.passwordService.createPassword(passwordData);
      
      this.logger.info('Password created successfully', { 
        id: newPassword.id,
        service: newPassword.service 
      });

      return ResponseHelper.created(res, newPassword);
    } catch (error) {
      this.logger.error('Failed to create password', error);
      return ResponseHelper.error(res, error);
    }
  }

  /**
   * Cập nhật password
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object  
   */
  async updatePassword(req, res) {
    try {
      const { id } = req.params;
      const passwordData = this.validationService.validatePasswordData(req.body);
      
      const updatedPassword = await this.passwordService.updatePassword(id, passwordData);
      
      this.logger.info('Password updated successfully', { id });

      return ResponseHelper.success(res, updatedPassword);
    } catch (error) {
      this.logger.error('Failed to update password', error);
      return ResponseHelper.error(res, error);
    }
  }

  /**
   * Xóa password
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async deletePassword(req, res) {
    try {
      const { id } = req.params;
      
      await this.passwordService.deletePassword(id);
      
      this.logger.info('Password deleted successfully', { id });

      return ResponseHelper.success(res, { message: 'Password deleted successfully' });
    } catch (error) {
      this.logger.error('Failed to delete password', error);
      return ResponseHelper.error(res, error);
    }
  }

  /**
   * Lấy thống kê passwords
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getStats(req, res) {
    try {
      const stats = await this.passwordService.getStats();
      
      return ResponseHelper.success(res, stats);
    } catch (error) {
      this.logger.error('Failed to get stats', error);
      return ResponseHelper.error(res, error);
    }
  }
}