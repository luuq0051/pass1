/**
 * Configuration Validation
 * Validate và sanitize configuration values
 * 
 * Features:
 * - Type-safe validation
 * - Environment-specific rules
 * - Error reporting
 */

import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

/**
 * App configuration schema
 */
const appConfigSchema = z.object({
  NAME: z.string().min(1, 'App name cannot be empty'),
  DESCRIPTION: z.string().min(1, 'App description cannot be empty'),
  VERSION: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must follow semver format'),
});

/**
 * API configuration schema với enhanced validation
 */
const apiConfigSchema = z.object({
  BASE_URL: z.string().url('BASE_URL must be a valid URL'),
  ENABLE_SYNC: z.boolean(),
  TIMEOUT: z.number().min(1000, 'Timeout must be at least 1000ms').max(30000, 'Timeout cannot exceed 30000ms'),
}).refine((config) => {
  // Validate production URL format - chỉ yêu cầu HTTPS trong production
  if (config.ENABLE_SYNC && !config.BASE_URL.startsWith('https://') && !config.BASE_URL.startsWith('http://localhost')) {
    return false;
  }
  return true;
}, {
  message: 'Production API must use HTTPS when sync is enabled (localhost HTTP is allowed)',
  path: ['BASE_URL'],
}).refine((config) => {
  // Validate URL format
  const isNetlifyFallback = config.BASE_URL.includes('silver-bublanina-ab8828.netlify.app');
  if (isNetlifyFallback) {
    logger.info('Using Netlify deployment URL', {
      url: config.BASE_URL
    });
  }
  return true; // Always pass validation
}, {
  message: 'API URL validation passed',
  path: ['BASE_URL'],
});

/**
 * Database configuration schema
 */
const databaseConfigSchema = z.object({
  NAME: z.string().min(1, 'Database name cannot be empty'),
  VERSION: z.number().int().positive('Database version must be positive integer'),
  STORE_NAME: z.string().min(1, 'Store name cannot be empty'),
  INDEXES: z.array(z.string()).min(1, 'At least one index is required'),
});

/**
 * Domain configuration schema
 */
const domainConfigSchema = z.object({
  PRODUCTION_DOMAIN: z.string().min(1, 'Production domain cannot be empty'),
  PRODUCTION_URL: z.string().url('Production URL must be valid'),
});

/**
 * Validate app configuration
 */
export const validateAppConfig = (config: unknown) => {
  try {
    return appConfigSchema.parse(config);
  } catch (error) {
    logger.error('App configuration validation failed', error as Error);
    throw new Error('Invalid app configuration');
  }
};

/**
 * Validate API configuration
 */
export const validateApiConfig = (config: unknown) => {
  try {
    return apiConfigSchema.parse(config);
  } catch (error) {
    logger.error('API configuration validation failed', error as Error);
    throw new Error('Invalid API configuration');
  }
};

/**
 * Validate database configuration
 */
export const validateDatabaseConfig = (config: unknown) => {
  try {
    return databaseConfigSchema.parse(config);
  } catch (error) {
    logger.error('Database configuration validation failed', error as Error);
    throw new Error('Invalid database configuration');
  }
};

/**
 * Validate domain configuration
 */
export const validateDomainConfig = (config: unknown) => {
  try {
    return domainConfigSchema.parse(config);
  } catch (error) {
    logger.error('Domain configuration validation failed', error as Error);
    throw new Error('Invalid domain configuration');
  }
};

/**
 * Validate all configurations
 */
export const validateAllConfigs = (configs: {
  app: unknown;
  api: unknown;
  database: unknown;
  domain: unknown;
}) => {
  const results = {
    app: validateAppConfig(configs.app),
    api: validateApiConfig(configs.api),
    database: validateDatabaseConfig(configs.database),
    domain: validateDomainConfig(configs.domain),
  };
  
  logger.info('All configurations validated successfully');
  return results;
};