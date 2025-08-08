import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  NetworkStatusManager,
  RequestQueueManager,
  NetworkRecoveryFetch,
  defaultNetworkRecoveryConfig,
} from '@/lib/network-recovery';
import { ChatSDKError } from '@/lib/errors';

// Mock fetch globally
global.fetch = vi.fn();

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    onLine: true,
    connection: {
      effectiveType: '4g',
    },
  },
  writable: true,
});

describe('Network Recovery System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('NetworkStatusManager', () => {
    it('should initialize with correct status', () => {
      const manager = new NetworkStatusManager();
      expect(manager.getStatus()).toBe('online');
    });

    it('should detect offline status', () => {
      // Mock navigator as offline
      Object.defineProperty(global, 'navigator', {
        value: { onLine: false },
        writable: true,
      });

      const manager = new NetworkStatusManager();
      expect(manager.getStatus()).toBe('offline');
    });

    it('should notify listeners of status changes', () => {
      const manager = new NetworkStatusManager();
      const listener = vi.fn();

      const unsubscribe = manager.subscribe(listener);
      expect(listener).toHaveBeenCalledWith('online');

      unsubscribe();
    });

    it('should handle network checks', async () => {
      const manager = new NetworkStatusManager();

      // Mock successful health check
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
      });

      // Trigger network check
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(manager.getStatus()).toBe('online');
    });
  });

  describe('RequestQueueManager', () => {
    it('should enqueue requests', () => {
      const networkStatus = new NetworkStatusManager();
      const queue = new RequestQueueManager(networkStatus);

      const requestId = queue.enqueue({
        url: '/api/test',
        options: { method: 'POST' },
        maxRetries: 3,
        priority: 'normal',
      });

      expect(requestId).toBeDefined();
      expect(queue.getQueueSize()).toBe(1);
    });

    it('should prioritize high priority requests', () => {
      const networkStatus = new NetworkStatusManager();
      const queue = new RequestQueueManager(networkStatus);

      queue.enqueue({
        url: '/api/normal',
        options: { method: 'GET' },
        maxRetries: 3,
        priority: 'normal',
      });

      queue.enqueue({
        url: '/api/high',
        options: { method: 'POST' },
        maxRetries: 3,
        priority: 'high',
      });

      expect(queue.getQueueSize()).toBe(2);
    });

    it('should process queue when online', async () => {
      const networkStatus = new NetworkStatusManager();
      const queue = new RequestQueueManager(networkStatus);

      // Mock successful fetch
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
      });

      queue.enqueue({
        url: '/api/test',
        options: { method: 'GET' },
        maxRetries: 3,
        priority: 'normal',
      });

      // Wait for queue processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(queue.getQueueSize()).toBe(0);
    });
  });

  describe('NetworkRecoveryFetch', () => {
    it('should handle successful requests', async () => {
      const fetch = new NetworkRecoveryFetch();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      });

      const response = await fetch.fetch('/api/test');
      expect(response.ok).toBe(true);
    });

    it('should retry failed requests', async () => {
      const fetch = new NetworkRecoveryFetch();

      // Mock fetch to fail twice then succeed
      let callCount = 0;
      (global.fetch as any).mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.resolve({
            ok: false,
            status: 500,
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
        });
      });

      const response = await fetch.fetch('/api/test');
      expect(response.ok).toBe(true);
      expect(callCount).toBe(3);
    });

    it('should queue requests when offline', async () => {
      const fetch = new NetworkRecoveryFetch();

      // Mock network as offline
      const networkStatus = (fetch as any).networkStatus;
      vi.spyOn(networkStatus, 'isOffline').mockReturnValue(true);

      try {
        await fetch.fetch('/api/test');
      } catch (error) {
        expect(error).toBeInstanceOf(ChatSDKError);
        expect((error as ChatSDKError).code).toBe('offline:chat');
      }
    });

    it('should handle timeout errors', async () => {
      const fetch = new NetworkRecoveryFetch();

      // Mock fetch to timeout
      (global.fetch as any).mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('timeout')), 100);
        });
      });

      try {
        await fetch.fetch('/api/test');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Enhanced Fetch Functions', () => {
    it('should handle JSON requests', async () => {
      const { fetchJSON } = await import(
        '@/lib/network-recovery/enhanced-fetch'
      );

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      });

      const result = await fetchJSON('/api/test');
      expect(result).toEqual({ data: 'test' });
    });

    it('should handle POST requests', async () => {
      const { postJSON } = await import(
        '@/lib/network-recovery/enhanced-fetch'
      );

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await postJSON('/api/test', { data: 'test' });
      expect(result).toEqual({ success: true });
    });

    it('should handle batch requests', async () => {
      const { batchRequests } = await import(
        '@/lib/network-recovery/enhanced-fetch'
      );

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      });

      const requests = [
        { input: '/api/test1' },
        { input: '/api/test2' },
        { input: '/api/test3' },
      ];

      const results = await batchRequests(requests);
      expect(results).toHaveLength(3);
    });
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const fetch = new NetworkRecoveryFetch();
      expect((fetch as any).config).toEqual(defaultNetworkRecoveryConfig);
    });

    it('should allow custom configuration', () => {
      const customConfig = {
        ...defaultNetworkRecoveryConfig,
        retryConfig: {
          ...defaultNetworkRecoveryConfig.retryConfig,
          maxRetries: 5,
        },
      };

      const fetch = new NetworkRecoveryFetch(customConfig);
      expect((fetch as any).config.retryConfig.maxRetries).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const fetch = new NetworkRecoveryFetch();

      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      try {
        await fetch.fetch('/api/test');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle authentication errors without retry', async () => {
      const fetch = new NetworkRecoveryFetch();

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ code: 'unauthorized:auth' }),
      });

      try {
        await fetch.fetch('/api/test');
      } catch (error) {
        expect(error).toBeInstanceOf(ChatSDKError);
        expect((error as ChatSDKError).code).toBe('unauthorized:auth');
      }
    });
  });
});
