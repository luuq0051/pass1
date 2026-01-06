/**
 * usePasswords Hook - Refactored với Service Layer và Performance Monitoring
 * Quản lý passwords với clean architecture pattern
 * 
 * Features:
 * - Service layer separation (theo steering rules)
 * - Centralized error handling
 * - Loading states management
 * - Toast notifications
 * - Type safety
 * - Performance monitoring
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { PasswordEntry, PasswordInsert, PasswordStats } from '@/lib/types/models';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { useLoadingState } from '@/hooks/use-loading-state';
import { ServiceFactory } from '@/lib/services/service-factory';
import { SUCCESS_MESSAGES } from '@/lib/constants/app-constants';
import { logger } from '@/lib/utils/logger';
import { configurationService } from '@/lib/config';
import { measureAsync, logMemoryUsage } from '@/lib/utils/performance-monitor';

/**
 * Hook configuration
 */
interface UsePasswordsConfig {
  enableApiSync?: boolean;
  autoInitialize?: boolean;
}

/**
 * Hook return type
 */
interface UsePasswordsReturn {
  // Data
  passwords: PasswordEntry[];
  loading: boolean;
  error: string | null;
  stats: PasswordStats;
  
  // Actions
  searchPasswords: (query?: string) => Promise<void>;
  addPassword: (entry: PasswordInsert) => Promise<void>;
  updatePassword: (id: string, entry: Partial<PasswordInsert>) => Promise<void>;
  deletePassword: (id: string) => Promise<void>;
  refreshPasswords: () => Promise<void>;
  clearAllPasswords: () => Promise<void>;
}

/**
 * Main usePasswords Hook - Refactored
 */
export const usePasswords = (config: UsePasswordsConfig = {}): UsePasswordsReturn => {
  const { enableApiSync = false, autoInitialize = true } = config;
  
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const { handleAsyncError } = useErrorHandler();
  const { loading, error, executeOperation } = useLoadingState();

  // Khởi tạo service với factory pattern và memoization
  const passwordService = useMemo(() => {
    logger.debug('Initializing PasswordService via Factory', { 
      enableApiSync,
      apiBaseUrl: configurationService.getApiBaseUrl(),
      isProduction: configurationService.isProduction()
    });
    return ServiceFactory.getDefaultPasswordService();
  }, [enableApiSync]);

  // Cập nhật config khi enableApiSync thay đổi
  useEffect(() => {
    passwordService.updateConfig({ enableApiSync });
  }, [passwordService, enableApiSync]);

  /**
   * Initialize database on mount
   */
  useEffect(() => {
    if (autoInitialize) {
      logger.info('Auto-initializing passwords');
      refreshPasswords();
    }
  }, [autoInitialize]);

  /**
   * Load passwords từ service với enhanced error handling và performance monitoring
   */
  const refreshPasswords = useCallback(async () => {
    const result = await measureAsync(
      'usePasswords.refreshPasswords',
      async () => {
        return await handleAsyncError(
          () => executeOperation(() => passwordService.getAllPasswords()),
          { showToast: false } // Không hiển thị toast cho refresh
        );
      },
      { passwordCount: passwords.length }
    );
    
    if (result) {
      setPasswords(result);
      logger.info('Passwords refreshed successfully', { count: result.length });
      
      // Log memory usage sau khi load data
      logMemoryUsage('after password refresh');
    }
  }, [passwordService, executeOperation, handleAsyncError, passwords.length]);

  /**
   * Tìm kiếm passwords với logging và performance monitoring
   */
  const searchPasswords = useCallback(async (query?: string) => {
    const result = await measureAsync(
      'usePasswords.searchPasswords',
      async () => {
        logger.debug('Searching passwords', { query });
        
        return await handleAsyncError(
          () => executeOperation(() => passwordService.searchPasswords(query || '')),
          { showToast: false }
        );
      },
      { query, currentPasswordCount: passwords.length }
    );
    
    if (result) {
      setPasswords(result);
      logger.info('Search completed', { query, resultCount: result.length });
    }
  }, [passwordService, executeOperation, handleAsyncError, passwords.length]);

  /**
   * Thêm password mới với success notification và performance monitoring
   */
  const addPassword = useCallback(async (entry: PasswordInsert) => {
    await measureAsync(
      'usePasswords.addPassword',
      async () => {
        logger.info('Adding new password', { service: entry.service });
        
        await executeOperation(
          () => passwordService.addPassword(entry),
          { 
            successMessage: SUCCESS_MESSAGES.PASSWORD_ADDED,
            showToast: true 
          }
        );
        
        // Refresh danh sách sau khi thêm thành công
        await refreshPasswords();
      },
      { service: entry.service }
    );
  }, [passwordService, executeOperation, refreshPasswords]);

  /**
   * Cập nhật password với success notification và performance monitoring
   */
  const updatePassword = useCallback(async (id: string, entry: Partial<PasswordInsert>) => {
    await measureAsync(
      'usePasswords.updatePassword',
      async () => {
        logger.info('Updating password', { id, service: entry.service });
        
        await executeOperation(
          () => passwordService.updatePassword(id, entry),
          { 
            successMessage: SUCCESS_MESSAGES.PASSWORD_UPDATED,
            showToast: true 
          }
        );
        
        // Refresh danh sách sau khi cập nhật thành công
        await refreshPasswords();
      },
      { id, service: entry.service }
    );
  }, [passwordService, executeOperation, refreshPasswords]);

  /**
   * Xóa password với success notification và performance monitoring
   */
  const deletePassword = useCallback(async (id: string) => {
    await measureAsync(
      'usePasswords.deletePassword',
      async () => {
        logger.info('Deleting password', { id });
        
        await executeOperation(
          () => passwordService.deletePassword(id),
          { 
            successMessage: SUCCESS_MESSAGES.PASSWORD_DELETED,
            showToast: true 
          }
        );
        
        // Refresh danh sách sau khi xóa thành công
        await refreshPasswords();
      },
      { id }
    );
  }, [passwordService, executeOperation, refreshPasswords]);

  /**
   * Xóa toàn bộ passwords (cho testing) với performance monitoring
   */
  const clearAllPasswords = useCallback(async () => {
    await measureAsync(
      'usePasswords.clearAllPasswords',
      async () => {
        logger.warn('Clearing all passwords');
        
        await executeOperation(
          () => passwordService.clearAllPasswords(),
          { 
            successMessage: "Đã xóa toàn bộ mật khẩu",
            showToast: true 
          }
        );
        
        // Refresh danh sách sau khi xóa thành công
        await refreshPasswords();
        
        // Log memory usage sau khi clear
        logMemoryUsage('after clear all passwords');
      }
    );
  }, [passwordService, executeOperation, refreshPasswords]);

  /**
   * Tính toán stats từ passwords hiện tại
   */
  const stats = useMemo((): PasswordStats => ({
    total: passwords.length,
    hasPasswords: passwords.length > 0
  }), [passwords]);

  return {
    // Data
    passwords,
    loading,
    error,
    stats,
    
    // Actions
    searchPasswords,
    addPassword,
    updatePassword,
    deletePassword,
    refreshPasswords,
    clearAllPasswords,
  };
};