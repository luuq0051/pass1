/**
 * Standardized Error Handling Patterns
 * Tạo consistent error handling across toàn bộ application
 */

import React from 'react';
import { logger } from './logger';
import { 
  ErrorType, 
  ErrorSeverity, 
  ErrorContext, 
  ErrorHandlerConfig,
  ErrorRecoveryStrategy 
} from '@/lib/types/error-types';

/**
 * Application Error class với enhanced context
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly userMessage: string;
  public readonly timestamp: Date;
  public readonly recoveryStrategy: ErrorRecoveryStrategy;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    userMessage?: string,
    context: ErrorContext = {},
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.userMessage = userMessage || this.getDefaultUserMessage(type);
    this.context = {
      ...context,
      timestamp: new Date()
    };
    this.timestamp = new Date();
    this.recoveryStrategy = this.getDefaultRecoveryStrategy(type);
  }

  private getDefaultUserMessage(type: ErrorType): string {
    const messages = {
      [ErrorType.VALIDATION]: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
      [ErrorType.DATABASE]: 'Có lỗi khi truy cập dữ liệu. Vui lòng thử lại.',
      [ErrorType.NETWORK]: 'Có lỗi kết nối. Vui lòng kiểm tra internet và thử lại.',
      [ErrorType.AUTHENTICATION]: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      [ErrorType.PERMISSION]: 'Bạn không có quyền thực hiện thao tác này.',
      [ErrorType.CLIPBOARD]: 'Không thể truy cập clipboard. Vui lòng thử lại.',
      [ErrorType.UNKNOWN]: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
    };
    return messages[type];
  }

  private getDefaultRecoveryStrategy(type: ErrorType): ErrorRecoveryStrategy {
    const strategies = {
      [ErrorType.VALIDATION]: ErrorRecoveryStrategy.FALLBACK,
      [ErrorType.DATABASE]: ErrorRecoveryStrategy.RETRY,
      [ErrorType.NETWORK]: ErrorRecoveryStrategy.RETRY,
      [ErrorType.AUTHENTICATION]: ErrorRecoveryStrategy.REDIRECT,
      [ErrorType.PERMISSION]: ErrorRecoveryStrategy.FALLBACK,
      [ErrorType.CLIPBOARD]: ErrorRecoveryStrategy.RETRY,
      [ErrorType.UNKNOWN]: ErrorRecoveryStrategy.RETRY
    };
    return strategies[type];
  }

  /**
   * Serialize error for logging/reporting
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      userMessage: this.userMessage,
      context: this.context,
      timestamp: this.timestamp,
      recoveryStrategy: this.recoveryStrategy,
      stack: this.stack
    };
  }
}

/**
 * Standardized async error handler với enhanced retry logic
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  config: ErrorHandlerConfig = {}
): Promise<T | null> {
  const {
    showToast = true,
    logError = true,
    fallbackValue = null,
    retryCount = 0,
    retryDelay = 1000,
    severity = ErrorSeverity.MEDIUM,
    context = {}
  } = config;

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const result = await operation();
      
      // Log successful retry nếu có
      if (attempt > 0 && logError) {
        logger.info(`Operation succeeded after ${attempt} retries`, { 
          context,
          attempts: attempt + 1 
        });
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      
      const appError = lastError instanceof AppError ? lastError : 
        new AppError(
          lastError.message, 
          ErrorType.UNKNOWN, 
          undefined, 
          { ...context, attempt: attempt + 1 },
          severity
        );
      
      if (logError) {
        logger.error(
          `Operation failed (attempt ${attempt + 1}/${retryCount + 1})`, 
          appError,
          appError.context
        );
      }
      
      // Retry logic với exponential backoff
      if (attempt < retryCount && appError.recoveryStrategy === ErrorRecoveryStrategy.RETRY) {
        const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Store last error for final handling
      lastError = appError;
      break;
    }
  }
  
  // All attempts failed
  if (lastError) {
    if (showToast) {
      // Toast sẽ được handle bởi global error handler
      throw lastError;
    }
  }
  
  return fallbackValue;
}

/**
 * Error boundary helper với recovery strategies
 */
export function createErrorBoundaryFallback(componentName: string) {
  return function ErrorFallback({ 
    error, 
    resetErrorBoundary 
  }: { 
    error: Error;
    resetErrorBoundary?: () => void;
  }) {
    const appError = error instanceof AppError ? error : 
      new AppError(error.message, ErrorType.UNKNOWN, undefined, { component: componentName });
    
    logger.error(`Error boundary caught error in ${componentName}`, appError);
    
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-lg font-semibold text-red-600 mb-2">
          Có lỗi xảy ra
        </h2>
        <p className="text-gray-600 mb-4">
          {appError.userMessage}
        </p>
        <div className="flex gap-2">
          {resetErrorBoundary && (
            <button
              onClick={resetErrorBoundary}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Thử lại
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  };
}

/**
 * Factory functions cho common errors
 */
export const ErrorFactory = {
  validation: (field: string, value: any, rule: string): AppError => 
    new AppError(
      `Validation failed for field '${field}' with rule '${rule}'`,
      ErrorType.VALIDATION,
      `Trường ${field} không hợp lệ`,
      { field, value, rule },
      ErrorSeverity.LOW
    ),

  database: (operation: string, details?: string): AppError => 
    new AppError(
      `Database operation '${operation}' failed: ${details}`,
      ErrorType.DATABASE,
      'Có lỗi khi truy cập dữ liệu',
      { operation, details },
      ErrorSeverity.HIGH
    ),

  network: (url: string, status?: number, statusText?: string): AppError => 
    new AppError(
      `Network request to '${url}' failed: ${status} ${statusText}`,
      ErrorType.NETWORK,
      'Có lỗi kết nối mạng',
      { url, status, statusText },
      ErrorSeverity.MEDIUM
    ),

  permission: (action: string, resource?: string): AppError =>
    new AppError(
      `Permission denied for action '${action}' on resource '${resource}'`,
      ErrorType.PERMISSION,
      'Bạn không có quyền thực hiện thao tác này',
      { action, resource },
      ErrorSeverity.MEDIUM
    )
};

// Re-export types for convenience
export { ErrorType, ErrorSeverity, ErrorRecoveryStrategy } from '@/lib/types/error-types';
export type { ErrorHandlerConfig, ErrorContext } from '@/lib/types/error-types';