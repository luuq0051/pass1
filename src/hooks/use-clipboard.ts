/**
 * useClipboard Hook - Refactored với Clean Architecture
 * Enhanced clipboard operations với standardized error handling
 * 
 * Features:
 * - Standardized error patterns
 * - Performance monitoring
 * - Memory leak prevention
 * - Security policies
 * - Clean separation of concerns
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useToastNotifications } from '@/hooks/use-toast-notifications';
import { logger } from '@/lib/utils/logger';
import { 
  ClipboardConfig, 
  ClipboardContext, 
  ClipboardSecurityPolicy,
  UseClipboardReturn,
  ClipboardResult 
} from '@/lib/types/clipboard-types';
import { 
  copyTextToClipboard, 
  clearClipboardContent, 
  isClipboardSupported 
} from '@/lib/utils/clipboard-utils';

/**
 * Default security policy
 */
const DEFAULT_SECURITY_POLICY: ClipboardSecurityPolicy = {
  autoCleanup: false,
  cleanupDelay: 30000,
  maxTextLength: 10000,
};

/**
 * Enhanced clipboard hook với clean architecture
 */
export const useClipboard = (config: ClipboardConfig = {}): UseClipboardReturn => {
  const {
    showToast = true,
    toastDuration = 2000,
    securityPolicy = DEFAULT_SECURITY_POLICY,
    retryConfig = { maxRetries: 2, retryDelay: 1000 }
  } = config;

  const [copied, setCopied] = useState(false);
  const { showSuccess, showError } = useToastNotifications();
  
  // Refs để cleanup timeouts
  const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set());
  const isSupported = isClipboardSupported();

  /**
   * Cleanup all timeouts khi component unmount
   */
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  /**
   * Helper để manage timeouts
   */
  const addTimeout = useCallback((callback: () => void, delay: number) => {
    const timeout = setTimeout(() => {
      callback();
      timeoutRefs.current.delete(timeout);
    }, delay);
    
    timeoutRefs.current.add(timeout);
    return timeout;
  }, []);

  /**
   * Main copy function với enhanced error handling
   */
  const copyToClipboard = useCallback(async (
    text: string,
    context: Partial<ClipboardContext> = {}
  ): Promise<ClipboardResult> => {
    const fullContext: ClipboardContext = {
      label: 'Nội dung',
      source: 'user',
      sensitive: false,
      timestamp: Date.now(),
      ...context
    };

    // Validate text length
    if (text.length > securityPolicy.maxTextLength) {
      const error = `Nội dung quá dài (${text.length}/${securityPolicy.maxTextLength} ký tự)`;
      logger.warn('Copy rejected - text too long', { length: text.length });
      
      if (showToast) {
        showError(error);
      }
      
      return { success: false };
    }

    try {
      const result = await copyTextToClipboard(text, fullContext);
      
      if (result.success) {
        setCopied(true);
        
        // Show success toast
        if (showToast) {
          showSuccess(`${fullContext.label} đã được sao chép`, {
            duration: toastDuration,
          });
        }
        
        // Reset copied state
        addTimeout(() => setCopied(false), toastDuration);
        
        // Auto cleanup for sensitive data
        if (fullContext.sensitive && securityPolicy.autoCleanup) {
          addTimeout(async () => {
            try {
              await clearClipboardContent();
              logger.debug('Auto-cleared sensitive clipboard content', fullContext);
            } catch (error) {
              logger.warn('Failed to auto-clear clipboard', error as Error);
            }
          }, securityPolicy.cleanupDelay);
        }
      } else if (result.error && showToast) {
        showError(result.error.userMessage);
      }
      
      return result;
      
    } catch (error) {
      logger.error('Clipboard operation failed', error as Error, fullContext);
      
      if (showToast) {
        showError('Không thể sao chép vào clipboard');
      }
      
      return { success: false };
    }
  }, [
    securityPolicy, 
    showToast, 
    toastDuration, 
    showSuccess, 
    showError, 
    addTimeout
  ]);

  /**
   * Clear clipboard với error handling
   */
  const clearClipboard = useCallback(async (): Promise<ClipboardResult> => {
    try {
      const result = await clearClipboardContent();
      
      if (result.success) {
        logger.debug('Clipboard cleared successfully');
      } else if (result.error && showToast) {
        showError(result.error.userMessage);
      }
      
      return result;
    } catch (error) {
      logger.error('Clear clipboard failed', error as Error);
      
      if (showToast) {
        showError('Không thể xóa clipboard');
      }
      
      return { success: false };
    }
  }, [showToast, showError]);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
    setCopied(false);
  }, []);

  return {
    copied,
    isSupported,
    copyToClipboard,
    clearClipboard,
    cleanup,
  };
};

/**
 * Specialized hook cho password copying với enhanced security
 */
export const useSecureClipboard = () => {
  return useClipboard({
    securityPolicy: {
      autoCleanup: true,
      cleanupDelay: 30000, // 30 seconds
      maxTextLength: 1000, // Passwords shouldn't be too long
    },
    showToast: true,
  });
};