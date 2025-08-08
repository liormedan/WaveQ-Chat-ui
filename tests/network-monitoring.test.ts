import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  NetworkMonitoringManager,
  getNetworkMonitoringManager,
  startNetworkMonitoring,
  stopNetworkMonitoring,
  getMonitoringStatus,
  type HealthCheckResult,
  type PerformanceMetrics,
  type MonitoringConfig,
} from '@/lib/network-monitoring';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeEach(() => {
  console.log = vi.fn();
  mockFetch.mockClear();
});

afterEach(() => {
  console.log = originalConsoleLog;
  vi.clearAllTimers();
});

describe('NetworkMonitoringManager', () => {
  let manager: NetworkMonitoringManager;

  beforeEach(() => {
    manager = new NetworkMonitoringManager({
      healthCheckInterval: 1000, // Fast interval for testing
      endpoints: ['/api/health'],
      enableDetailedLogging: false,
      enablePerformanceAlerts: false,
      maxHistorySize: 10,
    });
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(manager).toBeInstanceOf(NetworkMonitoringManager);
      expect(manager.getPerformanceMetrics()).toEqual({
        averageResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        successRate: 1,
        totalRequests: 0,
        failedRequests: 0,
        lastCheck: expect.any(Date),
        uptime: 1,
      });
    });

    it('should start monitoring when requested', () => {
      expect(manager.isMonitoring).toBe(false);
      manager.startMonitoring();
      expect(manager.isMonitoring).toBe(true);
    });

    it('should stop monitoring when requested', () => {
      manager.startMonitoring();
      expect(manager.isMonitoring).toBe(true);
      manager.stopMonitoring();
      expect(manager.isMonitoring).toBe(false);
    });
  });

  describe('Health Checks', () => {
    it('should perform health checks successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      const result = await manager.checkEndpointHealth('/api/health');

      expect(result).toEqual({
        status: 'healthy',
        responseTime: expect.any(Number),
        timestamp: expect.any(Date),
        endpoint: '/api/health',
        details: {
          statusCode: 200,
          statusText: 'OK',
        },
      });
    });

    it('should handle failed health checks', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await manager.checkEndpointHealth('/api/health');

      expect(result).toEqual({
        status: 'unhealthy',
        responseTime: expect.any(Number),
        timestamp: expect.any(Date),
        endpoint: '/api/health',
        error: 'Network error',
      });
    });

    it('should handle slow responses as degraded', async () => {
      // Mock a slow response
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  statusText: 'OK',
                }),
              100,
            ),
          ),
      );

      const result = await manager.checkEndpointHealth('/api/health');

      expect(result.status).toBe('degraded');
      expect(result.responseTime).toBeGreaterThan(100);
    });
  });

  describe('Performance Metrics', () => {
    it('should update performance metrics correctly', () => {
      const mockResults: HealthCheckResult[] = [
        {
          status: 'healthy',
          responseTime: 100,
          timestamp: new Date(),
          endpoint: '/api/health',
        },
        {
          status: 'healthy',
          responseTime: 200,
          timestamp: new Date(),
          endpoint: '/api/health',
        },
        {
          status: 'unhealthy',
          responseTime: -1,
          timestamp: new Date(),
          endpoint: '/api/health',
        },
      ];

      manager.updatePerformanceMetrics(mockResults);

      const metrics = manager.getPerformanceMetrics();
      expect(metrics.averageResponseTime).toBe(150); // (100 + 200) / 2
      expect(metrics.successRate).toBe(2 / 3); // 2 healthy out of 3
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.failedRequests).toBe(1);
    });

    it('should calculate uptime correctly', () => {
      // Simulate some health check history
      manager.updateHealthHistory([
        {
          status: 'healthy',
          responseTime: 100,
          timestamp: new Date(Date.now() - 60000),
          endpoint: '/api/health',
        },
        {
          status: 'unhealthy',
          responseTime: -1,
          timestamp: new Date(Date.now() - 30000),
          endpoint: '/api/health',
        },
      ]);

      const uptime = manager.calculateUptime();
      expect(uptime).toBeLessThan(1); // Should be less than 100% due to downtime
      expect(uptime).toBeGreaterThan(0);
    });
  });

  describe('Performance Alerts', () => {
    it('should trigger alerts for high response time', () => {
      const alertSpy = vi.fn();
      manager.on('performance_alert', alertSpy);

      // Set high response time
      manager['performanceMetrics'] = {
        ...manager.getPerformanceMetrics(),
        averageResponseTime: 6000, // Above threshold
      };

      manager.checkPerformanceAlerts();

      expect(alertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          alerts: expect.arrayContaining([
            expect.stringContaining('High response time'),
          ]),
        }),
      );
    });

    it('should trigger alerts for low success rate', () => {
      const alertSpy = vi.fn();
      manager.on('performance_alert', alertSpy);

      // Set low success rate
      manager.updatePerformanceMetrics([
        {
          status: 'unhealthy',
          responseTime: -1,
          timestamp: new Date(),
          endpoint: '/api/health',
        },
      ]);

      manager.checkPerformanceAlerts();

      expect(alertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          alerts: expect.arrayContaining([
            expect.stringContaining('Low success rate'),
          ]),
        }),
      );
    });
  });

  describe('History Management', () => {
    it('should maintain health check history', () => {
      const mockResult: HealthCheckResult = {
        status: 'healthy',
        responseTime: 100,
        timestamp: new Date(),
        endpoint: '/api/health',
      };

      manager['updateHealthHistory']([mockResult]);

      const history = manager.getHealthHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(mockResult);
    });

    it('should limit history size', () => {
      const results = Array.from({ length: 15 }, (_, i) => ({
        status: 'healthy' as const,
        responseTime: 100,
        timestamp: new Date(),
        endpoint: '/api/health',
      }));

      manager['updateHealthHistory'](results);

      const history = manager.getHealthHistory();
      expect(history).toHaveLength(10); // Should be limited to maxHistorySize
    });

    it('should clear history', () => {
      const mockResult: HealthCheckResult = {
        status: 'healthy',
        responseTime: 100,
        timestamp: new Date(),
        endpoint: '/api/health',
      };

      manager['updateHealthHistory']([mockResult]);
      expect(manager.getHealthHistory()).toHaveLength(1);

      manager.clearHistory();
      expect(manager.getHealthHistory()).toHaveLength(0);
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      const newConfig: Partial<MonitoringConfig> = {
        healthCheckInterval: 5000,
        performanceThresholds: {
          responseTime: 3000,
          successRate: 0.9,
          uptime: 0.98,
        },
      };

      manager.updateConfig(newConfig);

      expect(manager['config'].healthCheckInterval).toBe(5000);
      expect(manager['config'].performanceThresholds.responseTime).toBe(3000);
    });
  });

  describe('System Status', () => {
    it('should return system status summary', () => {
      const status = manager.getSystemStatus();

      expect(status).toEqual({
        isMonitoring: false,
        uptime: 1,
        lastCheck: null,
        overallHealth: 'healthy',
        alerts: [],
      });
    });

    it('should include alerts in system status', () => {
      // Set metrics that would trigger alerts
      manager['performanceMetrics'] = {
        ...manager.getPerformanceMetrics(),
        successRate: 0.8, // Below threshold
        averageResponseTime: 6000, // Above threshold
      };

      const status = manager.getSystemStatus();

      expect(status.alerts).toContain('Low success rate');
      expect(status.alerts).toContain('High response time');
    });
  });
});

describe('Singleton Functions', () => {
  beforeEach(() => {
    // Clear singleton instance
    vi.doMock('@/lib/network-monitoring', () => ({
      NetworkMonitoringManager: vi.fn(),
      getNetworkMonitoringManager: vi.fn(),
      startNetworkMonitoring: vi.fn(),
      stopNetworkMonitoring: vi.fn(),
      getMonitoringStatus: vi.fn(),
    }));
  });

  it('should get monitoring manager instance', () => {
    const manager = getNetworkMonitoringManager();
    expect(manager).toBeInstanceOf(NetworkMonitoringManager);
  });

  it('should start network monitoring', () => {
    const manager = startNetworkMonitoring();
    expect(manager).toBeInstanceOf(NetworkMonitoringManager);
  });

  it('should stop network monitoring', () => {
    stopNetworkMonitoring();
    // Should not throw
  });

  it('should get monitoring status', () => {
    const status = getMonitoringStatus();
    expect(status).toEqual({
      isMonitoring: false,
      systemStatus: null,
      performanceMetrics: expect.any(Object),
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complete monitoring lifecycle', async () => {
    const manager = new NetworkMonitoringManager({
      healthCheckInterval: 1000,
      endpoints: ['/api/health'],
      enableDetailedLogging: false,
      enablePerformanceAlerts: false,
    });

    // Mock successful health check
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    });

    // Start monitoring
    manager.startMonitoring();
    expect(manager['isMonitoring']).toBe(true);

    // Wait for health check
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Check that health check was performed
    const history = manager.getHealthHistory();
    expect(history.length).toBeGreaterThan(0);

    // Stop monitoring
    manager.stopMonitoring();
    expect(manager['isMonitoring']).toBe(false);

    manager.destroy();
  });

  it('should handle multiple endpoints', async () => {
    const manager = new NetworkMonitoringManager({
      healthCheckInterval: 1000,
      endpoints: ['/api/health', '/api/monitoring/health'],
      enableDetailedLogging: false,
      enablePerformanceAlerts: false,
    });

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    });

    manager.startMonitoring();
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const history = manager.getHealthHistory();
    expect(history.length).toBeGreaterThan(0);

    // Should have checked both endpoints
    const endpoints = history.map((h) => h.endpoint);
    expect(endpoints).toContain('/api/health');
    expect(endpoints).toContain('/api/monitoring/health');

    manager.destroy();
  });
});
