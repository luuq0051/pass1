# Configuration System Documentation

## Tổng quan

Hệ thống configuration của Memory Safe Guard đã được refactor để cải thiện type safety, performance và maintainability. Hệ thống mới sử dụng **Unified Configuration Provider** pattern thay vì multiple scattered configs.

## Architecture

### Before (Deprecated)
```
├── app-config.ts          # Static constants
├── config-factory.ts      # Factory pattern
├── configuration-service.ts # Service pattern  
├── config-manager.ts      # Manager pattern
└── config-types.ts        # Type definitions
```

### After (Recommended)
```
├── unified-types.ts           # Single source of truth cho types
├── configuration-provider.ts  # Unified provider với caching
├── migration-helper.ts        # Backward compatibility
└── config-performance-monitor.ts # Performance tracking
```

## Usage Examples

### ✅ Recommended: Unified Configuration

```typescript
import { getUnifiedConfig, validateConfig } from '@/lib/config';

// Get complete configuration
const config = getUnifiedConfig();

// Access specific configs
console.log(config.app.name);
console.log(config.api.baseUrl);
console.log(config.database.name);

// Validate configuration
const validation = validateConfig(config);
if (!validation.isValid) {
  console.error('Config errors:', validation.errors);
}
```

### ✅ Environment-specific Configuration

```typescript
import { getUnifiedConfig } from '@/lib/config';

// Get config for specific environment
const devConfig = getUnifiedConfig({ profile: 'development' });
const prodConfig = getUnifiedConfig({ profile: 'production' });

// With overrides
const customConfig = getUnifiedConfig({
  profile: 'development',
  overrides: {
    api: {
      timeout: 5000,
      enableSync: false
    }
  }
});
```

### ✅ Performance Monitoring

```typescript
import { getConfigPerformance, measureConfigLoad } from '@/lib/config';

// Measure config load time
const endMeasurement = measureConfigLoad();
const config = getUnifiedConfig();
endMeasurement(); // Records timing

// Get performance summary
const performance = getConfigPerformance();
console.log(`Config performance: ${performance.grade} (${performance.score}/100)`);
```

### ⚠️ Legacy (Backward Compatible)

```typescript
// Still works but deprecated
import { APPLICATION_CONFIG } from '@/lib/config';

console.log(APPLICATION_CONFIG.app.NAME); // Works but not recommended
```

## Migration Guide

### Step 1: Update Imports

```typescript
// Before
import { APPLICATION_CONFIG } from '@/lib/config';
import type { ApplicationConfiguration } from '@/lib/types/config-types';

// After
import { getUnifiedConfig } from '@/lib/config';
import type { UnifiedApplicationConfiguration } from '@/lib/config';
```

### Step 2: Update Usage

```typescript
// Before
const apiUrl = APPLICATION_CONFIG.api.BASE_URL;
const dbName = APPLICATION_CONFIG.database.NAME;

// After
const config = getUnifiedConfig();
const apiUrl = config.api.baseUrl;
const dbName = config.database.name;
```

### Step 3: Add Validation

```typescript
// Before
// No validation

// After
import { validateConfig } from '@/lib/config';

const config = getUnifiedConfig();
const validation = validateConfig(config);

if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors);
}
```

## Type Safety Improvements

### Before: Multiple Interfaces
```typescript
// config-factory.ts
interface ApplicationConfiguration {
  name: string;
  version: string;
}

// config-types.ts  
interface ApplicationConfiguration { // ❌ Name conflict!
  app: AppConfig;
  environment: EnvironmentConfig;
}
```

### After: Unified Types
```typescript
// unified-types.ts
interface UnifiedApplicationConfiguration {
  app: AppMetadata;
  environment: EnvironmentConfiguration;
  api: ApiConfiguration;
  database: DatabaseConfiguration;
  // ... all configs in one place
}
```

## Performance Benefits

### Caching
- ✅ Automatic configuration caching
- ✅ TTL-based cache invalidation
- ✅ Cache hit/miss tracking

### Lazy Loading
- ✅ Configuration loaded only when needed
- ✅ Singleton pattern prevents multiple instances
- ✅ Performance monitoring built-in

### Memory Optimization
- ✅ Single configuration object in memory
- ✅ No duplicate config instances
- ✅ Memory usage tracking

## Best Practices

### ✅ Do's

1. **Use getUnifiedConfig()** cho tất cả config access
2. **Validate configuration** trong production
3. **Monitor performance** với built-in tools
4. **Use type-safe access** với TypeScript
5. **Cache configuration** khi có thể

### ❌ Don'ts

1. **Không access** APPLICATION_CONFIG trực tiếp (deprecated)
2. **Không tạo** multiple config instances
3. **Không skip** validation trong production
4. **Không hardcode** config values
5. **Không ignore** performance warnings

## Environment Variables

### API Configuration
```bash
VITE_API_BASE_URL=https://api.example.com
VITE_API_TIMEOUT=10000
VITE_ENABLE_API_SYNC=true
VITE_API_RETRY_ATTEMPTS=3
```

### Development
```bash
NODE_ENV=development
VITE_ENABLE_CACHING=true
VITE_LOG_LEVEL=debug
```

### Production
```bash
NODE_ENV=production
VITE_ENABLE_CACHING=true
VITE_LOG_LEVEL=info
```

## Troubleshooting

### Common Issues

#### Type Errors
```typescript
// ❌ Error: Property 'BASE_URL' does not exist
const url = config.api.BASE_URL;

// ✅ Fix: Use correct property name
const url = config.api.baseUrl;
```

#### Performance Issues
```typescript
// ❌ Creating config multiple times
function getApiUrl() {
  const config = getUnifiedConfig(); // Called every time
  return config.api.baseUrl;
}

// ✅ Cache config at module level
const config = getUnifiedConfig();
function getApiUrl() {
  return config.api.baseUrl;
}
```

#### Validation Failures
```typescript
// Check validation results
const config = getUnifiedConfig();
const validation = validateConfig(config);

if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
  console.warn('Validation warnings:', validation.warnings);
  console.info('Suggestions:', validation.suggestions);
}
```

## Testing

### Unit Tests
```typescript
import { ConfigurationProvider } from '@/lib/config/configuration-provider';

describe('Configuration', () => {
  beforeEach(() => {
    ConfigurationProvider.resetInstance();
  });

  it('should create valid configuration', () => {
    const config = getUnifiedConfig();
    expect(config.app.name).toBeDefined();
    expect(config.api.baseUrl).toMatch(/^https?:\/\//);
  });
});
```

### Integration Tests
```typescript
import { getConfigPerformance } from '@/lib/config';

describe('Configuration Performance', () => {
  it('should load configuration quickly', () => {
    const performance = getConfigPerformance();
    expect(performance.score).toBeGreaterThan(80);
    expect(performance.grade).toMatch(/[A-C]/);
  });
});
```

## Future Roadmap

### Phase 1: ✅ Completed
- [x] Unified type system
- [x] Configuration provider
- [x] Migration helper
- [x] Performance monitoring

### Phase 2: 🚧 In Progress
- [ ] Remove deprecated configs
- [ ] Update all imports
- [ ] Add comprehensive tests
- [ ] Performance optimization

### Phase 3: 📋 Planned
- [ ] Configuration hot-reloading
- [ ] Advanced caching strategies
- [ ] Configuration versioning
- [ ] Remote configuration support