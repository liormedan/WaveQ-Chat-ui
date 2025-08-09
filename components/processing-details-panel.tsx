'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import {
  ClockIcon,
  CheckCircleIcon,
  LoaderIcon,
  AlertCircleIcon,
  InfoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlayIcon,
  PauseIcon,
} from './icons';
import { cn } from '@/lib/utils';

interface ProcessingStep {
  id: string;
  name: string;
  status: 'completed' | 'running' | 'error' | 'pending';
  duration: number;
  details?: string;
  progress?: number;
  startTime?: Date;
  endTime?: Date;
}

interface ProcessingDetailsPanelProps {
  processingType:
    | 'enhancement'
    | 'transcription'
    | 'translation'
    | 'noise-reduction'
    | 'format-conversion';
  processingSteps: ProcessingStep[];
  totalProcessingTime: number;
  qualityMetrics?: {
    signalToNoiseRatio?: number;
    clarityScore?: number;
    fidelityScore?: number;
  };
  isActive?: boolean;
  className?: string;
  onCancel?: () => void;
  onRetry?: () => void;
}

export const ProcessingDetailsPanel: React.FC<ProcessingDetailsPanelProps> = ({
  processingType,
  processingSteps,
  totalProcessingTime,
  qualityMetrics,
  isActive = false,
  className,
  onCancel,
  onRetry,
}) => {
  const [isExpanded, setIsExpanded] = useState(isActive);

  const getProcessingTypeLabel = (type: string) => {
    const labels = {
      enhancement: 'Audio Enhancement',
      transcription: 'Speech Transcription',
      translation: 'Audio Translation',
      'noise-reduction': 'Noise Reduction',
      'format-conversion': 'Format Conversion',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="text-green-600">
            <CheckCircleIcon size={14} />
          </div>
        );
      case 'running':
        return (
          <div className="text-blue-600 animate-spin">
            <LoaderIcon size={14} />
          </div>
        );
      case 'error':
        return (
          <div className="text-red-600">
            <AlertCircleIcon size={14} />
          </div>
        );
      case 'pending':
        return (
          <div className="text-gray-400">
            <ClockIcon size={14} />
          </div>
        );
      default:
        return (
          <div className="text-gray-400">
            <ClockIcon size={14} />
          </div>
        );
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'running':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      case 'pending':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getOverallProgress = () => {
    const completedSteps = processingSteps.filter(
      (step) => step.status === 'completed',
    ).length;
    const runningSteps = processingSteps.filter(
      (step) => step.status === 'running',
    );

    let progress = (completedSteps / processingSteps.length) * 100;

    // Add partial progress for running steps
    if (runningSteps.length > 0) {
      const runningProgress = runningSteps.reduce(
        (sum, step) => sum + (step.progress || 0),
        0,
      );
      progress +=
        (runningProgress / runningSteps.length / processingSteps.length) * 100;
    }

    return Math.min(progress, 100);
  };

  const getOverallStatus = () => {
    if (processingSteps.some((step) => step.status === 'error')) return 'error';
    if (processingSteps.some((step) => step.status === 'running'))
      return 'running';
    if (processingSteps.every((step) => step.status === 'completed'))
      return 'completed';
    return 'pending';
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
  };

  const formatTime = (date?: Date) => {
    if (!date) return 'Unknown';
    return date.toLocaleTimeString();
  };

  const overallStatus = getOverallStatus();
  const overallProgress = getOverallProgress();

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStepStatusIcon(overallStatus)}
            <CardTitle className="text-sm font-medium">
              {getProcessingTypeLabel(processingType)}
            </CardTitle>
            <Badge
              variant={overallStatus === 'completed' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {overallStatus === 'completed' &&
                `Completed in ${formatDuration(totalProcessingTime)}`}
              {overallStatus === 'running' && 'Processing...'}
              {overallStatus === 'error' && 'Error'}
              {overallStatus === 'pending' && 'Pending'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {overallStatus === 'running' && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="h-6 px-2 text-xs"
              >
                Cancel
              </Button>
            )}
            {overallStatus === 'error' && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-6 px-2 text-xs"
              >
                Retry
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronUpIcon size={14} />
              ) : (
                <ChevronDownIcon size={14} />
              )}
            </Button>
          </div>
        </div>

        {/* Overall Progress */}
        {(overallStatus === 'running' || overallStatus === 'error') && (
          <div className="space-y-2">
            <Progress value={overallProgress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(overallProgress)}% complete</span>
              <span>
                {processingSteps.filter((s) => s.status === 'completed').length}{' '}
                of {processingSteps.length} steps
              </span>
            </div>
          </div>
        )}
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <CardContent className="space-y-4">
              {/* Processing Steps */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <InfoIcon size={14} />
                  Processing Steps
                </h4>
                <div className="space-y-2">
                  {processingSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getStepStatusIcon(step.status)}
                        <span className="text-sm truncate">{step.name}</span>
                        {step.status === 'running' && step.progress && (
                          <Badge variant="outline" className="text-xs">
                            {Math.round(step.progress)}%
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {step.status === 'completed' && (
                          <span>{formatDuration(step.duration)}</span>
                        )}
                        {step.startTime && (
                          <span>{formatTime(step.startTime)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quality Metrics */}
              {qualityMetrics && overallStatus === 'completed' && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Quality Metrics</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {qualityMetrics.signalToNoiseRatio && (
                        <div className="text-center">
                          <div className="text-xs font-medium mb-1">SNR</div>
                          <Badge variant="outline" className="text-xs">
                            {qualityMetrics.signalToNoiseRatio.toFixed(1)} dB
                          </Badge>
                        </div>
                      )}
                      {qualityMetrics.clarityScore && (
                        <div className="text-center">
                          <div className="text-xs font-medium mb-1">
                            Clarity
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {qualityMetrics.clarityScore.toFixed(1)}/10
                          </Badge>
                        </div>
                      )}
                      {qualityMetrics.fidelityScore && (
                        <div className="text-center">
                          <div className="text-xs font-medium mb-1">
                            Fidelity
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {qualityMetrics.fidelityScore.toFixed(1)}/10
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Processing Summary */}
              {overallStatus === 'completed' && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Processing Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">
                          Total Time:
                        </span>
                        <span className="ml-1 font-medium">
                          {formatDuration(totalProcessingTime)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Steps:</span>
                        <span className="ml-1 font-medium">
                          {processingSteps.length}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Success Rate:
                        </span>
                        <span className="ml-1 font-medium">
                          {Math.round(
                            (processingSteps.filter(
                              (s) => s.status === 'completed',
                            ).length /
                              processingSteps.length) *
                              100,
                          )}
                          %
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Avg Step Time:
                        </span>
                        <span className="ml-1 font-medium">
                          {formatDuration(
                            totalProcessingTime / processingSteps.length,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
