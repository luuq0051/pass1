/**
 * Configuration Health Checker
 * Comprehensive health checking cho tất cả configuration objects
 */

import { logger } from '@/lib/utils/logger';
import { APPLICATION_CONFIG } from './index';
import type { ApplicationConfiguration } from '@/lib/types/config-types';

/**
 * Configuration health status
 */
export interface ConfigHealthStatus {
  isHealthy: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  checkedAt: Date;
}

/**
 * Configuration health checker class
 */
export class ConfigHealthChecker {
  /**
   * Perform comprehensive health check
   */
  static async performHealthCheck(): Promise<ConfigHealthStatus> {
    const startTime = performance.now();
    const status: ConfigHealthStatus = {
      isHealthy: true,
      errors: [],
      warnings: [],
      recommendations: [],
      checkedAt: new Date(),
    };

    try {
      // Check app configuration
      this.checkAppConfig(APPLICATION_CONFIG, status);
      
      // Check environment configuration
      this.checkEnvironmentConfig(APPLICATION_CONFIG, status);
      
      // Check API configuration
      this.checkApiConfig(APPLICATION_CONFIG, status);
      
      // Check database configuration
      this.checkDatabaseConfig(APPLICATION_CONFIG, status);
      
      // Check domain configuration
      this.checkDomainConfig(APPLICATION_CONFIG, status);
      
      // Check cross-configuration consistency
      this.checkConfigConsistency(APPLICATION_CONFIG, status);

      const duration = performance.now() - startTime;
      logger.info('Configuration health check completed', { 
        duration: `${duration.toFixed(2)}ms`,
        isHealthy: status.isHealthy,
        errorCount: status.errors.length,
        warningCount: status.warnings.length
      });

    } catch (error) {
      status.isHealthy = false;
      status.errors.push(`Health check failed: ${error}`);
      logger.error('Configuration health check failed', { error });
    }

    return status;
  }

  /**
   * Check app configuration
   */
  private static checkAppConfig(config: ApplicationConfiguration, status: ConfigHealthStatus): void {
    if (!config.app.NAME || config.app.NAME.trim().length === 0) {
      status.errors.push('App name is empty or invalid');
      status.isHealthy = false;
    }

    if (!config.app.VERSION || !/^\d+\.\d+\.\d+/.test(config.app.VERSION)) {
      status.warnings.push('App version format may be invalid (expected semver)');
      status.recommendations.push('Use semantic versioning format (x.y.z)');
    }
  }

  /**
   * Check environment configuration
   */
  private static checkEnvironmentConfig(config: ApplicationConfiguration, status: ConfigHealthStatus): void {
    if (config.environment.isDevelopment && config.environment.isProduction) {
      status.errors.push('Both development and production flags are true');
      status.isHealthy = false;
    }

    if (!config.environment.isDevelopment && !config.environment.isProduction) {
      status.warnings.push('Neither development nor production environment detected');
    }
  }

  /**
   * Check API configuration
   */
  private static checkApiConfig(config: ApplicationConfiguration, status: ConfigHealthStatus): void {
    if (!config.api.BASE_URL || !config.api.BASE_URL.startsWith('http')) {
      status.errors.push('API base URL is invalid or missing');
      status.isHealthy = false;
    }

    if (config.api.TIMEOUT < 1000) {
      status.warnings.push('API timeout is very low (< 1s), may cause issues');
      status.recommendations.push('Consider increasing API timeout to at least 3000ms');
    }

    if (config.api.ENABLE_SYNC && config.environment.isDevelopment) {
      status.warnings.push('API sync enabled in development mode');
      status.recommendations.push('Consider disabling API sync in development');
    }
  }

  /**
   * Check database configuration
   */
  private static checkDatabaseConfig(config: ApplicationConfiguration, status: ConfigHealthStatus): void {
    if (!config.database.NAME || config.database.NAME.trim().length === 0) {
      status.errors.push('Database name is empty');
      status.isHealthy = false;
    }

    if (config.database.VERSION < 1) {
      status.errors.push('Database version must be >= 1');
      status.isHealthy = false;
    }

    if (!config.database.INDEXES || config.database.INDEXES.length === 0) {
      status.warnings.push('No database indexes defined');
      status.recommendations.push('Consider adding indexes for better query performance');
    }
  }

  /**
   * Check domain configuration
   */
  private static checkDomainConfig(config: ApplicationConfiguration, status: ConfigHealthStatus): void {
    if (!config.domain.DOMAIN || !config.domain.DOMAIN.includes('.')) {
      status.errors.push('Domain configuration is invalid');
      status.isHealthy = false;
    }

    if (!config.domain.HOMEPAGE.startsWith('https://')) {
      status.warnings.push('Homepage URL should use HTTPS');
      status.recommendations.push('Use HTTPS for production URLs');
    }
  }

  /**
   * Check cross-configuration consistency
   */
  private static checkConfigConsistency(config: ApplicationConfiguration, status: ConfigHealthStatus): void {
    // Check if API URL matches domain
    if (!config.api.BASE_URL.includes(config.domain.DOMAIN)) {
      status.warnings.push('API base URL domain does not match domain configuration');
      status.recommendations.push('Ensure API and domain configurations are consistent');
    }

    // Check app name consistency
    if (config.app.NAME !== config.domain.APP_NAME) {
      status.warnings.push('App name inconsistency between app and domain configs');
      status.recommendations.push('Ensure app names are consistent across configurations');
    }
  }

  /**
   * Get configuration summary
   */
  static getConfigSummary(): Record<string, any> {
    return {
      app: {
        name: APPLICATION_CONFIG.app.NAME,
        version: APPLICATION_CONFIG.app.VERSION,
      },
      environment: {
        isDevelopment: APPLICATION_CONFIG.environment.isDevelopment,
        isProduction: APPLICATION_CONFIG.environment.isProduction,
      },
      api: {
        baseUrl: APPLICATION_CONFIG.api.BASE_URL,
        syncEnabled: APPLICATION_CONFIG.api.ENABLE_SYNC,
        timeout: APPLICATION_CONFIG.api.TIMEOUT,
      },
      database: {
        name: APPLICATION_CONFIG.database.NAME,
        version: APPLICATION_CONFIG.database.VERSION,
      },
      domain: {
        domain: APPLICATION_CONFIG.domain.DOMAIN,
        homepage: APPLICATION_CONFIG.domain.HOMEPAGE,
      },
    };
  }
}

/**
 * Convenience function để perform health check
 */
export const checkConfigHealth = () => ConfigHealthChecker.performHealthCheck();

/**
 * Convenience function để get config summary
 */
export const getConfigSummary = () => ConfigHealthChecker.getConfigSummary();