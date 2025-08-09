'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import {
  LineChartIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  DownloadIcon,
  UploadIcon,
  GlobeIcon,
  XIcon,
  SettingsIcon,
  RefreshIcon,
  ArrowUpIcon,
  InfoIcon,
} from './icons';
import {
  useNetworkMonitoring,
  useHealthHistory,
} from '@/lib/network-monitoring/use-network-monitoring';
import { cn } from '@/lib/utils';
import type {
  HealthCheckResult,
  PerformanceMetrics,
} from '@/lib/network-monitoring';

// Dashboard props
interface NetworkMonitoringDashboardProps {
  className?: string;
  showControls?: boolean;
  showHistory?: boolean;
  showMetrics?: boolean;
  autoStart?: boolean;
}

// Performance metric card props
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  status?: 'good' | 'warning' | 'error';
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  className?: string;
}

// Health status indicator props
interface HealthStatusIndicatorProps {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  timestamp: Date;
  endpoint: string;
  className?: string;
}

// Performance metrics display props
interface PerformanceMetricsDisplayProps {
  metrics: PerformanceMetrics;
  className?: string;
}

// Health history list props
interface HealthHistoryListProps {
  history: HealthCheckResult[];
  maxItems?: number;
  className?: string;
}

/**
 * Performance metric card component
 */
function MetricCard({
  title,
  value,
  subtitle,
  trend,
  status = 'good',
  icon: Icon,
  className,
}: MetricCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUpIcon size={16} />;
      case 'down':
        return <ArrowUpIcon size={16} />;
      default:
        return null;
    }
  };

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {Icon && <Icon size={16} />}
              <h3 className="text-sm font-medium text-muted-foreground">
                {title}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{value}</span>
              {getTrendIcon()}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={cn('w-2 h-2 rounded-full', getStatusColor())} />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Health status indicator component
 */
function HealthStatusIndicator({
  status,
  responseTime,
  timestamp,
  endpoint,
  className,
}: HealthStatusIndicatorProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'unhealthy':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon size={16} />;
      case 'degraded':
        return <AlertCircleIcon size={16} />;
      case 'unhealthy':
        return <XIcon size={16} />;
      default:
        return <InfoIcon size={16} />;
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 border rounded-lg',
        getStatusColor(),
        className,
      )}
    >
      {getStatusIcon()}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{endpoint}</span>
          <Badge variant="secondary" className="text-xs">
            {status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{responseTime}ms</span>
          <span>{timestamp.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Performance metrics display component
 */
function PerformanceMetricsDisplay({
  metrics,
  className,
}: PerformanceMetricsDisplayProps) {
  const getSuccessRateStatus = () => {
    if (metrics.successRate >= 0.95) return 'good';
    if (metrics.successRate >= 0.8) return 'warning';
    return 'error';
  };

  const getResponseTimeStatus = () => {
    if (metrics.averageResponseTime <= 1000) return 'good';
    if (metrics.averageResponseTime <= 3000) return 'warning';
    return 'error';
  };

  const getUptimeStatus = () => {
    if (metrics.uptime >= 0.99) return 'good';
    if (metrics.uptime >= 0.95) return 'warning';
    return 'error';
  };

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
      <MetricCard
        title="Success Rate"
        value={`${(metrics.successRate * 100).toFixed(1)}%`}
        subtitle={`${metrics.totalRequests} total requests`}
        status={getSuccessRateStatus()}
        icon={CheckCircleIcon}
      />
      <MetricCard
        title="Avg Response Time"
        value={`${metrics.averageResponseTime.toFixed(0)}ms`}
        subtitle={`${metrics.minResponseTime}ms - ${metrics.maxResponseTime}ms`}
        status={getResponseTimeStatus()}
        icon={ClockIcon}
      />
      <MetricCard
        title="Uptime"
        value={`${(metrics.uptime * 100).toFixed(2)}%`}
        subtitle={`Last check: ${metrics.lastCheck.toLocaleTimeString()}`}
        status={getUptimeStatus()}
        icon={LineChartIcon}
      />
    </div>
  );
}

/**
 * Health history list component
 */
function HealthHistoryList({
  history,
  maxItems = 10,
  className,
}: HealthHistoryListProps) {
  const recentHistory = history.slice(-maxItems).reverse();

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Recent Health Checks</h3>
        <Badge variant="secondary">{history.length} total</Badge>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {recentHistory.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <InfoIcon size={24} />
            <p className="text-sm">No health checks performed yet</p>
          </div>
        ) : (
          recentHistory.map((check, index) => (
            <HealthStatusIndicator
              key={`${check.timestamp.getTime()}-${index}`}
              status={check.status}
              responseTime={check.responseTime}
              timestamp={check.timestamp}
              endpoint={check.endpoint}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Main network monitoring dashboard component
 */
export function NetworkMonitoringDashboard({
  className,
  showControls = true,
  showHistory = true,
  showMetrics = true,
  autoStart = false,
}: NetworkMonitoringDashboardProps) {
  const {
    isMonitoring,
    systemStatus,
    performanceMetrics,
    healthHistory,
    startMonitoring,
    stopMonitoring,
    clearHistory,
    updateConfig,
  } = useNetworkMonitoring({
    autoStart,
    enableRealTimeUpdates: true,
    updateInterval: 5000,
  });

  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState({
    healthCheckInterval: 30000,
    performanceThresholds: {
      responseTime: 5000,
      successRate: 0.95,
      uptime: 0.99,
    },
  });

  const handleStartMonitoring = () => {
    startMonitoring(config);
  };

  const handleStopMonitoring = () => {
    stopMonitoring();
  };

  const handleClearHistory = () => {
    clearHistory();
  };

  const handleUpdateConfig = (newConfig: any) => {
    setConfig(newConfig);
    updateConfig(newConfig);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
                            <GlobeIcon size={20} />
            <h2 className="text-xl font-semibold">Network Monitoring</h2>
          </div>
          <Badge
            variant={isMonitoring ? 'default' : 'secondary'}
            className={cn(
              'flex items-center gap-1',
              isMonitoring
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800',
            )}
          >
            {isMonitoring ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Active
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                Inactive
              </>
            )}
          </Badge>
        </div>

        {showControls && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isMonitoring ? 'destructive' : 'default'}
              onClick={
                isMonitoring ? handleStopMonitoring : handleStartMonitoring
              }
            >
              {isMonitoring ? (
                <>
                  <XIcon size={16} />
                  Stop
                </>
              ) : (
                <>
                  <GlobeIcon size={16} />
                  Start
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
            >
              <SettingsIcon size={16} />
              Settings
            </Button>
            <Button size="sm" variant="outline" onClick={handleClearHistory}>
              <RefreshIcon size={16} />
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monitoring Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="health-check-interval"
                      className="text-sm font-medium"
                    >
                      Health Check Interval (ms)
                    </label>
                    <input
                      id="health-check-interval"
                      type="number"
                      value={config.healthCheckInterval}
                      onChange={(e) =>
                        handleUpdateConfig({
                          ...config,
                          healthCheckInterval: Number.parseInt(
                            e.target.value,
                            10,
                          ),
                        })
                      }
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="response-time-threshold"
                      className="text-sm font-medium"
                    >
                      Response Time Threshold (ms)
                    </label>
                    <input
                      id="response-time-threshold"
                      type="number"
                      value={config.performanceThresholds.responseTime}
                      onChange={(e) =>
                        handleUpdateConfig({
                          ...config,
                          performanceThresholds: {
                            ...config.performanceThresholds,
                            responseTime: Number.parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="success-rate-threshold"
                      className="text-sm font-medium"
                    >
                      Success Rate Threshold (%)
                    </label>
                    <input
                      id="success-rate-threshold"
                      type="number"
                      step="0.01"
                      value={config.performanceThresholds.successRate * 100}
                      onChange={(e) =>
                        handleUpdateConfig({
                          ...config,
                          performanceThresholds: {
                            ...config.performanceThresholds,
                            successRate:
                              Number.parseFloat(e.target.value) / 100,
                          },
                        })
                      }
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* System Status */}
      {systemStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                              <LineChartIcon size={20} />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Health</span>
                  <Badge
                    variant={
                      systemStatus.overallHealth === 'healthy'
                        ? 'default'
                        : systemStatus.overallHealth === 'degraded'
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {systemStatus.overallHealth}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uptime</span>
                  <span className="text-sm">
                    {(systemStatus.uptime * 100).toFixed(2)}%
                  </span>
                </div>
                {systemStatus.lastCheck && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Check</span>
                    <span className="text-sm">
                      {systemStatus.lastCheck.toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {systemStatus.alerts && systemStatus.alerts.length > 0 ? (
                  <div>
                    <span className="text-sm font-medium text-red-600">
                      Alerts
                    </span>
                    <ul className="mt-1 space-y-1">
                      {systemStatus.alerts.map((alert: string, index: number) => (
                        <li
                          key={`alert-${index}-${alert.slice(0, 10)}`}
                          className="text-sm text-red-600 flex items-center gap-1"
                        >
                          <AlertCircleIcon size={12} />
                          {alert}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircleIcon size={16} />
                    <span className="text-sm">No alerts</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      {showMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                              <ArrowUpIcon size={20} />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceMetricsDisplay metrics={performanceMetrics} />
          </CardContent>
        </Card>
      )}

      {/* Health History */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon size={20} />
              Health History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HealthHistoryList history={healthHistory} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
