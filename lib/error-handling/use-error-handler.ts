import { useState, useCallback, useEffect } from 'react';
import { errorHandler, handleUnknownError, type ErrorInfo, type ErrorContext } from './index';

// Error state interface
export interface ErrorState {
  hasError: boolean;
  errorInfo: ErrorInfo | null;
  isDismissed: boolean;
}

// Error handler hook return type
export interface UseErrorHandlerReturn {
  errorState: ErrorState;
  handleError: (error: unknown, context?: Partial<ErrorContext>) => void;
  clearError: () => void;
  dismissError: () => void;
  retry: () => void;
  withErrorHandling: <T>(
    operation: () => Promise<T>,
    context?: Partial<ErrorContext>,
  ) => Promise<T>;
}

// Configuration for the error handler hook
export interface UseErrorHandlerConfig {
  autoHandle?: boolean;
  showNotifications?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

// Default configuration
const defaultConfig: UseErrorHandlerConfig = {
  autoHandle: true,
  showNotifications: true,
  retryOnError: false,
  maxRetries: 3,
  retryDelay: 1000,
};

/**
 * React hook for error handling with user-friendly error display
 */
export function useErrorHandler(
  config: UseErrorHandlerConfig = {},
): UseErrorHandlerReturn {
  const finalConfig = { ...defaultConfig, ...config };

  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    errorInfo: null,
    isDismissed: false,
  });

  const [retryCount, setRetryCount] = useState(0);
  const [lastOperation, setLastOperation] = useState<
    (() => Promise<any>) | null
  >(null);

  // Handle error with context
  const handleError = useCallback(
    (error: unknown, context?: Partial<ErrorContext>) => {
      const errorInfo = handleUnknownError(error, context);

      setErrorState({
        hasError: true,
        errorInfo,
        isDismissed: false,
      });

      // Show notification if enabled
      if (finalConfig.showNotifications && errorInfo.severity !== 'low') {
        showErrorNotification(errorInfo);
      }

      // Auto-retry if enabled and not exceeded max retries
      if (
        finalConfig.retryOnError &&
        finalConfig.maxRetries &&
        retryCount < finalConfig.maxRetries &&
        lastOperation &&
        shouldRetryError(errorInfo)
      ) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          lastOperation();
        }, finalConfig.retryDelay || 1000);
      }
    },
    [finalConfig, retryCount, lastOperation],
  );

  // Clear error state
  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      errorInfo: null,
      isDismissed: false,
    });
    setRetryCount(0);
    setLastOperation(null);
  }, []);

  // Dismiss error (keep error info but mark as dismissed)
  const dismissError = useCallback(() => {
    setErrorState((prev) => ({
      ...prev,
      isDismissed: true,
    }));
  }, []);

  // Retry last operation
  const retry = useCallback(async () => {
    if (lastOperation) {
      setRetryCount(0);
      setErrorState((prev) => ({
        ...prev,
        hasError: false,
        isDismissed: false,
      }));

      try {
        await lastOperation();
      } catch (error) {
        handleError(error);
      }
    }
  }, [lastOperation, handleError]);

  // Wrapper for async operations with error handling
  const withErrorHandling = useCallback(
    async <T>(
      operation: () => Promise<T>,
      context?: Partial<ErrorContext>,
    ): Promise<T> => {
      setLastOperation(() => operation);

      try {
        const result = await operation();
        // Clear any previous errors on success
        if (errorState.hasError) {
          clearError();
        }
        return result;
      } catch (error) {
        handleError(error, context);
        throw error;
      }
    },
    [errorState.hasError, clearError, handleError],
  );

  // Auto-clear errors after a delay for low severity errors
  useEffect(() => {
    if (
      errorState.hasError &&
      errorState.errorInfo?.severity === 'low' &&
      !errorState.isDismissed
    ) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000); // Auto-clear after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [
    errorState.hasError,
    errorState.errorInfo?.severity,
    errorState.isDismissed,
    clearError,
  ]);

  return {
    errorState,
    handleError,
    clearError,
    dismissError,
    retry,
    withErrorHandling,
  };
}

// Helper function to determine if an error should be retried
function shouldRetryError(errorInfo: ErrorInfo): boolean {
  // Don't retry authentication or authorization errors
  if (
    errorInfo.category === 'authentication' ||
    errorInfo.category === 'authorization'
  ) {
    return false;
  }

  // Don't retry validation errors
  if (errorInfo.category === 'validation') {
    return false;
  }

  // Retry network, database, and system errors
  return ['network', 'database', 'system', 'external_service'].includes(
    errorInfo.category,
  );
}

// Show error notification (can be customized)
function showErrorNotification(errorInfo: ErrorInfo): void {
  // Check if browser supports notifications
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Error', {
      body: errorInfo.userMessage,
      icon: '/favicon.ico',
    });
  } else {
    // Fallback to console or custom notification system
    console.warn('Error Notification:', errorInfo.userMessage);
  }
}

// Hook for handling specific error types
export function useSpecificErrorHandler<T extends string>(
  errorTypes: T[],
  config?: UseErrorHandlerConfig,
) {
  const {
    errorState,
    handleError,
    clearError,
    dismissError,
    retry,
    withErrorHandling,
  } = useErrorHandler(config);

  const handleSpecificError = useCallback(
    (error: unknown, errorType: T, context?: Partial<ErrorContext>) => {
      if (errorTypes.includes(errorType)) {
        handleError(error, { ...context, action: errorType });
      }
    },
    [errorTypes, handleError],
  );

  return {
    errorState,
    handleSpecificError,
    clearError,
    dismissError,
    retry,
    withErrorHandling,
  };
}

// Hook for handling form errors
export function useFormErrorHandler(config?: UseErrorHandlerConfig) {
  const {
    errorState,
    handleError,
    clearError,
    dismissError,
    retry,
    withErrorHandling,
  } = useErrorHandler(config);

  const handleFormError = useCallback(
    (error: unknown, fieldName?: string, context?: Partial<ErrorContext>) => {
      const formContext = {
        ...context,
        action: 'form_submission',
        additionalData: {
          ...context?.additionalData,
          fieldName,
        },
      };

      handleError(error, formContext);
    },
    [handleError],
  );

  return {
    errorState,
    handleFormError,
    clearError,
    dismissError,
    retry,
    withErrorHandling,
  };
}

// Hook for handling API errors
export function useAPIErrorHandler(config?: UseErrorHandlerConfig) {
  const {
    errorState,
    handleError,
    clearError,
    dismissError,
    retry,
    withErrorHandling,
  } = useErrorHandler(config);

  const handleAPIError = useCallback(
    (
      error: unknown,
      endpoint?: string,
      method?: string,
      context?: Partial<ErrorContext>,
    ) => {
      const apiContext = {
        ...context,
        action: 'api_request',
        additionalData: {
          ...context?.additionalData,
          endpoint,
          method,
        },
      };

      handleError(error, apiContext);
    },
    [handleError],
  );

  return {
    errorState,
    handleAPIError,
    clearError,
    dismissError,
    retry,
    withErrorHandling,
  };
}
