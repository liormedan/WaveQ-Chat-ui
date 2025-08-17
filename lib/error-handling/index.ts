import React from 'react';
import {
  ChatSDKError,
  type ErrorCode,
  type ErrorType,
  type Surface,
} from '../errors';

// Error Categories
export type ErrorCategory =
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'database'
  | 'network'
  | 'file_processing'
  | 'audio_processing'
  | 'external_service'
  | 'system'
  | 'user_action';

// Error Severity Levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error Context for better debugging
export interface ErrorContext {
  userId?: string;
  chatId?: string;
  audioId?: string;
  messageId?: string;
  action?: string;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  additionalData?: Record<string, any>;
}

// Enhanced Error Information
export interface ErrorInfo {
  code: ErrorCode;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  suggestedActions: string[];
  context: ErrorContext;
  originalError?: Error;
  stack?: string;
}

// Error Handler Configuration
export interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableReporting: boolean;
  enableUserNotifications: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  maxLogEntries: number;
  reportEndpoint?: string;
}

// Default Configuration
export const defaultErrorHandlerConfig: ErrorHandlerConfig = {
  enableLogging: true,
  enableReporting: false,
  enableUserNotifications: true,
  logLevel: 'error',
  maxLogEntries: 1000,
};

// Error Category Mapping
export const errorCategoryMap: Record<ErrorType, ErrorCategory> = {
  bad_request: 'validation',
  unauthorized: 'authentication',
  forbidden: 'authorization',
  not_found: 'validation',
  rate_limit: 'system',
  offline: 'network',
};

// Error Severity Mapping
export const errorSeverityMap: Record<ErrorType, ErrorSeverity> = {
  bad_request: 'low',
  unauthorized: 'medium',
  forbidden: 'medium',
  not_found: 'low',
  rate_limit: 'medium',
  offline: 'high',
};

// Surface to Category Mapping
export const surfaceCategoryMap: Record<Surface, ErrorCategory> = {
  chat: 'user_action',
  auth: 'authentication',
  api: 'system',
  stream: 'audio_processing',
  database: 'database',
  history: 'user_action',
  vote: 'user_action',
  document: 'file_processing',
  suggestions: 'user_action',
};

// Centralized Error Handler Class
export class ErrorHandler {
  private config: ErrorHandlerConfig;
  private errorLog: ErrorInfo[] = [];
  private static instance: ErrorHandler;

  private constructor(config: ErrorHandlerConfig = defaultErrorHandlerConfig) {
    this.config = config;
  }

  public static getInstance(config?: ErrorHandlerConfig): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler(config);
    }
    return ErrorHandler.instance;
  }

  // Handle and categorize errors
  public handleError(
    error: Error | ChatSDKError,
    context: Partial<ErrorContext> = {},
  ): ErrorInfo {
    const errorInfo = this.createErrorInfo(error, context);

    if (this.config.enableLogging) {
      this.logError(errorInfo);
    }

    if (this.config.enableReporting) {
      this.reportError(errorInfo);
    }

    return errorInfo;
  }

  // Create structured error information
  private createErrorInfo(
    error: Error | ChatSDKError,
    context: Partial<ErrorContext>,
  ): ErrorInfo {
    const isChatSDKError = error instanceof ChatSDKError;
    const errorCode = isChatSDKError
      ? (`${error.type}:${error.surface}` as ErrorCode)
      : 'bad_request:api';
    const [type, surface] = errorCode.split(':') as [ErrorType, Surface];

    const category = this.determineCategory(type, surface);
    const severity = this.determineSeverity(type, category);
    const userMessage = this.getUserFriendlyMessage(errorCode, error.message);
    const suggestedActions = this.getSuggestedActions(errorCode, category);

    const errorContext: ErrorContext = {
      timestamp: new Date(),
      ...context,
    };

    return {
      code: errorCode,
      category,
      severity,
      message: error.message,
      userMessage,
      suggestedActions,
      context: errorContext,
      originalError: error,
      stack: error.stack,
    };
  }

  // Determine error category based on type and surface
  private determineCategory(type: ErrorType, surface: Surface): ErrorCategory {
    // Check if surface provides more specific categorization
    if (surfaceCategoryMap[surface]) {
      return surfaceCategoryMap[surface];
    }

    // Fall back to type-based categorization
    return errorCategoryMap[type] || 'system';
  }

  // Determine error severity
  private determineSeverity(
    type: ErrorType,
    category: ErrorCategory,
  ): ErrorSeverity {
    // Override severity based on category for certain cases
    if (category === 'database') return 'high';
    if (category === 'external_service') return 'high';
    if (category === 'audio_processing') return 'medium';

    return errorSeverityMap[type] || 'medium';
  }

  // Get user-friendly error messages
  private getUserFriendlyMessage(
    errorCode: ErrorCode,
    originalMessage: string,
  ): string {
    const messageMap: Partial<Record<ErrorCode, string>> = {
      'bad_request:api':
        'The request could not be processed. Please check your input and try again.',
      'bad_request:database':
        'A database error occurred. Please try again in a moment.',
      'bad_request:document':
        'The document request was invalid. Please check your input.',
      'unauthorized:auth': 'Please sign in to continue.',
      'unauthorized:chat': 'Please sign in to view this chat.',
      'unauthorized:document': 'Please sign in to view this document.',
      'forbidden:auth': 'You do not have permission to access this feature.',
      'forbidden:chat': 'You do not have permission to access this chat.',
      'forbidden:document':
        'You do not have permission to access this document.',
      'not_found:chat': 'The requested chat was not found.',
      'not_found:document': 'The requested document was not found.',
      'rate_limit:chat':
        'You have exceeded the rate limit. Please try again later.',
      'offline:chat':
        'Network connection issue. Please check your internet connection.',
    };

    return (
      messageMap[errorCode] || 'An unexpected error occurred. Please try again.'
    );
  }

  // Get suggested actions for users
  private getSuggestedActions(
    errorCode: ErrorCode,
    category: ErrorCategory,
  ): string[] {
    const actionMap: Record<ErrorCategory, string[]> = {
      authentication: [
        'Please sign in to your account',
        'Check if your session has expired',
        'Try refreshing the page',
      ],
      authorization: [
        'Contact support if you believe this is an error',
        'Check if you have the necessary permissions',
        'Try accessing the feature from a different account',
      ],
      validation: [
        'Check your input and try again',
        'Ensure all required fields are filled',
        'Verify the format of your data',
      ],
      database: [
        'Please try again in a moment',
        'Contact support if the issue persists',
        'Check if the service is experiencing issues',
      ],
      network: [
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again',
      ],
      file_processing: [
        'Check if the file format is supported',
        'Try uploading a smaller file',
        'Ensure the file is not corrupted',
      ],
      audio_processing: [
        'Check if the audio format is supported',
        'Try with a shorter audio file',
        'Ensure the audio quality is sufficient',
      ],
      external_service: [
        'The external service may be temporarily unavailable',
        'Try again in a few minutes',
        'Contact support if the issue persists',
      ],
      system: [
        'Try refreshing the page',
        'Clear your browser cache',
        'Contact support if the issue persists',
      ],
      user_action: [
        'Check your input and try again',
        'Ensure you have the necessary permissions',
        'Try the action again',
      ],
    };

    return (
      actionMap[category] || [
        'Try again',
        'Contact support if the issue persists',
      ]
    );
  }

  // Log error information
  private logError(errorInfo: ErrorInfo): void {
    const logEntry = {
      timestamp: errorInfo.context.timestamp,
      code: errorInfo.code,
      category: errorInfo.category,
      severity: errorInfo.severity,
      message: errorInfo.message,
      userMessage: errorInfo.userMessage,
      suggestedActions: errorInfo.suggestedActions,
      context: errorInfo.context,
      stack: errorInfo.stack,
    };

    // Add to in-memory log
    this.errorLog.push(logEntry);

    // Keep log size manageable
    if (this.errorLog.length > this.config.maxLogEntries) {
      this.errorLog = this.errorLog.slice(-this.config.maxLogEntries);
    }

    // Console logging based on severity
    const logLevel = this.getLogLevel(errorInfo.severity);
    if (logLevel === 'error') {
      console.error('Error Handler:', logEntry);
    } else if (logLevel === 'warn') {
      console.warn('Error Handler:', logEntry);
    } else if (logLevel === 'info') {
      console.info('Error Handler:', logEntry);
    }
  }

  // Get appropriate log level based on severity
  private getLogLevel(
    severity: ErrorSeverity,
  ): 'error' | 'warn' | 'info' | 'debug' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      case 'low':
        return 'info';
      default:
        return 'error';
    }
  }

  // Report error to external service (if configured)
  private async reportError(errorInfo: ErrorInfo): Promise<void> {
    if (!this.config.reportEndpoint) return;

    try {
      await fetch(this.config.reportEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: {
            code: errorInfo.code,
            category: errorInfo.category,
            severity: errorInfo.severity,
            message: errorInfo.message,
            context: errorInfo.context,
          },
          timestamp: errorInfo.context.timestamp.toISOString(),
        }),
      });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  // Get error statistics
  public getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recentErrors: ErrorInfo[];
  } {
    const errorsByCategory: Record<ErrorCategory, number> = {
      authentication: 0,
      authorization: 0,
      validation: 0,
      database: 0,
      network: 0,
      file_processing: 0,
      audio_processing: 0,
      external_service: 0,
      system: 0,
      user_action: 0,
    };
    const errorsBySeverity: Record<ErrorSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    this.errorLog.forEach((error) => {
      errorsByCategory[error.category] =
        (errorsByCategory[error.category] || 0) + 1;
      errorsBySeverity[error.severity] =
        (errorsBySeverity[error.severity] || 0) + 1;
    });

    return {
      totalErrors: this.errorLog.length,
      errorsByCategory,
      errorsBySeverity,
      recentErrors: this.errorLog.slice(-10), // Last 10 errors
    };
  }

  // Clear error log
  public clearErrorLog(): void {
    this.errorLog = [];
  }

  // Update configuration
  public updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Convenience functions for common error handling patterns
export const errorHandler = ErrorHandler.getInstance();

// Create and handle a ChatSDKError
export function handleSDKError(
  errorCode: ErrorCode,
  cause?: string,
  context?: Partial<ErrorContext>,
): ErrorInfo {
  const error = new ChatSDKError(errorCode, cause);
  return errorHandler.handleError(error, context);
}

// Handle unknown errors
export function handleUnknownError(
  error: unknown,
  context?: Partial<ErrorContext>,
): ErrorInfo {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const sdkError = new ChatSDKError('bad_request:api', errorMessage);
  return errorHandler.handleError(sdkError, context);
}

// Async error wrapper for API routes
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Partial<ErrorContext>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const errorInfo = handleUnknownError(error, context);
    throw errorInfo;
  }
}

// Error boundary for React components
export function createErrorBoundary(
  fallback: (error: ErrorInfo) => React.ReactNode,
) {
  return class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; errorInfo: ErrorInfo | null }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): {
      hasError: boolean;
      errorInfo: ErrorInfo;
    } {
      const errorInfo = handleUnknownError(error);
      return { hasError: true, errorInfo };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      handleUnknownError(error, {
        additionalData: { reactErrorInfo: errorInfo },
      });
    }

    render() {
      if (this.state.hasError && this.state.errorInfo) {
        return fallback(this.state.errorInfo);
      }

      return this.props.children;
    }
  };
}
