# Network Recovery System

## Overview

The Network Recovery System provides comprehensive network error recovery capabilities including automatic retry mechanisms with exponential backoff, offline detection and request queuing, and graceful degradation for service unavailability.

## Features

### 1. Automatic Retry Mechanisms
- **Exponential Backoff**: Intelligent retry delays that increase with each attempt
- **Configurable Retry Count**: Default 3 retries, customizable per request
- **Retryable Error Detection**: Automatic identification of retryable vs non-retryable errors
- **Status Code Based Retries**: Retry on specific HTTP status codes (408, 429, 500, 502, 503, 504)

### 2. Offline Detection
- **Real-time Network Monitoring**: Continuous network status monitoring
- **Browser API Integration**: Uses `navigator.onLine` and network events
- **Health Check Endpoints**: Periodic health checks to detect degraded connections
- **Status Categories**: Online, Offline, Degraded, Unknown

### 3. Request Queuing
- **Offline Queue**: Requests are queued when network is offline
- **Priority System**: High, Normal, Low priority levels
- **Automatic Processing**: Queued requests are processed when connection is restored
- **Queue Management**: Configurable queue size limits and processing controls

### 4. Graceful Degradation
- **Service Unavailability Handling**: Graceful handling when services are unavailable
- **Fallback Mechanisms**: Automatic fallback to cached or offline data
- **User Feedback**: Clear status indicators and progress feedback
- **Performance Monitoring**: Response time tracking and performance metrics

## Architecture

### Core Components

#### 1. NetworkStatusManager
Manages network connectivity status and provides real-time updates.

```typescript
import { NetworkStatusManager } from '@/lib/network-recovery';

const networkManager = new NetworkStatusManager();
const status = networkManager.getStatus(); // 'online' | 'offline' | 'degraded' | 'unknown'
```

#### 2. RequestQueueManager
Handles request queuing and processing when network is unavailable.

```typescript
import { RequestQueueManager } from '@/lib/network-recovery';

const queue = new RequestQueueManager(networkManager);
const requestId = queue.enqueue({
  url: '/api/data',
  options: { method: 'POST', body: JSON.stringify(data) },
  maxRetries: 3,
  priority: 'high',
});
```

#### 3. NetworkRecoveryFetch
Enhanced fetch implementation with built-in retry and queue support.

```typescript
import { NetworkRecoveryFetch } from '@/lib/network-recovery';

const fetch = new NetworkRecoveryFetch();
const response = await fetch.fetch('/api/data', {
  method: 'POST',
  body: JSON.stringify(data),
});
```

### React Hooks

#### useNetworkRecovery
Main hook for network recovery functionality.

```typescript
import { useNetworkRecovery } from '@/lib/network-recovery/use-network-recovery';

function MyComponent() {
  const { networkStatus, isOnline, queueStats, clearQueue } = useNetworkRecovery();
  
  return (
    <div>
      <p>Status: {networkStatus}</p>
      <p>Queue Size: {queueStats.queueSize}</p>
      {!isOnline && <button onClick={clearQueue}>Clear Queue</button>}
    </div>
  );
}
```

#### useNetworkStatus
Simplified hook for network status only.

```typescript
import { useNetworkStatus } from '@/lib/network-recovery/use-network-recovery';

function StatusIndicator() {
  const { status, isOnline, isOffline } = useNetworkStatus();
  
  return (
    <div className={isOnline ? 'text-green-500' : 'text-red-500'}>
      {status}
    </div>
  );
}
```

#### useGracefulDegradation
Hook for implementing graceful degradation patterns.

```typescript
import { useGracefulDegradation } from '@/lib/network-recovery/use-network-recovery';

function MyComponent() {
  const data = useGracefulDegradation(
    onlineData,    // Data to show when online
    offlineData,   // Data to show when offline
    degradedData   // Optional data for degraded connection
  );
  
  return <div>{data}</div>;
}
```

### Enhanced Fetch Utilities

#### Basic Usage
```typescript
import { networkAwareFetch } from '@/lib/network-recovery/enhanced-fetch';

// GET request with retry
const data = await networkAwareFetch.get('/api/users');

// POST request with custom options
const result = await networkAwareFetch.post('/api/users', userData, {
  retryCount: 5,
  timeout: 10000,
  onRetry: (attempt, error) => console.log(`Retry ${attempt}:`, error),
});
```

#### Batch Requests
```typescript
import { batchRequests } from '@/lib/network-recovery/enhanced-fetch';

const requests = [
  { input: '/api/users/1' },
  { input: '/api/users/2' },
  { input: '/api/users/3' },
];

const results = await batchRequests(requests, {
  concurrency: 3,
  onProgress: (completed, total) => {
    console.log(`Progress: ${completed}/${total}`);
  },
});
```

## Configuration

### Default Configuration
```typescript
const defaultConfig = {
  enableRetry: true,
  enableQueue: true,
  enableOfflineDetection: true,
  enableGracefulDegradation: true,
  retryConfig: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    retryableErrors: ['network', 'timeout', 'connection', 'offline'],
  },
  queueConfig: {
    maxQueueSize: 100,
    flushInterval: 5000,
    maxConcurrentRequests: 3,
  },
  offlineConfig: {
    checkInterval: 30000,
    timeoutThreshold: 10000,
    degradedThreshold: 5000,
  },
};
```

### Custom Configuration
```typescript
import { createNetworkRecoveryFetch } from '@/lib/network-recovery';

const customFetch = createNetworkRecoveryFetch({
  retryConfig: {
    maxRetries: 5,
    baseDelay: 2000,
  },
  queueConfig: {
    maxQueueSize: 50,
  },
});
```

## UI Components

### NetworkStatusIndicator
Displays network status with various presentation options.

```typescript
import { NetworkStatusIndicator } from '@/components/network-status-indicator';

// Compact indicator
<NetworkStatusIndicator variant="compact" />

// Detailed card
<NetworkStatusIndicator variant="detailed" showDetails showQueue />

// Banner for offline state
<NetworkStatusIndicator variant="banner" />
```

### NetworkRecoveryControls
Provides controls for managing network recovery.

```typescript
import { NetworkRecoveryControls } from '@/components/network-status-indicator';

<NetworkRecoveryControls />
```

### NetworkAwareLoading
Loading component that adapts to network status.

```typescript
import { NetworkAwareLoading } from '@/components/network-status-indicator';

<NetworkAwareLoading isLoading={loading} isOnline={isOnline}>
  <div>Content</div>
</NetworkAwareLoading>
```

## Integration Examples

### Chat Component Integration
```typescript
import { useNetworkRecovery } from '@/lib/network-recovery/use-network-recovery';
import { NetworkStatusIndicator } from '@/components/network-status-indicator';

function Chat() {
  const { isOnline, networkStatus } = useNetworkRecovery();
  
  return (
    <div>
      <NetworkStatusIndicator variant="compact" />
      {isOnline ? (
        <ChatInterface />
      ) : (
        <OfflineMessage />
      )}
    </div>
  );
}
```

### API Integration
```typescript
import { networkAwareFetch } from '@/lib/network-recovery/enhanced-fetch';

// Replace existing fetch calls
const fetchData = async () => {
  try {
    const data = await networkAwareFetch.get('/api/data', {
      retry: true,
      retryCount: 3,
      timeout: 5000,
      onRetry: (attempt, error) => {
        console.log(`Retry attempt ${attempt}:`, error);
      },
    });
    return data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
};
```

### Error Handling Integration
```typescript
import { useErrorHandler } from '@/lib/error-handling/use-error-handler';
import { useNetworkRecovery } from '@/lib/network-recovery/use-network-recovery';

function MyComponent() {
  const { handleError } = useErrorHandler();
  const { isOnline } = useNetworkRecovery();
  
  const handleSubmit = async (data) => {
    try {
      if (!isOnline) {
        throw new Error('Network is offline');
      }
      
      const result = await networkAwareFetch.post('/api/submit', data);
      return result;
    } catch (error) {
      handleError(error, { action: 'form_submission' });
    }
  };
}
```

## Testing

### Unit Tests
```typescript
import { describe, it, expect, vi } from 'vitest';
import { NetworkRecoveryFetch } from '@/lib/network-recovery';

describe('Network Recovery', () => {
  it('should retry failed requests', async () => {
    const fetch = new NetworkRecoveryFetch();
    
    // Mock fetch to fail then succeed
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount <= 2) {
        return Promise.resolve({ ok: false, status: 500 });
      }
      return Promise.resolve({ ok: true, status: 200 });
    });
    
    const response = await fetch.fetch('/api/test');
    expect(response.ok).toBe(true);
    expect(callCount).toBe(3);
  });
});
```

### Integration Tests
```typescript
import { render, screen } from '@testing-library/react';
import { NetworkStatusIndicator } from '@/components/network-status-indicator';

describe('NetworkStatusIndicator', () => {
  it('should show offline status', () => {
    // Mock network as offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    
    render(<NetworkStatusIndicator />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });
});
```

## Performance Considerations

### Memory Management
- Queue size limits prevent memory issues
- Automatic cleanup of processed requests
- Configurable timeouts for request processing

### Network Efficiency
- Exponential backoff reduces server load
- Concurrent request limits prevent overwhelming servers
- Health check intervals are configurable

### User Experience
- Immediate feedback on network status changes
- Clear indicators for offline/online states
- Graceful degradation maintains functionality

## Best Practices

### 1. Error Handling
```typescript
// Always handle network errors gracefully
try {
  const data = await networkAwareFetch.get('/api/data');
  return data;
} catch (error) {
  if (error.code === 'offline:chat') {
    // Show offline message
    return offlineData;
  }
  throw error;
}
```

### 2. User Feedback
```typescript
// Provide clear status feedback
const { networkStatus, queueStats } = useNetworkRecovery();

if (networkStatus === 'offline') {
  return <OfflineBanner queueSize={queueStats.queueSize} />;
}
```

### 3. Configuration
```typescript
// Use appropriate retry settings for different request types
const criticalRequest = await networkAwareFetch.post('/api/critical', data, {
  retryCount: 5,
  timeout: 30000,
  priority: 'high',
});

const backgroundRequest = await networkAwareFetch.get('/api/background', {
  retryCount: 1,
  timeout: 5000,
  priority: 'low',
});
```

### 4. Monitoring
```typescript
// Monitor network performance
const { networkStatus, queueStats } = useNetworkRecovery();

useEffect(() => {
  if (queueStats.queueSize > 10) {
    console.warn('Large request queue detected');
  }
}, [queueStats.queueSize]);
```

## Migration Guide

### From Basic Fetch
```typescript
// Before
const response = await fetch('/api/data');
const data = await response.json();

// After
const data = await networkAwareFetch.get('/api/data');
```

### From SWR/Fetch with Error Handling
```typescript
// Before
const { data, error } = useSWR('/api/data', fetcher);

// After
const { data, error } = useSWR('/api/data', networkAwareFetch.get);
```

### From Custom Retry Logic
```typescript
// Before
const fetchWithRetry = async (url, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
};

// After
const response = await networkAwareFetch.fetch(url, { retryCount: 3 });
```

## Troubleshooting

### Common Issues

#### 1. Requests Not Retrying
- Check if error is in retryable list
- Verify retry configuration
- Ensure network status is being detected correctly

#### 2. Queue Not Processing
- Check if network status is 'online'
- Verify queue configuration
- Check for errors in queue processing

#### 3. Performance Issues
- Reduce retry count for non-critical requests
- Adjust queue size limits
- Monitor concurrent request limits

### Debug Mode
```typescript
// Enable debug logging
const fetch = new NetworkRecoveryFetch({
  enableLogging: true,
  logLevel: 'debug',
});
```

## Future Enhancements

### Planned Features
- **Service Worker Integration**: Offline-first capabilities
- **Background Sync**: Automatic sync when connection is restored
- **Predictive Retry**: Machine learning based retry strategies
- **Advanced Metrics**: Detailed performance analytics
- **Custom Protocols**: Support for WebSocket and other protocols

### Extension Points
- **Custom Retry Strategies**: Implement custom retry logic
- **External Monitoring**: Integrate with external monitoring services
- **A/B Testing**: Test different recovery strategies
- **Analytics Integration**: Track network performance metrics
