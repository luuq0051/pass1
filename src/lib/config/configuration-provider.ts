/**
 * Unified Configuration Provider
 * Single source of truth cho application configuration
 * 
 * Features:
 * - Singleton pattern với lazy loading
 * - Type-safe configuration access
 * - Runtime validation
 * - Performance monitoring
 * - Environment-aware configuration
 */

import { logger } from '@/lib/utils/logger';
import { ENV_ACCESS } from './env-utils';
import { buildApiBaseUrl } from './url-builder';
import { getAppVersion } from '@/lib/utils/version-utils';
import type {
  UnifiedApplicationConfiguration,
  ConfigurationProfile,
  ConfigurationValidationResult,
  ConfigurationHealthStatus,
  ConfigurationFactoryOptions,
  isValidConfiguration
} from './unified-types';

/**
 * Local constants để tránh import issues
 */
const CONFIG_CONSTANTS = {
  VALIDATION_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  DEFAULT_TIMEOUT: 10000,
  MIN_TIMEOUT: 3000,
  DEFAULT_CACHE_TIME: 5 * 60 * 1000,
  DEFAULT_RETRY_ATTEMPTS: 3,
  DEFAULT_RETRY_DELAY: 1000,
} as const;

/**
 * Configuration Provider Class
 * Centralized configuration management với advanced features
 */
export class ConfigurationProvider {
  private static instance: ConfigurationProvider;
  private config: UnifiedApplicationConfiguration | null = null;
  private lastValidation: number = 0;
  private healthStatus: ConfigurationHealthStatus | null = null;
  private readonly CACHE_TTL = CONFIG_CONSTANTS.VALIDATION_CACHE_TTL;

  private constructor() {
    logger.debug('ConfigurationProvider initializing...');
  }

  /**
   * Get singleton instance với lazy initialization
   */
  public static getInstance(): ConfigurationProvider {
    if (!ConfigurationProvider.instance) {
      ConfigurationProvider.instance = new ConfigurationProvider();
    }
    return ConfigurationProvider.instance;
  }

  /**
   * Get complete application configuration
   * Lazy loading với caching và validation
   */
  public getConfiguration(options?: Partial<ConfigurationFactoryOptions>): UnifiedApplicationConfiguration {
    const startTime = performance.now();
    
    try {
      // Return cached config if valid
      if (this.config && !this.shouldRefreshConfig()) {
        logger.debug('Returning cached configuration');
        return this.config;
      }

      // Create new configuration
      const profile = this.determineProfile(options?.profile);
      this.config = this.createConfiguration(profile, options);

      // Validate if enabled
      if (options?.enableValidation !== false) {
        const validation = this.validateConfiguration(this.config);
        if (!validation.isValid) {
          logger.warn('Configuration validation failed', {
            errors: validation.errors,
            warnings: validation.warnings
          });
        }
      }

      const endTime = performance.now();
      logger.info('Configuration created successfully', {
        profile,
        loadTime: `${(endTime - startTime).toFixed(2)}ms`,
        cacheEnabled: options?.enableCaching !== false
      });

      return this.config;

    } catch (error) {
      logger.error('Failed to get configuration', error as Error);
      throw new Error(`Configuration creation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Create configuration for specific profile
   */
  private createConfiguration(
    profile: ConfigurationProfile,
    options?: Partial<ConfigurationFactoryOptions>
  ): UnifiedApplicationConfiguration {
    const baseConfig = {
      environment: profile,
      version: getAppVersion(),
      createdAt: Date.now(),
    };

    const config: UnifiedApplicationConfiguration = {
      ...baseConfig,
      
      app: {
        name: this.getAppName(profile),
        description: this.getAppDescription(profile),
        version: getAppVersion(),
      },

      environment: {
        isDevelopment: profile === 'development',
        isProduction: profile === 'production',
        isTesting: profile === 'testing',
        nodeEnv: ENV_ACCESS.getEnvVar('NODE_ENV', profile),
      },

      theme: {
        defaultTheme: 'dark',
        storageKey: 'memory-safe-guard-theme',
        enableSystemTheme: true,
      },

      api: this.createApiConfiguration(profile),
      database: this.createDatabaseConfiguration(profile),
      domain: this.createDomainConfiguration(profile),
      routes: this.createRoutesConfiguration(),
      performance: this.createPerformanceConfiguration(profile),
      security: this.createSecurityConfiguration(profile),
    };

    // Apply overrides if provided
    if (options?.overrides) {
      return this.mergeConfigurations(config, options.overrides);
    }

    return config;
  }

  /**
   * Create API configuration based on profile
   */
  private createApiConfiguration(profile: ConfigurationProfile) {
    const baseConfigs = {
      development: {
        baseUrl: 'http://localhost:3001/api/passwords',
        timeout: CONFIG_CONSTANTS.DEFAULT_TIMEOUT,
        enableSync: false,
        retryAttempts: 1,
        retryDelay: CONFIG_CONSTANTS.DEFAULT_RETRY_DELAY,
        enableCaching: true,
      },
      production: {
        baseUrl: buildApiBaseUrl(),
        timeout: CONFIG_CONSTANTS.DEFAULT_TIMEOUT,
        enableSync: true,
        retryAttempts: CONFIG_CONSTANTS.DEFAULT_RETRY_ATTEMPTS,
        retryDelay: CONFIG_CONSTANTS.DEFAULT_RETRY_DELAY * 2,
        enableCaching: true,
      },
      testing: {
        baseUrl: 'http://localhost:3001/api/passwords',
        timeout: CONFIG_CONSTANTS.MIN_TIMEOUT,
        enableSync: false,
        retryAttempts: 0,
        retryDelay: 0,
        enableCaching: false,
      },
      staging: {
        baseUrl: buildApiBaseUrl(),
        timeout: CONFIG_CONSTANTS.DEFAULT_TIMEOUT,
        enableSync: true,
        retryAttempts: 2,
        retryDelay: CONFIG_CONSTANTS.DEFAULT_RETRY_DELAY,
        enableCaching: true,
      },
    };

    const baseConfig = baseConfigs[profile];
    
    // Override với environment variables
    return {
      baseUrl: ENV_ACCESS.getEnvVar('VITE_API_BASE_URL', baseConfig.baseUrl),
      timeout: Math.max(
        ENV_ACCESS.getNumberEnv('VITE_API_TIMEOUT', baseConfig.timeout),
        CONFIG_CONSTANTS.MIN_TIMEOUT
      ),
      enableSync: ENV_ACCESS.getBooleanEnv('VITE_ENABLE_API_SYNC', baseConfig.enableSync),
      retryAttempts: ENV_ACCESS.getNumberEnv('VITE_API_RETRY_ATTEMPTS', baseConfig.retryAttempts),
      retryDelay: ENV_ACCESS.getNumberEnv('VITE_API_RETRY_DELAY', baseConfig.retryDelay),
      enableCaching: ENV_ACCESS.getBooleanEnv('VITE_ENABLE_CACHING', baseConfig.enableCaching),
    };
  }

  /**
   * Create database configuration based on profile
   */
  private createDatabaseConfiguration(profile: ConfigurationProfile) {
    const configs = {
      development: {
        name: 'memorySafeGuardDB_dev',
        version: 1,
        storeName: 'passwords',
        indexes: ['service', 'username', 'updatedAt'] as const,
        enableBackup: true,
        maxEntries: 1000,
      },
      production: {
        name: 'memorySafeGuardDB',
        version: 1,
        storeName: 'passwords',
        indexes: ['service', 'username', 'updatedAt'] as const,
        enableBackup: true,
        maxEntries: 10000,
      },
      testing: {
        name: 'memorySafeGuardDB_test',
        version: 1,
        storeName: 'passwords',
        indexes: ['service', 'username', 'updatedAt'] as const,
        enableBackup: false,
        maxEntries: 100,
      },
      staging: {
        name: 'memorySafeGuardDB_staging',
        version: 1,
        storeName: 'passwords',
        indexes: ['service', 'username', 'updatedAt'] as const,
        enableBackup: true,
        maxEntries: 5000,
      },
    };

    return configs[profile];
  }

  /**
   * Create domain configuration
   */
  private createDomainConfiguration(profile: ConfigurationProfile) {
    const domain = 'silver-bublanina-ab8828.netlify.app';
    
    return {
      appName: 'Memory Safe Guard',
      appDescription: 'Ứng dụng quản lý mật khẩu hiện đại và an toàn',
      domain,
      homepage: `https://${domain}`,
      productionDomain: domain,
      productionUrl: `https://${domain}`,
    };
  }

  /**
   * Create routes configuration
   */
  private createRoutesConfiguration() {
    return {
      home: '/',
      notFound: '*',
    };
  }

  /**
   * Create performance configuration
   */
  private createPerformanceConfiguration(profile: ConfigurationProfile) {
    return {
      cacheStaleTime: CONFIG_CONSTANTS.DEFAULT_CACHE_TIME,
      apiTimeoutDefault: CONFIG_CONSTANTS.DEFAULT_TIMEOUT,
      apiTimeoutMin: CONFIG_CONSTANTS.MIN_TIMEOUT,
      retryAttemptsQuery: profile === 'production' ? 3 : 1,
      retryAttemptsMutation: profile === 'production' ? 2 : 1,
    };
  }

  /**
   * Create security configuration
   */
  private createSecurityConfiguration(profile: ConfigurationProfile) {
    return {
      enableEncryption: profile === 'production',
      enableAuditLog: profile !== 'testing',
      sessionTimeout: profile === 'production' ? 30 * 60 * 1000 : 60 * 60 * 1000, // 30min prod, 1hr dev
      maxLoginAttempts: 5,
    };
  }

  /**
   * Validate configuration
   */
  public validateConfiguration(config: UnifiedApplicationConfiguration): ConfigurationValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // Basic structure validation
      if (!isValidConfiguration(config)) {
        errors.push('Invalid configuration structure');
      }

      // API validation
      if (!config.api.baseUrl || !config.api.baseUrl.startsWith('http')) {
        errors.push('Invalid API base URL');
      }

      if (config.api.timeout < CONFIG_CONSTANTS.MIN_TIMEOUT) {
        warnings.push(`API timeout (${config.api.timeout}ms) is below recommended minimum (${CONFIG_CONSTANTS.MIN_TIMEOUT}ms)`);
      }

      // Database validation
      if (!config.database.name || config.database.name.trim().length === 0) {
        errors.push('Database name is required');
      }

      // Performance suggestions
      if (config.environment.isProduction && !config.api.enableCaching) {
        suggestions.push('Consider enabling API caching for production');
      }

      // Security suggestions
      if (config.environment.isProduction && !config.security.enableEncryption) {
        suggestions.push('Enable encryption for production environment');
      }

      const score = this.calculateConfigScore(errors.length, warnings.length, suggestions.length);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions,
        score,
      };

    } catch (error) {
      logger.error('Configuration validation error', error as Error);
      return {
        isValid: false,
        errors: ['Validation process failed'],
        warnings: [],
        suggestions: [],
        score: 0,
      };
    }
  }

  /**
   * Get configuration health status
   */
  public getHealthStatus(): ConfigurationHealthStatus {
    if (this.healthStatus && (Date.now() - this.healthStatus.lastCheck) < this.CACHE_TTL) {
      return this.healthStatus;
    }

    const config = this.getConfiguration();
    const validation = this.validateConfiguration(config);

    this.healthStatus = {
      isHealthy: validation.isValid && validation.errors.length === 0,
      lastCheck: Date.now(),
      environment: config.environment.nodeEnv,
      apiStatus: this.getApiStatus(config),
      databaseStatus: this.getDatabaseStatus(config),
      overallScore: validation.score,
      issues: [...validation.errors, ...validation.warnings],
    };

    return this.healthStatus;
  }

  /**
   * Helper methods
   */
  private determineProfile(profile?: ConfigurationProfile): ConfigurationProfile {
    if (profile) return profile;
    
    if (ENV_ACCESS.isDevelopment) return 'development';
    if (ENV_ACCESS.getEnvVar('NODE_ENV') === 'test') return 'testing';
    return 'production';
  }

  private shouldRefreshConfig(): boolean {
    return !this.config || (Date.now() - this.lastValidation) > this.CACHE_TTL;
  }

  private getAppName(profile: ConfigurationProfile): string {
    const names = {
      development: 'Memory Safe Guard (Dev)',
      production: 'Memory Safe Guard',
      testing: 'Memory Safe Guard (Test)',
      staging: 'Memory Safe Guard (Staging)',
    };
    return names[profile];
  }

  private getAppDescription(profile: ConfigurationProfile): string {
    return profile === 'production' 
      ? 'Ứng dụng quản lý mật khẩu hiện đại và an toàn'
      : `Ứng dụng quản lý mật khẩu - ${profile}`;
  }

  private mergeConfigurations(
    base: UnifiedApplicationConfiguration,
    overrides: Partial<UnifiedApplicationConfiguration>
  ): UnifiedApplicationConfiguration {
    return {
      ...base,
      ...overrides,
      app: { ...base.app, ...overrides.app },
      environment: { ...base.environment, ...overrides.environment },
      theme: { ...base.theme, ...overrides.theme },
      api: { ...base.api, ...overrides.api },
      database: { ...base.database, ...overrides.database },
      domain: { ...base.domain, ...overrides.domain },
      routes: { ...base.routes, ...overrides.routes },
      performance: { ...base.performance, ...overrides.performance },
      security: { ...base.security, ...overrides.security },
    };
  }

  private calculateConfigScore(errors: number, warnings: number, suggestions: number): number {
    let score = 100;
    score -= errors * 25;
    score -= warnings * 10;
    score -= suggestions * 5;
    return Math.max(0, score);
  }

  private getApiStatus(config: UnifiedApplicationConfiguration): 'healthy' | 'warning' | 'error' {
    if (!config.api.baseUrl || !config.api.baseUrl.startsWith('http')) return 'error';
    if (config.api.timeout < CONFIG_CONSTANTS.MIN_TIMEOUT) return 'warning';
    return 'healthy';
  }

  private getDatabaseStatus(config: UnifiedApplicationConfiguration): 'healthy' | 'warning' | 'error' {
    if (!config.database.name) return 'error';
    if (config.database.maxEntries < 100) return 'warning';
    return 'healthy';
  }

  /**
   * Reset instance (for testing)
   */
  public static resetInstance(): void {
    ConfigurationProvider.instance = null as any;
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.config = null;
    this.healthStatus = null;
    this.lastValidation = 0;
    logger.debug('Configuration cache cleared');
  }
}

/**
 * Export singleton instance
 */
export const configurationProvider = ConfigurationProvider.getInstance();

/**
 * Convenience functions với type safety
 */
export const getUnifiedConfig = (options?: Partial<ConfigurationFactoryOptions>) => 
  configurationProvider.getConfiguration(options);

export const validateConfig = (config: UnifiedApplicationConfiguration) => 
  configurationProvider.validateConfiguration(config);

export const getConfigHealth = () => 
  configurationProvider.getHealthStatus();