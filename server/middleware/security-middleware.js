/**
 * Security Middleware - Bảo mật cho API endpoints
 * Rate limiting, input validation, security headers
 */

import { SecurityService } from '../services/security-service.js';
import { ResponseHelper } from '../utils/response-helper.js';
import { Logger } from '../utils/logger.js';
import { AppError } from '../utils/app-error.js';

const logger = new Logger('SecurityMiddleware');
const securityService = new SecurityService();

/**
 * Rate limiting middleware
 * @param {number} maxRequests - Max requests per window
 * @param {number} windowMs - Time window in milliseconds
 */
export const rateLimiter = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [key, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(time => time > windowStart);
      if (validTimestamps.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, validTimestamps);
      }
    }
    
    // Check current requests
    const userRequests = requests.get(identifier) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      logger.warn('Rate limit exceeded', { 
        ip: identifier, 
        requests: recentRequests.length,
        maxRequests 
      });
      
      return ResponseHelper.error(res, new AppError('Too many requests', 429));
    }
    
    // Add current request
    recentRequests.push(now);
    requests.set(identifier, recentRequests);
    
    next();
  };
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req, res, next) => {
  // Prevent XSS attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // HTTPS enforcement (in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * Input sanitization middleware
 */
export const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = securityService.sanitizeInput(req.body[key]);
        }
      }
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      for (const key in req.query) {
        if (typeof req.query[key] === 'string') {
          req.query[key] = securityService.sanitizeInput(req.query[key]);
        }
      }
    }
    
    next();
  } catch (error) {
    logger.error('Input sanitization failed', error);
    return ResponseHelper.error(res, new AppError('Invalid input format', 400));
  }
};

/**
 * Request size limiter
 */
export const requestSizeLimiter = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxBytes = parseSize(maxSize);
    
    if (contentLength > maxBytes) {
      logger.warn('Request size exceeded', { 
        contentLength, 
        maxBytes,
        ip: req.ip 
      });
      
      return ResponseHelper.error(res, new AppError('Request entity too large', 413));
    }
    
    next();
  };
};

/**
 * Parse size string to bytes
 * @param {string} size - Size string (e.g., '10mb', '1gb')
 * @returns {number} Size in bytes
 */
function parseSize(size) {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)$/);
  if (!match) return 0;
  
  const [, num, unit] = match;
  return parseFloat(num) * units[unit];
}

/**
 * API key validation middleware (nếu cần)
 */
export const validateApiKey = (req, res, next) => {
  const apiKey = req.get('X-API-Key') || req.query.apiKey;
  
  // Skip validation in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  if (!apiKey) {
    return ResponseHelper.unauthorized(res, 'API key is required');
  }
  
  // Validate API key (implement your logic here)
  const validApiKey = process.env.API_KEY;
  if (apiKey !== validApiKey) {
    logger.warn('Invalid API key attempt', { 
      providedKey: apiKey.substring(0, 8) + '...',
      ip: req.ip 
    });
    
    return ResponseHelper.unauthorized(res, 'Invalid API key');
  }
  
  next();
};

/**
 * CORS configuration middleware
 */
export const corsConfig = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:3000',
      'https://yapee.online'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  maxAge: 86400 // 24 hours
};