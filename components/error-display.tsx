'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertTriangleIcon, XIcon, RefreshIcon, InfoIcon } from './icons';
import { cn } from '@/lib/utils';
import type { ErrorInfo } from '@/lib/error-handling';

// Error display component props
interface ErrorDisplayProps {
  errorInfo: ErrorInfo;
  onDismiss?: () => void;
  onRetry?: () => void;
  showDetails?: boolean;
  className?: string;
  variant?: 'inline' | 'card' | 'toast';
}

// Error severity color mapping
const severityColors: Record<string, string> = {
  low: 'bg-blue-50 border-blue-200 text-blue-800',
  medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  high: 'bg-orange-50 border-orange-200 text-orange-800',
  critical: 'bg-red-50 border-red-200 text-red-800',
};

// Error category icon mapping
const categoryIcons: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  authentication: AlertTriangleIcon,
  authorization: AlertTriangleIcon,
  validation: InfoIcon,
  database: AlertTriangleIcon,
  network: AlertTriangleIcon,
  file_processing: AlertTriangleIcon,
  audio_processing: AlertTriangleIcon,
  external_service: AlertTriangleIcon,
  system: AlertTriangleIcon,
  user_action: InfoIcon,
};

export function ErrorDisplay({
  errorInfo,
  onDismiss,
  onRetry,
  showDetails = false,
  className,
  variant = 'card',
}: ErrorDisplayProps) {
  const IconComponent = categoryIcons[errorInfo.category] || AlertTriangleIcon;
  const severityColor =
    severityColors[errorInfo.severity] || severityColors.medium;

  const renderContent = () => (
    <div className={cn('flex items-start gap-3', className)}>
      <IconComponent
        size={20}
        className={cn(
          'mt-0.5 flex-shrink-0',
          errorInfo.severity === 'critical'
            ? 'text-red-500'
            : errorInfo.severity === 'high'
              ? 'text-orange-500'
              : errorInfo.severity === 'medium'
                ? 'text-yellow-500'
                : 'text-blue-500',
        )}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-medium text-sm">{errorInfo.userMessage}</h3>
          <Badge variant="secondary" className="text-xs">
            {errorInfo.category}
          </Badge>
        </div>

        {errorInfo.suggestedActions.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1">
              Suggested actions:
            </p>
            <ul className="text-xs space-y-1">
              {errorInfo.suggestedActions.map((action, index) => (
                <li
                  key={`action-${index}-${action.slice(0, 10)}`}
                  className="flex items-center gap-1"
                >
                  <span className="w-1 h-1 bg-current rounded-full opacity-60" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {showDetails && (
          <details className="mt-2">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              Technical details
            </summary>
            <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
              <div>
                <strong>Code:</strong> {errorInfo.code}
              </div>
              <div>
                <strong>Severity:</strong> {errorInfo.severity}
              </div>
              <div>
                <strong>Category:</strong> {errorInfo.category}
              </div>
              {errorInfo.context.userId && (
                <div>
                  <strong>User ID:</strong> {errorInfo.context.userId}
                </div>
              )}
              {errorInfo.context.chatId && (
                <div>
                  <strong>Chat ID:</strong> {errorInfo.context.chatId}
                </div>
              )}
              {errorInfo.context.action && (
                <div>
                  <strong>Action:</strong> {errorInfo.context.action}
                </div>
              )}
              <div>
                <strong>Timestamp:</strong>{' '}
                {errorInfo.context.timestamp.toISOString()}
              </div>
            </div>
          </details>
        )}

        <div className="flex items-center gap-2 mt-3">
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="text-xs"
            >
              <RefreshIcon size={14} className="mr-1" />
              Retry
            </Button>
          )}

          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="text-xs"
            >
              Dismiss
            </Button>
          )}
        </div>
      </div>

      {onDismiss && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onDismiss}
          className="flex-shrink-0 h-6 w-6 p-0"
        >
          <XIcon size={14} />
        </Button>
      )}
    </div>
  );

  if (variant === 'inline') {
    return (
      <div className={cn('p-3 border rounded-md', severityColor)}>
        {renderContent()}
      </div>
    );
  }

  if (variant === 'toast') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.3 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
        className={cn(
          'p-4 border rounded-lg shadow-lg max-w-md',
          severityColor,
        )}
      >
        {renderContent()}
      </motion.div>
    );
  }

  // Default card variant
  return (
    <Card
      className={cn(
        'border-l-4',
        severityColor.replace('border-', 'border-l-'),
      )}
    >
      <CardContent className="p-4">{renderContent()}</CardContent>
    </Card>
  );
}

// Error boundary fallback component
interface ErrorBoundaryFallbackProps {
  errorInfo: ErrorInfo;
  onRetry?: () => void;
}

export function ErrorBoundaryFallback({
  errorInfo,
  onRetry,
}: ErrorBoundaryFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangleIcon size={20} className="text-red-500" />
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorDisplay
            errorInfo={errorInfo}
            onRetry={onRetry}
            showDetails={true}
            variant="inline"
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Toast-style error notification
interface ErrorToastProps {
  errorInfo: ErrorInfo;
  onDismiss: () => void;
  onRetry?: () => void;
}

export function ErrorToast({ errorInfo, onDismiss, onRetry }: ErrorToastProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed top-4 right-4 z-50"
      >
        <ErrorDisplay
          errorInfo={errorInfo}
          onDismiss={onDismiss}
          onRetry={onRetry}
          variant="toast"
        />
      </motion.div>
    </AnimatePresence>
  );
}

// Error list component for displaying multiple errors
interface ErrorListProps {
  errors: ErrorInfo[];
  onDismiss?: (errorInfo: ErrorInfo) => void;
  onRetry?: (errorInfo: ErrorInfo) => void;
  className?: string;
}

export function ErrorList({
  errors,
  onDismiss,
  onRetry,
  className,
}: ErrorListProps) {
  if (errors.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {errors.map((errorInfo, index) => (
        <ErrorDisplay
          key={`${errorInfo.code}-${errorInfo.context.timestamp.getTime()}-${index}`}
          errorInfo={errorInfo}
          onDismiss={onDismiss ? () => onDismiss(errorInfo) : undefined}
          onRetry={onRetry ? () => onRetry(errorInfo) : undefined}
          variant="inline"
        />
      ))}
    </div>
  );
}
