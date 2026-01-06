/**
 * App Configuration Constants
 * Tập trung các cấu hình chính của ứng dụng
 */

import { QueryClient } from "@tanstack/react-query";
import { ENV_ACCESS } from './env-utils';
import { buildApiBaseUrl } from './url-builder';
import { getAppVersion } from '@/lib/utils/version-utils';
import type { 
  AppConfig, 
  EnvironmentConfig, 
  ThemeConfig, 
  ApiConfig, 
  DatabaseConfig, 
  DomainConfig, 
  TimeConstants,
  RoutesConfig 
} from '@/lib/types/config-types';

/**
 * Time constants (milliseconds)
 * Centralized time values để tránh magic numbers
 */
const TIME_CONSTANTS: TimeConstants = {
  CACHE_STALE_TIME: 5 * 60 * 1000, // 5 phút - thời gian cache cho password data
  API_TIMEOUT_DEFAULT: 10 * 1000, // 10 giây - timeout mặc định cho production
  API_TIMEOUT_MIN: 3 * 1000, // 3 giây - timeout tối thiểu để tránh premature failures
  RETRY_ATTEMPTS_QUERY: 2, // Số lần retry cho queries
  RETRY_ATTEMPTS_MUTATION: 1, // Số lần retry cho mutations
} as const;

/**
 * App metadata configuration
 * Note: VERSION được quản lý thông qua version-utils để đảm bảo consistency
 */
export const APP_CONFIG: AppConfig = {
  NAME: "Memory Safe Guard",
  DESCRIPTION: "Ứng dụng quản lý mật khẩu hiện đại và an toàn",
  VERSION: getAppVersion(), // Refactored: Sử dụng utility function
} as const;

/**
 * Environment detection utilities
 * Centralized environment access với validation
 * 
 * Refactored: Thêm Neon DB configuration
 */
export const ENV_CONFIG: EnvironmentConfig = {
  // App environment
  isDevelopment: ENV_ACCESS.isDevelopment,
  isProduction: ENV_ACCESS.isProduction,
  
  // Database configuration
  DATABASE_URL: ENV_ACCESS.getEnvVar('DATABASE_URL', ''),
  USE_NEONDB: ENV_ACCESS.getBooleanEnv('VITE_USE_NEONDB', false),
  
  // Encryption configuration
  ENCRYPTION_KEY: ENV_ACCESS.getEnvVar('VITE_ENCRYPTION_KEY', ''),
} as const;

/**
 * Theme configuration
 */
export const THEME_CONFIG: ThemeConfig = {
  DEFAULT_THEME: "dark" as const,
  STORAGE_KEY: "memory-safe-guard-theme",
} as const;

/**
 * QueryClient configuration cho password manager
 * Tối ưu cho bảo mật và performance
 */
export const QUERY_CLIENT_CONFIG = {
  defaultOptions: {
    queries: {
      // Cache data trong thời gian được định nghĩa cho password data
      staleTime: TIME_CONSTANTS.CACHE_STALE_TIME,
      // Retry với số lần được định nghĩa khi có lỗi
      retry: TIME_CONSTANTS.RETRY_ATTEMPTS_QUERY,
      // Không refetch khi window focus (bảo mật)
      refetchOnWindowFocus: false,
      // Không refetch khi reconnect (tránh leak data)
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry với số lần được định nghĩa cho mutations
      retry: TIME_CONSTANTS.RETRY_ATTEMPTS_MUTATION,
    },
  },
} as const;

/**
 * Tạo QueryClient instance với cấu hình tối ưu
 */
export const createQueryClient = () => new QueryClient(QUERY_CLIENT_CONFIG);

/**
 * Route configuration
 */
export const ROUTES: RoutesConfig = {
  HOME: "/",
  NOT_FOUND: "*",
} as const;

/**
 * API Default Configuration
 * Centralized defaults để tránh magic values
 */
const API_DEFAULTS = {
  // Smart sync enabling: production default true, development false để tránh timeout
  DEFAULT_SYNC_ENABLED: ENV_ACCESS.isProduction,
  // Fallback sync disabled để tránh API timeout trong development
  FALLBACK_SYNC_ENABLED: false,
  DEFAULT_TIMEOUT: TIME_CONSTANTS.API_TIMEOUT_DEFAULT,
  MIN_TIMEOUT: TIME_CONSTANTS.API_TIMEOUT_MIN,
} as const;

export const API_CONFIG: ApiConfig = {
  // Clean URL construction với proper separation of concerns
  BASE_URL: buildApiBaseUrl(),
  // Smart sync configuration với proper fallback logic
  ENABLE_SYNC: ENV_ACCESS.getBooleanEnv(
    'VITE_ENABLE_API_SYNC', 
    // Sử dụng fallback disabled để tránh timeout issues trong development
    ENV_ACCESS.isDevelopment ? API_DEFAULTS.FALLBACK_SYNC_ENABLED : API_DEFAULTS.DEFAULT_SYNC_ENABLED
  ),
  TIMEOUT: Math.max(
    ENV_ACCESS.getNumberEnv('VITE_API_TIMEOUT', API_DEFAULTS.DEFAULT_TIMEOUT),
    API_DEFAULTS.MIN_TIMEOUT
  ),
} as const;

/**
 * Database configuration
 */
export const DATABASE_CONFIG: DatabaseConfig = {
  NAME: "memorySafeGuardDB",
  VERSION: 1,
  STORE_NAME: "passwords",
  INDEXES: ["service", "username", "updatedAt"] as const,
} as const;

/**
 * Domain configuration
 * Refactored: Loại bỏ trùng lặp và tạo computed properties
 */
const DOMAIN_BASE = "silver-bublanina-ab8828.netlify.app" as const;

export const DOMAIN_CONFIG: DomainConfig = {
  APP_NAME: "Memory Safe Guard",
  APP_DESCRIPTION: "Quản lý mật khẩu an toàn và hiện đại",
  DOMAIN: DOMAIN_BASE,
  HOMEPAGE: `https://${DOMAIN_BASE}`,
  // Computed properties để tránh trùng lặp
  PRODUCTION_DOMAIN: DOMAIN_BASE,
  PRODUCTION_URL: `https://${DOMAIN_BASE}`,
} as const;
