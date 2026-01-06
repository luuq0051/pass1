/**
 * Custom Application Error Class
 * Chuẩn hóa error handling trong toàn bộ ứng dụng
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, originalError = null, code = null) {
    super(message);
    
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isAppError = true;
    this.code = code;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Tạo BadRequest error (400)
   */
  static badRequest(message, details = null) {
    return new AppError(message, 400, null, 'BAD_REQUEST');
  }

  /**
   * Tạo Unauthorized error (401)
   */
  static unauthorized(message = 'Unauthorized access') {
    return new AppError(message, 401, null, 'UNAUTHORIZED');
  }

  /**
   * Tạo Forbidden error (403)
   */
  static forbidden(message = 'Access forbidden') {
    return new AppError(message, 403, null, 'FORBIDDEN');
  }

  /**
   * Tạo NotFound error (404)
   */
  static notFound(message = 'Resource not found') {
    return new AppError(message, 404, null, 'NOT_FOUND');
  }

  /**
   * Tạo Conflict error (409)
   */
  static conflict(message = 'Resource conflict') {
    return new AppError(message, 409, null, 'CONFLICT');
  }

  /**
   * Tạo Internal Server error (500)
   */
  static internal(message = 'Internal server error', originalError = null) {
    return new AppError(message, 500, originalError, 'INTERNAL_ERROR');
  }

  /**
   * Convert error object thành JSON
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      timestamp: this.timestamp,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
    };
  }
}