'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  HistoryIcon,
  TrashIcon,
  DownloadIcon,
  ChartIcon,
  FilterIcon,
  CalendarIcon,
  FileIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  InfoIcon,
  RefreshIcon,
} from './icons';
import { cn } from '@/lib/utils';
import type { GeneratedAudioFile } from './generated-audio-display';

interface ProcessingHistoryItem {
  id: string;
  originalAudioName: string;
  generatedAudioName: string;
  processingType: string;
  totalProcessingTime: number;
  createdAt: Date;
  metadata: any;
  qualityMetrics?: any;
}

interface ProcessingStats {
  overall: {
    totalProcessed: number;
    totalProcessingTime: number;
    averageProcessingTime: number;
    processingTypes: string[];
    recentActivity: number;
  };
  byType: Array<{
    processingType: string;
    count: number;
    avgTime: number;
  }>;
}

interface ProcessingPerformance {
  date: string;
  count: number;
  avgProcessingTime: number;
  totalProcessingTime: number;
}

interface StorageUsage {
  totalFiles: number;
  totalSize: number;
  avgFileSize: number;
  oldestFile: Date | null;
  newestFile: Date | null;
}

interface ProcessingHistoryManagerProps {
  chatId: string;
  onRedownload?: (audioId: string, format: string) => void;
  onCleanup?: (result: any) => void;
  className?: string;
}

export function ProcessingHistoryManager({
  chatId,
  onRedownload,
  onCleanup,
  className,
}: ProcessingHistoryManagerProps) {
  const [history, setHistory] = useState<ProcessingHistoryItem[]>([]);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [performance, setPerformance] = useState<ProcessingPerformance[]>([]);
  const [storage, setStorage] = useState<StorageUsage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    processingType: '',
    status: '',
    dateRange: null as { start: Date; end: Date } | null,
  });
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    hasMore: false,
    totalCount: 0,
  });
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupParams, setCleanupParams] = useState({
    olderThanDays: 30,
    keepCount: 10,
    dryRun: true,
  });

  const fetchHistory = async (reset = false) => {
    if (!chatId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: reset ? '0' : pagination.offset.toString(),
        includeStats: 'true',
        includePerformance: 'true',
        includeStorage: 'true',
        timeRange: '30d',
      });

      if (filters.processingType) {
        params.append('processingType', filters.processingType);
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.dateRange) {
        params.append('startDate', filters.dateRange.start.toISOString());
        params.append('endDate', filters.dateRange.end.toISOString());
      }

      const response = await fetch(
        `/api/chat/${chatId}/processing-history?${params}`,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch processing history');
      }

      const data = await response.json();

      if (data.success) {
        const newHistory = data.history.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        }));

        setHistory(reset ? newHistory : [...history, ...newHistory]);
        setPagination({
          ...pagination,
          offset: reset
            ? pagination.limit
            : pagination.offset + pagination.limit,
          hasMore: data.pagination.hasMore,
          totalCount: data.pagination.totalCount,
        });

        if (data.stats) {
          setStats(data.stats);
        }
        if (data.performance) {
          setPerformance(data.performance);
        }
        if (data.storage) {
          setStorage(data.storage);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch processing history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(true);
  }, [chatId, filters]);

  const handleRedownload = async (audioId: string, format: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/redownload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioId,
          format,
          messageId: `redownload_${Date.now()}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to re-download file');
      }

      const data = await response.json();

      if (data.success) {
        // Trigger actual download
        const downloadResponse = await fetch(
          `/api/chat/${chatId}/redownload?audioId=${audioId}&format=${format}`,
        );

        if (downloadResponse.ok) {
          const blob = await downloadResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = data.downloadInfo.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }

        onRedownload?.(audioId, format);
      }
    } catch (error) {
      console.error('Re-download error:', error);
      setError(error instanceof Error ? error.message : 'Re-download failed');
    }
  };

  const handleCleanup = async () => {
    try {
      const response = await fetch(`/api/chat/${chatId}/cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanupParams),
      });

      if (!response.ok) {
        throw new Error('Failed to cleanup files');
      }

      const data = await response.json();

      if (data.success) {
        onCleanup?.(data.cleanup);
        setShowCleanupModal(false);

        // Refresh history after cleanup
        fetchHistory(true);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      setError(error instanceof Error ? error.message : 'Cleanup failed');
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

  const getStatusIcon = (item: ProcessingHistoryItem) => {
    const hasErrors = item.qualityMetrics?.error || false;
    const isCompleted = item.totalProcessingTime > 0;

    if (hasErrors) {
      return <AlertTriangleIcon size={16} />;
    } else if (isCompleted) {
      return <CheckCircleIcon size={16} />;
    } else {
      return <ClockIcon size={16} />;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HistoryIcon size={20} />
          <h2 className="text-xl font-semibold">Processing History</h2>
          <Badge variant="secondary">{pagination.totalCount} files</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchHistory(true)}
            disabled={isLoading}
          >
            <RefreshIcon size={16} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCleanupModal(true)}
          >
            <TrashIcon size={16} />
            Cleanup
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileIcon size={16} className="text-primary" />
                <span className="text-sm font-medium">Total Processed</span>
              </div>
              <div className="text-2xl font-bold mt-2">
                {stats.overall.totalProcessed}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ClockIcon size={16} className="text-primary" />
                <span className="text-sm font-medium">Avg Processing Time</span>
              </div>
              <div className="text-2xl font-bold mt-2">
                {formatDuration(stats.overall.averageProcessingTime)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ChartIcon size={16} className="text-primary" />
                <span className="text-sm font-medium">Recent Activity</span>
              </div>
              <div className="text-2xl font-bold mt-2">
                {stats.overall.recentActivity}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <InfoIcon size={16} className="text-primary" />
                <span className="text-sm font-medium">Storage Used</span>
              </div>
              <div className="text-2xl font-bold mt-2">
                {storage ? formatFileSize(storage.totalSize) : '0 B'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FilterIcon size={16} className="text-primary" />
            <CardTitle className="text-sm font-medium">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="processing-type" className="text-sm">
                Type:
              </label>
              <select
                id="processing-type"
                value={filters.processingType}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    processingType: e.target.value,
                  }))
                }
                className="text-sm border rounded px-2 py-1"
              >
                <option value="">All Types</option>
                <option value="enhancement">Enhancement</option>
                <option value="transcription">Transcription</option>
                <option value="translation">Translation</option>
                <option value="noise-reduction">Noise Reduction</option>
                <option value="format-conversion">Format Conversion</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="processing-status" className="text-sm">
                Status:
              </label>
              <select
                id="processing-status"
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="text-sm border rounded px-2 py-1"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="error">Error</option>
                <option value="processing">Processing</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Processing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 mb-4">
              <AlertTriangleIcon size={14} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50"
              >
                {getStatusIcon(item)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium truncate">
                      {item.generatedAudioName}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {getProcessingTypeLabel(item.processingType)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Original: {item.originalAudioName}</span>
                    <span>•</span>
                    <span>
                      Time: {formatDuration(item.totalProcessingTime)}
                    </span>
                    <span>•</span>
                    <span>Created: {item.createdAt.toLocaleDateString()}</span>
                    {item.metadata?.fileSize && (
                      <>
                        <span>•</span>
                        <span>
                          Size: {formatFileSize(item.metadata.fileSize)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRedownload(item.id, 'mp3')}
                    className="h-8 w-8 p-0"
                  >
                    <DownloadIcon size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            </div>
          )}

          {pagination.hasMore && !isLoading && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchHistory(false)}
                disabled={isLoading}
              >
                Load More
              </Button>
            </div>
          )}

          {history.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <HistoryIcon size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No processing history found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cleanup Modal */}
      <AnimatePresence>
        {showCleanupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCleanupModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-lg shadow-lg max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrashIcon size={20} className="text-primary" />
                  <CardTitle>Cleanup Old Files</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="older-than-days"
                      className="text-sm font-medium"
                    >
                      Delete files older than:
                    </label>
                    <input
                      id="older-than-days"
                      type="number"
                      min="1"
                      max="365"
                      value={cleanupParams.olderThanDays}
                      onChange={(e) =>
                        setCleanupParams((prev) => ({
                          ...prev,
                          olderThanDays: Number.parseInt(e.target.value, 10),
                        }))
                      }
                      className="w-full mt-1 text-sm border rounded px-2 py-1"
                    />
                    <span className="text-xs text-muted-foreground">days</span>
                  </div>

                  <div>
                    <label htmlFor="keep-count" className="text-sm font-medium">
                      Keep at least:
                    </label>
                    <input
                      id="keep-count"
                      type="number"
                      min="1"
                      max="100"
                      value={cleanupParams.keepCount}
                      onChange={(e) =>
                        setCleanupParams((prev) => ({
                          ...prev,
                          keepCount: Number.parseInt(e.target.value, 10),
                        }))
                      }
                      className="w-full mt-1 text-sm border rounded px-2 py-1"
                    />
                    <span className="text-xs text-muted-foreground">
                      most recent files
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="dry-run"
                      checked={cleanupParams.dryRun}
                      onChange={(e) =>
                        setCleanupParams((prev) => ({
                          ...prev,
                          dryRun: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <label htmlFor="dry-run" className="text-sm">
                      Dry run (preview what would be deleted)
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCleanupModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCleanup} disabled={isLoading}>
                    {cleanupParams.dryRun ? 'Preview' : 'Cleanup'}
                  </Button>
                </div>
              </CardContent>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
