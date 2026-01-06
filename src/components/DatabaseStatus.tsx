/**
 * DatabaseStatus Component
 * Hiển thị trạng thái kết nối database và service info
 */

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Cloud, HardDrive, RefreshCw, Info } from 'lucide-react';
import { ServiceFactory } from '@/lib/services/service-factory';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';

interface DatabaseStatusProps {
  className?: string;
  showDetails?: boolean;
}

interface ServiceInfo {
  detectedType: string;
  hasNeonConfig: boolean;
  forceNeonDB: boolean;
  apiBaseUrl: string;
  enableApiSync: boolean;
}

interface HealthStatus {
  isHealthy: boolean;
  responseTime?: number;
  error?: string;
  lastChecked: Date;
}

export const DatabaseStatus = ({ className, showDetails = false }: DatabaseStatusProps) => {
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    isHealthy: false,
    lastChecked: new Date()
  });
  const [isChecking, setIsChecking] = useState(false);

  /**
   * Load service information
   */
  const loadServiceInfo = () => {
    try {
      const info = ServiceFactory.getServiceInfo();
      setServiceInfo(info);
      logger.debug('Service info loaded', info);
    } catch (error) {
      logger.error('Failed to load service info', error);
    }
  };

  /**
   * Check database health
   */
  const checkHealth = async () => {
    setIsChecking(true);
    
    try {
      const service = ServiceFactory.getDefaultPasswordService();
      const startTime = Date.now();
      
      // Check if service has healthCheck method
      if ('healthCheck' in service && typeof service.healthCheck === 'function') {
        const isHealthy = await service.healthCheck();
        const responseTime = Date.now() - startTime;
        
        setHealthStatus({
          isHealthy,
          responseTime,
          lastChecked: new Date()
        });
      } else {
        // Fallback: try to get stats as health check
        await service.getStats();
        const responseTime = Date.now() - startTime;
        
        setHealthStatus({
          isHealthy: true,
          responseTime,
          lastChecked: new Date()
        });
      }
    } catch (error) {
      logger.warn('Health check failed', error);
      setHealthStatus({
        isHealthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date()
      });
    } finally {
      setIsChecking(false);
    }
  };

  /**
   * Initialize component
   */
  useEffect(() => {
    loadServiceInfo();
    checkHealth();
  }, []);

  /**
   * Get status badge variant
   */
  const getStatusVariant = () => {
    if (isChecking) return 'secondary';
    return healthStatus.isHealthy ? 'default' : 'destructive';
  };

  /**
   * Get database icon
   */
  const getDatabaseIcon = () => {
    if (serviceInfo?.detectedType === 'neondb') {
      return <Cloud className="h-4 w-4" />;
    }
    return <HardDrive className="h-4 w-4" />;
  };

  /**
   * Format response time
   */
  const formatResponseTime = (time?: number) => {
    if (!time) return 'N/A';
    return `${time}ms`;
  };

  if (!serviceInfo) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Database className="h-4 w-4 animate-pulse" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!showDetails) {
    // Compact view
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {getDatabaseIcon()}
        <Badge variant={getStatusVariant()}>
          {isChecking ? 'Checking...' : (
            healthStatus.isHealthy ? 
              (serviceInfo.detectedType === 'neondb' ? 'Neon DB' : 'IndexedDB') : 
              'Offline'
          )}
        </Badge>
        {healthStatus.responseTime && (
          <span className="text-xs text-muted-foreground">
            {formatResponseTime(healthStatus.responseTime)}
          </span>
        )}
      </div>
    );
  }

  // Detailed view
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Database className="h-4 w-4" />
          Database Status
          <Button
            variant="ghost"
            size="sm"
            onClick={checkHealth}
            disabled={isChecking}
            className="ml-auto h-6 w-6 p-0"
          >
            <RefreshCw className={cn("h-3 w-3", isChecking && "animate-spin")} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Connection</span>
          <Badge variant={getStatusVariant()}>
            {isChecking ? 'Checking...' : (healthStatus.isHealthy ? 'Connected' : 'Disconnected')}
          </Badge>
        </div>

        {/* Database Type */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Type</span>
          <div className="flex items-center gap-1">
            {getDatabaseIcon()}
            <span className="text-sm font-medium">
              {serviceInfo.detectedType === 'neondb' ? 'Neon PostgreSQL' : 'IndexedDB'}
            </span>
          </div>
        </div>

        {/* Response Time */}
        {healthStatus.responseTime && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Response Time</span>
            <span className="text-sm font-medium">
              {formatResponseTime(healthStatus.responseTime)}
            </span>
          </div>
        )}

        {/* API Sync Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">API Sync</span>
          <Badge variant={serviceInfo.enableApiSync ? 'default' : 'secondary'}>
            {serviceInfo.enableApiSync ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>

        {/* Last Checked */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Last Checked</span>
          <span className="text-xs text-muted-foreground">
            {healthStatus.lastChecked.toLocaleTimeString()}
          </span>
        </div>

        {/* Error Message */}
        {healthStatus.error && (
          <div className="rounded-md bg-destructive/10 p-2">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Connection Error</p>
                <p className="text-xs text-destructive/80">{healthStatus.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Configuration Info */}
        {serviceInfo.hasNeonConfig && (
          <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-2">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Neon DB Configured
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Using cloud database for data storage
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};