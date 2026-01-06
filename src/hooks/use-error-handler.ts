/**
 * useErrorHandler Hook - Refactored với Standardized Error Patterns
 * Centralized error handling sử dụng error-patterns utilities
 * 
 * Features:
 * - Consistent error messaging với AppError
 * - Toast integration
 * - Error logging
 * - Retry logic support
 * - Type-safe error handling
 */

import { useCallback } from 'react';
import { useToastNotifications } from '@/hooks/use-toast-notifications';
import { ERROR_MESSAGES } from '@/lib/constants/app-constants';
import { 
  AppError, 
  ErrorType, 
  handleAsyncOperation,
  type ErrorHandlerConfig 
} from '@/lib/utils/error-patterns';

/**
 * Hook-specific error handler configuration
 * Extends base ErrorHandlerConfig với toast-specific options
 */
interface UseErrorHandlerConfig extends ErrorHandlerConfig {
  fallbackMessage?: string;
}

/**
 * Error handler return type
 */
interface UseErrorHandlerReturn {
  handleError: (error: unknown, config?: UseErrorHandlerConfig) => void;
  handleAsyncError: <T>(
    operation: () => Promise<T>,
    config?: UseErrorHandlerConfig
  ) => Promise<T | null>;
}

/**
 * Custom hook sử dụng standardized error patterns
 * Refactor: Tích hợp với error-patterns.ts để tránh code duplication
 */
export const useErrorHandler = (): UseErrorHandlerReturn => {
  const { showError, showErrorWithRetry } = useToastNotifications();

  /**
   * Xử lý error với AppError patterns
   */
  const handleError = useCallback((
    error: unknown,
    config: UseErrorHandlerConfig = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      fallbackMessage = ERROR_MESSAGES.UNKNOWN_ERROR
    } = config;

    // Convert to AppError nếu chưa phải
    const appError = error instanceof AppError ? error : 
      new AppError(
        error instanceof Error ? error.message : 'Unknown error',
        ErrorType.UNKNOWN,
        fallbackMessage
      );

    // Log error nếu được enable
    if (logError) {
      console.error('Error handled by useErrorHandler', appError);
    }

    // Hiển thị toast notification nếu được enable
    if (showToast) {
      showError(appError.userMessage);
    }
  }, [showError]);

  /**
   * Wrapper cho async operations sử dụng standardized handler
   */
  const handleAsyncError = useCallback(async <T>(
    operation: () => Promise<T>,
    config: UseErrorHandlerConfig = {}
  ): Promise<T | null> => {
    try {
      // Sử dụng standardized async handler
      return await handleAsyncOperation(operation, {
        ...config,
        showToast: false, // Handle toast manually để có control tốt hơn
      });
    } catch (error) {
      handleError(error, config);
      return null;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
  };
};