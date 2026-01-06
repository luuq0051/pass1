/**
 * Performance Monitoring Utility
 * Theo dõi và tối ưu hóa hiệu suất ứng dụng
 */

import { logger } from './logger';

/**
 * Performance metrics interface
 */
interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

/**
 * Performance thresholds
 */
const PERFORMANCE_THRESHOLDS = {
  SLOW_OPERATION: 1000, // 1 second
  VERY_SLOW_OPERATION: 3000, // 3 seconds
  DATABASE_QUERY: 500, // 500ms
  COMPONENT_RENDER: 100, // 100ms
} as const;

/**
 * Performance Monitor Class
 */
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true';
  }

  /**
   * Start timing an operation
   */
  startTiming(name: string, metadata?: Record<string, any>): string {
    if (!this.isEnabled) return name;

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };

    this.metrics.set(name, metric);
    return name;
  }

  /**
   * End timing an operation
   */
  endTiming(name: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      logger.warn(`Performance metric '${name}' not found`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // Log performance warning nếu quá chậm
    this.checkPerformanceThreshold(metric);

    // Clean up
    this.metrics.delete(name);

    return metric.duration;
  }

  /**
   * Measure async operation
   */
  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.isEnabled) {
      return await operation();
    }

    this.startTiming(name, metadata);
    try {
      const result = await operation();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name);
      throw error;
    }
  }

  /**
   * Measure sync operation
   */
  measureSync<T>(
    name: string,
    operation: () => T,
    metadata?: Record<string, any>
  ): T {
    if (!this.isEnabled) {
      return operation();
    }

    this.startTiming(name, metadata);
    try {
      const result = operation();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name);
      throw error;
    }
  }

  /**
   * Check performance thresholds và log warnings
   */
  private checkPerformanceThreshold(metric: PerformanceMetric): void {
    if (!metric.duration) return;

    const { name, duration, metadata } = metric;

    if (duration > PERFORMANCE_THRESHOLDS.VERY_SLOW_OPERATION) {
      logger.warn(`Very slow operation detected: ${name}`, {
        duration: `${duration.toFixed(2)}ms`,
        threshold: `${PERFORMANCE_THRESHOLDS.VERY_SLOW_OPERATION}ms`,
        metadata
      });
    } else if (duration > PERFORMANCE_THRESHOLDS.SLOW_OPERATION) {
      logger.info(`Slow operation detected: ${name}`, {
        duration: `${duration.toFixed(2)}ms`,
        threshold: `${PERFORMANCE_THRESHOLDS.SLOW_OPERATION}ms`,
        metadata
      });
    }

    // Specific thresholds
    if (name.includes('database') && duration > PERFORMANCE_THRESHOLDS.DATABASE_QUERY) {
      logger.warn(`Slow database query: ${name}`, {
        duration: `${duration.toFixed(2)}ms`,
        metadata
      });
    }

    if (name.includes('render') && duration > PERFORMANCE_THRESHOLDS.COMPONENT_RENDER) {
      logger.warn(`Slow component render: ${name}`, {
        duration: `${duration.toFixed(2)}ms`,
        metadata
      });
    }
  }

  /**
   * Get memory usage information
   */
  getMemoryUsage(): Record<string, number> | null {
    if (!this.isEnabled || !('memory' in performance)) {
      return null;
    }

    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedPercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  }

  /**
   * Log memory usage
   */
  logMemoryUsage(context?: string): void {
    if (!this.isEnabled) return;

    const memory = this.getMemoryUsage();
    if (memory) {
      logger.debug(`Memory usage${context ? ` (${context})` : ''}`, {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
        percentage: `${memory.usedPercentage.toFixed(1)}%`
      });
    }
  }

  /**
   * Performance decorator for methods
   */
  createDecorator(defaultName?: string) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value;
      const name = defaultName || `${target.constructor.name}.${propertyName}`;

      descriptor.value = function (...args: any[]) {
        return performanceMonitor.measureSync(name, () => method.apply(this, args));
      };

      return descriptor;
    };
  }

  /**
   * Async performance decorator
   */
  createAsyncDecorator(defaultName?: string) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value;
      const name = defaultName || `${target.constructor.name}.${propertyName}`;

      descriptor.value = async function (...args: any[]) {
        return await performanceMonitor.measureAsync(name, () => method.apply(this, args));
      };

      return descriptor;
    };
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Convenience functions
 */
export const measureAsync = performanceMonitor.measureAsync.bind(performanceMonitor);
export const measureSync = performanceMonitor.measureSync.bind(performanceMonitor);
export const startTiming = performanceMonitor.startTiming.bind(performanceMonitor);
export const endTiming = performanceMonitor.endTiming.bind(performanceMonitor);
export const logMemoryUsage = performanceMonitor.logMemoryUsage.bind(performanceMonitor);

/**
 * Performance decorators
 */
export const PerformanceDecorator = performanceMonitor.createDecorator();
export const AsyncPerformanceDecorator = performanceMonitor.createAsyncDecorator();