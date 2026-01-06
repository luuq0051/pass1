/**
 * Configuration Type Definitions
 * Centralized type definitions cho tất cả configuration objects
 */

/**
 * App configuration type
 */
export interface AppConfig {
  readonly NAME: string;
  readonly DESCRIPTION: string;
  readonly VERSION: string;
}

/**
 * Environment configuration type
 * Updated: Thêm Neon DB và encryption support
 */
export interface EnvironmentConfig {
  readonly isDevelopment: boolean;
  readonly isProduction: boolean;
  readonly DATABASE_URL: string;
  readonly USE_NEONDB: boolean;
  readonly ENCRYPTION_KEY: string;
}

/**
 * Theme configuration type
 */
export interface ThemeConfig {
  readonly DEFAULT_THEME: "light" | "dark";
  readonly STORAGE_KEY: string;
}

/**
 * API configuration type
 */
export interface ApiConfig {
  readonly BASE_URL: string;
  readonly ENABLE_SYNC: boolean;
  readonly TIMEOUT: number;
}

/**
 * Database configuration type
 */
export interface DatabaseConfig {
  readonly NAME: string;
  readonly VERSION: number;
  readonly STORE_NAME: string;
  readonly INDEXES: readonly string[];
}

/**
 * Domain configuration type
 */
export interface DomainConfig {
  readonly APP_NAME: string;
  readonly APP_DESCRIPTION: string;
  readonly DOMAIN: string;
  readonly HOMEPAGE: string;
  readonly PRODUCTION_DOMAIN: string;
  readonly PRODUCTION_URL: string;
}

/**
 * Time constants type
 */
export interface TimeConstants {
  readonly CACHE_STALE_TIME: number;
  readonly API_TIMEOUT_DEFAULT: number;
  readonly API_TIMEOUT_MIN: number;
  readonly RETRY_ATTEMPTS_QUERY: number;
  readonly RETRY_ATTEMPTS_MUTATION: number;
}

/**
 * Routes configuration type
 */
export interface RoutesConfig {
  readonly HOME: string;
  readonly NOT_FOUND: string;
}

/**
 * Complete application configuration type
 */
export interface ApplicationConfiguration {
  app: AppConfig;
  environment: EnvironmentConfig;
  theme: ThemeConfig;
  api: ApiConfig;
  database: DatabaseConfig;
  domain: DomainConfig;
  routes: RoutesConfig;
}