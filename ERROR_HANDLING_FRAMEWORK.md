# Comprehensive Error Handling Framework

## Overview

This error handling framework provides a centralized, categorized, and user-friendly approach to error management across the application. It includes error categorization, severity levels, user-friendly messages, suggested actions, logging, and reporting capabilities.

## Features

### 1. Centralized Error Handling System
- **Error Categorization**: Automatically categorizes errors into meaningful groups
- **Severity Levels**: Low, Medium, High, Critical
- **User-Friendly Messages**: Clear, actionable error messages
- **Suggested Actions**: Provides users with specific steps to resolve issues

### 2. Error Categories
- `authentication`: Login/session related errors
- `authorization`: Permission/access control errors
- `validation`: Input/data validation errors
- `database`: Database operation errors
- `network`: Connection/network errors
- `file_processing`: File upload/processing errors
- `audio_processing`: Audio-specific processing errors
- `external_service`: Third-party service errors
- `system`: General system errors
- `user_action`: User interaction errors

### 3. Error Severity Levels
- **Low**: Informational errors, auto-cleared after 5 seconds
- **Medium**: Warnings that require user attention
- **High**: Errors that may affect functionality
- **Critical**: System-breaking errors requiring immediate attention

## Architecture

### Core Components

#### 1. Error Handler (`lib/error-handling/index.ts`)
```typescript
import { errorHandler, handleSDKError, handleUnknownError } from '@/lib/error-handling';

// Handle SDK errors
const errorInfo = handleSDKError('unauthorized:auth', 'User not authenticated');

// Handle unknown errors
const errorInfo = handleUnknownError(error, { userId: '123', chatId: '456' });
```

#### 2. React Hook (`lib/error-handling/use-error-handler.ts`)
```typescript
import { useErrorHandler } from '@/lib/error-handling/use-error-handler';

function MyComponent() {
  const { errorState, handleError, clearError, retry } = useErrorHandler({
    autoHandle: true,
    showNotifications: true,
    retryOnError: true,
    maxRetries: 3,
  });

  const handleAsyncOperation = async () => {
    try {
      await someAsyncOperation();
    } catch (error) {
      handleError(error, { action: 'async_operation' });
    }
  };

  return (
    <div>
      {errorState.hasError && (
        <ErrorDisplay
          errorInfo={errorState.errorInfo!}
          onRetry={retry}
          onDismiss={clearError}
        />
      )}
    </div>
  );
}
```

#### 3. API Middleware (`lib/error-handling/api-middleware.ts`)
```typescript
import { withErrorHandling, createAuthErrorHandler } from '@/lib/error-handling/api-middleware';

const handler = async (request: NextRequest, { params }) => {
  // Your API logic here
  // Errors are automatically handled and categorized
};

export const GET = withErrorHandling(handler, {
  customErrorHandler: (error, context) => {
    if (error.message === 'Authentication required') {
      return createAuthErrorHandler()(error, context);
    }
    return null; // Use default handling
  },
});
```

#### 4. Error Display Components (`components/error-display.tsx`)
```typescript
import { ErrorDisplay, ErrorToast, ErrorList } from '@/components/error-display';

// Inline error display
<ErrorDisplay
  errorInfo={errorInfo}
  onRetry={handleRetry}
  onDismiss={handleDismiss}
  variant="inline"
/>

// Toast notification
<ErrorToast
  errorInfo={errorInfo}
  onDismiss={handleDismiss}
  onRetry={handleRetry}
/>

// List of errors
<ErrorList
  errors={errorList}
  onDismiss={handleDismiss}
  onRetry={handleRetry}
/>
```

## Usage Examples

### 1. API Route Error Handling

**Before (Basic Error Handling):**
```typescript
export async function GET(request: NextRequest, { params }) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await fetchData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
```

**After (Enhanced Error Handling):**
```typescript
import { withErrorHandling, createAuthErrorHandler } from '@/lib/error-handling/api-middleware';

const handler = async (request: NextRequest, { params }) => {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }
  
  const data = await fetchData();
  return NextResponse.json({ success: true, data });
};

export const GET = withErrorHandling(handler, {
  customErrorHandler: (error, context) => {
    if (error.message === 'Authentication required') {
      return createAuthErrorHandler()(error, context);
    }
    return null;
  },
});
```

### 2. React Component Error Handling

**Before (Basic Error State):**
```typescript
function MyComponent() {
  const [error, setError] = useState<string | null>(null);
  
  const handleOperation = async () => {
    try {
      await someOperation();
    } catch (err) {
      setError('Something went wrong');
    }
  };
  
  return (
    <div>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

**After (Enhanced Error Handling):**
```typescript
import { useErrorHandler } from '@/lib/error-handling/use-error-handler';
import { ErrorDisplay } from '@/components/error-display';

function MyComponent() {
  const { errorState, handleError, clearError, retry, withErrorHandling } = useErrorHandler({
    autoHandle: true,
    showNotifications: true,
  });
  
  const handleOperation = withErrorHandling(async () => {
    await someOperation();
  }, { action: 'user_operation' });
  
  return (
    <div>
      {errorState.hasError && (
        <ErrorDisplay
          errorInfo={errorState.errorInfo!}
          onRetry={retry}
          onDismiss={clearError}
          variant="inline"
        />
      )}
    </div>
  );
}
```

### 3. Database Error Handling

**Before:**
```typescript
export async function saveData(data: any) {
  try {
    return await db.insert(table).values(data);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save data');
  }
}
```

**After:**
```typescript
import { handleSDKError } from '@/lib/error-handling';

export async function saveData(data: any) {
  try {
    return await db.insert(table).values(data);
  } catch (error) {
    return handleSDKError('bad_request:database', 'Failed to save data', {
      action: 'save_data',
      additionalData: { dataType: typeof data },
    });
  }
}
```

## Error Reporting

### 1. Server-Side Error Reporting
```typescript
import { errorReportingService } from '@/lib/error-handling/error-reporting';

// Configure error reporting
errorReportingService.updateConfig({
  enabled: true,
  endpoint: 'https://your-error-service.com/api/errors',
  apiKey: process.env.ERROR_REPORTING_API_KEY,
  environment: process.env.NODE_ENV,
  appVersion: process.env.APP_VERSION,
});

// Errors are automatically reported when handled
```

### 2. Client-Side Error Reporting
```typescript
import { setupGlobalErrorHandling, reportClientError } from '@/lib/error-handling/error-reporting';

// Setup global error handling
setupGlobalErrorHandling();

// Report specific client errors
try {
  // Some operation
} catch (error) {
  reportClientError(error, {
    action: 'user_action',
    additionalData: { component: 'MyComponent' },
  });
}
```

## Configuration

### 1. Error Handler Configuration
```typescript
import { errorHandler } from '@/lib/error-handling';

errorHandler.updateConfig({
  enableLogging: true,
  enableReporting: true,
  enableUserNotifications: true,
  logLevel: 'error',
  maxLogEntries: 1000,
  reportEndpoint: 'https://your-error-service.com/api/errors',
});
```

### 2. React Hook Configuration
```typescript
const { errorState, handleError } = useErrorHandler({
  autoHandle: true,
  showNotifications: true,
  retryOnError: true,
  maxRetries: 3,
  retryDelay: 1000,
});
```

### 3. API Middleware Configuration
```typescript
export const GET = withErrorHandling(handler, {
  enableLogging: true,
  enableReporting: true,
  includeRequestInfo: true,
  includeUserInfo: true,
  customErrorHandler: (error, context) => {
    // Custom error handling logic
  },
});
```

## Error Statistics and Monitoring

### 1. Get Error Statistics
```typescript
import { errorHandler } from '@/lib/error-handling';

const stats = errorHandler.getErrorStats();
console.log('Total errors:', stats.totalErrors);
console.log('Errors by category:', stats.errorsByCategory);
console.log('Errors by severity:', stats.errorsBySeverity);
console.log('Recent errors:', stats.recentErrors);
```

### 2. Error Reporting Service Statistics
```typescript
import { errorReportingService } from '@/lib/error-handling/error-reporting';

console.log('Queue size:', errorReportingService.getQueueSize());
await errorReportingService.forceFlush();
```

## Best Practices

### 1. Error Categorization
- Use specific error categories for better user experience
- Provide meaningful error messages
- Include suggested actions for resolution

### 2. Error Handling in Components
- Use the `useErrorHandler` hook for consistent error handling
- Display errors using the `ErrorDisplay` component
- Provide retry functionality when appropriate

### 3. API Error Handling
- Wrap API handlers with `withErrorHandling`
- Use custom error handlers for specific error types
- Include relevant context information

### 4. Error Reporting
- Configure error reporting for production environments
- Include relevant context without exposing sensitive information
- Monitor error patterns and trends

## Migration Guide

### 1. Migrating Existing API Routes
1. Import the error handling middleware
2. Wrap your handler with `withErrorHandling`
3. Replace manual error responses with thrown errors
4. Add custom error handlers if needed

### 2. Migrating React Components
1. Replace manual error state with `useErrorHandler`
2. Replace error display with `ErrorDisplay` component
3. Use `withErrorHandling` for async operations
4. Add retry functionality where appropriate

### 3. Migrating Database Operations
1. Wrap database calls with error handling
2. Use `handleSDKError` for database-specific errors
3. Include relevant context information
4. Add appropriate error categorization

## Requirements Fulfilled

This implementation fulfills the following requirements:

### Requirement 10.1: Error Handling and Logging
- ✅ Centralized error handling system with categorization
- ✅ Comprehensive error logging with context
- ✅ Error reporting to external services
- ✅ Error statistics and monitoring

### Requirement 10.5: User Experience
- ✅ User-friendly error messages
- ✅ Suggested actions for error resolution
- ✅ Retry functionality for recoverable errors
- ✅ Error severity levels and appropriate UI feedback
- ✅ Toast notifications for important errors
- ✅ Error boundary fallbacks for React components

## Future Enhancements

1. **Error Analytics Dashboard**: Web interface for viewing error statistics
2. **Error Alerting**: Real-time alerts for critical errors
3. **Error Correlation**: Group related errors for better analysis
4. **Performance Monitoring**: Track error impact on performance
5. **A/B Testing**: Test different error messages for effectiveness
6. **Machine Learning**: Predict and prevent errors based on patterns
