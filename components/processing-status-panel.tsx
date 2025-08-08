'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProcessingProgress } from './processing-progress';
import { useActiveProcessingStatuses } from '@/hooks/use-processing-status';
import { processingStatusService } from '@/lib/services/processing-status-service';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ChevronDownIcon, ChevronUpIcon, XIcon } from './icons';
import { cn } from '@/lib/utils';

export interface ProcessingStatusPanelProps {
  className?: string;
  maxHeight?: string;
  showCompleted?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number; // in milliseconds
}

export const ProcessingStatusPanel: React.FC<ProcessingStatusPanelProps> = ({
  className,
  maxHeight = '400px',
  showCompleted = false,
  autoHide = true,
  autoHideDelay = 5000,
}) => {
  const activeStatuses = useActiveProcessingStatuses();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Show panel when there are active statuses
  React.useEffect(() => {
    if (activeStatuses.length > 0) {
      setIsVisible(true);
      if (autoHide) {
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, autoHideDelay);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [activeStatuses.length, autoHide, autoHideDelay]);

  // Get all statuses for display
  const allStatuses = showCompleted
    ? processingStatusService.getAllStatuses()
    : activeStatuses;

  if (!isVisible || allStatuses.length === 0) {
    return null;
  }

  const handleCancelAll = () => {
    allStatuses.forEach((status) => {
      if (
        status.canCancel &&
        (status.status === 'pending' || status.status === 'running')
      ) {
        processingStatusService.cancelProcessing(status.id);
      }
    });
  };

  const getStatusTypeIcon = (type: string) => {
    switch (type) {
      case 'audio-processing':
        return '🎵';
      case 'ai-response':
        return '🤖';
      case 'file-upload':
        return '📁';
      case 'transcription':
        return '🎤';
      case 'analysis':
        return '📊';
      default:
        return '⚙️';
    }
  };

  const getStatusTypeLabel = (type: string) => {
    switch (type) {
      case 'audio-processing':
        return 'Audio Processing';
      case 'ai-response':
        return 'AI Response';
      case 'file-upload':
        return 'File Upload';
      case 'transcription':
        return 'Transcription';
      case 'analysis':
        return 'Analysis';
      default:
        return 'Processing';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn('fixed bottom-4 right-4 z-50 w-96', className)}
    >
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">Processing Tasks</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {activeStatuses.length} active
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              {activeStatuses.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelAll}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <XIcon size={14} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <ChevronDownIcon size={14} />
                ) : (
                  <ChevronUpIcon size={14} />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div
            className={cn(
              'space-y-3 overflow-hidden transition-all duration-300',
              isExpanded ? 'max-h-none' : `max-h-${maxHeight} overflow-y-auto`,
            )}
          >
            <AnimatePresence>
              {allStatuses.map((status) => (
                <motion.div
                  key={status.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border rounded-lg p-3 bg-card"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">
                      {getStatusTypeIcon(status.type)}
                    </span>
                    <span className="text-sm font-medium">
                      {getStatusTypeLabel(status.type)}
                    </span>
                    {status.metadata?.audioFileName && (
                      <span className="text-xs text-muted-foreground truncate">
                        - {status.metadata.audioFileName}
                      </span>
                    )}
                  </div>

                  <ProcessingProgress
                    steps={status.steps}
                    overallProgress={status.overallProgress}
                    status={status.status}
                    estimatedTimeRemaining={status.estimatedTimeRemaining}
                    canCancel={status.canCancel}
                    canRetry={status.canRetry}
                    showSteps={isExpanded}
                    title=""
                    onCancel={() =>
                      processingStatusService.cancelProcessing(status.id)
                    }
                    onRetry={() =>
                      processingStatusService.retryProcessing(status.id)
                    }
                    className="border-0 shadow-none p-0"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
