/**
 * Unified Configuration Types
 * Single source of truth cho tất cả configuration types
 * 
 * Refactor: Thay thế tất cả duplicate type definitions
 */

/**
 * Base configuration interface
 * Chứa các properties chung cho tất cả configs
 */
export interface BaseConfiguration {
  readonly environment: 'development' | 'production' | 'testing';
  readonly version: string;
  readonly createdAt: number;
}

/**
 * Application metadata configuration
 */
export interface AppMetadata {
  readonly name: string;
  readonly description: string;
  readonly version: string;
}

/**
 * Environment configuration
 */
export interface EnvironmentConfiguration {
  readonly isDevelopment: boolean;
  readonly isProduction: boolean;
  readonly isTesting: boolean;
  readonly nodeEnv: string;
}

/**
 * Theme configuration
 */
export interface ThemeConfiguration {
  readonly defaultTheme: 'light' | 'dark';
  readonly storageKey: string;
  readonly enableSystemTheme: boolean;
}

/**
 * API configuration với validation
 */
export interface ApiConfiguration {
  readonly baseUrl: string;
  readonly timeout: number;
  readonly enableSync: boolean;
  readonly retryAttempts: number;
  readonly retryDelay: number;
  readonly enableCaching: boolean;
}

/**
 * Database configuration
 */
export interface DatabaseConfiguration {
  readonly name: string;
  readonly version: number;
  readonly storeName: string;
  readonly indexes: readonly string[];
  readonly enableBackup: boolean;
  readonly maxEntries: number;
}

/**
 * Domain configuration
 */
export interface DomainConfiguration {
  readonly appName: string;
  readonly appDescription: string;
  readonly domain: string;
  readonly homepage: string;
  readonly productionDomain: string;
  readonly productionUrl: string;
}

/**
 * Routes configuration
 */
export interface RoutesConfiguration {
  readonly home: string;
  readonly notFound: string;
  readonly [key: string]: string;
}

/**
 * Performance configuration
 */
export interface PerformanceConfiguration {
  readonly cacheStaleTime: number;
  readonly apiTimeoutDefault: number;
  readonly apiTimeoutMin: number;
  readonly retryAttemptsQuery: number;
  readonly retryAttemptsMutation: number;
}

/**
 * Security configuration
 */
export interface SecurityConfiguration {
  readonly enableEncryption: boolean;
  readonly enableAuditLog: boolean;
  readonly sessionTimeout: number;
  readonly maxLoginAttempts: number;
}

/**
 * Complete application configuration
 * Unified interface cho toàn bộ app config
 */
export interface UnifiedApplicationConfiguration extends BaseConfiguration {
  readonly app: AppMetadata;
  readonly environment: EnvironmentConfiguration;
  readonly theme: ThemeConfiguration;
  readonly api: ApiConfiguration;
  readonly database: DatabaseConfiguration;
  readonly domain: DomainConfiguration;
  readonly routes: RoutesConfiguration;
  readonly performance: PerformanceConfiguration;
  readonly security: SecurityConfiguration;
}

/**
 * Configuration validation result
 */
export interface ConfigurationValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly suggestions: readonly string[];
  readonly score: number; // 0-100
}

/**
 * Configuration health status
 */
export interface ConfigurationHealthStatus {
  readonly isHealthy: boolean;
  readonly lastCheck: number;
  readonly environment: string;
  readonly apiStatus: 'healthy' | 'warning' | 'error';
  readonly databaseStatus: 'healthy' | 'warning' | 'error';
  readonly overallScore: number;
  readonly issues: readonly string[];
}

/**
 * Configuration profile for different environments
 */
export type ConfigurationProfile = 'development' | 'production' | 'testing' | 'staging';

/**
 * Configuration factory options
 */
export interface ConfigurationFactoryOptions {
  readonly profile: ConfigurationProfile;
  readonly overrides?: Partial<UnifiedApplicationConfiguration>;
  readonly enableValidation?: boolean;
  readonly enableCaching?: boolean;
}

/**
 * Type guards cho configuration validation
 */
export const isValidConfiguration = (config: any): config is UnifiedApplicationConfiguration => {
  return (
    config &&
    typeof config === 'object' &&
    config.app &&
    config.environment &&
    config.api &&
    config.database &&
    config.domain
  );
};

export const isValidApiConfiguration = (config: any): config is ApiConfiguration => {
  return (
    config &&
    typeof config.baseUrl === 'string' &&
    typeof config.timeout === 'number' &&
    typeof config.enableSync === 'boolean'
  );
};

export const isValidDatabaseConfiguration = (config: any): config is DatabaseConfiguration => {
  return (
    config &&
    typeof config.name === 'string' &&
    typeof config.version === 'number' &&
    typeof config.storeName === 'string' &&
    Array.isArray(config.indexes)
  );
};

/**
 * Configuration constants
 */
export const CONFIG_CONSTANTS = {
  DEFAULT_TIMEOUT: 10000,
  MIN_TIMEOUT: 3000,
  MAX_TIMEOUT: 30000,
  DEFAULT_CACHE_TIME: 5 * 60 * 1000, // 5 minutes
  DEFAULT_RETRY_ATTEMPTS: 3,
  DEFAULT_RETRY_DELAY: 1000,
  VALIDATION_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
} as const;

/**
 * Export legacy types for backward compatibility
 * TODO: Remove these after migration is complete
 */
export type {
  AppMetadata as AppConfig,
  EnvironmentConfiguration as EnvironmentConfig,
  ThemeConfiguration as ThemeConfig,
  ApiConfiguration as ApiConfig,
  DatabaseConfiguration as DatabaseConfig,
  DomainConfiguration as DomainConfig,
  RoutesConfiguration as RoutesConfig,
  UnifiedApplicationConfiguration as ApplicationConfiguration,
};