import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  NetworkStatus,
  NetworkRecoveryConfig,
  QueuedRequest,
} from './index';
import {
  networkRecoveryFetch,
  subscribeToNetworkStatus,
  getQueueStats,
} from './index';

// Network recovery hook return type
export interface UseNetworkRecoveryReturn {
  networkStatus: NetworkStatus;
  isOnline: boolean;
  isOffline: boolean;
  isDegraded: boolean;
  queueStats: {
    queueSize: number;
    processingCount: number;
  };
  retryRequest: (requestId: string) => Promise<void>;
  clearQueue: () => void;
  getQueuedRequests: () => QueuedRequest[];
}

// Configuration for the network recovery hook
export interface UseNetworkRecoveryConfig {
  enableStatusMonitoring?: boolean;
  enableQueueMonitoring?: boolean;
  enableGracefulDegradation?: boolean;
  onStatusChange?: (status: NetworkStatus) => void;
  onQueueUpdate?: (stats: {
    queueSize: number;
    processingCount: number;
  }) => void;
}

// Default configuration
const defaultConfig: UseNetworkRecoveryConfig = {
  enableStatusMonitoring: true,
  enableQueueMonitoring: true,
  enableGracefulDegradation: true,
};

/**
 * React hook for network recovery functionality
 */
export function useNetworkRecovery(
  config: UseNetworkRecoveryConfig = {},
): UseNetworkRecoveryReturn {
  const finalConfig = { ...defaultConfig, ...config };
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('unknown');
  const [queueStats, setQueueStats] = useState({
    queueSize: 0,
    processingCount: 0,
  });
  const statusUnsubscribeRef = useRef<(() => void) | null>(null);
  const queueStatsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to network status changes
  useEffect(() => {
    if (!finalConfig.enableStatusMonitoring) return;

    const unsubscribe = subscribeToNetworkStatus((status) => {
      setNetworkStatus(status);
      finalConfig.onStatusChange?.(status);
    });

    statusUnsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
    };
  }, [finalConfig.enableStatusMonitoring, finalConfig.onStatusChange]);

  // Monitor queue stats
  useEffect(() => {
    if (!finalConfig.enableQueueMonitoring) return;

    const updateQueueStats = () => {
      const stats = getQueueStats();
      setQueueStats(stats);
      finalConfig.onQueueUpdate?.(stats);
    };

    // Update immediately
    updateQueueStats();

    // Set up interval for periodic updates
    queueStatsIntervalRef.current = setInterval(updateQueueStats, 1000);

    return () => {
      if (queueStatsIntervalRef.current) {
        clearInterval(queueStatsIntervalRef.current);
      }
    };
  }, [finalConfig.enableQueueMonitoring, finalConfig.onQueueUpdate]);

  // Retry a specific request
  const retryRequest = useCallback(async (requestId: string) => {
    // This would need to be implemented based on the specific request queue implementation
    // For now, we'll just trigger a queue flush
    console.info(`Retrying request: ${requestId}`);
  }, []);

  // Clear the request queue
  const clearQueue = useCallback(() => {
    // This would need to be implemented based on the specific request queue implementation
    console.info('Clearing request queue');
  }, []);

  // Get queued requests (placeholder - would need actual implementation)
  const getQueuedRequests = useCallback((): QueuedRequest[] => {
    // This would need to be implemented based on the specific request queue implementation
    return [];
  }, []);

  return {
    networkStatus,
    isOnline: networkStatus === 'online' || networkStatus === 'degraded',
    isOffline: networkStatus === 'offline',
    isDegraded: networkStatus === 'degraded',
    queueStats,
    retryRequest,
    clearQueue,
    getQueuedRequests,
  };
}

// Hook for network status only
export function useNetworkStatus(): {
  status: NetworkStatus;
  isOnline: boolean;
  isOffline: boolean;
  isDegraded: boolean;
} {
  const { networkStatus, isOnline, isOffline, isDegraded } = useNetworkRecovery(
    {
      enableStatusMonitoring: true,
      enableQueueMonitoring: false,
    },
  );

  return {
    status: networkStatus,
    isOnline,
    isOffline,
    isDegraded,
  };
}

// Hook for request queue monitoring only
export function useRequestQueue(): {
  queueSize: number;
  processingCount: number;
  retryRequest: (requestId: string) => Promise<void>;
  clearQueue: () => void;
} {
  const { queueStats, retryRequest, clearQueue } = useNetworkRecovery({
    enableStatusMonitoring: false,
    enableQueueMonitoring: true,
  });

  return {
    queueSize: queueStats.queueSize,
    processingCount: queueStats.processingCount,
    retryRequest,
    clearQueue,
  };
}

// Hook for graceful degradation
export function useGracefulDegradation<T>(
  onlineValue: T,
  offlineValue: T,
  degradedValue?: T,
): T {
  const { status: networkStatus } = useNetworkStatus();

  if (networkStatus === 'offline') {
    return offlineValue;
  }

  if (networkStatus === 'degraded' && degradedValue !== undefined) {
    return degradedValue;
  }

  return onlineValue;
}

// Hook for conditional rendering based on network status
export function useNetworkConditionalRender<T>(
  onlineComponent: T,
  offlineComponent: T,
  degradedComponent?: T,
): T {
  return useGracefulDegradation(
    onlineComponent,
    offlineComponent,
    degradedComponent,
  );
}

// Hook for network-aware fetch
export function useNetworkAwareFetch() {
  const { isOnline, isOffline } = useNetworkStatus();

  const fetchWithNetworkAwareness = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      if (isOffline) {
        throw new Error('Network is offline');
      }

      try {
        return await networkRecoveryFetch.fetch(input, init);
      } catch (error) {
        if (isOffline) {
          throw new Error('Network went offline during request');
        }
        throw error;
      }
    },
    [isOnline, isOffline],
  );

  return {
    fetch: fetchWithNetworkAwareness,
    isOnline,
    isOffline,
  };
}

// Hook for offline-first functionality
export function useOfflineFirst<T>(
  onlineData: T,
  offlineData: T,
  syncFunction?: (data: T) => Promise<void>,
) {
  const { isOnline, isOffline } = useNetworkStatus();
  const [syncing, setSyncing] = useState(false);

  const syncData = useCallback(async () => {
    if (!syncFunction || isOffline) return;

    setSyncing(true);
    try {
      await syncFunction(offlineData);
    } catch (error) {
      console.error('Failed to sync data:', error);
    } finally {
      setSyncing(false);
    }
  }, [syncFunction, offlineData, isOffline]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && syncFunction) {
      syncData();
    }
  }, [isOnline, syncData]);

  return {
    data: isOffline ? offlineData : onlineData,
    isOffline,
    syncing,
    syncData,
  };
}
