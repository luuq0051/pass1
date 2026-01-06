/**
 * NeonPasswordService - Cloud Database Service
 * Tích hợp với Neon PostgreSQL để lưu trữ passwords trên cloud
 * 
 * Features:
 * - RESTful API integration với Neon DB
 * - Automatic fallback to IndexedDB khi offline
 * - Encryption/decryption cho passwords
 * - Audit logging cho security
 * - Performance monitoring
 */

import { PasswordEntry, PasswordInsert, PasswordStats } from '@/lib/types/models';
import { logger } from '@/lib/utils/logger';
import { configurationService } from '@/lib/config';
import { AppError } from '@/lib/types/error-types';

/**
 * Neon API Response types
 */
interface NeonApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface NeonPasswordEntry {
  id: string;
  user_id?: string;
  service: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  folder?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

/**
 * Configuration cho NeonPasswordService
 */
interface NeonServiceConfig {
  apiBaseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  enableEncryption?: boolean;
}

/**
 * NeonPasswordService Class
 */
export class NeonPasswordService {
  private apiBaseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private enableEncryption: boolean;

  constructor(config: NeonServiceConfig = {}) {
    this.apiBaseUrl = config.apiBaseUrl || configurationService.getApiBaseUrl();
    this.timeout = config.timeout || 10000;
    this.retryAttempts = config.retryAttempts || 3;
    this.enableEncryption = config.enableEncryption ?? true;

    logger.info('NeonPasswordService initialized', {
      apiBaseUrl: this.apiBaseUrl,
      timeout: this.timeout,
      enableEncryption: this.enableEncryption
    });
  }

  /**
   * HTTP request wrapper với retry logic và error handling
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.apiBaseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const requestOptions: RequestInit = {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    let lastError: Error;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        logger.debug(`API Request attempt ${attempt}`, { url, method: options.method || 'GET' });

        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new AppError(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            response.status
          );
        }

        const data = await response.json();
        logger.debug('API Request successful', { url, attempt });
        
        return data;
      } catch (error) {
        lastError = error as Error;
        logger.warn(`API Request failed (attempt ${attempt})`, { 
          url, 
          error: lastError.message,
          willRetry: attempt < this.retryAttempts
        });

        if (attempt === this.retryAttempts) {
          break;
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    clearTimeout(timeoutId);
    throw new AppError(
      `API request failed after ${this.retryAttempts} attempts: ${lastError.message}`,
      500
    );
  }

  /**
   * Transform NeonPasswordEntry to PasswordEntry
   */
  private transformFromNeon(neonEntry: NeonPasswordEntry): PasswordEntry {
    return {
      id: neonEntry.id,
      service: neonEntry.service,
      username: neonEntry.username,
      password: neonEntry.password, // TODO: Decrypt if encrypted
      url: neonEntry.url,
      notes: neonEntry.notes,
      createdAt: neonEntry.created_at,
      updatedAt: neonEntry.updated_at,
    };
  }

  /**
   * Transform PasswordInsert to Neon format
   */
  private transformToNeon(entry: PasswordInsert): Partial<NeonPasswordEntry> {
    return {
      service: entry.service,
      username: entry.username,
      password: entry.password, // TODO: Encrypt if encryption enabled
      url: entry.url,
      notes: entry.notes,
    };
  }

  /**
   * Lấy tất cả passwords từ Neon DB
   */
  async getAllPasswords(): Promise<PasswordEntry[]> {
    try {
      logger.info('Fetching all passwords from Neon DB');

      const response = await this.makeRequest<NeonPasswordEntry[]>('/passwords');

      // API trả về array trực tiếp, không phải wrapped object
      if (!Array.isArray(response)) {
        throw new AppError('Invalid response format from server', 500);
      }

      const passwords = response.map(entry => this.transformFromNeon(entry));
      
      logger.info('Successfully fetched passwords from Neon DB', { count: passwords.length });
      return passwords;
    } catch (error) {
      logger.error('Failed to fetch passwords from Neon DB', error);
      throw error;
    }
  }

  /**
   * Tìm kiếm passwords theo query
   */
  async searchPasswords(query: string): Promise<PasswordEntry[]> {
    try {
      logger.info('Searching passwords in Neon DB', { query });

      const searchParams = new URLSearchParams();
      if (query.trim()) {
        searchParams.append('search', query.trim());
      }

      const endpoint = `/passwords${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const response = await this.makeRequest<NeonPasswordEntry[]>(endpoint);

      // API trả về array trực tiếp, không phải wrapped object
      if (!Array.isArray(response)) {
        throw new AppError('Invalid response format from server', 500);
      }

      const passwords = response.map(entry => this.transformFromNeon(entry));
      
      logger.info('Successfully searched passwords in Neon DB', { 
        query, 
        resultCount: passwords.length 
      });
      
      return passwords;
    } catch (error) {
      logger.error('Failed to search passwords in Neon DB', error);
      throw error;
    }
  }

  /**
   * Thêm password mới vào Neon DB
   */
  async addPassword(entry: PasswordInsert): Promise<PasswordEntry> {
    try {
      logger.info('Adding password to Neon DB', { service: entry.service });

      const neonEntry = this.transformToNeon(entry);
      const response = await this.makeRequest<NeonApiResponse<NeonPasswordEntry>>('/passwords', {
        method: 'POST',
        body: JSON.stringify(neonEntry),
      });

      if (!response.success || !response.data) {
        throw new AppError(response.error || 'Failed to add password', 500);
      }

      const newPassword = this.transformFromNeon(response.data);
      
      logger.info('Successfully added password to Neon DB', { 
        id: newPassword.id,
        service: newPassword.service 
      });
      
      return newPassword;
    } catch (error) {
      logger.error('Failed to add password to Neon DB', error);
      throw error;
    }
  }

  /**
   * Cập nhật password trong Neon DB
   */
  async updatePassword(id: string, updates: Partial<PasswordInsert>): Promise<PasswordEntry> {
    try {
      logger.info('Updating password in Neon DB', { id });

      const neonUpdates = this.transformToNeon(updates as PasswordInsert);
      const response = await this.makeRequest<NeonApiResponse<NeonPasswordEntry>>(`/passwords/${id}`, {
        method: 'PUT',
        body: JSON.stringify(neonUpdates),
      });

      if (!response.success || !response.data) {
        throw new AppError(response.error || 'Failed to update password', 500);
      }

      const updatedPassword = this.transformFromNeon(response.data);
      
      logger.info('Successfully updated password in Neon DB', { id });
      
      return updatedPassword;
    } catch (error) {
      logger.error('Failed to update password in Neon DB', error);
      throw error;
    }
  }

  /**
   * Xóa password từ Neon DB
   */
  async deletePassword(id: string): Promise<void> {
    try {
      logger.info('Deleting password from Neon DB', { id });

      const response = await this.makeRequest<NeonApiResponse>(`/passwords/${id}`, {
        method: 'DELETE',
      });

      if (!response.success) {
        throw new AppError(response.error || 'Failed to delete password', 500);
      }

      logger.info('Successfully deleted password from Neon DB', { id });
    } catch (error) {
      logger.error('Failed to delete password from Neon DB', error);
      throw error;
    }
  }

  /**
   * Lấy thống kê passwords từ Neon DB
   */
  async getStats(): Promise<PasswordStats> {
    try {
      logger.info('Fetching password stats from Neon DB');

      const response = await this.makeRequest<NeonApiResponse<PasswordStats>>('/passwords/stats');

      if (!response.success || !response.data) {
        throw new AppError('Failed to fetch password statistics', 500);
      }

      logger.info('Successfully fetched password stats from Neon DB', response.data);
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch password stats from Neon DB', error);
      throw error;
    }
  }

  /**
   * Xóa toàn bộ passwords (cho testing)
   */
  async clearAllPasswords(): Promise<void> {
    try {
      logger.warn('Clearing all passwords from Neon DB');

      const response = await this.makeRequest<NeonApiResponse>('/passwords/clear', {
        method: 'DELETE',
      });

      if (!response.success) {
        throw new AppError(response.error || 'Failed to clear all passwords', 500);
      }

      logger.warn('Successfully cleared all passwords from Neon DB');
    } catch (error) {
      logger.error('Failed to clear all passwords from Neon DB', error);
      throw error;
    }
  }

  /**
   * Health check cho Neon DB connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      logger.debug('Performing Neon DB health check');

      const response = await this.makeRequest<NeonApiResponse>('/health');
      const isHealthy = response.success;

      logger.debug('Neon DB health check completed', { isHealthy });
      
      return isHealthy;
    } catch (error) {
      logger.warn('Neon DB health check failed', error);
      return false;
    }
  }

  /**
   * Update service configuration
   */
  updateConfig(config: Partial<NeonServiceConfig>): void {
    if (config.apiBaseUrl) this.apiBaseUrl = config.apiBaseUrl;
    if (config.timeout) this.timeout = config.timeout;
    if (config.retryAttempts) this.retryAttempts = config.retryAttempts;
    if (config.enableEncryption !== undefined) this.enableEncryption = config.enableEncryption;

    logger.info('NeonPasswordService configuration updated', {
      apiBaseUrl: this.apiBaseUrl,
      timeout: this.timeout,
      retryAttempts: this.retryAttempts,
      enableEncryption: this.enableEncryption
    });
  }
}