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
 * Error handler wrapper cho async operations
 */
export interface ErrorHandlerConfig {
  showToast?: boolean;
  logError?: boolean;
  fallbackValue?: any;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Standardized async error handler
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
    retryDelay = 1000
  } = config;

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (logError) {
        logger.error(`Operation failed (attempt ${attempt + 1}/${retryCount + 1})`, lastError);
      }
      
      // Retry logic
      if (attempt < retryCount) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
    }
  }
  
  // All attempts failed
  if (lastError) {
    if (showToast) {
      const appError = lastError instanceof AppError ? lastError : 
        new AppError(lastError.message, ErrorType.UNKNOWN);
      
      // Toast sẽ được handle bởi global error handler
      throw appError;
    }
  }
  
  return fallbackValue;
}

/**
 * Error boundary helper
 */
export function createErrorBoundaryFallback(componentName: string) {
  return function ErrorFallback({ error }: { error: Error }) {
    logger.error(`Error boundary caught error in ${componentName}`, error);
    
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-lg font-semibold text-red-600 mb-2">
          Có lỗi xảy ra
        </h2>
        <p className="text-gray-600 mb-4">
          {error instanceof AppError ? error.userMessage : 'Vui lòng tải lại trang và thử lại.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Tải lại trang
        </button>
      </div>
    );
  };
}

/**
 * Validation error helper
 */
export function createValidationError(
  field: string,
  value: any,
  rule: string
): AppError {
  return new AppError(
    `Validation failed for field '${field}' with rule '${rule}'`,
    ErrorType.VALIDATION,
    `Trường ${field} không hợp lệ`,
    { field, value, rule }
  );
}

/**
 * Database error helper
 */
export function createDatabaseError(
  operation: string,
  details?: string
): AppError {
  return new AppError(
    `Database operation '${operation}' failed: ${details}`,
    ErrorType.DATABASE,
    'Có lỗi khi truy cập dữ liệu',
    { operation, details }
  );
}

/**
 * Network error helper
 */
export function createNetworkError(
  url: string,
  status?: number,
  statusText?: string
): AppError {
  return new AppError(
    `Network request to '${url}' failed: ${status} ${statusText}`,
    ErrorType.NETWORK,
    'Có lỗi kết nối mạng',
    { url, status, statusText }
  );
}