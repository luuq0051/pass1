/**
 * Error Types - Centralized Error Type Definitions
 * Tập trung tất cả error-related types để đảm bảo consistency
 */

/**
 * Standard error types cho application
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  PERMISSION = 'PERMISSION',
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