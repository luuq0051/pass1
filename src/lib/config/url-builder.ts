/**
 * URL Builder Utility
 * Centralized URL construction với environment-aware logic
 * 
 * Features:
 * - Environment-specific URL building
 * - Validation và error handling
 * - Caching cho performance
 * - Type safety
 */

import { ENV_ACCESS } from './env-utils';
import { logger } from '@/lib/utils/logger';

/**
 * Deployment constants - Centralized hardcoded values
 */
export const DEPLOYMENT_CONSTANTS = {
  // Netlify deployment URLs
  NETLIFY_FALLBACK_URL: 'https://silver-bublanina-ab8828.netlify.app',
  NETLIFY_FUNCTIONS_PATH: '/.netlify/functions/api',
  
  // Development URLs
  DEV_API_PATH: '/api',
  
  // Default production domain
  DEFAULT_PRODUCTION_URL: 'https://yapee.online',
} as const;

/**
 * URL validation utilities
 */
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Cached URL values để tránh recomputation
 */
let cachedApiBaseUrl: string | null = null;
let cachedAppUrl: string | null = null;

/**
 * API URL Builder Class
 * Sử dụng Builder pattern để construct URLs
 */
export class ApiUrlBuilder {
  /**
   * Build API base URL với environment-aware logic
   */
  static buildApiBaseUrl(): string {
    // Return cached value nếu có
    if (cachedApiBaseUrl) {
      return cachedApiBaseUrl;
    }

    const endTimer = logger.time('buildApiBaseUrl');
    
    try {
      // Kiểm tra explicit env var trước
      const explicitApiUrl = ENV_ACCESS.getEnvVar('VITE_API_BASE_URL');
      if (explicitApiUrl) {
        if (isValidUrl(explicitApiUrl)) {
          cachedApiBaseUrl = explicitApiUrl;
          logger.debug('Using explicit API URL from env', { url: explicitApiUrl });
          return explicitApiUrl;
        } else {
          logger.warn('Invalid API URL in env var, falling back', { url: explicitApiUrl });
        }
      }

      // Environment-specific logic
      if (ENV_ACCESS.isProduction) {
        cachedApiBaseUrl = this.buildProductionApiUrl();
      } else {
        cachedApiBaseUrl = DEPLOYMENT_CONSTANTS.DEV_API_PATH;
      }

      logger.info('API Base URL built', { 
        url: cachedApiBaseUrl, 
        environment: ENV_ACCESS.isProduction ? 'production' : 'development' 
      });

      return cachedApiBaseUrl;
    } finally {
      endTimer();
    }
  }

  /**
   * Build production API URL với fallback logic
   */
  private static buildProductionApiUrl(): string {
    const appUrl = this.getAppUrl();
    const apiPath = DEPLOYMENT_CONSTANTS.NETLIFY_FUNCTIONS_PATH;
    
    return `${appUrl}${apiPath}`;
  }

  /**
   * Get app URL với validation và fallback
   */
  private static getAppUrl(): string {
    if (cachedAppUrl) {
      return cachedAppUrl;
    }

    // Thử lấy từ env var
    const envAppUrl = ENV_ACCESS.getEnvVar('VITE_APP_URL');
    if (envAppUrl && isValidUrl(envAppUrl)) {
      cachedAppUrl = envAppUrl;
      return envAppUrl;
    }

    // Fallback logic
    const fallbackUrl = DEPLOYMENT_CONSTANTS.NETLIFY_FALLBACK_URL;
    logger.warn('Using fallback app URL', { 
      fallback: fallbackUrl,
      reason: envAppUrl ? 'Invalid URL format' : 'Missing env var'
    });

    cachedAppUrl = fallbackUrl;
    return fallbackUrl;
  }

  /**
   * Reset cache - useful cho testing
   */
  static resetCache(): void {
    cachedApiBaseUrl = null;
    cachedAppUrl = null;
    logger.debug('URL cache reset');
  }

  /**
   * Validate current configuration
   */
  static validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      const apiUrl = this.buildApiBaseUrl();
      if (!isValidUrl(apiUrl)) {
        errors.push(`Invalid API URL: ${apiUrl}`);
      }
    } catch (error) {
      errors.push(`Failed to build API URL: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Convenience functions cho backward compatibility
 */
export const buildApiBaseUrl = () => ApiUrlBuilder.buildApiBaseUrl();
export const validateUrlConfiguration = () => ApiUrlBuilder.validateConfiguration();

/**
 * Type definitions
 */
export type UrlValidationResult = {
  isValid: boolean;
  errors: string[];
};