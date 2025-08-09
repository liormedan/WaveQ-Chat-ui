'use client';

import React, { useState } from 'react';
import { AudioPlayer } from './audio-player';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  PlayIcon, 
  PauseIcon, 
  DownloadIcon, 
  ShareIcon, 
  MoreHorizontalIcon,
  WaveformIcon 
} from './icons';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface AudioPlayerWithControlsProps {
  src: string;
  title?: string;
  className?: string;
  showControls?: boolean;
  showWaveform?: boolean;
  onDownload?: () => void;
  onShare?: () => void;
  metadata?: {
    duration?: number;
    fileSize?: number;
    format?: string;
    bitrate?: number;
  };
}

export const AudioPlayerWithControls: React.FC<AudioPlayerWithControlsProps> = ({
  src,
  title,
  className,
  showControls = true,
  showWaveform = false,
  onDownload,
  onShare,
  metadata,
}) => {
  const [showMetadata, setShowMetadata] = useState(false);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown duration';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main Audio Player */}
      <AudioPlayer
        src={src}
        title={title}
        className="w-full"
      />

      {/* Controls and Metadata */}
      {showControls && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {metadata && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {metadata.format?.toUpperCase() || 'AUDIO'}
                </Badge>
                {metadata.duration && (
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(metadata.duration)}
                  </span>
                )}
                {metadata.fileSize && (
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(metadata.fileSize)}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {showWaveform && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                title="Show waveform"
              >
                <WaveformIcon size={14} />
              </Button>
            )}

            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                className="h-6 w-6 p-0"
                title="Download audio"
              >
                <DownloadIcon size={14} />
              </Button>
            )}

            {onShare && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onShare}
                className="h-6 w-6 p-0"
                title="Share audio"
              >
                <ShareIcon size={14} />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <MoreHorizontalIcon size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowMetadata(!showMetadata)}>
                  {showMetadata ? 'Hide' : 'Show'} metadata
                </DropdownMenuItem>
                {onDownload && (
                  <DropdownMenuItem onClick={onDownload}>
                    Download audio
                  </DropdownMenuItem>
                )}
                {onShare && (
                  <DropdownMenuItem onClick={onShare}>
                    Share audio
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Extended Metadata */}
      {showMetadata && metadata && (
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <h4 className="text-sm font-medium">Audio Metadata</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {metadata.format && (
              <div>
                <span className="text-muted-foreground">Format:</span>
                <span className="ml-1 font-medium">{metadata.format.toUpperCase()}</span>
              </div>
            )}
            {metadata.bitrate && (
              <div>
                <span className="text-muted-foreground">Bitrate:</span>
                <span className="ml-1 font-medium">{metadata.bitrate} kbps</span>
              </div>
            )}
            {metadata.duration && (
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <span className="ml-1 font-medium">{formatDuration(metadata.duration)}</span>
              </div>
            )}
            {metadata.fileSize && (
              <div>
                <span className="text-muted-foreground">File Size:</span>
                <span className="ml-1 font-medium">{formatFileSize(metadata.fileSize)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};