import { EventEmitter } from 'node:events';

// Network monitoring types
export type NetworkStatus = 'online' | 'offline' | 'degraded' | 'unknown';

export type HealthCheckResult = {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  timestamp: Date;
  endpoint: string;
  error?: string;
  details?: Record<string, any>;
};

export type PerformanceMetrics = {
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  successRate: number;
  totalRequests: number;
  failedRequests: number;
  lastCheck: Date;
  uptime: number;
};

export type NetworkEvent = {
  type: 'status_change' | 'health_check' | 'performance_alert' | 'error';
  timestamp: Date;
  data: any;
};

export type MonitoringConfig = {
  healthCheckInterval: number;
  performanceThresholds: {
    responseTime: number;
    successRate: number;
    uptime: number;
  };
  endpoints: string[];
  enableDetailedLogging: boolean;
  enablePerformanceAlerts: boolean;
  maxHistorySize: number;
};

// Default configuration
const defaultConfig: MonitoringConfig = {
  healthCheckInterval: 30000, // 30 seconds
  performanceThresholds: {
    responseTime: 5000, // 5 seconds
    successRate: 0.95, // 95%
    uptime: 0.99, // 99%
  },
  endpoints: ['/api/health'],
  enableDetailedLogging: true,
  enablePerformanceAlerts: true,
  maxHistorySize: 1000,
};

/**
 * Network Monitoring Manager
 * Provides comprehensive network monitoring, health checks, and performance metrics
 */
export class NetworkMonitoringManager extends EventEmitter {
  private config: MonitoringConfig;
  private healthCheckHistory: HealthCheckResult[] = [];
  private performanceMetrics: PerformanceMetrics;
  private monitoringInterval: NodeJS.Timeout | null = null;
  public isMonitoring = false;
  private startTime: Date;

  constructor(config: Partial<MonitoringConfig> = {}) {
    super();
    this.config = { ...defaultConfig, ...config };
    this.startTime = new Date();
    this.performanceMetrics = this.initializePerformanceMetrics();
  }

  /**
   * Start network monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);

    this.emit('monitoring_started', { timestamp: new Date() });
    this.log('Network monitoring started');
  }

  /**
   * Stop network monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.emit('monitoring_stopped', { timestamp: new Date() });
    this.log('Network monitoring stopped');
  }

  /**
   * Perform health checks on all configured endpoints
   */
  private async performHealthChecks(): Promise<void> {
    const promises = this.config.endpoints.map((endpoint) =>
      this.checkEndpointHealth(endpoint),
    );

    try {
      const results = await Promise.allSettled(promises);
      const healthResults = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            status: 'unhealthy' as const,
            responseTime: -1,
            timestamp: new Date(),
            endpoint: this.config.endpoints[index],
            error: result.reason?.message || 'Unknown error',
          };
        }
      });

      this.updateHealthHistory(healthResults);
      this.updatePerformanceMetrics(healthResults);
      this.checkPerformanceAlerts();
    } catch (error) {
      this.log('Health check failed', error);
      this.emit('health_check_error', { error, timestamp: new Date() });
    }
  }

  /**
   * Check health of a specific endpoint
   */
  public async checkEndpointHealth(
    endpoint: string,
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timestamp = new Date();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(endpoint, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      let status: HealthCheckResult['status'] = 'healthy';
      if (!response.ok) {
        status = 'unhealthy';
      } else if (
        responseTime > this.config.performanceThresholds.responseTime
      ) {
        status = 'degraded';
      }

      const result: HealthCheckResult = {
        status,
        responseTime,
        timestamp,
        endpoint,
        details: {
          statusCode: response.status,
          statusText: response.statusText,
        },
      };

      this.emit('health_check_completed', result);
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: HealthCheckResult = {
        status: 'unhealthy',
        responseTime,
        timestamp,
        endpoint,
        error: error instanceof Error ? error.message : String(error),
      };

      this.emit('health_check_failed', result);
      return result;
    }
  }

  /**
   * Update health check history
   */
  public updateHealthHistory(results: HealthCheckResult[]): void {
    this.healthCheckHistory.push(...results);

    // Keep history size manageable
    if (this.healthCheckHistory.length > this.config.maxHistorySize) {
      this.healthCheckHistory = this.healthCheckHistory.slice(
        -this.config.maxHistorySize,
      );
    }
  }

  /**
   * Update performance metrics based on health check results
   */
  public updatePerformanceMetrics(results: HealthCheckResult[]): void {
    const validResults = results.filter((r) => r.responseTime >= 0);

    if (validResults.length === 0) return;

    const responseTimes = validResults.map((r) => r.responseTime);
    const successfulChecks = validResults.filter(
      (r) => r.status === 'healthy',
    ).length;
    const totalChecks = validResults.length;

    this.performanceMetrics = {
      averageResponseTime:
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      successRate: successfulChecks / totalChecks,
      totalRequests: this.performanceMetrics.totalRequests + totalChecks,
      failedRequests:
        this.performanceMetrics.failedRequests +
        (totalChecks - successfulChecks),
      lastCheck: new Date(),
      uptime: this.calculateUptime(),
    };

    this.emit('metrics_updated', this.performanceMetrics);
  }

  /**
   * Check for performance alerts
   */
  public checkPerformanceAlerts(): void {
    const { performanceThresholds } = this.config;
    const alerts: string[] = [];

    if (
      this.performanceMetrics.averageResponseTime >
      performanceThresholds.responseTime
    ) {
      alerts.push(
        `High response time: ${this.performanceMetrics.averageResponseTime}ms`,
      );
    }

    if (
      this.performanceMetrics.successRate < performanceThresholds.successRate
    ) {
      alerts.push(
        `Low success rate: ${(this.performanceMetrics.successRate * 100).toFixed(1)}%`,
      );
    }

    if (this.performanceMetrics.uptime < performanceThresholds.uptime) {
      alerts.push(
        `Low uptime: ${(this.performanceMetrics.uptime * 100).toFixed(1)}%`,
      );
    }

    if (alerts.length > 0) {
      const alertData = {
        alerts,
        metrics: this.performanceMetrics,
        timestamp: new Date(),
      };

      this.emit('performance_alert', alertData);
      this.log('Performance alerts triggered', alertData);
    }
  }

  /**
   * Calculate system uptime
   */
  public calculateUptime(): number {
    const totalTime = Date.now() - this.startTime.getTime();
    const downtime = this.healthCheckHistory
      .filter((h) => h.status === 'unhealthy')
      .reduce((total, check) => {
        // Estimate downtime based on health check interval
        return total + this.config.healthCheckInterval;
      }, 0);

    return Math.max(0, 1 - downtime / totalTime);
  }

  /**
   * Initialize performance metrics
   */
  private initializePerformanceMetrics(): PerformanceMetrics {
    return {
      averageResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      successRate: 1,
      totalRequests: 0,
      failedRequests: 0,
      lastCheck: new Date(),
      uptime: 1,
    };
  }

  /**
   * Get current performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Get health check history
   */
  public getHealthHistory(limit?: number): HealthCheckResult[] {
    const history = [...this.healthCheckHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get recent health status
   */
  public getRecentHealthStatus(): HealthCheckResult | null {
    const recent = this.healthCheckHistory.slice(-1);
    return recent.length > 0 ? recent[0] : null;
  }

  /**
   * Get system status summary
   */
  public getSystemStatus(): {
    isMonitoring: boolean;
    uptime: number;
    lastCheck: Date | null;
    overallHealth: 'healthy' | 'degraded' | 'unhealthy';
    alerts: string[];
  } {
    const recentHealth = this.getRecentHealthStatus();
    const alerts: string[] = [];

    if (
      this.performanceMetrics.successRate <
      this.config.performanceThresholds.successRate
    ) {
      alerts.push('Low success rate');
    }

    if (
      this.performanceMetrics.averageResponseTime >
      this.config.performanceThresholds.responseTime
    ) {
      alerts.push('High response time');
    }

    let overallHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (recentHealth) {
      if (recentHealth.status === 'unhealthy') {
        overallHealth = 'unhealthy';
      } else if (recentHealth.status === 'degraded') {
        overallHealth = 'degraded';
      }
    }

    return {
      isMonitoring: this.isMonitoring,
      uptime: this.performanceMetrics.uptime,
      lastCheck: recentHealth?.timestamp || null,
      overallHealth,
      alerts,
    };
  }

  /**
   * Clear monitoring history
   */
  public clearHistory(): void {
    this.healthCheckHistory = [];
    this.performanceMetrics = this.initializePerformanceMetrics();
    this.emit('history_cleared', { timestamp: new Date() });
  }

  /**
   * Update monitoring configuration
   */
  public updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('config_updated', { config: this.config, timestamp: new Date() });
  }

  /**
   * Log monitoring events
   */
  private log(message: string, data?: any): void {
    if (this.config.enableDetailedLogging) {
      console.log(`[Network Monitoring] ${message}`, data || '');
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopMonitoring();
    this.removeAllListeners();
  }
}

// Singleton instance
let monitoringManager: NetworkMonitoringManager | null = null;

/**
 * Get or create the network monitoring manager instance
 */
export function getNetworkMonitoringManager(
  config?: Partial<MonitoringConfig>,
): NetworkMonitoringManager {
  if (!monitoringManager) {
    monitoringManager = new NetworkMonitoringManager(config);
  }
  return monitoringManager;
}

/**
 * Start network monitoring
 */
export function startNetworkMonitoring(
  config?: Partial<MonitoringConfig>,
): NetworkMonitoringManager {
  const manager = getNetworkMonitoringManager(config);
  manager.startMonitoring();
  return manager;
}

/**
 * Stop network monitoring
 */
export function stopNetworkMonitoring(): void {
  if (monitoringManager) {
    monitoringManager.stopMonitoring();
  }
}

/**
 * Get current monitoring status
 */
export function getMonitoringStatus(): {
  isMonitoring: boolean;
  systemStatus: any;
  performanceMetrics: PerformanceMetrics;
} {
  if (!monitoringManager) {
    return {
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
    };
  }

  return {
    isMonitoring: monitoringManager.isMonitoring,
    systemStatus: monitoringManager.getSystemStatus(),
    performanceMetrics: monitoringManager.getPerformanceMetrics(),
  };
}
