/**
 * Enhanced Logger Utility
 * Comprehensive logging system với multiple levels và performance tracking
 */

export class Logger {
  constructor(context = 'App') {
    this.context = context;
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };
  }

  /**
   * Kiểm tra xem level có được log hay không
   */
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  /**
   * Format log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      context: this.context,
      message,
      ...meta
    };

    return JSON.stringify(logEntry, null, process.env.NODE_ENV === 'development' ? 2 : 0);
  }

  /**
   * Error level logging
   */
  error(message, error = null, meta = {}) {
    if (!this.shouldLog('error')) return;

    const errorMeta = {
      ...meta,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      } : null
    };

    console.error(this.formatMessage('error', message, errorMeta));
  }

  /**
   * Warning level logging
   */
  warn(message, meta = {}) {
    if (!this.shouldLog('warn')) return;
    console.warn(this.formatMessage('warn', message, meta));
  }

  /**
   * Info level logging
   */
  info(message, meta = {}) {
    if (!this.shouldLog('info')) return;
    console.info(this.formatMessage('info', message, meta));
  }

  /**
   * Debug level logging
   */
  debug(message, meta = {}) {
    if (!this.shouldLog('debug')) return;
    console.debug(this.formatMessage('debug', message, meta));
  }

  /**
   * Trace level logging
   */
  trace(message, meta = {}) {
    if (!this.shouldLog('trace')) return;
    console.trace(this.formatMessage('trace', message, meta));
  }

  /**
   * Performance timing
   */
  time(label) {
    console.time(`${this.context}:${label}`);
  }

  /**
   * End performance timing
   */
  timeEnd(label) {
    console.timeEnd(`${this.context}:${label}`);
  }

  /**
   * Log HTTP request
   */
  logRequest(req, res, responseTime) {
    const meta = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    };

    const level = res.statusCode >= 400 ? 'warn' : 'info';
    this[level](`${req.method} ${req.url}`, meta);
  }

  /**
   * Log database operation
   */
  logDbOperation(operation, table, duration, recordCount = null) {
    const meta = {
      operation,
      table,
      duration: `${duration}ms`,
      recordCount
    };

    this.debug(`Database operation: ${operation} on ${table}`, meta);
  }

  /**
   * Log security event
   */
  logSecurityEvent(event, details = {}) {
    const meta = {
      securityEvent: event,
      ...details,
      severity: 'HIGH'
    };

    this.warn(`Security event: ${event}`, meta);
  }
}