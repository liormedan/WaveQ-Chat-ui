'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LoaderIcon,
  CheckCircleFillIcon,
  WarningIcon,
  XIcon,
  RefreshIcon,
  ClockIcon,
  PlayIcon,
  PauseIcon,
} from './icons';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

export type ProcessingStepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'error'
  | 'cancelled';

export interface ProcessingStep {
  id: string;
  name: string;
  status: ProcessingStepStatus;
  progress?: number; // 0-100
  startTime?: Date;
  endTime?: Date;
  error?: string;
  estimatedDuration?: number; // in seconds
  actualDuration?: number; // in seconds
}

export interface ProcessingProgressProps {
  steps: ProcessingStep[];
  overallProgress: number; // 0-100
  status: ProcessingStepStatus;
  estimatedTimeRemaining?: number; // in seconds
  canCancel?: boolean;
  canRetry?: boolean;
  showSteps?: boolean;
  title?: string;
  description?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  className?: string;
}

export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  steps,
  overallProgress,
  status,
  estimatedTimeRemaining,
  canCancel = false,
  canRetry = false,
  showSteps = true,
  title = 'Processing Progress',
  description,
  onCancel,
  onRetry,
  onPause,
  onResume,
  className,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time for running operations
  useEffect(() => {
    if (status === 'running' && !isPaused) {
      const interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status, isPaused]);

  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <ClockIcon size={16} />,
          text: 'Pending',
          className: 'text-muted-foreground',
          message: 'Waiting for processing to start...',
        };
      case 'running':
        return {
          icon: <LoaderIcon size={16} />,
          text: 'Running',
          className: 'text-blue-600 dark:text-blue-400',
          message: 'Processing in progress...',
        };
      case 'completed':
        return {
          icon: <CheckCircleFillIcon size={16} />,
          text: 'Completed',
          className: 'text-green-600 dark:text-green-400',
          message: 'Processing completed successfully',
        };
      case 'error':
        return {
          icon: <WarningIcon size={16} />,
          text: 'Error',
          className: 'text-red-600 dark:text-red-400',
          message: 'Processing failed',
        };
      case 'cancelled':
        return {
          icon: <XIcon size={16} />,
          text: 'Cancelled',
          className: 'text-orange-600 dark:text-orange-400',
          message: 'Processing was cancelled',
        };
      default:
        return {
          icon: null,
          text: 'Unknown',
          className: 'text-muted-foreground',
          message: '',
        };
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const getStepStatusIcon = (stepStatus: ProcessingStepStatus) => {
    switch (stepStatus) {
      case 'pending':
        return <ClockIcon size={14} className="text-muted-foreground" />;
      case 'running':
        return <LoaderIcon size={14} />;
      case 'completed':
        return <CheckCircleFillIcon size={14} className="text-green-600" />;
      case 'error':
        return <WarningIcon size={14} className="text-red-600" />;
      case 'cancelled':
        return <XIcon size={14} className="text-orange-600" />;
      default:
        return null;
    }
  };

  const getStepStatusBadge = (stepStatus: ProcessingStepStatus) => {
    const baseClasses = 'text-xs px-2 py-1 rounded-full';
    switch (stepStatus) {
      case 'pending':
        return (
          <Badge variant="secondary" className={baseClasses}>
            pending
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="default" className={baseClasses}>
            running
          </Badge>
        );
      case 'completed':
        return (
          <Badge
            variant="default"
            className={cn(
              baseClasses,
              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            )}
          >
            completed
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className={baseClasses}>
            error
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge
            variant="secondary"
            className={cn(
              baseClasses,
              'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            )}
          >
            cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  const completedSteps = steps.filter(
    (step) => step.status === 'completed',
  ).length;
  const totalSteps = steps.length;

  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false);
      onResume?.();
    } else {
      setIsPaused(true);
      onPause?.();
    }
  };

  return (
    <Card className={cn('w-full', className)} data-testid="processing-progress">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {config.icon}
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn('text-sm', config.className)}
            >
              {config.text}
            </Badge>
            {status === 'running' && onPause && onResume && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePauseResume}
                className="h-8 w-8 p-0"
              >
                {isPaused ? <PlayIcon size={14} /> : <PauseIcon size={14} />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Overall Progress</span>
            <span className="text-muted-foreground">
              {overallProgress}% ({completedSteps}/{totalSteps} steps)
            </span>
          </div>
          <Progress value={overallProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">{config.message}</p>
        </div>

        {/* Time Information */}
        {(status === 'running' || status === 'completed') && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {elapsedTime > 0 && (
                <span className="text-muted-foreground">
                  Elapsed: {formatTime(elapsedTime)}
                </span>
              )}
              {estimatedTimeRemaining && status === 'running' && (
                <span className="text-muted-foreground">
                  Remaining: ~{formatTime(estimatedTimeRemaining)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Processing Steps */}
        {showSteps && steps.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Processing Steps</h4>
            <div className="space-y-2">
              <AnimatePresence>
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                      {getStepStatusIcon(step.status)}
                      <span className="text-sm font-medium truncate">
                        {step.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {step.progress !== undefined &&
                        step.status === 'running' && (
                          <div className="flex items-center gap-1">
                            <Progress
                              value={step.progress}
                              className="w-16 h-1"
                            />
                            <span className="text-xs text-muted-foreground w-8">
                              {step.progress}%
                            </span>
                          </div>
                        )}

                      {getStepStatusBadge(step.status)}

                      {step.actualDuration && (
                        <span className="text-xs text-muted-foreground">
                          Duration: {formatTime(step.actualDuration)}
                        </span>
                      )}
                    </div>

                    {step.error && (
                      <div className="mt-2 w-full">
                        <p className="text-xs text-red-600 dark:text-red-400">
                          Error: {step.error}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {canCancel && status === 'running' && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <XIcon size={14} className="mr-2" />
              Cancel
            </Button>
          )}

          {canRetry && status === 'error' && onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshIcon size={14} className="mr-2" />
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
