# Network Monitoring System

## Overview

The Network Monitoring System provides comprehensive monitoring capabilities for network health, performance metrics, and system status. It builds upon the existing network recovery system to provide detailed insights into application performance and reliability.

## Features

### 1. Health Checks
- **Automatic Health Monitoring**: Continuous monitoring of configured endpoints
- **Response Time Tracking**: Detailed response time measurements and analysis
- **Status Classification**: Healthy, Degraded, and Unhealthy status categories
- **Multi-Endpoint Support**: Monitor multiple endpoints simultaneously

### 2. Performance Metrics
- **Average Response Time**: Rolling average of response times
- **Success Rate**: Percentage of successful health checks
- **Uptime Calculation**: System uptime based on health check history
- **Min/Max Response Times**: Performance boundaries tracking

### 3. Performance Alerts
- **Configurable Thresholds**: Customizable alert thresholds
- **Real-time Alerts**: Immediate notification of performance issues
- **Alert Categories**: Response time, success rate, and uptime alerts
- **Event-driven Architecture**: Event-based alert system

### 4. History Management
- **Health Check History**: Maintains historical health check data
- **Configurable History Size**: Adjustable history retention
- **Performance Trends**: Track performance over time
- **Data Cleanup**: Automatic cleanup of old data

### 5. System Status
- **Overall Health Assessment**: Comprehensive system health evaluation
- **Alert Management**: Centralized alert tracking and management
- **Real-time Status**: Live system status updates
- **Status Aggregation**: Combine multiple health indicators

## Architecture

### Core Components

#### 1. NetworkMonitoringManager
The central monitoring manager that orchestrates all monitoring activities.

```typescript
import { NetworkMonitoringManager } from '@/lib/network-monitoring';

const manager = new NetworkMonitoringManager({
  healthCheckInterval: 30000,
  endpoints: ['/api/health', '/api/monitoring/health'],
  performanceThresholds: {
    responseTime: 5000,
    successRate: 0.95,
    uptime: 0.99,
  },
});
```

#### 2. React Hooks
Comprehensive React hooks for easy integration with React components.

```typescript
import { useNetworkMonitoring, usePerformanceMetrics } from '@/lib/network-monitoring/use-network-monitoring';

function MonitoringComponent() {
  const {
    isMonitoring,
    systemStatus,
    performanceMetrics,
    healthHistory,
    startMonitoring,
    stopMonitoring,
  } = useNetworkMonitoring({
    autoStart: true,
    enableRealTimeUpdates: true,
  });

  return (
    <div>
      <p>Monitoring: {isMonitoring ? 'Active' : 'Inactive'}</p>
      <p>Success Rate: {(performanceMetrics.successRate * 100).toFixed(1)}%</p>
    </div>
  );
}
```

#### 3. UI Components
Ready-to-use React components for displaying monitoring information.

```typescript
import { NetworkMonitoringDashboard } from '@/components/network-monitoring-dashboard';

function App() {
  return (
    <NetworkMonitoringDashboard
      showControls={true}
      showHistory={true}
      showMetrics={true}
      autoStart={true}
    />
  );
}
```

## Configuration

### Default Configuration
```typescript
const defaultConfig = {
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
```

### Custom Configuration
```typescript
const customConfig = {
  healthCheckInterval: 15000, // 15 seconds
  performanceThresholds: {
    responseTime: 3000, // 3 seconds
    successRate: 0.98, // 98%
    uptime: 0.995, // 99.5%
  },
  endpoints: [
    '/api/health',
    '/api/monitoring/health',
    '/api/auth/session',
  ],
  enableDetailedLogging: false,
  enablePerformanceAlerts: true,
  maxHistorySize: 500,
};
```

## API Endpoints

### Enhanced Health Check API
The system includes an enhanced health check API that provides detailed monitoring information.

#### GET /api/monitoring/health
Returns comprehensive health information including:
- Overall system status
- Database connectivity
- External service checks
- System resource metrics
- Performance metrics

```typescript
// Example response
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "responseTime": 150,
  "uptime": 86400,
  "environment": "production",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 50,
      "connectionPool": {
        "active": 5,
        "idle": 10,
        "total": 15
      }
    },
    "external": [
      {
        "name": "Auth Service",
        "status": "healthy",
        "responseTime": 100,
        "endpoint": "/api/auth/session"
      }
    ],
    "system": {
      "status": "healthy",
      "cpu": {
        "usage": 25.5,
        "load": 0.255
      },
      "memory": {
        "used": 512000000,
        "total": 2048000000,
        "free": 1536000000
      },
      "disk": {
        "used": 500000000000,
        "total": 1000000000000,
        "free": 500000000000
      }
    }
  },
  "metrics": {
    "memory": {
      "heapUsed": 256000000,
      "heapTotal": 512000000,
      "external": 128000000,
      "rss": 1024000000
    },
    "performance": {
      "averageResponseTime": 200,
      "requestsPerSecond": 25.5,
      "errorRate": 0.02,
      "activeConnections": 45
    }
  }
}
```

#### HEAD /api/monitoring/health
Lightweight health check for network monitoring with minimal overhead.

```typescript
// Response headers
{
  "X-Response-Time": "150",
  "X-Health-Status": "healthy"
}
```

## Usage Examples

### Basic Monitoring Setup
```typescript
import { startNetworkMonitoring } from '@/lib/network-monitoring';

// Start monitoring with default configuration
const manager = startNetworkMonitoring();

// Start monitoring with custom configuration
const manager = startNetworkMonitoring({
  healthCheckInterval: 15000,
  endpoints: ['/api/health', '/api/monitoring/health'],
  performanceThresholds: {
    responseTime: 3000,
    successRate: 0.98,
    uptime: 0.995,
  },
});
```

### React Component Integration
```typescript
import { useNetworkMonitoring } from '@/lib/network-monitoring/use-network-monitoring';

function MonitoringWidget() {
  const {
    isMonitoring,
    systemStatus,
    performanceMetrics,
    startMonitoring,
    stopMonitoring,
  } = useNetworkMonitoring({
    autoStart: true,
    onPerformanceAlert: (alert) => {
      console.log('Performance alert:', alert);
    },
  });

  return (
    <div>
      <h3>Network Monitoring</h3>
      <p>Status: {isMonitoring ? 'Active' : 'Inactive'}</p>
      <p>Success Rate: {(performanceMetrics.successRate * 100).toFixed(1)}%</p>
      <p>Avg Response Time: {performanceMetrics.averageResponseTime.toFixed(0)}ms</p>
      <p>Uptime: {(performanceMetrics.uptime * 100).toFixed(2)}%</p>
      
      <button onClick={isMonitoring ? stopMonitoring : startMonitoring}>
        {isMonitoring ? 'Stop' : 'Start'} Monitoring
      </button>
    </div>
  );
}
```

### Dashboard Component
```typescript
import { NetworkMonitoringDashboard } from '@/components/network-monitoring-dashboard';

function MonitoringPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">System Monitoring</h1>
      
      <NetworkMonitoringDashboard
        showControls={true}
        showHistory={true}
        showMetrics={true}
        autoStart={true}
      />
    </div>
  );
}
```

### Event Handling
```typescript
import { getNetworkMonitoringManager } from '@/lib/network-monitoring';

const manager = getNetworkMonitoringManager();

// Listen for performance alerts
manager.on('performance_alert', (alert) => {
  console.log('Performance alert:', alert.alerts);
  // Send notification to user
  showNotification('Performance Alert', alert.alerts.join(', '));
});

// Listen for health check events
manager.on('health_check_completed', (result) => {
  console.log('Health check completed:', result);
});

// Listen for monitoring status changes
manager.on('monitoring_started', () => {
  console.log('Monitoring started');
});

manager.on('monitoring_stopped', () => {
  console.log('Monitoring stopped');
});
```

## Performance Considerations

### Memory Management
- Configurable history size limits
- Automatic cleanup of old data
- Efficient data structures for large datasets

### Network Efficiency
- Lightweight HEAD requests for health checks
- Configurable check intervals
- Minimal overhead for monitoring

### Real-time Updates
- Event-driven architecture
- Efficient React state management
- Configurable update intervals

## Error Handling

### Health Check Failures
- Automatic retry mechanisms
- Graceful degradation
- Detailed error reporting

### Network Issues
- Timeout handling
- Connection error recovery
- Offline detection

### Performance Alerts
- Configurable thresholds
- Multiple alert categories
- Alert aggregation

## Testing

### Unit Tests
Comprehensive test suite covering all monitoring functionality:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { NetworkMonitoringManager } from '@/lib/network-monitoring';

describe('NetworkMonitoringManager', () => {
  it('should perform health checks successfully', async () => {
    const manager = new NetworkMonitoringManager();
    const result = await manager.checkEndpointHealth('/api/health');
    expect(result.status).toBe('healthy');
  });
});
```

### Integration Tests
End-to-end testing of monitoring workflows:

```typescript
describe('Monitoring Integration', () => {
  it('should handle complete monitoring lifecycle', async () => {
    const manager = new NetworkMonitoringManager();
    manager.startMonitoring();
    await new Promise(resolve => setTimeout(resolve, 1100));
    const history = manager.getHealthHistory();
    expect(history.length).toBeGreaterThan(0);
  });
});
```

## Future Enhancements

### Planned Features
- **Service Worker Integration**: Offline monitoring capabilities
- **Advanced Metrics**: Detailed performance analytics
- **Predictive Monitoring**: ML-based performance prediction
- **External Integrations**: Third-party monitoring services

### Extension Points
- **Custom Health Checks**: Implement custom health check logic
- **External Monitoring**: Integrate with monitoring services
- **A/B Testing**: Test different monitoring strategies
- **Analytics Integration**: Track monitoring performance metrics

## Conclusion

The Network Monitoring System provides a comprehensive solution for monitoring application health and performance. It offers:

1. **Robust Health Checks**: Automatic monitoring of multiple endpoints
2. **Detailed Performance Metrics**: Comprehensive performance tracking
3. **Real-time Alerts**: Immediate notification of issues
4. **Flexible Configuration**: Customizable monitoring parameters
5. **React Integration**: Easy integration with React applications
6. **Event-driven Architecture**: Efficient event handling system

The system is production-ready, thoroughly tested, and provides excellent monitoring capabilities while maintaining low overhead and high performance.
