/**
 * Configuration Performance Monitor
 * Theo dõi performance của configuration system
 * 
 * Features:
 * - Configuration load time tracking
 * - Memory usage monitoring
 * - Cache hit/miss statistics
 * - Performance recommendations
 */

import { logger } from '@/lib/utils/logger';

/**
 * Performance metrics interface
 */
export interface ConfigPerformanceMetrics {
  readonly loadTime: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly memoryUsage: number;
  readonly validationTime: number;
  readonly lastMeasurement: number;
}

/**
 * Performance recommendations
 */
export interface PerformanceRecommendation {
  readonly type: 'warning' | 'info' | 'critical';
  readonly message: string;
  readonly action: string;
  readonly impact: 'low' | 'medium' | 'high';
}

/**
 * Configuration Performance Monitor Class
 */
export class ConfigPerformanceMonitor {
  private static instance: ConfigPerformanceMonitor;
  private metrics: ConfigPerformanceMetrics;
  private loadTimes: number[] = [];
  private validationTimes: number[] = [];
  private readonly MAX_HISTORY = 100;

  private constructor() {
    this.metrics = {
      loadTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      memoryUsage: 0,
      validationTime: 0,
      lastMeasurement: Date.now(),
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ConfigPerformanceMonitor {
    if (!ConfigPerformanceMonitor.instance) {
      ConfigPerformanceMonitor.instance = new ConfigPerformanceMonitor();
    }
    return ConfigPerformanceMonitor.instance;
  }

  /**
   * Start measuring configuration load time
   */
  public startLoadMeasurement(): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      this.recordLoadTime(loadTime);
      
      logger.debug('Configuration load time recorded', {
        loadTime: `${loadTime.toFixed(2)}ms`,
        averageLoadTime: `${this.getAverageLoadTime().toFixed(2)}ms`
      });
    };
  }

  /**
   * Start measuring validation time
   */
  public startValidationMeasurement(): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const validationTime = endTime - startTime;
      
      this.recordValidationTime(validationTime);
      
      logger.debug('Configuration validation time recorded', {
        validationTime: `${validationTime.toFixed(2)}ms`,
        averageValidationTime: `${this.getAverageValidationTime().toFixed(2)}ms`
      });
    };
  }

  /**
   * Record cache hit
   */
  public recordCacheHit(): void {
    this.metrics = {
      ...this.metrics,
      cacheHits: this.metrics.cacheHits + 1,
      lastMeasurement: Date.now(),
    };
  }

  /**
   * Record cache miss
   */
  public recordCacheMiss(): void {
    this.metrics = {
      ...this.metrics,
      cacheMisses: this.metrics.cacheMisses + 1,
      lastMeasurement: Date.now(),
    };
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): ConfigPerformanceMetrics {
    return {
      ...this.metrics,
      loadTime: this.getAverageLoadTime(),
      validationTime: this.getAverageValidationTime(),
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Get performance recommendations
   */
  public getRecommendations(): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];
    const metrics = this.getMetrics();

    // Load time recommendations
    if (metrics.loadTime > 50) {
      recommendations.push({
        type: 'warning',
        message: `Configuration load time is high (${metrics.loadTime.toFixed(2)}ms)`,
        action: 'Consider enabling configuration caching or reducing config complexity',
        impact: 'medium',
      });
    }

    if (metrics.loadTime > 100) {
      recommendations.push({
        type: 'critical',
        message: `Configuration load time is very high (${metrics.loadTime.toFixed(2)}ms)`,
        action: 'Implement lazy loading or optimize configuration structure',
        impact: 'high',
      });
    }

    // Cache efficiency recommendations
    const cacheHitRate = this.getCacheHitRate();
    if (cacheHitRate < 0.8 && (metrics.cacheHits + metrics.cacheMisses) > 10) {
      recommendations.push({
        type: 'info',
        message: `Cache hit rate is low (${(cacheHitRate * 100).toFixed(1)}%)`,
        action: 'Review cache TTL settings or configuration access patterns',
        impact: 'low',
      });
    }

    // Validation time recommendations
    if (metrics.validationTime > 20) {
      recommendations.push({
        type: 'warning',
        message: `Configuration validation is slow (${metrics.validationTime.toFixed(2)}ms)`,
        action: 'Optimize validation logic or reduce validation frequency',
        impact: 'medium',
      });
    }

    // Memory usage recommendations
    if (metrics.memoryUsage > 1024 * 1024) { // 1MB
      recommendations.push({
        type: 'warning',
        message: `Configuration memory usage is high (${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB)`,
        action: 'Review configuration size and consider data optimization',
        impact: 'medium',
      });
    }

    return recommendations;
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(): {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    summary: string;
    recommendations: PerformanceRecommendation[];
  } {
    const metrics = this.getMetrics();
    const recommendations = this.getRecommendations();
    
    let score = 100;
    
    // Deduct points based on performance issues
    if (metrics.loadTime > 50) score -= 20;
    if (metrics.loadTime > 100) score -= 30;
    if (metrics.validationTime > 20) score -= 15;
    if (this.getCacheHitRate() < 0.8) score -= 10;
    if (metrics.memoryUsage > 1024 * 1024) score -= 15;
    
    score = Math.max(0, score);
    
    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
    
    const summary = this.generatePerformanceSummary(score, metrics);
    
    return {
      score,
      grade,
      summary,
      recommendations,
    };
  }

  /**
   * Reset metrics (for testing)
   */
  public resetMetrics(): void {
    this.metrics = {
      loadTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      memoryUsage: 0,
      validationTime: 0,
      lastMeasurement: Date.now(),
    };
    this.loadTimes = [];
    this.validationTimes = [];
  }

  /**
   * Private helper methods
   */
  private recordLoadTime(time: number): void {
    this.loadTimes.push(time);
    if (this.loadTimes.length > this.MAX_HISTORY) {
      this.loadTimes.shift();
    }
  }

  private recordValidationTime(time: number): void {
    this.validationTimes.push(time);
    if (this.validationTimes.length > this.MAX_HISTORY) {
      this.validationTimes.shift();
    }
  }

  private getAverageLoadTime(): number {
    if (this.loadTimes.length === 0) return 0;
    return this.loadTimes.reduce((sum, time) => sum + time, 0) / this.loadTimes.length;
  }

  private getAverageValidationTime(): number {
    if (this.validationTimes.length === 0) return 0;
    return this.validationTimes.reduce((sum, time) => sum + time, 0) / this.validationTimes.length;
  }

  private getCacheHitRate(): number {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total === 0 ? 1 : this.metrics.cacheHits / total;
  }

  private estimateMemoryUsage(): number {
    // Rough estimation based on configuration complexity
    // In a real implementation, you might use performance.measureUserAgentSpecificMemory()
    const baseSize = 1024; // 1KB base
    const configComplexity = this.loadTimes.length + this.validationTimes.length;
    return baseSize + (configComplexity * 100);
  }

  private generatePerformanceSummary(score: number, metrics: ConfigPerformanceMetrics): string {
    if (score >= 90) {
      return `Excellent configuration performance (${score}/100). Load time: ${metrics.loadTime.toFixed(2)}ms, Cache hit rate: ${(this.getCacheHitRate() * 100).toFixed(1)}%`;
    } else if (score >= 80) {
      return `Good configuration performance (${score}/100). Minor optimizations possible.`;
    } else if (score >= 70) {
      return `Fair configuration performance (${score}/100). Some performance issues detected.`;
    } else if (score >= 60) {
      return `Poor configuration performance (${score}/100). Performance optimization needed.`;
    } else {
      return `Critical configuration performance issues (${score}/100). Immediate attention required.`;
    }
  }
}

/**
 * Export singleton instance
 */
export const configPerformanceMonitor = ConfigPerformanceMonitor.getInstance();

/**
 * Convenience functions
 */
export const measureConfigLoad = () => configPerformanceMonitor.startLoadMeasurement();
export const measureConfigValidation = () => configPerformanceMonitor.startValidationMeasurement();
export const recordCacheHit = () => configPerformanceMonitor.recordCacheHit();
export const recordCacheMiss = () => configPerformanceMonitor.recordCacheMiss();
export const getConfigPerformance = () => configPerformanceMonitor.getPerformanceSummary();