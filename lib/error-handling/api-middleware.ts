import type { NextRequest, NextResponse } from 'next/server';
import {
  errorHandler,
  handleSDKError,
  handleUnknownError,
  type ErrorContext,
} from './index';
import { ChatSDKError } from '../errors';

// API route handler type
export type APIHandler = (
  request: NextRequest,
  context: { params: Record<string, string> },
) => Promise<NextResponse>;

// Enhanced API handler with error handling
export type EnhancedAPIHandler = (
  request: NextRequest,
  context: { params: Record<string, string> },
) => Promise<NextResponse>;

// Middleware configuration
export interface APIMiddlewareConfig {
  enableLogging?: boolean;
  enableReporting?: boolean;
  includeRequestInfo?: boolean;
  includeUserInfo?: boolean;
  customErrorHandler?: (error: unknown, context: ErrorContext) => NextResponse;
}

// Default configuration
const defaultConfig: APIMiddlewareConfig = {
  enableLogging: true,
  enableReporting: false,
  includeRequestInfo: true,
  includeUserInfo: true,
};

/**
 * Wraps an API handler with comprehensive error handling
 */
export function withErrorHandling(
  handler: APIHandler,
  config: APIMiddlewareConfig = {},
): EnhancedAPIHandler {
  const finalConfig = { ...defaultConfig, ...config };

  return async (
    request: NextRequest,
    context: { params: Record<string, string> },
  ) => {
    const startTime = Date.now();

    try {
      // Extract request information for error context
      const errorContext: Partial<ErrorContext> = {
        timestamp: new Date(),
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: getClientIP(request),
        sessionId: request.headers.get('x-session-id') || undefined,
        additionalData: {
          method: request.method,
          url: request.url,
          params: context.params,
        },
      };

      // Add user information if available
      if (finalConfig.includeUserInfo) {
        try {
          const { auth } = await import('@/app/(auth)/auth');
          const session = await auth();
          if (session?.user?.id) {
            errorContext.userId = session.user.id;
          }
        } catch (error) {
          // Ignore auth errors in error context
        }
      }

      // Execute the handler
      const response = await handler(request, context);

      // Log successful requests if enabled
      if (finalConfig.enableLogging) {
        const duration = Date.now() - startTime;
        console.info('API Request Success:', {
          method: request.method,
          url: request.url,
          status: response.status,
          duration: `${duration}ms`,
        });
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Create error context with request information
      const errorContext: ErrorContext = {
        timestamp: new Date(),
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: getClientIP(request),
        sessionId: request.headers.get('x-session-id') || undefined,
        additionalData: {
          method: request.method,
          url: request.url,
          params: context.params,
          duration: `${duration}ms`,
        },
      };

      // Add user information if available
      if (finalConfig.includeUserInfo) {
        try {
          const { auth } = await import('@/app/(auth)/auth');
          const session = await auth();
          if (session?.user?.id) {
            errorContext.userId = session.user.id;
          }
        } catch (authError) {
          // Ignore auth errors in error context
        }
      }

      // Handle the error
      const errorInfo = errorHandler.handleError(error, errorContext);

      // Use custom error handler if provided
      if (finalConfig.customErrorHandler) {
        return finalConfig.customErrorHandler(error, errorContext);
      }

      // Return appropriate error response
      return createErrorResponse(errorInfo);
    }
  };
}

/**
 * Create an error response based on error information
 */
function createErrorResponse(errorInfo: any): NextResponse {
  const { code, message, statusCode, context } = errorInfo;

  // For database errors, don't expose internal details
  if (errorInfo.category === 'database') {
    return NextResponse.json(
      {
        error: 'A database error occurred. Please try again in a moment.',
        code: 'database_error',
      },
      { status: 500 },
    );
  }

  // For authentication errors
  if (errorInfo.category === 'authentication') {
    return NextResponse.json(
      {
        error: message,
        code: code || 'authentication_error',
      },
      { status: statusCode || 401 },
    );
  }

  // For authorization errors
  if (errorInfo.category === 'authorization') {
    return NextResponse.json(
      {
        error: message,
        code: code || 'authorization_error',
      },
      { status: statusCode || 403 },
    );
  }

  // For validation errors
  if (errorInfo.category === 'validation') {
    return NextResponse.json(
      {
        error: message,
        code: code || 'validation_error',
        details: context.additionalData,
      },
      { status: statusCode || 400 },
    );
  }

  // For network errors
  if (errorInfo.category === 'network') {
    return NextResponse.json(
      {
        error: message,
        code: code || 'network_error',
      },
      { status: statusCode || 503 },
    );
  }

  // For system errors
  if (errorInfo.category === 'system') {
    return NextResponse.json(
      {
        error: 'A system error occurred. Please try again later.',
        code: code || 'system_error',
      },
      { status: statusCode || 500 },
    );
  }

  // Default error response
  return NextResponse.json(
    {
      error: message || 'An unexpected error occurred.',
      code: code || 'unknown_error',
    },
    { status: statusCode || 500 },
  );
}

/**
 * Extract client IP address from request
 */
function getClientIP(request: NextRequest): string | undefined {
  // Check various headers for client IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return undefined;
}

/**
 * Create a simple error handler for common API patterns
 */
export function createSimpleErrorHandler(
  errorCode: string,
  statusCode = 500,
  message?: string,
) {
  return (error: unknown, context: ErrorContext): NextResponse => {
    const errorInfo = handleSDKError(
      errorCode as any,
      message || String(error),
      context,
    );
    return createErrorResponse(errorInfo);
  };
}

/**
 * Rate limiting error handler
 */
export function createRateLimitErrorHandler(limit: number, windowMs: number) {
  return (error: unknown, context: ErrorContext): NextResponse => {
    const errorInfo = handleSDKError(
      'rate_limit:chat',
      `Rate limit exceeded: ${limit} requests per ${windowMs}ms`,
      context,
    );
    return NextResponse.json(
      {
        error: 'Rate limit exceeded. Please try again later.',
        code: 'rate_limit_exceeded',
        retryAfter: Math.ceil(windowMs / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(windowMs / 1000).toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Window': windowMs.toString(),
        },
      },
    );
  };
}

/**
 * Validation error handler
 */
export function createValidationErrorHandler(fieldName?: string) {
  return (error: unknown, context: ErrorContext): NextResponse => {
    const message = fieldName
      ? `Invalid ${fieldName}. Please check your input.`
      : 'Invalid input. Please check your data.';

    const errorInfo = handleSDKError('bad_request:api', message, context);
    return createErrorResponse(errorInfo);
  };
}

/**
 * Database error handler
 */
export function createDatabaseErrorHandler() {
  return (error: unknown, context: ErrorContext): NextResponse => {
    const errorInfo = handleSDKError(
      'bad_request:database',
      'Database operation failed',
      context,
    );
    return createErrorResponse(errorInfo);
  };
}

/**
 * Authentication error handler
 */
export function createAuthErrorHandler() {
  return (error: unknown, context: ErrorContext): NextResponse => {
    const errorInfo = handleSDKError(
      'unauthorized:auth',
      'Authentication required',
      context,
    );
    return createErrorResponse(errorInfo);
  };
}
