import type { ErrorInfo, ErrorContext } from './index';

// Error reporting service configuration
export interface ErrorReportingConfig {
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  environment: 'development' | 'staging' | 'production';
  appVersion?: string;
  maxBatchSize: number;
  flushInterval: number;
  retryAttempts: number;
  retryDelay: number;
}

// Error report payload
export interface ErrorReport {
  id: string;
  timestamp: string;
  error: {
    code: string;
    category: string;
    severity: string;
    message: string;
    userMessage: string;
    suggestedActions: string[];
    context: ErrorContext;
    stack?: string;
  };
  environment: string;
  appVersion?: string;
  userAgent?: string;
  sessionId?: string;
}

// Default configuration
export const defaultErrorReportingConfig: ErrorReportingConfig = {
  enabled: false,
  environment: 'development',
  maxBatchSize: 10,
  flushInterval: 5000, // 5 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

// Error reporting service class
export class ErrorReportingService {
  private config: ErrorReportingConfig;
  private queue: ErrorReport[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isFlushing = false;
  private static instance: ErrorReportingService;

  private constructor(
    config: ErrorReportingConfig = defaultErrorReportingConfig,
  ) {
    this.config = config;
    this.startFlushTimer();
  }

  public static getInstance(
    config?: Partial<ErrorReportingConfig>,
  ): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      const mergedConfig = config ? { ...defaultErrorReportingConfig, ...config } : defaultErrorReportingConfig;
      ErrorReportingService.instance = new ErrorReportingService(mergedConfig);
    }
    return ErrorReportingService.instance;
  }

  /**
   * Report an error to the external service
   */
  public async reportError(errorInfo: ErrorInfo): Promise<void> {
    if (!this.config.enabled || !this.config.endpoint) {
      return;
    }

    const report: ErrorReport = {
      id: this.generateReportId(),
      timestamp: errorInfo.context.timestamp.toISOString(),
      error: {
        code: errorInfo.code,
        category: errorInfo.category,
        severity: errorInfo.severity,
        message: errorInfo.message,
        userMessage: errorInfo.userMessage,
        suggestedActions: errorInfo.suggestedActions,
        context: errorInfo.context,
        stack: errorInfo.stack,
      },
      environment: this.config.environment,
      appVersion: this.config.appVersion,
      userAgent: errorInfo.context.userAgent,
      sessionId: errorInfo.context.sessionId,
    };

    // Add to queue
    this.queue.push(report);

    // Flush immediately if queue is full
    if (this.queue.length >= this.config.maxBatchSize) {
      await this.flush();
    }
  }

  /**
   * Report multiple errors in a batch
   */
  public async reportErrors(errorInfos: ErrorInfo[]): Promise<void> {
    if (!this.config.enabled || !this.config.endpoint) {
      return;
    }

    const reports = errorInfos.map((errorInfo) => ({
      id: this.generateReportId(),
      timestamp: errorInfo.context.timestamp.toISOString(),
      error: {
        code: errorInfo.code,
        category: errorInfo.category,
        severity: errorInfo.severity,
        message: errorInfo.message,
        userMessage: errorInfo.userMessage,
        suggestedActions: errorInfo.suggestedActions,
        context: errorInfo.context,
        stack: errorInfo.stack,
      },
      environment: this.config.environment,
      appVersion: this.config.appVersion,
      userAgent: errorInfo.context.userAgent,
      sessionId: errorInfo.context.sessionId,
    }));

    this.queue.push(...reports);

    // Flush immediately if queue is full
    if (this.queue.length >= this.config.maxBatchSize) {
      await this.flush();
    }
  }

  /**
   * Flush the error queue to the external service
   */
  private async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) {
      return;
    }

    this.isFlushing = true;

    try {
      const reports = this.queue.splice(0, this.config.maxBatchSize);

      await this.sendReports(reports);

      console.info(`Error Reporting: Sent ${reports.length} error reports`);
    } catch (error) {
      console.error('Error Reporting: Failed to send error reports:', error);

      // Put reports back in queue for retry
      const batchSize = this.config.maxBatchSize;
      this.queue.unshift(...this.queue.splice(0, batchSize));
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Send error reports to the external service
   */
  private async sendReports(reports: ErrorReport[]): Promise<void> {
    if (!this.config.endpoint) {
      throw new Error('Error reporting endpoint not configured');
    }

    const payload = {
      reports,
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      appVersion: this.config.appVersion,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await fetch(this.config.endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.config.retryAttempts) {
          // Wait before retry
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.retryDelay * attempt),
          );
        }
      }
    }

    throw lastError || new Error('Failed to send error reports');
  }

  /**
   * Start the flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush().catch((error) => {
        console.error('Error Reporting: Flush timer error:', error);
      });
    }, this.config.flushInterval);
  }

  /**
   * Generate a unique report ID
   */
  private generateReportId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ErrorReportingConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart flush timer if interval changed
    if (newConfig.flushInterval) {
      this.startFlushTimer();
    }
  }

  /**
   * Get current queue size
   */
  public getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear the error queue
   */
  public clearQueue(): void {
    this.queue = [];
  }

  /**
   * Force flush the queue
   */
  public async forceFlush(): Promise<void> {
    await this.flush();
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

// Convenience function to get the error reporting service instance
export const errorReportingService = ErrorReportingService.getInstance();

// Error reporting middleware for API routes
export function withErrorReporting(
  handler: (request: Request, context: any) => Promise<Response>,
  config?: Partial<ErrorReportingConfig>,
): (request: Request, context: any) => Promise<Response> {
  const reportingService = ErrorReportingService.getInstance(config);

  return async (request: Request, context: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      // Report the error
      const errorInfo = {
        code: 'system:api',
        category: 'system',
        severity: 'high',
        message: error instanceof Error ? error.message : String(error),
        userMessage: 'A system error occurred. Please try again later.',
        suggestedActions: [
          'Try refreshing the page',
          'Contact support if the issue persists',
        ],
        context: {
          timestamp: new Date(),
          userAgent: request.headers.get('user-agent') || undefined,
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
          additionalData: {
            method: request.method,
            url: request.url,
          },
        },
        stack: error instanceof Error ? error.stack : undefined,
      };

      await reportingService.reportError(errorInfo as any);

      // Re-throw the error
      throw error;
    }
  };
}

// Error reporting for client-side errors
export function reportClientError(
  error: Error,
  context?: Partial<ErrorContext>,
): void {
  const errorInfo = {
    code: 'system:client',
    category: 'system',
    severity: 'medium',
    message: error.message,
    userMessage: 'A client-side error occurred. Please refresh the page.',
    suggestedActions: [
      'Refresh the page',
      'Clear browser cache',
      'Contact support if the issue persists',
    ],
    context: {
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      additionalData: {
        url: window.location.href,
        stack: error.stack,
      },
      ...context,
    },
    stack: error.stack,
  };

  // Send to error reporting service if configured
  if (typeof window !== 'undefined') {
    // In a real implementation, you might send this to your API endpoint
    console.error('Client Error:', errorInfo);
  }
}

// Global error handler for unhandled errors
export function setupGlobalErrorHandling(): void {
  if (typeof window === 'undefined') return;

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    reportClientError(
      error instanceof Error ? error : new Error(String(error)),
      { action: 'unhandled_promise_rejection' },
    );
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    reportClientError(new Error(event.message), {
      action: 'uncaught_error',
      additionalData: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });
}
