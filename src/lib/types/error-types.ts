/**
 * Error Types - Centralized Error Type Definitions
 * Tập trung tất cả error-related types để đảm bảo consistency
 */

/**
 * Custom Application Error class
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly context?: ErrorContext;
  public readonly userMessage: string;
  public readonly timestamp: Date;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    userMessage?: string,
    context?: ErrorContext
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.userMessage = userMessage || message;
    this.context = context;
    this.timestamp = new Date();

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Create a validation error
   */
  static validation(message: string, userMessage?: string, context?: ErrorContext): AppError {
    return new AppError(message, ErrorType.VALIDATION, ErrorSeverity.MEDIUM, userMessage, context);
  }

  /**
   * Create a database error
   */
  static database(message: string, userMessage?: string, context?: ErrorContext): AppError {
    return new AppError(message, ErrorType.DATABASE, ErrorSeverity.HIGH, userMessage, context);
  }

  /**
   * Create a network error
   */
  static network(message: string, userMessage?: string, context?: ErrorContext): AppError {
    return new AppError(message, ErrorType.NETWORK, ErrorSeverity.MEDIUM, userMessage, context);
  }

  /**
   * Create an authentication error
   */
  static authentication(message: string, userMessage?: string, context?: ErrorContext): AppError {
    return new AppError(message, ErrorType.AUTHENTICATION, ErrorSeverity.HIGH, userMessage, context);
  }

  /**
   * Convert to JSON for logging/reporting
   */
  toJSON(): ErrorReport {
    return {
      id: `${this.type}-${Date.now()}`,
      type: this.type,
      severity: this.severity,
      message: this.message,
      userMessage: this.userMessage,
      stack: this.stack,
      context: this.context || {},
      timestamp: this.timestamp,
      resolved: false
    };
  }
}

/**
 * Standard error types cho application
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  PERMISSION = 'PERMISSION',
  CLIPBOARD = 'CLIPBOARD',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Error context interface
 */
export interface ErrorContext {
  component?: string;
  operation?: string;
  userId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

/**
 * Error handler configuration interface
 */
export interface ErrorHandlerConfig {
  showToast?: boolean;
  logError?: boolean;
  fallbackValue?: any;
  retryCount?: number;
  retryDelay?: number;
  severity?: ErrorSeverity;
  context?: ErrorContext;
}

/**
 * Error reporting interface
 */
export interface ErrorReport {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  stack?: string;
  context: ErrorContext;
  timestamp: Date;
  resolved: boolean;
}

/**
 * Error boundary props interface
 */
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

/**
 * Error recovery strategies
 */
export enum ErrorRecoveryStrategy {
  RETRY = 'RETRY',
  FALLBACK = 'FALLBACK',
  REDIRECT = 'REDIRECT',
  RELOAD = 'RELOAD',
  IGNORE = 'IGNORE'
}

/**
 * Error recovery configuration
 */
export interface ErrorRecoveryConfig {
  strategy: ErrorRecoveryStrategy;
  maxRetries?: number;
  retryDelay?: number;
  fallbackComponent?: React.ComponentType;
  redirectUrl?: string;
}