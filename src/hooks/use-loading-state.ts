/**
 * useLoadingState Hook - Enhanced với Standardized Error Patterns
 * Tách riêng loading state management để tái sử dụng
 * 
 * Features:
 * - Centralized loading state
 * - Standardized error handling
 * - Operation wrapper với retry logic
 * - Toast notifications integration
 * - Performance tracking
 */

import { useState, useCallback } from 'react';
import { useToastNotifications } from '@/hooks/use-toast-notifications';
import { 
  AppError, 
  ErrorType, 
  handleAsyncOperation,
  type ErrorHandlerConfig 
} from '@/lib/utils/error-patterns';

interface LoadingStateConfig {
  showToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
  logErrors?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

interface UseLoadingStateReturn {
  loading: boolean;
  error: string | null;
  executeOperation: <T>(
    operation: () => Promise<T>,
    config?: LoadingStateConfig
  ) => Promise<T | null>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

/**
 * Enhanced useLoadingState Hook với Standardized Error Patterns
 * Refactor: Tích hợp error patterns và retry logic
 */
export const useLoadingState = (): UseLoadingStateReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToastNotifications();

  const executeOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    config: LoadingStateConfig = {}
  ): Promise<T | null> => {
    const {
      showToast = true,
      successMessage,
      errorMessage,
      logErrors = true,
      retryCount = 0,
      retryDelay = 1000
    } = config;

    setLoading(true);
    setError(null);
    
    try {
      // Sử dụng standardized error handler với retry logic
      const result = await handleAsyncOperation(operation, {
        showToast: false, // Handle toast manually để có control tốt hơn
        logError: logErrors,
        retryCount,
        retryDelay
      });
      
      if (result !== null) {
        // Show success toast if configured
        if (showToast && successMessage) {
          showSuccess(successMessage);
        }
        return result;
      }
      
      return null;
    } catch (err) {
      const appError = err instanceof AppError ? err : 
        new AppError(
          err instanceof Error ? err.message : 'Unknown error',
          ErrorType.UNKNOWN,
          errorMessage
        );
      
      setError(appError.userMessage);
      
      // Show error toast if enabled
      if (showToast) {
        showError(appError.userMessage);
      }
      
      throw appError;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    executeOperation,
    setError,
    clearError,
  };
};