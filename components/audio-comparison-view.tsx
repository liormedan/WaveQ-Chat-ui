'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AudioPlayerWithControls } from './audio-player-with-controls';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  PlayIcon,
  PauseIcon,
  SyncIcon,
  CompareIcon,
  VolumeIcon,
  AudioIcon,
} from './icons';
import { cn } from '@/lib/utils';

interface AudioComparisonViewProps {
  originalAudio: {
    url: string;
    name: string;
    metadata?: {
      format?: string;
      duration?: number;
      fileSize?: number;
      bitrate?: number;
    };
  };
  generatedAudio: {
    url: string;
    name: string;
    metadata: {
      format: string;
      duration: number;
      fileSize: number;
      bitrate: number;
    };
  };
  processingType: string;
  qualityMetrics?: {
    signalToNoiseRatio?: number;
    clarityScore?: number;
    fidelityScore?: number;
  };
  className?: string;
  onClose?: () => void;
}

export const AudioComparisonView: React.FC<AudioComparisonViewProps> = ({
  originalAudio,
  generatedAudio,
  processingType,
  qualityMetrics,
  className,
  onClose,
}) => {
  const [syncPlayback, setSyncPlayback] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showMetrics, setShowMetrics] = useState(false);

  const originalPlayerRef = useRef<HTMLAudioElement>(null);
  const generatedPlayerRef = useRef<HTMLAudioElement>(null);

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

  const getQualityColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 8) return 'bg-green-100 text-green-800';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSyncToggle = () => {
    setSyncPlayback(!syncPlayback);
  };

  const handlePlayPause = () => {
    const originalPlayer = originalPlayerRef.current;
    const generatedPlayer = generatedPlayerRef.current;

    if (!originalPlayer || !generatedPlayer) return;

    if (isPlaying) {
      originalPlayer.pause();
      generatedPlayer.pause();
    } else {
      if (syncPlayback) {
        // Sync both players to the same time
        generatedPlayer.currentTime = originalPlayer.currentTime;
        Promise.all([
          originalPlayer.play(),
          generatedPlayer.play(),
        ]).catch(console.error);
      } else {
        originalPlayer.play().catch(console.error);
      }
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn('space-y-4', className)}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CompareIcon size={16} />
              <CardTitle className="text-sm font-medium">
                Audio Comparison
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {getProcessingTypeLabel(processingType)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMetrics(!showMetrics)}
                className="h-6 px-2 text-xs"
              >
                {showMetrics ? 'Hide' : 'Show'} Metrics
              </Button>
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Sync Controls */}
          <div className="flex items-center justify-center gap-4 p-3 bg-muted/30 rounded-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncToggle}
              className={cn('h-8', {
                'bg-primary text-primary-foreground': syncPlayback,
              })}
            >
              <SyncIcon size={14} />
              {syncPlayback ? 'Synced' : 'Sync Playback'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayPause}
              className="h-8"
            >
              {isPlaying ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
              {isPlaying ? 'Pause Both' : 'Play Both'}
            </Button>
          </div>

          {/* Audio Players */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Audio */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AudioIcon size={14} />
                Original Audio
              </div>
              <AudioPlayerWithControls
                src={originalAudio.url}
                title={originalAudio.name}
                showControls={true}
                showWaveform={false}
                metadata={originalAudio.metadata}
              />
              <audio
                ref={originalPlayerRef}
                src={originalAudio.url}
                style={{ display: 'none' }}
              />
            </div>

            {/* Generated Audio */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AudioIcon size={14} />
                Generated Audio
              </div>
              <AudioPlayerWithControls
                src={generatedAudio.url}
                title={generatedAudio.name}
                showControls={true}
                showWaveform={true}
                metadata={generatedAudio.metadata}
              />
              <audio
                ref={generatedPlayerRef}
                src={generatedAudio.url}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Quality Metrics */}
          {showMetrics && qualityMetrics && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 border-t pt-4"
            >
              <h4 className="text-sm font-medium">Quality Comparison</h4>
              <div className="grid grid-cols-3 gap-4">
                {qualityMetrics.signalToNoiseRatio && (
                  <div className="text-center">
                    <div className="text-xs font-medium mb-1">Signal-to-Noise Ratio</div>
                    <Badge
                      variant="outline"
                      className={cn('text-xs', getQualityColor(qualityMetrics.signalToNoiseRatio))}
                    >
                      {qualityMetrics.signalToNoiseRatio.toFixed(1)} dB
                    </Badge>
                  </div>
                )}
                {qualityMetrics.clarityScore && (
                  <div className="text-center">
                    <div className="text-xs font-medium mb-1">Clarity Score</div>
                    <Badge
                      variant="outline"
                      className={cn('text-xs', getQualityColor(qualityMetrics.clarityScore))}
                    >
                      {qualityMetrics.clarityScore.toFixed(1)}/10
                    </Badge>
                  </div>
                )}
                {qualityMetrics.fidelityScore && (
                  <div className="text-center">
                    <div className="text-xs font-medium mb-1">Fidelity Score</div>
                    <Badge
                      variant="outline"
                      className={cn('text-xs', getQualityColor(qualityMetrics.fidelityScore))}
                    >
                      {qualityMetrics.fidelityScore.toFixed(1)}/10
                    </Badge>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Technical Comparison */}
          <div className="space-y-3 border-t pt-4">
            <h4 className="text-sm font-medium">Technical Comparison</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-medium mb-2">Original</div>
                <div className="space-y-1 text-muted-foreground">
                  <div>Format: {originalAudio.metadata?.format?.toUpperCase() || 'Unknown'}</div>
                  <div>Duration: {formatDuration(originalAudio.metadata?.duration)}</div>
                  <div>Size: {formatFileSize(originalAudio.metadata?.fileSize)}</div>
                  <div>Bitrate: {originalAudio.metadata?.bitrate ? `${originalAudio.metadata.bitrate} kbps` : 'Unknown'}</div>
                </div>
              </div>
              <div>
                <div className="font-medium mb-2">Generated</div>
                <div className="space-y-1 text-muted-foreground">
                  <div>Format: {generatedAudio.metadata.format.toUpperCase()}</div>
                  <div>Duration: {formatDuration(generatedAudio.metadata.duration)}</div>
                  <div>Size: {formatFileSize(generatedAudio.metadata.fileSize)}</div>
                  <div>Bitrate: {generatedAudio.metadata.bitrate} kbps</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};