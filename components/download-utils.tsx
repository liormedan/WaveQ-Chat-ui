'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  DownloadIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LoaderIcon,
  FileIcon,
  ArchiveIcon,
} from './icons';
import { cn } from '@/lib/utils';

export interface DownloadInfo {
  id: string;
  originalName: string;
  generatedName: string;
  filename: string;
  url: string;
  metadata: {
    format: string;
    bitrate: number;
    sampleRate: number;
    channels: number;
    duration: number;
    fileSize: number;
    processingType: string;
    processingTime: number;
    qualityMetrics?: any;
  };
}

export interface DownloadOptions {
  format: 'mp3' | 'wav' | 'flac' | 'm4a' | 'ogg';
  includeMetadata: boolean;
  batchDownload: boolean;
}

interface DownloadUtilsProps {
  chatId: string;
  audioIds: string[];
  onDownloadComplete?: (downloadInfo: DownloadInfo[]) => void;
  onDownloadError?: (error: string) => void;
  className?: string;
}

export function DownloadUtils({
  chatId,
  audioIds,
  onDownloadComplete,
  onDownloadError,
  className,
}: DownloadUtilsProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<
    'idle' | 'preparing' | 'downloading' | 'complete' | 'error'
  >('idle');
  const [selectedFormat, setSelectedFormat] = useState<
    'mp3' | 'wav' | 'flac' | 'm4a' | 'ogg'
  >('mp3');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [batchDownload, setBatchDownload] = useState(false);

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

  const handleDownload = async () => {
    if (audioIds.length === 0) {
      onDownloadError?.('No audio files selected');
      return;
    }

    setIsDownloading(true);
    setDownloadStatus('preparing');
    setDownloadProgress(0);

    try {
      // Prepare download request
      const response = await fetch(
        `/api/chat/${chatId}/generated-audios/download`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audioIds,
            format: selectedFormat,
            batch: batchDownload && audioIds.length > 1,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to prepare download');
      }

      const data = await response.json();
      setDownloadStatus('downloading');
      setDownloadProgress(50);

      if (data.type === 'batch') {
        // Handle batch download
        await handleBatchDownload(data.data);
      } else {
        // Handle single file download
        await handleSingleDownload(data.data);
      }

      setDownloadProgress(100);
      setDownloadStatus('complete');
      onDownloadComplete?.(data.data);

      // Reset after a delay
      setTimeout(() => {
        setDownloadStatus('idle');
        setDownloadProgress(0);
      }, 2000);
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus('error');
      onDownloadError?.(
        error instanceof Error ? error.message : 'Download failed',
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSingleDownload = async (downloadInfo: DownloadInfo) => {
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = downloadInfo.url;
    link.download = downloadInfo.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBatchDownload = async (downloadData: DownloadInfo[]) => {
    // For batch downloads, we'll create a ZIP file
    // In a real implementation, you would use a library like JSZip
    // For now, we'll download files individually
    for (let i = 0; i < downloadData.length; i++) {
      const downloadInfo = downloadData[i];
      await handleSingleDownload(downloadInfo);

      // Update progress
      const progress = 50 + ((i + 1) / downloadData.length) * 50;
      setDownloadProgress(progress);

      // Small delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  const getStatusIcon = () => {
    switch (downloadStatus) {
      case 'preparing':
        return <LoaderIcon size={16} className="animate-spin" />;
      case 'downloading':
        return <LoaderIcon size={16} className="animate-spin" />;
      case 'complete':
        return <CheckCircleIcon size={16} className="text-green-500" />;
      case 'error':
        return <AlertCircleIcon size={16} className="text-red-500" />;
      default:
        return <DownloadIcon size={16} />;
    }
  };

  const getStatusText = () => {
    switch (downloadStatus) {
      case 'preparing':
        return 'Preparing download...';
      case 'downloading':
        return 'Downloading...';
      case 'complete':
        return 'Download complete!';
      case 'error':
        return 'Download failed';
      default:
        return `Download ${audioIds.length} file${audioIds.length > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Download Options */}
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="format-select" className="text-sm font-medium">
              Format:
            </label>
            <select
              id="format-select"
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as any)}
              className="text-sm border rounded px-2 py-1"
              disabled={isDownloading}
            >
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
              <option value="flac">FLAC</option>
              <option value="m4a">M4A</option>
              <option value="ogg">OGG</option>
            </select>
          </div>

          {audioIds.length > 1 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="batch-download"
                checked={batchDownload}
                onChange={(e) => setBatchDownload(e.target.checked)}
                disabled={isDownloading}
                className="rounded"
              />
              <label htmlFor="batch-download" className="text-sm">
                Batch download
              </label>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="include-metadata"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
              disabled={isDownloading}
              className="rounded"
            />
            <label htmlFor="include-metadata" className="text-sm">
              Include metadata
            </label>
          </div>
        </div>

        {/* File Info */}
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <FileIcon size={12} />
            <span>
              {audioIds.length} file{audioIds.length > 1 ? 's' : ''} selected
            </span>
            {batchDownload && audioIds.length > 1 && (
              <>
                <span>•</span>
                <ArchiveIcon size={12} />
                <span>Will be packaged as ZIP</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Download Button */}
      <Button
        onClick={handleDownload}
        disabled={isDownloading || audioIds.length === 0}
        className="w-full"
      >
        {getStatusIcon()}
        <span className="ml-2">{getStatusText()}</span>
      </Button>

      {/* Progress Bar */}
      {isDownloading && (
        <div className="space-y-2">
          <Progress value={downloadProgress} className="h-2" />
          <div className="text-xs text-muted-foreground text-center">
            {downloadProgress.toFixed(0)}% complete
          </div>
        </div>
      )}

      {/* Status Messages */}
      {downloadStatus === 'complete' && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircleIcon size={14} />
          <span>Download completed successfully!</span>
        </div>
      )}

      {downloadStatus === 'error' && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircleIcon size={14} />
          <span>Download failed. Please try again.</span>
        </div>
      )}
    </div>
  );
}

// Utility function for downloading a single file
export async function downloadSingleFile(
  chatId: string,
  audioId: string,
  format = 'mp3',
): Promise<void> {
  try {
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
    link.download = `audio_${audioId}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

// Utility function for batch downloading
export async function downloadBatchFiles(
  chatId: string,
  audioIds: string[],
  format = 'mp3',
): Promise<void> {
  try {
    const response = await fetch(
      `/api/chat/${chatId}/generated-audios/download`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioIds,
          format,
          batch: true,
        }),
      },
    );

    if (!response.ok) {
      throw new Error('Batch download failed');
    }

    const data = await response.json();

    // Download each file individually
    for (const downloadInfo of data.data) {
      await downloadSingleFile(chatId, downloadInfo.id, format);
      // Small delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.error('Batch download error:', error);
    throw error;
  }
}
