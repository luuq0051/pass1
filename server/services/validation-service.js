/**
 * Validation Service - Input validation và sanitization
 * Sử dụng Zod schema để validate data
 */

import { z } from 'zod';
import { AppError } from '../utils/app-error.js';

export class ValidationService {
  constructor() {
    // Schema cho password data
    this.passwordSchema = z.object({
      service: z.string()
        .min(1, 'Service name is required')
        .max(100, 'Service name too long')
        .trim(),
      username: z.string()
        .min(1, 'Username is required')
        .max(100, 'Username too long')
        .trim(),
      password: z.string()
        .min(1, 'Password is required')
        .max(500, 'Password too long')
    });

    // Schema cho search parameters
    this.searchParamsSchema = z.object({
      search: z.string()
        .max(100, 'Search term too long')
        .optional()
        .transform(val => val?.trim()),
      page: z.number()
        .int()
        .min(1, 'Page must be at least 1')
        .max(1000, 'Page number too high')
        .default(1),
      limit: z.number()
        .int()
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit cannot exceed 100')
        .default(50)
    });
  }

  /**
   * Validate password data
   * @param {Object} data - Raw password data
   * @returns {Object} Validated and sanitized data
   * @throws {AppError} Validation error
   */
  validatePasswordData(data) {
    try {
      return this.passwordSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new AppError(`Validation failed: ${messages.join(', ')}`, 400);
      }
      throw new AppError('Invalid password data', 400, error);
    }
  }

  /**
   * Validate search parameters
   * @param {Object} params - Raw search parameters
   * @returns {Object} Validated and sanitized parameters
   * @throws {AppError} Validation error
   */
  validateSearchParams(params) {
    try {
      return this.searchParamsSchema.parse(params);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new AppError(`Invalid search parameters: ${messages.join(', ')}`, 400);
      }
      throw new AppError('Invalid search parameters', 400, error);
    }
  }

  /**
   * Validate ID parameter
   * @param {string} id - ID to validate
   * @returns {string} Validated ID
   * @throws {AppError} Validation error
   */
  validateId(id) {
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid ID format', 400);
    }

    // Kiểm tra format UUID hoặc số nguyên
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const integerRegex = /^\d+$/;

    if (!uuidRegex.test(id) && !integerRegex.test(id)) {
      throw new AppError('Invalid ID format', 400);
    }

    return id;
  }

  /**
   * Sanitize SQL input để tránh injection
   * @param {string} input - Input string
   * @returns {string} Sanitized string
   */
  sanitizeSqlInput(input) {
    if (typeof input !== 'string') return input;
    
    // Loại bỏ các ký tự nguy hiểm
    return input
      .replace(/['"\\;]/g, '') // Loại bỏ quotes và semicolon
      .replace(/--/g, '') // Loại bỏ SQL comments
      .replace(/\/\*/g, '') // Loại bỏ block comments
      .trim();
  }
}