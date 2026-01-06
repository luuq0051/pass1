/**
 * Configuration Migration Helper
 * Giúp migrate từ old config system sang unified system
 * 
 * Features:
 * - Backward compatibility
 * - Gradual migration support
 * - Type safety during transition
 */

import { logger } from '@/lib/utils/logger';
import { configurationProvider, getUnifiedConfig } from './configuration-provider';
import type { UnifiedApplicationConfiguration } from './unified-types';

// Legacy imports for backward compatibility
import { APP_CONFIG, API_CONFIG, DATABASE_CONFIG, DOMAIN_CONFIG, THEME_CONFIG, ROUTES } from './app-config';
import type { ApplicationConfiguration } from '@/lib/types/config-types';

/**
 * Migration adapter để convert legacy config sang unified format
 */
export class ConfigurationMigrationAdapter {
  /**
   * Convert legacy ApplicationConfiguration to UnifiedApplicationConfiguration
   */
  public static convertLegacyToUnified(legacyConfig: ApplicationConfiguration): UnifiedApplicationConfiguration {
    logger.debug('Converting legacy configuration to unified format');
    
    try {
      const unifiedConfig: UnifiedApplicationConfiguration = {
        environment: 'production', // Default, will be overridden
        version: legacyConfig.app.VERSION,
        createdAt: Date.now(),
        
        app: {
          name: legacyConfig.app.NAME,
          description: legacyConfig.app.DESCRIPTION,
          version: legacyConfig.app.VERSION,
        },
        
        environment: {
          isDevelopment: legacyConfig.environment.isDevelopment,
          isProduction: legacyConfig.environment.isProduction,
          isTesting: false, // Not available in legacy
          nodeEnv: legacyConfig.environment.isDevelopment ? 'development' : 'production',
        },
        
        theme: {
          defaultTheme: legacyConfig.theme.DEFAULT_THEME,
          storageKey: legacyConfig.theme.STORAGE_KEY,
          enableSystemTheme: true, // New feature
        },
        
        api: {
          baseUrl: legacyConfig.api.BASE_URL,
          timeout: legacyConfig.api.TIMEOUT,
          enableSync: legacyConfig.api.ENABLE_SYNC,
          retryAttempts: 3, // Default value
          retryDelay: 1000, // Default value
          enableCaching: true, // Default value
        },
        
        database: {
          name: legacyConfig.database.NAME,
          version: legacyConfig.database.VERSION,
          storeName: legacyConfig.database.STORE_NAME,
          indexes: legacyConfig.database.INDEXES,
          enableBackup: true, // Default value
          maxEntries: 10000, // Default value
        },
        
        domain: {
          appName: legacyConfig.domain.APP_NAME,
          appDescription: legacyConfig.domain.APP_DESCRIPTION,
          domain: legacyConfig.domain.DOMAIN,
          homepage: legacyConfig.domain.HOMEPAGE,
          productionDomain: legacyConfig.domain.PRODUCTION_DOMAIN,
          productionUrl: legacyConfig.domain.PRODUCTION_URL,
        },
        
        routes: {
          home: legacyConfig.routes.HOME,
          notFound: legacyConfig.routes.NOT_FOUND,
        },
        
        performance: {
          cacheStaleTime: 5 * 60 * 1000, // 5 minutes
          apiTimeoutDefault: legacyConfig.api.TIMEOUT,
          apiTimeoutMin: 3000,
          retryAttemptsQuery: 2,
          retryAttemptsMutation: 1,
        },
        
        security: {
          enableEncryption: legacyConfig.environment.isProduction,
          enableAuditLog: true,
          sessionTimeout: 30 * 60 * 1000, // 30 minutes
          maxLoginAttempts: 5,
        },
      };
      
      logger.info('Legacy configuration converted successfully');
      return unifiedConfig;
      
    } catch (error) {
      logger.error('Failed to convert legacy configuration', error as Error);
      throw new Error(`Configuration conversion failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Create legacy config from current app-config for backward compatibility
   */
  public static createLegacyConfig(): ApplicationConfiguration {
    return {
      app: APP_CONFIG,
      environment: {
        isDevelopment: import.meta.env.DEV,
        isProduction: import.meta.env.PROD,
        DATABASE_URL: '', // Not used in current implementation
      },
      theme: THEME_CONFIG,
      api: API_CONFIG,
      database: DATABASE_CONFIG,
      domain: DOMAIN_CONFIG,
      routes: ROUTES,
    };
  }
  
  /**
   * Get configuration với backward compatibility
   * Trả về unified config nhưng có thể fallback về legacy nếu cần
   */
  public static getCompatibleConfig(): UnifiedApplicationConfiguration {
    try {
      // Try to get unified config first
      return getUnifiedConfig();
    } catch (error) {
      logger.warn('Failed to get unified config, falling back to legacy', error as Error);
      
      // Fallback to legacy config
      const legacyConfig = this.createLegacyConfig();
      return this.convertLegacyToUnified(legacyConfig);
    }
  }
}

/**
 * Backward compatibility exports
 * Cho phép existing code tiếp tục hoạt động trong quá trình migration
 */

/**
 * @deprecated Use getUnifiedConfig() instead
 */
export const APPLICATION_CONFIG = ConfigurationMigrationAdapter.createLegacyConfig();

/**
 * @deprecated Use configurationProvider.validateConfiguration() instead
 */
/**
 * @deprecated Use configurationProvider.validateConfiguration() instead
 * Commented out to avoid export conflicts with index.ts
 */
/*
export const VALIDATED_CONFIG = (() => {
  try {
    const config = ConfigurationMigrationAdapter.getCompatibleConfig();
    const validation = configurationProvider.validateConfiguration(config);
    
    if (!validation.isValid) {
      logger.warn('Configuration validation failed during legacy compatibility check', {
        errors: validation.errors,
        warnings: validation.warnings
      });
    }
    
    return config;
  } catch (error) {
    logger.error('Failed to create validated config for backward compatibility', error as Error);
    return ConfigurationMigrationAdapter.createLegacyConfig();
  }
})();
*/

/**
 * Migration utilities
 */
export const migrationUtils = {
  /**
   * Check if current code is using legacy config patterns
   */
  isUsingLegacyConfig(): boolean {
    // Simple heuristic - check if old config objects are being accessed
    return typeof window !== 'undefined' && 
           (window as any).__LEGACY_CONFIG_DETECTED__ === true;
  },
  
  /**
   * Mark that legacy config is being used (for monitoring)
   */
  markLegacyUsage(location: string): void {
    logger.warn(`Legacy configuration usage detected at: ${location}`, {
      location,
      timestamp: Date.now(),
      recommendation: 'Migrate to unified configuration system'
    });
    
    if (typeof window !== 'undefined') {
      (window as any).__LEGACY_CONFIG_DETECTED__ = true;
    }
  },
  
  /**
   * Get migration recommendations
   */
  getMigrationRecommendations(): string[] {
    return [
      'Replace APPLICATION_CONFIG with getUnifiedConfig()',
      'Replace VALIDATED_CONFIG with configurationProvider.validateConfiguration()',
      'Use configurationProvider.getHealthStatus() for config monitoring',
      'Update imports to use unified-types instead of config-types',
      'Consider using ConfigurationProvider for centralized config management'
    ];
  }
};

/**
 * Development helper để track migration progress
 */
if (import.meta.env.DEV) {
  logger.info('Configuration migration helper loaded', {
    legacyConfigAvailable: true,
    unifiedConfigAvailable: true,
    migrationRecommendations: migrationUtils.getMigrationRecommendations()
  });
}