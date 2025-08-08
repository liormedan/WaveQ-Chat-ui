'use client';

import { useState } from 'react';
import { AudioIcon, PlayIcon, PauseIcon } from './icons';
import { cn } from '@/lib/utils';

interface AudioPreviewProps {
  audioFileName: string;
  audioFileUrl: string;
  audioFileType: string;
  audioDuration?: number | null;
  contextSummary?: string | null;
  className?: string;
  compact?: boolean;
}

export function AudioPreview({
  audioFileName,
  audioFileUrl,
  audioFileType,
  audioDuration,
  contextSummary,
  className,
  compact = false,
}: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio(audioFileUrl);
      audio.addEventListener('ended', () => setIsPlaying(false));
      return audio;
    }
    return null;
  });

  const togglePlay = () => {
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-2 bg-muted rounded-md',
          className,
        )}
      >
        <button
          type="button"
          onClick={togglePlay}
          className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {isPlaying ? <PauseIcon size={12} /> : <PlayIcon size={12} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{audioFileName}</div>
          {audioDuration && (
            <div className="text-xs text-muted-foreground">
              {formatDuration(audioDuration)}
            </div>
          )}
        </div>
        <div className="text-muted-foreground flex-shrink-0">
          <AudioIcon size={16} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('flex flex-col gap-2 p-3 bg-muted rounded-lg', className)}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{audioFileName}</div>
          <div className="text-xs text-muted-foreground">
            {audioFileType}{' '}
            {audioDuration && `• ${formatDuration(audioDuration)}`}
          </div>
        </div>
        <div className="text-muted-foreground flex-shrink-0">
          <AudioIcon size={20} />
        </div>
      </div>

      {contextSummary && (
        <div className="text-xs text-muted-foreground line-clamp-2">
          {contextSummary}
        </div>
      )}
    </div>
  );
}
