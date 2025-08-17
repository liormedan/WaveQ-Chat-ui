import { ChatSDKError } from '../errors';
import type { ErrorContext } from '../error-handling';

// Network status types
export type NetworkStatus = 'online' | 'offline' | 'degraded' | 'unknown';

// Request queue item
export interface QueuedRequest {
  id: string;
  url: string;
  options: RequestInit;
  retryCount: number;
  maxRetries: number;
  timestamp: number;
  priority: 'high' | 'normal' | 'low';
  metadata?: Record<string, any>;
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
  retryableErrors: string[];
}

// Network recovery configuration
export interface NetworkRecoveryConfig {
  enableRetry: boolean;
  enableQueue: boolean;
  enableOfflineDetection: boolean;
  enableGracefulDegradation: boolean;
  retryConfig: RetryConfig;
  queueConfig: {
    maxQueueSize: number;
    flushInterval: number;
    maxConcurrentRequests: number;
  };
  offlineConfig: {
    checkInterval: number;
    timeoutThreshold: number;
    degradedThreshold: number;
  };
}

// Default configurations
export const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['network', 'timeout', 'connection', 'offline'],
};

export const defaultNetworkRecoveryConfig: NetworkRecoveryConfig = {
  enableRetry: true,
  enableQueue: true,
  enableOfflineDetection: true,
  enableGracefulDegradation: true,
  retryConfig: defaultRetryConfig,
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

// Network status manager
export class NetworkStatusManager {
  private status = 'unknown' as NetworkStatus;
  private lastCheck = 0;
  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private config: NetworkRecoveryConfig;

  constructor(config: NetworkRecoveryConfig = defaultNetworkRecoveryConfig) {
    this.config = config;
    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Set initial status
    this.status = navigator.onLine ? 'online' : 'offline';

    // Listen for online/offline events
    window.addEventListener('online', () => this.updateStatus('online'));
    window.addEventListener('offline', () => this.updateStatus('offline'));

    // Start periodic network checks
    if (this.config.enableOfflineDetection) {
      this.startNetworkChecks();
    }
  }

  private updateStatus(newStatus: NetworkStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.status));
  }

  private startNetworkChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.performNetworkCheck();
    }, this.config.offlineConfig.checkInterval);
  }

  private async performNetworkCheck(): Promise<void> {
    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.offlineConfig.timeoutThreshold,
      );

      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        if (responseTime > this.config.offlineConfig.degradedThreshold) {
          this.updateStatus('degraded');
        } else {
          this.updateStatus('online');
        }
      } else {
        this.updateStatus('degraded');
      }
    } catch (error) {
      this.updateStatus('offline');
    }
  }

  public getStatus(): NetworkStatus {
    return this.status;
  }

  public isOnline(): boolean {
    return this.status === 'online' || this.status === 'degraded';
  }

  public isOffline(): boolean {
    return this.status === 'offline';
  }

  public isDegraded(): boolean {
    return this.status === 'degraded';
  }

  public subscribe(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.listeners.clear();
  }
}

// Request queue manager
export class RequestQueueManager {
  private queue: QueuedRequest[] = [];
  private processing: Set<string> = new Set();
  private flushTimer: NodeJS.Timeout | null = null;
  private config: NetworkRecoveryConfig;
  private networkStatus: NetworkStatusManager;

  constructor(
    networkStatus: NetworkStatusManager,
    config: NetworkRecoveryConfig = defaultNetworkRecoveryConfig,
  ) {
    this.config = config;
    this.networkStatus = networkStatus;
    this.startFlushTimer();
  }

  public enqueue(
    request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>,
  ): string {
    const id = this.generateRequestId();
    const queuedRequest: QueuedRequest = {
      ...request,
      id,
      timestamp: Date.now(),
      retryCount: 0,
    };

    // Add to queue based on priority
    if (request.priority === 'high') {
      this.queue.unshift(queuedRequest);
    } else {
      this.queue.push(queuedRequest);
    }

    // Limit queue size
    if (this.queue.length > this.config.queueConfig.maxQueueSize) {
      this.queue = this.queue.slice(0, this.config.queueConfig.maxQueueSize);
    }

    return id;
  }

  public async processQueue(): Promise<void> {
    if (
      !this.networkStatus.isOnline() ||
      this.processing.size >= this.config.queueConfig.maxConcurrentRequests
    ) {
      return;
    }

    const requestsToProcess = this.queue.splice(
      0,
      this.config.queueConfig.maxConcurrentRequests - this.processing.size,
    );

    for (const request of requestsToProcess) {
      this.processRequest(request);
    }
  }

  private async processRequest(request: QueuedRequest): Promise<void> {
    this.processing.add(request.id);

    try {
      const response = await this.executeRequest(request);

      // Request successful, remove from queue
      this.processing.delete(request.id);

      // Notify success (could be extended with callbacks)
      console.info(`Queued request ${request.id} completed successfully`);
    } catch (error) {
      this.processing.delete(request.id);

      // Handle retry logic
      if (this.shouldRetry(request, error)) {
        request.retryCount++;
        const delay = this.calculateRetryDelay(request.retryCount);

        setTimeout(() => {
          this.queue.unshift(request);
        }, delay);
      } else {
        // Request failed permanently
        console.error(
          `Queued request ${request.id} failed permanently:`,
          error,
        );
      }
    }
  }

  private async executeRequest(request: QueuedRequest): Promise<Response> {
    const response = await fetch(request.url, request.options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  private shouldRetry(request: QueuedRequest, error: unknown): boolean {
    if (request.retryCount >= request.maxRetries) {
      return false;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if error is retryable
    return this.config.retryConfig.retryableErrors.some((retryableError) =>
      errorMessage.toLowerCase().includes(retryableError.toLowerCase()),
    );
  }

  private calculateRetryDelay(retryCount: number): number {
    const delay =
      this.config.retryConfig.baseDelay *
      Math.pow(this.config.retryConfig.backoffMultiplier, retryCount);
    return Math.min(delay, this.config.retryConfig.maxDelay);
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.processQueue();
    }, this.config.queueConfig.flushInterval);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getQueueSize(): number {
    return this.queue.length;
  }

  public getProcessingCount(): number {
    return this.processing.size;
  }

  public clearQueue(): void {
    this.queue = [];
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.queue = [];
    this.processing.clear();
  }
}

// Enhanced fetch with retry and queue support
export class NetworkRecoveryFetch {
  private networkStatus: NetworkStatusManager;
  private requestQueue: RequestQueueManager;
  private config: NetworkRecoveryConfig;

  constructor(config: NetworkRecoveryConfig = defaultNetworkRecoveryConfig) {
    this.config = config;
    this.networkStatus = new NetworkStatusManager(config);
    this.requestQueue = new RequestQueueManager(this.networkStatus, config);
  }

  public async fetch(
    input: RequestInfo | URL,
    init?: RequestInit,
    context?: Partial<ErrorContext>,
  ): Promise<Response> {
    // If offline and queue is enabled, queue the request
    if (this.networkStatus.isOffline() && this.config.enableQueue) {
      const requestId = this.requestQueue.enqueue({
        url: typeof input === 'string' ? input : input.toString(),
        options: init || {},
        maxRetries: this.config.retryConfig.maxRetries,
        priority: 'normal',
        metadata: context,
      });

      throw new ChatSDKError(
        'offline:chat',
        `Request queued with ID: ${requestId}`,
      );
    }

    // If online, attempt the request with retry logic
    if (this.config.enableRetry) {
      return this.fetchWithRetry(input, init, context);
    }

    // Fallback to regular fetch
    return fetch(input, init);
  }

  private async fetchWithRetry(
    input: RequestInfo | URL,
    init?: RequestInit,
    context?: Partial<ErrorContext>,
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (
      let attempt = 1;
      attempt <= this.config.retryConfig.maxRetries + 1;
      attempt++
    ) {
      try {
        const response = await fetch(input, init);

        // Check if response indicates a retryable error
        if (!response.ok && this.isRetryableStatus(response.status)) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if we should retry
        if (
          attempt <= this.config.retryConfig.maxRetries &&
          this.shouldRetry(error)
        ) {
          const delay = this.calculateRetryDelay(attempt);

          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, delay));

          // Check network status before retry
          if (this.networkStatus.isOffline()) {
            throw new ChatSDKError('offline:chat', 'Network is offline');
          }

          continue;
        }

        break;
      }
    }

    // All retries failed
    if (lastError) {
      throw lastError;
    }

    throw new Error('Request failed');
  }

  private isRetryableStatus(status: number): boolean {
    return this.config.retryConfig.retryableStatusCodes.includes(status);
  }

  private shouldRetry(error: unknown): boolean {
    if (error instanceof ChatSDKError) {
      return (error.type === 'offline' && error.surface === 'chat') || 
             (error.type === 'rate_limit' && error.surface === 'chat');
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    return this.config.retryConfig.retryableErrors.some((retryableError) =>
      errorMessage.toLowerCase().includes(retryableError.toLowerCase()),
    );
  }

  private calculateRetryDelay(attempt: number): number {
    const delay =
      this.config.retryConfig.baseDelay *
      Math.pow(this.config.retryConfig.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.config.retryConfig.maxDelay);
  }

  public getNetworkStatus(): NetworkStatus {
    return this.networkStatus.getStatus();
  }

  public subscribeToNetworkStatus(
    listener: (status: NetworkStatus) => void,
  ): () => void {
    return this.networkStatus.subscribe(listener);
  }

  public getQueueStats(): { queueSize: number; processingCount: number } {
    return {
      queueSize: this.requestQueue.getQueueSize(),
      processingCount: this.requestQueue.getProcessingCount(),
    };
  }

  public destroy(): void {
    this.networkStatus.destroy();
    this.requestQueue.destroy();
  }
}

// Singleton instance
export const networkRecoveryFetch = new NetworkRecoveryFetch();

// Convenience functions
export function createNetworkRecoveryFetch(
  config?: Partial<NetworkRecoveryConfig>,
): NetworkRecoveryFetch {
  const finalConfig = { ...defaultNetworkRecoveryConfig, ...config };
  return new NetworkRecoveryFetch(finalConfig);
}

export function getNetworkStatus(): NetworkStatus {
  return networkRecoveryFetch.getNetworkStatus();
}

export function subscribeToNetworkStatus(
  listener: (status: NetworkStatus) => void,
): () => void {
  return networkRecoveryFetch.subscribeToNetworkStatus(listener);
}

export function getQueueStats(): {
  queueSize: number;
  processingCount: number;
} {
  return networkRecoveryFetch.getQueueStats();
}
