'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  DownloadIcon,
  ArchiveIcon,
  FileIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  InfoIcon,
  XIcon,
  PlayIcon,
  PauseIcon,
} from './icons';
import { cn } from '@/lib/utils';
import { DownloadUtils, type DownloadInfo } from './download-utils';
import { BatchDownloadPanel } from './batch-download-panel';
import type { GeneratedAudioFile } from './generated-audio-display';

interface DownloadTask {
  id: string;
  filename: string;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  progress: number;
  error?: string;
  startTime: Date;
  endTime?: Date;
  fileSize?: number;
}

interface DownloadManagerProps {
  chatId: string;
  generatedAudios: GeneratedAudioFile[];
  onDownloadComplete?: (downloadInfo: DownloadInfo[]) => void;
  onDownloadError?: (error: string) => void;
  className?: string;
}

export function DownloadManager({
  chatId,
  generatedAudios,
  onDownloadComplete,
  onDownloadError,
  className,
}: DownloadManagerProps) {
  const [isBatchPanelOpen, setIsBatchPanelOpen] = useState(false);
  const [downloadTasks, setDownloadTasks] = useState<DownloadTask[]>([]);
  const [activeDownloads, setActiveDownloads] = useState<Set<string>>(
    new Set(),
  );

  const handleSingleDownload = async (audioId: string, format: string) => {
    const taskId = `${audioId}-${format}`;
    const audio = generatedAudios.find((a) => a.id === audioId);
    if (!audio) return;

    const filename = `${audio.generatedAudioName}.${format}`;

    setActiveDownloads((prev) => new Set(prev).add(taskId));
    setDownloadTasks((prev) => [
      ...prev,
      {
        id: taskId,
        filename,
        status: 'pending',
        progress: 0,
        startTime: new Date(),
      },
    ]);

    let progressInterval: NodeJS.Timeout | undefined;

    try {
      // Update status to downloading
      setDownloadTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? { ...task, status: 'downloading' as const }
            : task,
        ),
      );

      // Simulate download progress
      progressInterval = setInterval(() => {
        setDownloadTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? { ...task, progress: Math.min(task.progress + 10, 90) }
              : task,
          ),
        );
      }, 200);

      // Perform actual download
      const response = await fetch(
        `/api/chat/${chatId}/generated-audios/download?audioId=${audioId}&format=${format}`,
      );

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      if (progressInterval) {
        clearInterval(progressInterval);
      }

      // Mark as completed
      setDownloadTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: 'completed',
                progress: 100,
                endTime: new Date(),
              }
            : task,
        ),
      );

      onDownloadComplete?.([
        {
          id: audioId,
          originalName: audio.originalAudioName,
          generatedName: audio.generatedAudioName,
          filename,
          url: audio.generatedAudioUrl,
          metadata: {
            format: audio.metadata.format,
            bitrate: audio.metadata.bitrate,
            sampleRate: audio.metadata.sampleRate,
            channels: audio.metadata.channels,
            duration: audio.metadata.duration,
            fileSize: audio.metadata.fileSize,
            processingType: audio.processingDetails.processingType,
            processingTime: audio.processingDetails.totalProcessingTime,
            qualityMetrics: audio.processingDetails.qualityMetrics,
          },
        },
      ]);
    } catch (error) {
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      setDownloadTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: 'error',
                error:
                  error instanceof Error ? error.message : 'Download failed',
                endTime: new Date(),
              }
            : task,
        ),
      );

      onDownloadError?.(
        error instanceof Error ? error.message : 'Download failed',
      );
    } finally {
      setActiveDownloads((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const handleBatchDownload = (downloadInfo: DownloadInfo[]) => {
    onDownloadComplete?.(downloadInfo);
    setIsBatchPanelOpen(false);
  };

  const handleBatchDownloadError = (error: string) => {
    onDownloadError?.(error);
  };

  const removeTask = (taskId: string) => {
    setDownloadTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const getStatusIcon = (status: DownloadTask['status']) => {
    switch (status) {
      case 'pending':
        return <ClockIcon size={16} />;
      case 'downloading':
        return <DownloadIcon size={16} />;
      case 'completed':
        return <CheckCircleIcon size={16} />;
      case 'error':
        return <AlertCircleIcon size={16} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const completedTasks = downloadTasks.filter(
    (task) => task.status === 'completed',
  );
  const activeTaskCount = activeDownloads.size;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Download Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsBatchPanelOpen(true)}
          disabled={generatedAudios.length === 0}
        >
          <ArchiveIcon size={16} />
          Batch Download
          <Badge variant="secondary" className="ml-2">
            {generatedAudios.length}
          </Badge>
        </Button>

        {activeTaskCount > 0 && (
          <Badge variant="outline" className="text-xs">
            {activeTaskCount} downloading
          </Badge>
        )}
      </div>

      {/* Download History */}
      {downloadTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DownloadIcon size={16} />
                <CardTitle className="text-sm font-medium">
                  Download History
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {completedTasks.length} completed
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDownloadTasks([])}
                className="h-6 w-6 p-0"
              >
                <XIcon size={14} />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="max-h-40 overflow-y-auto space-y-2">
              {downloadTasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg border',
                    task.status === 'completed' &&
                      'bg-green-50 border-green-200',
                    task.status === 'error' && 'bg-red-50 border-red-200',
                    task.status === 'downloading' &&
                      'bg-blue-50 border-blue-200',
                  )}
                >
                  {getStatusIcon(task.status)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileIcon size={12} />
                      <span className="text-sm font-medium truncate">
                        {task.filename}
                      </span>
                    </div>

                    {task.status === 'downloading' && (
                      <Progress value={task.progress} className="h-1" />
                    )}

                    {task.status === 'error' && task.error && (
                      <p className="text-xs text-red-600">{task.error}</p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTask(task.id)}
                    className="h-6 w-6 p-0"
                  >
                    <XIcon size={12} />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batch Download Panel */}
      <BatchDownloadPanel
        chatId={chatId}
        generatedAudios={generatedAudios}
        isOpen={isBatchPanelOpen}
        onClose={() => setIsBatchPanelOpen(false)}
        onDownloadComplete={handleBatchDownload}
        onDownloadError={handleBatchDownloadError}
      />
    </div>
  );
}
