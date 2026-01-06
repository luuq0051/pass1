/**
 * App Configuration Constants
 * Tập trung các cấu hình chính của ứng dụng
 */

import { QueryClient } from "@tanstack/react-query";
import { ENV_ACCESS } from './env-utils';

/**
 * App metadata configuration
 */
export const APP_CONFIG = {
  NAME: "Memory Safe Guard",
  DESCRIPTION: "Ứng dụng quản lý mật khẩu hiện đại và an toàn",
  VERSION: "1.0.0", // Có thể lấy từ package.json
} as const;

/**
 * Environment detection utilities
 * Centralized environment access với validation
 */
export const ENV_CONFIG = {
  // App environment
  isDevelopment: ENV_ACCESS.isDevelopment,
  isProduction: ENV_ACCESS.isProduction,
  
  // API configuration với validation - Updated to match API_CONFIG
  API_BASE_URL: ENV_ACCESS.getEnvVar('VITE_API_BASE_URL', 'https://yapee.online/api/passwords'),
  API_TIMEOUT: ENV_ACCESS.getNumberEnv('VITE_API_TIMEOUT', 5000),
  
  // Domain configuration
  APP_DOMAIN: ENV_ACCESS.getEnvVar('VITE_APP_DOMAIN', 'yapee.online'),
  APP_URL: ENV_ACCESS.getEnvVar('VITE_APP_URL', 'https://yapee.online'),
  
  // Database URL (nếu có)
  DATABASE_URL: ENV_ACCESS.getEnvVar('DATABASE_URL', ''),
} as const;

/**
 * Theme configuration
 */
export const THEME_CONFIG = {
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
      // Cache data trong 5 phút cho password data
      staleTime: 5 * 60 * 1000,
      // Retry 2 lần khi có lỗi
      retry: 2,
      // Không refetch khi window focus (bảo mật)
      refetchOnWindowFocus: false,
      // Không refetch khi reconnect (tránh leak data)
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry 1 lần cho mutations
      retry: 1,
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
export const ROUTES = {
  HOME: "/",
  NOT_FOUND: "*",
} as const;

/**
 * API configuration cho hybrid approach
 */
export const API_CONFIG = {
  // Sử dụng full URL cho production để pass validation
  BASE_URL: ENV_ACCESS.getEnvVar('VITE_API_BASE_URL', 
    ENV_ACCESS.isProduction 
      ? `${ENV_ACCESS.getEnvVar('VITE_APP_URL', 'https://silver-bublanina-ab8828.netlify.app')}/.netlify/functions/api`
      : '/api'
  ),
  // Smart sync enabling: production default true, có thể override bằng env var
  ENABLE_SYNC: ENV_ACCESS.getBooleanEnv('VITE_ENABLE_API_SYNC', ENV_ACCESS.isProduction),
  TIMEOUT: ENV_ACCESS.getNumberEnv('VITE_API_TIMEOUT', 10000), // Tăng timeout lên 10s
} as const;

/**
 * Database configuration
 */
export const DATABASE_CONFIG = {
  NAME: "memorySafeGuardDB",
  VERSION: 1,
  STORE_NAME: "passwords",
  INDEXES: ["service", "username", "updatedAt"] as const,
} as const;

/**
 * Domain configuration
 */
export const DOMAIN_CONFIG = {
  APP_NAME: "Memory Safe Guard",
  APP_DESCRIPTION: "Quản lý mật khẩu an toàn và hiện đại",
  DOMAIN: "yapee.online",
  HOMEPAGE: "https://yapee.online",
  // Thêm properties để consistent với Footer component
  PRODUCTION_DOMAIN: "yapee.online",
  PRODUCTION_URL: "https://yapee.online",
} as const;
