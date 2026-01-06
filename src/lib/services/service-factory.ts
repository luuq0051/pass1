/**
 * Service Factory Pattern
 * Centralized service creation và dependency injection
 * Updated: Enhanced Neon DB support với automatic detection
 */

import { PasswordService } from './password-service';
import { NeonPasswordService } from './neon-password-service';
import { IndexedDBPasswordRepository, IPasswordRepository } from '@/lib/db/password-repository';
import { API_CONFIG, ENV_CONFIG } from '@/lib/config/app-config';
import { logger } from '@/lib/utils/logger';

/**
 * Service configuration interface
 */
export interface ServiceFactoryConfig {
  enableApiSync?: boolean;
  repositoryType?: 'indexeddb' | 'neondb' | 'api' | 'hybrid';
  useNeonDB?: boolean;
  forceNeonDB?: boolean; // New: Force Neon DB usage
}

/**
 * Factory class cho service creation
 */
export class ServiceFactory {
  private static repositories = new Map<string, IPasswordRepository>();
  private static services = new Map<string, PasswordService | NeonPasswordService>();

  /**
   * Detect best service type based on environment
   */
  private static detectServiceType(): 'neondb' | 'indexeddb' {
    // Kiểm tra environment variables
    const hasNeonConfig = ENV_CONFIG.DATABASE_URL && ENV_CONFIG.DATABASE_URL.length > 0;
    const forceNeonDB = ENV_CONFIG.USE_NEONDB;
    const isProduction = ENV_CONFIG.isProduction;

    if (forceNeonDB || hasNeonConfig) {
      logger.info('Auto-detected Neon DB configuration', { 
        hasNeonConfig, 
        forceNeonDB, 
        isProduction 
      });
      return 'neondb';
    }

    logger.info('Using IndexedDB as fallback', { 
      hasNeonConfig, 
      forceNeonDB, 
      isProduction 
    });
    return 'indexeddb';
  }

  /**
   * Create password repository based on configuration
   */
  static createPasswordRepository(type: 'indexeddb' | 'neondb' | 'api' | 'hybrid' = 'indexeddb'): IPasswordRepository {
    const key = `password-repo-${type}`;
    
    if (!this.repositories.has(key)) {
      switch (type) {
        case 'indexeddb':
          this.repositories.set(key, new IndexedDBPasswordRepository());
          break;
        case 'neondb':
          // NeonDB sử dụng HTTP API, không cần repository pattern
          logger.info('NeonDB uses direct HTTP API, skipping repository creation');
          break;
        case 'api':
          // TODO: Implement API repository
          throw new Error('API repository not implemented yet');
        case 'hybrid':
          // TODO: Implement hybrid repository (NeonDB + IndexedDB fallback)
          throw new Error('Hybrid repository not implemented yet');
        default:
          throw new Error(`Unknown repository type: ${type}`);
      }
    }

    return this.repositories.get(key)!;
  }

  /**
   * Create password service with proper dependencies
   * Enhanced: Auto-detection và smart fallback
   */
  static createPasswordService(config: ServiceFactoryConfig = {}): PasswordService | NeonPasswordService {
    const {
      enableApiSync = API_CONFIG.ENABLE_SYNC,
      repositoryType,
      useNeonDB,
      forceNeonDB = false
    } = config;

    // Auto-detect service type nếu không được chỉ định
    const detectedType = repositoryType || this.detectServiceType();
    const shouldUseNeonDB = forceNeonDB || useNeonDB || detectedType === 'neondb';

    if (shouldUseNeonDB) {
      const key = `neon-password-service-${enableApiSync}`;
      
      if (!this.services.has(key)) {
        logger.info('Creating NeonPasswordService instance', { 
          enableApiSync,
          apiBaseUrl: API_CONFIG.BASE_URL 
        });
        
        const service = new NeonPasswordService({
          apiBaseUrl: API_CONFIG.BASE_URL,
          timeout: API_CONFIG.TIMEOUT,
          enableEncryption: !!ENV_CONFIG.ENCRYPTION_KEY
        });
        
        this.services.set(key, service);
      }

      return this.services.get(key)! as NeonPasswordService;
    }

    // Fallback to IndexedDB service
    const key = `password-service-${detectedType}-${enableApiSync}`;
    
    if (!this.services.has(key)) {
      logger.info('Creating IndexedDB PasswordService instance', { 
        repositoryType: detectedType,
        enableApiSync 
      });
      
      // Create repository
      const repository = this.createPasswordRepository(detectedType);
      
      // Create service with dependency injection
      const service = PasswordService.getInstance({ enableApiSync });
      
      this.services.set(key, service);
    }

    return this.services.get(key)! as PasswordService;
  }

  /**
   * Clear all cached instances - for testing
   */
  static clearCache(): void {
    this.repositories.clear();
    this.services.clear();
    PasswordService.resetInstance();
    logger.info('ServiceFactory cache cleared');
  }

  /**
   * Get default password service với smart detection
   * Enhanced: Automatic service selection
   */
  static getDefaultPasswordService(): PasswordService | NeonPasswordService {
    const detectedType = this.detectServiceType();
    
    logger.info('Getting default password service', { 
      detectedType,
      apiSync: API_CONFIG.ENABLE_SYNC 
    });
    
    return this.createPasswordService({
      enableApiSync: API_CONFIG.ENABLE_SYNC,
      repositoryType: detectedType
    });
  }

  /**
   * Force NeonDB service creation
   */
  static getNeonPasswordService(): NeonPasswordService {
    logger.info('Force creating NeonPasswordService');
    
    return this.createPasswordService({
      forceNeonDB: true,
      enableApiSync: true
    }) as NeonPasswordService;
  }

  /**
   * Force IndexedDB service creation
   */
  static getIndexedDBPasswordService(): PasswordService {
    logger.info('Force creating IndexedDB PasswordService');
    
    return this.createPasswordService({
      repositoryType: 'indexeddb',
      enableApiSync: false
    }) as PasswordService;
  }

  /**
   * Get service info for debugging
   */
  static getServiceInfo(): {
    detectedType: string;
    hasNeonConfig: boolean;
    forceNeonDB: boolean;
    apiBaseUrl: string;
    enableApiSync: boolean;
  } {
    return {
      detectedType: this.detectServiceType(),
      hasNeonConfig: !!(ENV_CONFIG.DATABASE_URL && ENV_CONFIG.DATABASE_URL.length > 0),
      forceNeonDB: ENV_CONFIG.USE_NEONDB,
      apiBaseUrl: API_CONFIG.BASE_URL,
      enableApiSync: API_CONFIG.ENABLE_SYNC
    };
  }
}