'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { PlayIcon, PauseIcon, VolumeIcon, MuteIcon, AudioIcon } from './icons';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
}

export const AudioPlayer = ({ src, title, className }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      setError(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError('Failed to load audio file');
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.error('Error playing audio:', err);
        setError('Failed to play audio');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progress = progressRef.current;
    if (!audio || !progress) return;

    const rect = progress.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = Number.parseFloat(e.target.value);
    setVolume(newVolume);
    audio.volume = newVolume;

    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-3 bg-destructive/10 rounded-lg',
          className,
        )}
      >
        <AudioIcon size={16} />
        <span className="text-sm text-destructive">Error: {error}</span>
      </div>
    );
  }

  return (
    <div
      data-testid="audio-player"
      className={cn(
        'flex flex-col gap-3 p-4 bg-muted/50 rounded-lg',
        className,
      )}
    >
      {/* Audio Info */}
      <div className="flex items-center gap-2">
        <AudioIcon size={16} className="text-muted-foreground" />
        <span className="text-sm font-medium truncate">
          {title || 'Audio File'}
        </span>
      </div>

      {/* Main Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePlayPause}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
          ) : isPlaying ? (
            <PauseIcon size={16} />
          ) : (
            <PlayIcon size={16} />
          )}
        </Button>

        {/* Progress Bar */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-8">
            {formatTime(currentTime)}
          </span>

          <div
            ref={progressRef}
            className="flex-1 h-2 bg-muted rounded-full cursor-pointer relative"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-primary rounded-full transition-all duration-150"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <span className="text-xs text-muted-foreground w-8">
            {formatTime(duration)}
          </span>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="h-6 w-6 p-0"
          >
            {isMuted ? <MuteIcon size={14} /> : <VolumeIcon size={14} />}
          </Button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-12 h-1 bg-muted rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
};
