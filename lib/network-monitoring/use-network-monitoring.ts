import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getNetworkMonitoringManager,
  startNetworkMonitoring,
  stopNetworkMonitoring,
  getMonitoringStatus,
  type NetworkMonitoringManager,
  type MonitoringConfig,
  type HealthCheckResult,
  type PerformanceMetrics,
} from './index';

// Hook configuration
export interface UseNetworkMonitoringConfig {
  autoStart?: boolean;
  enableRealTimeUpdates?: boolean;
  updateInterval?: number;
  onStatusChange?: (status: any) => void;
  onPerformanceAlert?: (alert: any) => void;
  onHealthCheck?: (result: HealthCheckResult) => void;
}

// Hook return type
export interface UseNetworkMonitoringReturn {
  isMonitoring: boolean;
  systemStatus: any;
  performanceMetrics: PerformanceMetrics;
  healthHistory: HealthCheckResult[];
  startMonitoring: (config?: Partial<MonitoringConfig>) => void;
  stopMonitoring: () => void;
  clearHistory: () => void;
  updateConfig: (config: Partial<MonitoringConfig>) => void;
  manager: NetworkMonitoringManager | null;
}

// Default configuration
const defaultConfig: UseNetworkMonitoringConfig = {
  autoStart: false,
  enableRealTimeUpdates: true,
  updateInterval: 5000, // 5 seconds
  onStatusChange: undefined,
  onPerformanceAlert: undefined,
  onHealthCheck: undefined,
};

/**
 * React hook for network monitoring functionality
 */
export function useNetworkMonitoring(
  config: UseNetworkMonitoringConfig = {},
): UseNetworkMonitoringReturn {
  const finalConfig = { ...defaultConfig, ...config };
  const [monitoringState, setMonitoringState] = useState({
    isMonitoring: false,
    systemStatus: null,
    performanceMetrics: {
      averageResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      successRate: 1,
      totalRequests: 0,
      failedRequests: 0,
      lastCheck: new Date(),
      uptime: 1,
    },
    healthHistory: [] as HealthCheckResult[],
  });

  const managerRef = useRef<NetworkMonitoringManager | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize monitoring manager
  useEffect(() => {
    managerRef.current = getNetworkMonitoringManager();

    // Set up event listeners
    const manager = managerRef.current;
    if (manager) {
      manager.on('monitoring_started', () => {
        setMonitoringState((prev) => ({ ...prev, isMonitoring: true }));
        finalConfig.onStatusChange?.({ type: 'monitoring_started' });
      });

      manager.on('monitoring_stopped', () => {
        setMonitoringState((prev) => ({ ...prev, isMonitoring: false }));
        finalConfig.onStatusChange?.({ type: 'monitoring_stopped' });
      });

      manager.on('health_check_completed', (result: HealthCheckResult) => {
        setMonitoringState((prev) => ({
          ...prev,
          healthHistory: [...prev.healthHistory, result].slice(-100), // Keep last 100
        }));
        finalConfig.onHealthCheck?.(result);
      });

      manager.on('health_check_failed', (result: HealthCheckResult) => {
        setMonitoringState((prev) => ({
          ...prev,
          healthHistory: [...prev.healthHistory, result].slice(-100),
        }));
        finalConfig.onHealthCheck?.(result);
      });

      manager.on('performance_alert', (alert: any) => {
        finalConfig.onPerformanceAlert?.(alert);
      });

      manager.on('metrics_updated', (metrics: PerformanceMetrics) => {
        setMonitoringState((prev) => ({
          ...prev,
          performanceMetrics: metrics,
        }));
      });
    }

    return () => {
      if (manager) {
        manager.removeAllListeners();
      }
    };
  }, [
    finalConfig.onStatusChange,
    finalConfig.onPerformanceAlert,
    finalConfig.onHealthCheck,
  ]);

  // Auto-start monitoring if configured
  useEffect(() => {
    if (finalConfig.autoStart && managerRef.current) {
      managerRef.current.startMonitoring();
    }

    return () => {
      if (managerRef.current) {
        managerRef.current.stopMonitoring();
      }
    };
  }, [finalConfig.autoStart]);

  // Set up periodic updates
  useEffect(() => {
    if (!finalConfig.enableRealTimeUpdates) return;

    const updateStatus = () => {
      const status = getMonitoringStatus();
      setMonitoringState((prev) => ({
        ...prev,
        isMonitoring: status.isMonitoring,
        systemStatus: status.systemStatus,
        performanceMetrics: status.performanceMetrics,
      }));
    };

    // Update immediately
    updateStatus();

    // Set up interval
    updateIntervalRef.current = setInterval(
      updateStatus,
      finalConfig.updateInterval,
    );

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [finalConfig.enableRealTimeUpdates, finalConfig.updateInterval]);

  // Start monitoring
  const startMonitoring = useCallback((config?: Partial<MonitoringConfig>) => {
    if (config) {
      managerRef.current?.updateConfig(config);
    }
    managerRef.current?.startMonitoring();
  }, []);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    managerRef.current?.stopMonitoring();
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    managerRef.current?.clearHistory();
    setMonitoringState((prev) => ({ ...prev, healthHistory: [] }));
  }, []);

  // Update configuration
  const updateConfig = useCallback((config: Partial<MonitoringConfig>) => {
    managerRef.current?.updateConfig(config);
  }, []);

  return {
    isMonitoring: monitoringState.isMonitoring,
    systemStatus: monitoringState.systemStatus,
    performanceMetrics: monitoringState.performanceMetrics,
    healthHistory: monitoringState.healthHistory,
    startMonitoring,
    stopMonitoring,
    clearHistory,
    updateConfig,
    manager: managerRef.current,
  };
}

/**
 * Simplified hook for just monitoring status
 */
export function useMonitoringStatus() {
  const [status, setStatus] = useState({
    isMonitoring: false,
    systemStatus: null,
    performanceMetrics: {
      averageResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      successRate: 1,
      totalRequests: 0,
      failedRequests: 0,
      lastCheck: new Date(),
      uptime: 1,
    },
  });

  useEffect(() => {
    const updateStatus = () => {
      const currentStatus = getMonitoringStatus();
      setStatus(currentStatus);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  return status;
}

/**
 * Hook for performance metrics only
 */
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    averageResponseTime: 0,
    minResponseTime: 0,
    maxResponseTime: 0,
    successRate: 1,
    totalRequests: 0,
    failedRequests: 0,
    lastCheck: new Date(),
    uptime: 1,
  });

  useEffect(() => {
    const updateMetrics = () => {
      const status = getMonitoringStatus();
      setMetrics(status.performanceMetrics);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 10000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
}

/**
 * Hook for health history
 */
export function useHealthHistory(limit?: number) {
  const [history, setHistory] = useState<HealthCheckResult[]>([]);

  useEffect(() => {
    const updateHistory = () => {
      const manager = getNetworkMonitoringManager();
      const healthHistory = manager.getHealthHistory(limit);
      setHistory(healthHistory);
    };

    updateHistory();
    const interval = setInterval(updateHistory, 5000);

    return () => clearInterval(interval);
  }, [limit]);

  return history;
}

/**
 * Hook for starting/stopping monitoring with automatic cleanup
 */
export function useMonitoringControl() {
  const managerRef = useRef<NetworkMonitoringManager | null>(null);

  useEffect(() => {
    managerRef.current = getNetworkMonitoringManager();

    return () => {
      if (managerRef.current) {
        managerRef.current.stopMonitoring();
      }
    };
  }, []);

  const start = useCallback((config?: Partial<MonitoringConfig>) => {
    if (config) {
      managerRef.current?.updateConfig(config);
    }
    managerRef.current?.startMonitoring();
  }, []);

  const stop = useCallback(() => {
    managerRef.current?.stopMonitoring();
  }, []);

  return { start, stop, manager: managerRef.current };
}
