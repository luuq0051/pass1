/**
 * Unified Configuration System Tests
 * Comprehensive test suite cho new configuration system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigurationProvider } from '../configuration-provider';
import { ConfigurationMigrationAdapter } from '../migration-helper';
import { configPerformanceMonitor } from '../config-performance-monitor';
import type { UnifiedApplicationConfiguration } from '../unified-types';

// Mock environment variables
vi.mock('../env-utils', () => ({
  ENV_ACCESS: {
    isDevelopment: true,
    isProduction: false,
    getEnvVar: vi.fn((key: string, defaultValue: string) => defaultValue),
    getBooleanEnv: vi.fn((key: string, defaultValue: boolean) => defaultValue),
    getNumberEnv: vi.fn((key: string, defaultValue: number) => defaultValue),
  }
}));

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    time: vi.fn(() => vi.fn()),
  }
}));

describe('ConfigurationProvider', () => {
  let provider: ConfigurationProvider;

  beforeEach(() => {
    ConfigurationProvider.resetInstance();
    provider = ConfigurationProvider.getInstance();
    configPerformanceMonitor.resetMetrics();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = ConfigurationProvider.getInstance();
      const instance2 = ConfigurationProvider.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Configuration Creation', () => {
    it('should create valid development configuration', () => {
      const config = provider.getConfiguration({ profile: 'development' });
      
      expect(config).toBeDefined();
      expect(config.environment).toBe('development');
      expect(config.app.name).toContain('Dev');
      expect(config.api.enableSync).toBe(false);
      expect(config.database.name).toContain('_dev');
    });

    it('should create valid production configuration', () => {
      const config = provider.getConfiguration({ profile: 'production' });
      
      expect(config).toBeDefined();
      expect(config.environment).toBe('production');
      expect(config.app.name).toBe('Memory Safe Guard');
      expect(config.api.enableSync).toBe(true);
      expect(config.database.name).toBe('memorySafeGuardDB');
    });

    it('should create valid testing configuration', () => {
      const config = provider.getConfiguration({ profile: 'testing' });
      
      expect(config).toBeDefined();
      expect(config.environment).toBe('testing');
      expect(config.app.name).toContain('Test');
      expect(config.api.enableSync).toBe(false);
      expect(config.database.enableBackup).toBe(false);
    });
  });

  describe('Configuration Overrides', () => {
    it('should apply overrides correctly', () => {
      const config = provider.getConfiguration({
        profile: 'development',
        overrides: {
          api: {
            timeout: 5000,
            enableSync: true,
          },
          app: {
            name: 'Custom App Name',
          }
        }
      });

      expect(config.api.timeout).toBe(5000);
      expect(config.api.enableSync).toBe(true);
      expect(config.app.name).toBe('Custom App Name');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate valid configuration', () => {
      const config = provider.getConfiguration();
      const validation = provider.validateConfiguration(config);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.score).toBeGreaterThan(0);
    });

    it('should detect invalid API URL', () => {
      const config = provider.getConfiguration({
        overrides: {
          api: {
            baseUrl: 'invalid-url'
          }
        }
      });
      
      const validation = provider.validateConfiguration(config);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid API base URL');
    });

    it('should detect empty database name', () => {
      const config = provider.getConfiguration({
        overrides: {
          database: {
            name: ''
          }
        }
      });
      
      const validation = provider.validateConfiguration(config);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Database name is required');
    });

    it('should provide performance suggestions', () => {
      const config = provider.getConfiguration({
        profile: 'production',
        overrides: {
          api: {
            enableCaching: false
          }
        }
      });
      
      const validation = provider.validateConfiguration(config);
      expect(validation.suggestions).toContain('Consider enabling API caching for production');
    });
  });

  describe('Health Status', () => {
    it('should return healthy status for valid config', () => {
      const health = provider.getHealthStatus();
      
      expect(health.isHealthy).toBe(true);
      expect(health.apiStatus).toBe('healthy');
      expect(health.databaseStatus).toBe('healthy');
      expect(health.overallScore).toBeGreaterThan(50);
    });

    it('should detect API issues', () => {
      provider.getConfiguration({
        overrides: {
          api: {
            baseUrl: 'invalid'
          }
        }
      });
      
      const health = provider.getHealthStatus();
      expect(health.apiStatus).toBe('error');
      expect(health.isHealthy).toBe(false);
    });
  });

  describe('Caching', () => {
    it('should cache configuration', () => {
      const config1 = provider.getConfiguration();
      const config2 = provider.getConfiguration();
      
      expect(config1).toBe(config2); // Same reference = cached
    });

    it('should clear cache', () => {
      const config1 = provider.getConfiguration();
      provider.clearCache();
      const config2 = provider.getConfiguration();
      
      expect(config1).not.toBe(config2); // Different reference = not cached
    });
  });
});

describe('ConfigurationMigrationAdapter', () => {
  describe('Legacy to Unified Conversion', () => {
    it('should convert legacy config correctly', () => {
      const legacyConfig = {
        app: {
          NAME: 'Test App',
          DESCRIPTION: 'Test Description',
          VERSION: '1.0.0'
        },
        environment: {
          isDevelopment: true,
          isProduction: false,
          DATABASE_URL: ''
        },
        theme: {
          DEFAULT_THEME: 'dark' as const,
          STORAGE_KEY: 'test-theme'
        },
        api: {
          BASE_URL: 'https://api.test.com',
          ENABLE_SYNC: true,
          TIMEOUT: 5000
        },
        database: {
          NAME: 'testDB',
          VERSION: 1,
          STORE_NAME: 'test',
          INDEXES: ['id', 'name'] as const
        },
        domain: {
          APP_NAME: 'Test App',
          APP_DESCRIPTION: 'Test Description',
          DOMAIN: 'test.com',
          HOMEPAGE: 'https://test.com',
          PRODUCTION_DOMAIN: 'test.com',
          PRODUCTION_URL: 'https://test.com'
        },
        routes: {
          HOME: '/',
          NOT_FOUND: '*'
        }
      };

      const unifiedConfig = ConfigurationMigrationAdapter.convertLegacyToUnified(legacyConfig);
      
      expect(unifiedConfig.app.name).toBe('Test App');
      expect(unifiedConfig.api.baseUrl).toBe('https://api.test.com');
      expect(unifiedConfig.database.name).toBe('testDB');
      expect(unifiedConfig.environment.isDevelopment).toBe(true);
    });
  });

  describe('Backward Compatibility', () => {
    it('should provide compatible config', () => {
      const config = ConfigurationMigrationAdapter.getCompatibleConfig();
      
      expect(config).toBeDefined();
      expect(config.app.name).toBeDefined();
      expect(config.api.baseUrl).toBeDefined();
      expect(config.database.name).toBeDefined();
    });
  });
});

describe('Performance Monitoring', () => {
  beforeEach(() => {
    configPerformanceMonitor.resetMetrics();
  });

  describe('Load Time Measurement', () => {
    it('should measure configuration load time', () => {
      const endMeasurement = configPerformanceMonitor.startLoadMeasurement();
      
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait 10ms
      }
      
      endMeasurement();
      
      const metrics = configPerformanceMonitor.getMetrics();
      expect(metrics.loadTime).toBeGreaterThan(0);
    });
  });

  describe('Cache Tracking', () => {
    it('should track cache hits and misses', () => {
      configPerformanceMonitor.recordCacheHit();
      configPerformanceMonitor.recordCacheHit();
      configPerformanceMonitor.recordCacheMiss();
      
      const metrics = configPerformanceMonitor.getMetrics();
      expect(metrics.cacheHits).toBe(2);
      expect(metrics.cacheMisses).toBe(1);
    });
  });

  describe('Performance Recommendations', () => {
    it('should provide recommendations for slow load times', () => {
      // Simulate slow load times
      for (let i = 0; i < 5; i++) {
        const endMeasurement = configPerformanceMonitor.startLoadMeasurement();
        setTimeout(endMeasurement, 100); // Simulate 100ms load time
      }
      
      const recommendations = configPerformanceMonitor.getRecommendations();
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Summary', () => {
    it('should generate performance summary', () => {
      const summary = configPerformanceMonitor.getPerformanceSummary();
      
      expect(summary.score).toBeGreaterThanOrEqual(0);
      expect(summary.score).toBeLessThanOrEqual(100);
      expect(['A', 'B', 'C', 'D', 'F']).toContain(summary.grade);
      expect(summary.summary).toBeDefined();
      expect(Array.isArray(summary.recommendations)).toBe(true);
    });
  });
});

describe('Type Safety', () => {
  it('should provide type-safe configuration access', () => {
    const provider = ConfigurationProvider.getInstance();
    const config = provider.getConfiguration();
    
    // These should compile without TypeScript errors
    expect(typeof config.app.name).toBe('string');
    expect(typeof config.api.baseUrl).toBe('string');
    expect(typeof config.api.timeout).toBe('number');
    expect(typeof config.api.enableSync).toBe('boolean');
    expect(typeof config.database.name).toBe('string');
    expect(typeof config.database.version).toBe('number');
    expect(Array.isArray(config.database.indexes)).toBe(true);
  });
});

describe('Error Handling', () => {
  it('should handle configuration creation errors gracefully', () => {
    // Mock a failure in configuration creation
    const originalGetEnvVar = vi.fn().mockImplementation(() => {
      throw new Error('Environment variable access failed');
    });
    
    vi.doMock('../env-utils', () => ({
      ENV_ACCESS: {
        isDevelopment: true,
        isProduction: false,
        getEnvVar: originalGetEnvVar,
        getBooleanEnv: vi.fn(),
        getNumberEnv: vi.fn(),
      }
    }));

    expect(() => {
      const provider = ConfigurationProvider.getInstance();
      provider.clearCache(); // Force recreation
      provider.getConfiguration();
    }).toThrow('Configuration creation failed');
  });
});