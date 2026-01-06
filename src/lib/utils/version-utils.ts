/**
 * Version Utilities
 * Utility functions để quản lý version information
 */

/**
 * Get version from package.json
 * Note: Trong production build, version sẽ được inject tại build time
 */
export const getAppVersion = (): string => {
  // TODO: Implement version injection từ package.json tại build time
  // Hiện tại return hardcoded version để tránh breaking changes
  return "1.0.0";
};

/**
 * Version comparison utilities
 */
export const compareVersions = (version1: string, version2: string): number => {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    
    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }
  
  return 0;
};

/**
 * Check if version is valid semver format
 */
export const isValidVersion = (version: string): boolean => {
  const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?(\+[a-zA-Z0-9-]+)?$/;
  return semverRegex.test(version);
};