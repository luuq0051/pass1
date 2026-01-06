/**
 * Configuration Index
 * Central export cho tất cả configurations
 * 
 * Refactor: Tạo single source of truth cho configs
 */

// Environment utilities
export { ENV_ACCESS, ENV_UTILS, getEnvironmentConfig } from './env-utils';

// Core configurations
export { 
  APP_CONFIG, 
  THEME_CONFIG, 
  QUERY_CLIENT_CONFIG, 
  createQueryClient, 
  ROUTES,
  API_CONFIG,
  DATABASE_CONFIG,
  DOMAIN_CONFIG
} from './app-config';

// Configuration service (recommended approach)
export {
  configurationService,
  getConfiguredUrl,
  getConfiguredDomain,
  isConfiguredProduction,
  getConfiguredApiBaseUrl
} from './configuration-service';

// Domain-specific configurations
export { 
  DOMAINS, 
  URLS, 
  getCurrentDomain, 
  getCurrentUrl, 
  isDomainValid, 
  isProductionDomain 
} from './domain-config';

// Import for internal use
import { getCurrentUrl, isProductionDomain } from './domain-config';

// Environment configuration
export { config as environmentConfig } from './environment';

// URL Builder utilities
export { 
  ApiUrlBuilder, 
  buildApiBaseUrl, 
  validateUrlConfiguration, 
  DEPLOYMENT_CONSTANTS 
} from './url-builder';
export type { UrlValidationResult } from './url-builder';

// Configuration validation
export { 
  validateAppConfig, 
  validateApiConfig, 
  validateDatabaseConfig, 
  validateDomainConfig, 
  validateAllConfigs 
} from './config-validator';

// Runtime validation
export {
  validateRuntimeApiConfig,
  validateRuntimeDatabaseConfig,
  validateRuntimeDomainConfig,
  validateAllRuntimeConfigs,
  initializeConfigValidation
} from './runtime-validator';
export type { ConfigHealthStatus } from './runtime-validator';

// Toast configuration
export { TOAST_CONFIG } from './toast-config';

// Configuration factory (DEPRECATED - Use unified-types instead)
export {
  ConfigurationFactory,
  getCurrentConfig,
  getConfigForProfile
} from './config-factory';
export type {
  ConfigProfile,
  ApiConfiguration,
  DatabaseConfiguration,
  ApplicationConfiguration as FactoryApplicationConfiguration,
  CompleteConfiguration
} from './config-factory';

// NEW: Unified Configuration System
export {
  configurationProvider,
  getUnifiedConfig,
  validateConfig,
  getConfigHealth
} from './configuration-provider';
export type {
  UnifiedApplicationConfiguration,
  ConfigurationProfile,
  ConfigurationValidationResult,
  ConfigurationHealthStatus,
  CONFIG_CONSTANTS
} from './unified-types';

// New: API-specific validation
export {
  validateApiConfiguration,
  getApiConfigRecommendations
} from './api-config-validator';

// New: Configuration management
export {
  ConfigurationManager,
  configManager
} from './config-manager';

// New: Configuration health checking
export {
  ConfigHealthChecker,
  checkConfigHealth,
  getConfigSummary
} from './config-health-checker';
export type { ConfigHealthStatus as HealthCheckerStatus } from './config-health-checker';

// Type exports
export type { DomainType, UrlType } from './domain-config';
export type { Config } from './environment';
export type { EnvironmentConfig } from './env-utils';
export type { 
  AppConfig, 
  ApiConfig, 
  DatabaseConfig, 
  DomainConfig, 
  ThemeConfig, 
  TimeConstants, 
  RoutesConfig, 
  ApplicationConfiguration 
} from '@/lib/types/config-types';

/**
 * Convenience exports cho backward compatibility
 */
export const getBaseUrl = getCurrentUrl;
export const isProduction = isProductionDomain;

/**
 * Validated configuration object
 * Tất cả configs đã được validate
 */
import { APP_CONFIG, API_CONFIG, DATABASE_CONFIG, DOMAIN_CONFIG, ENV_CONFIG, THEME_CONFIG, ROUTES } from './app-config';
import { validateAllConfigs } from './config-validator';
import type { ApplicationConfiguration } from '@/lib/types/config-types';

export const VALIDATED_CONFIG = validateAllConfigs({
  app: APP_CONFIG,
  api: API_CONFIG,
  database: DATABASE_CONFIG,
  domain: DOMAIN_CONFIG,
});

// NEW: Performance monitoring
export {
  configPerformanceMonitor,
  measureConfigLoad,
  measureConfigValidation,
  recordCacheHit,
  recordCacheMiss,
  getConfigPerformance
} from './config-performance-monitor';

// NEW: Migration support
export {
  ConfigurationMigrationAdapter,
  migrationUtils,
  APPLICATION_CONFIG // Backward compatibility
} from './migration-helper';

/**
 * RECOMMENDED: Use unified configuration system
 * 
 * Example:
 * ```typescript
 * import { getUnifiedConfig } from '@/lib/config';
 * 
 * const config = getUnifiedConfig();
 * console.log(config.app.name);
 * ```
 */