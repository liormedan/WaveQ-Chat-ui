import { ChatSDKError } from '../errors';
import type { ErrorContext } from '../error-handling';
import { networkRecoveryFetch, type NetworkRecoveryConfig } from './index';

// Enhanced fetch options
export interface EnhancedFetchOptions extends RequestInit {
  retry?: boolean;
  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
  priority?: 'high' | 'auto' | 'low';
  context?: Partial<ErrorContext>;
  onRetry?: (attempt: number, error: Error) => void;
  onSuccess?: (response: Response) => void;
  onError?: (error: Error) => void;
}

// Enhanced fetch response
export interface EnhancedFetchResponse extends Response {
  retryCount?: number;
  totalTime?: number;
}

// Fetch with network recovery
export async function fetchWithNetworkRecovery(
  input: RequestInfo | URL,
  options: EnhancedFetchOptions = {},
): Promise<EnhancedFetchResponse> {
  const {
    retry = true,
    retryCount = 3,
    retryDelay = 1000,
    timeout,
    priority = 'auto',
    context,
    onRetry,
    onSuccess,
    onError,
    ...fetchOptions
  } = options;

  const startTime = Date.now();
  let lastError: Error | null = null;

  // Create abort controller for timeout
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | null = null;

  if (timeout) {
    timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);
  }

  try {
    // Use network recovery fetch
    const response = await networkRecoveryFetch.fetch(
      input,
      {
        ...fetchOptions,
        signal: controller.signal,
      },
      context,
    );

    // Clear timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const enhancedResponse = response as EnhancedFetchResponse;
    enhancedResponse.totalTime = Date.now() - startTime;

    onSuccess?.(enhancedResponse);
    return enhancedResponse;
  } catch (error) {
    // Clear timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    lastError = error instanceof Error ? error : new Error(String(error));

    // Handle timeout errors
    if (lastError.name === 'AbortError') {
      const timeoutError = new Error(`Request timeout after ${timeout}ms`);
      onError?.(timeoutError);
      throw timeoutError;
    }

    // Handle network errors
    if (
      lastError instanceof ChatSDKError &&
      lastError.type === 'offline' &&
      lastError.surface === 'chat'
    ) {
      onError?.(lastError);
      throw lastError;
    }

    // Retry logic
    if (retry && retryCount > 0) {
      for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
          // Wait before retry
          if (attempt > 1) {
            const delay = retryDelay * Math.pow(2, attempt - 2); // Exponential backoff
            await new Promise((resolve) => setTimeout(resolve, delay));
          }

          onRetry?.(attempt, lastError);

          // Retry the request
          const response = await networkRecoveryFetch.fetch(
            input,
            {
              ...fetchOptions,
              signal: controller.signal,
            },
            context,
          );

          const enhancedResponse = response as EnhancedFetchResponse;
          enhancedResponse.retryCount = attempt;
          enhancedResponse.totalTime = Date.now() - startTime;

          onSuccess?.(enhancedResponse);
          return enhancedResponse;
        } catch (retryError) {
          lastError =
            retryError instanceof Error
              ? retryError
              : new Error(String(retryError));

          // Don't retry on certain errors
          if (retryError instanceof ChatSDKError) {
            if (
              (retryError.type === 'offline' && retryError.surface === 'chat') ||
              (retryError.type === 'unauthorized' && retryError.surface === 'auth')
            ) {
              onError?.(retryError);
              throw retryError;
            }
          }

          // Last attempt failed
          if (attempt === retryCount) {
            onError?.(lastError);
            throw lastError;
          }
        }
      }
    }

    onError?.(lastError);
    throw lastError;
  }
}

// JSON fetch with network recovery
export async function fetchJSON<T = any>(
  input: RequestInfo | URL,
  options: EnhancedFetchOptions = {},
): Promise<T> {
  const response = await fetchWithNetworkRecovery(input, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ChatSDKError(
      errorData.code || 'bad_request:api',
      errorData.message || `HTTP ${response.status}: ${response.statusText}`,
    );
  }

  return response.json();
}

// POST JSON with network recovery
export async function postJSON<T = any>(
  input: RequestInfo | URL,
  data: any,
  options: EnhancedFetchOptions = {},
): Promise<T> {
  return fetchJSON<T>(input, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// GET JSON with network recovery
export async function getJSON<T = any>(
  input: RequestInfo | URL,
  options: EnhancedFetchOptions = {},
): Promise<T> {
  return fetchJSON<T>(input, {
    ...options,
    method: 'GET',
  });
}

// PUT JSON with network recovery
export async function putJSON<T = any>(
  input: RequestInfo | URL,
  data: any,
  options: EnhancedFetchOptions = {},
): Promise<T> {
  return fetchJSON<T>(input, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// DELETE with network recovery
export async function deleteJSON<T = any>(
  input: RequestInfo | URL,
  options: EnhancedFetchOptions = {},
): Promise<T> {
  return fetchJSON<T>(input, {
    ...options,
    method: 'DELETE',
  });
}

// File upload with network recovery
export async function uploadFile(
  input: RequestInfo | URL,
  file: File,
  options: EnhancedFetchOptions = {},
): Promise<Response> {
  const formData = new FormData();
  formData.append('file', file);

  return fetchWithNetworkRecovery(input, {
    ...options,
    method: 'POST',
    body: formData,
    headers: {
      // Don't set Content-Type for FormData
      ...options.headers,
    },
  });
}

// Batch requests with network recovery
export async function batchRequests<T>(
  requests: Array<{
    input: RequestInfo | URL;
    options?: EnhancedFetchOptions;
  }>,
  options: {
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
  } = {},
): Promise<T[]> {
  const { concurrency = 3, onProgress } = options;
  const results: T[] = [];
  const errors: Error[] = [];

  // Process requests in batches
  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    const batchPromises = batch.map(async (request, index) => {
      try {
        const result = await fetchJSON<T>(request.input, request.options);
        results[i + index] = result;
        onProgress?.(
          results.filter((r) => r !== undefined).length,
          requests.length,
        );
        return result;
      } catch (error) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        errors.push(errorObj);
        results[i + index] = undefined as any;
        onProgress?.(
          results.filter((r) => r !== undefined).length,
          requests.length,
        );
        throw errorObj;
      }
    });

    await Promise.allSettled(batchPromises);
  }

  // If all requests failed, throw the first error
  if (errors.length === requests.length) {
    throw errors[0];
  }

  return results;
}

// Create a configured fetch instance
export function createNetworkAwareFetch(
  config?: Partial<NetworkRecoveryConfig>,
) {
  return {
    fetch: (input: RequestInfo | URL, options?: EnhancedFetchOptions) =>
      fetchWithNetworkRecovery(input, options),
    json: <T = any>(input: RequestInfo | URL, options?: EnhancedFetchOptions) =>
      fetchJSON<T>(input, options),
    post: <T = any>(
      input: RequestInfo | URL,
      data: any,
      options?: EnhancedFetchOptions,
    ) => postJSON<T>(input, data, options),
    get: <T = any>(input: RequestInfo | URL, options?: EnhancedFetchOptions) =>
      getJSON<T>(input, options),
    put: <T = any>(
      input: RequestInfo | URL,
      data: any,
      options?: EnhancedFetchOptions,
    ) => putJSON<T>(input, data, options),
    delete: <T = any>(
      input: RequestInfo | URL,
      options?: EnhancedFetchOptions,
    ) => deleteJSON<T>(input, options),
    upload: (
      input: RequestInfo | URL,
      file: File,
      options?: EnhancedFetchOptions,
    ) => uploadFile(input, file, options),
    batch: <T>(
      requests: Array<{
        input: RequestInfo | URL;
        options?: EnhancedFetchOptions;
      }>,
      options?: {
        concurrency?: number;
        onProgress?: (completed: number, total: number) => void;
      },
    ) => batchRequests<T>(requests, options),
  };
}

// Default network-aware fetch instance
export const networkAwareFetch = createNetworkAwareFetch();
