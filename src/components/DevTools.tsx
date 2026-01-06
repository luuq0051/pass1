/**
 * DevTools Component
 * Development tools cho testing và debugging Neon DB integration
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  Cloud, 
  HardDrive, 
  RefreshCw, 
  Trash2, 
  Download,
  Upload,
  Settings,
  Bug
} from 'lucide-react';
import { ServiceFactory } from '@/lib/services/service-factory';
import { useToastNotifications } from '@/hooks/use-toast-notifications';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';

interface DevToolsProps {
  className?: string;
}

export const DevTools = ({ className }: DevToolsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError, showInfo } = useToastNotifications();

  /**
   * Get service information
   */
  const getServiceInfo = () => {
    try {
      const info = ServiceFactory.getServiceInfo();
      showInfo('Service Info', JSON.stringify(info, null, 2));
      logger.info('Service info retrieved', info);
    } catch (error) {
      showError('Error', 'Failed to get service info');
      logger.error('Failed to get service info', error);
    }
  };

  /**
   * Test database connection
   */
  const testConnection = async () => {
    setIsLoading(true);
    try {
      const service = ServiceFactory.getDefaultPasswordService();
      
      if ('healthCheck' in service && typeof service.healthCheck === 'function') {
        const isHealthy = await service.healthCheck();
        if (isHealthy) {
          showSuccess('Connection Test', 'Database connection is healthy');
        } else {
          showError('Connection Test', 'Database connection failed');
        }
      } else {
        // Fallback test
        await service.getStats();
        showSuccess('Connection Test', 'Database connection is working');
      }
    } catch (error) {
      showError('Connection Test', `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      logger.error('Connection test failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Switch to Neon DB
   */
  const switchToNeonDB = async () => {
    setIsLoading(true);
    try {
      ServiceFactory.clearCache();
      const neonService = ServiceFactory.getNeonPasswordService();
      const stats = await neonService.getStats();
      
      showSuccess('Switched to Neon DB', `Connected successfully. Total passwords: ${stats.total}`);
      logger.info('Switched to Neon DB', stats);
    } catch (error) {
      showError('Switch Failed', `Cannot switch to Neon DB: ${error instanceof Error ? error.message : 'Unknown error'}`);
      logger.error('Failed to switch to Neon DB', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Switch to IndexedDB
   */
  const switchToIndexedDB = async () => {
    setIsLoading(true);
    try {
      ServiceFactory.clearCache();
      const indexedDBService = ServiceFactory.getIndexedDBPasswordService();
      const stats = await indexedDBService.getStats();
      
      showSuccess('Switched to IndexedDB', `Connected successfully. Total passwords: ${stats.total}`);
      logger.info('Switched to IndexedDB', stats);
    } catch (error) {
      showError('Switch Failed', `Cannot switch to IndexedDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
      logger.error('Failed to switch to IndexedDB', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear all data
   */
  const clearAllData = async () => {
    if (!confirm('Are you sure you want to clear all password data? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const service = ServiceFactory.getDefaultPasswordService();
      await service.clearAllPasswords();
      
      showSuccess('Data Cleared', 'All password data has been cleared');
      logger.warn('All password data cleared via DevTools');
    } catch (error) {
      showError('Clear Failed', `Cannot clear data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      logger.error('Failed to clear data', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Export data
   */
  const exportData = async () => {
    setIsLoading(true);
    try {
      const service = ServiceFactory.getDefaultPasswordService();
      const passwords = await service.getAllPasswords();
      
      const dataStr = JSON.stringify(passwords, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `memory-safe-guard-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showSuccess('Export Complete', `Exported ${passwords.length} passwords`);
      logger.info('Data exported', { count: passwords.length });
    } catch (error) {
      showError('Export Failed', `Cannot export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      logger.error('Failed to export data', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn("gap-2", className)}
      >
        <Bug className="h-4 w-4" />
        Dev Tools
      </Button>
    );
  }

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Development Tools
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Service Information */}
        <div>
          <h3 className="text-sm font-medium mb-3">Service Information</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={getServiceInfo}
              disabled={isLoading}
            >
              <Settings className="h-4 w-4 mr-2" />
              Get Service Info
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={testConnection}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Test Connection
            </Button>
          </div>
        </div>

        <Separator />

        {/* Database Switching */}
        <div>
          <h3 className="text-sm font-medium mb-3">Database Switching</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={switchToNeonDB}
              disabled={isLoading}
            >
              <Cloud className="h-4 w-4 mr-2" />
              Switch to Neon DB
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={switchToIndexedDB}
              disabled={isLoading}
            >
              <HardDrive className="h-4 w-4 mr-2" />
              Switch to IndexedDB
            </Button>
          </div>
        </div>

        <Separator />

        {/* Data Operations */}
        <div>
          <h3 className="text-sm font-medium mb-3">Data Operations</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={clearAllData}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Data
            </Button>
          </div>
        </div>

        {/* Environment Info */}
        <div>
          <h3 className="text-sm font-medium mb-3">Environment</h3>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">
              {import.meta.env.MODE}
            </Badge>
            <Badge variant={import.meta.env.VITE_USE_NEONDB === 'true' ? 'default' : 'outline'}>
              Neon DB: {import.meta.env.VITE_USE_NEONDB === 'true' ? 'Enabled' : 'Disabled'}
            </Badge>
            <Badge variant={import.meta.env.VITE_ENABLE_API_SYNC === 'true' ? 'default' : 'outline'}>
              API Sync: {import.meta.env.VITE_ENABLE_API_SYNC === 'true' ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Processing...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};