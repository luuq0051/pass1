/**
 * Response Helper - Chuẩn hóa API responses
 * Áp dụng consistent response format
 */

export class ResponseHelper {
  /**
   * Success response (200)
   * @param {Response} res - Express response object
   * @param {*} data - Response data
   * @param {string} message - Success message
   */
  static success(res, data = null, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Created response (201)
   * @param {Response} res - Express response object
   * @param {*} data - Created resource data
   * @param {string} message - Success message
   */
  static created(res, data, message = 'Resource created successfully') {
    return res.status(201).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Error response
   * @param {Response} res - Express response object
   * @param {Error|AppError} error - Error object
   */
  static error(res, error) {
    // Xử lý AppError (custom error)
    if (error.isAppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: {
          code: error.code,
          details: error.details
        },
        timestamp: new Date().toISOString()
      });
    }

    // Xử lý database errors
    if (error.code) {
      const dbError = this.handleDatabaseError(error);
      return res.status(dbError.status).json({
        success: false,
        message: dbError.message,
        error: {
          code: error.code,
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        timestamp: new Date().toISOString()
      });
    }

    // Generic error
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';

    return res.status(statusCode).json({
      success: false,
      message,
      error: {
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Validation error response (400)
   * @param {Response} res - Express response object
   * @param {Array} errors - Validation errors
   */
  static validationError(res, errors) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: errors
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Not found response (404)
   * @param {Response} res - Express response object
   * @param {string} message - Not found message
   */
  static notFound(res, message = 'Resource not found') {
    return res.status(404).json({
      success: false,
      message,
      error: {
        code: 'NOT_FOUND'
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Unauthorized response (401)
   * @param {Response} res - Express response object
   * @param {string} message - Unauthorized message
   */
  static unauthorized(res, message = 'Unauthorized access') {
    return res.status(401).json({
      success: false,
      message,
      error: {
        code: 'UNAUTHORIZED'
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Forbidden response (403)
   * @param {Response} res - Express response object
   * @param {string} message - Forbidden message
   */
  static forbidden(res, message = 'Access forbidden') {
    return res.status(403).json({
      success: false,
      message,
      error: {
        code: 'FORBIDDEN'
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle database-specific errors
   * @param {Error} error - Database error
   * @returns {Object} Formatted error response
   */
  static handleDatabaseError(error) {
    switch (error.code) {
      case '23505': // Unique violation
        return {
          status: 409,
          message: 'Resource already exists'
        };
      case '23503': // Foreign key violation
        return {
          status: 400,
          message: 'Invalid reference to related resource'
        };
      case '23502': // Not null violation
        return {
          status: 400,
          message: 'Required field is missing'
        };
      case '42P01': // Undefined table
        return {
          status: 500,
          message: 'Database configuration error'
        };
      default:
        return {
          status: 500,
          message: 'Database operation failed'
        };
    }
  }
}