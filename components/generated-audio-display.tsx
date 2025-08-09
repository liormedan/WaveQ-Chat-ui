'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioPlayer } from './audio-player';
import { AudioPlayerWithControls } from './audio-player-with-controls';
import { AudioComparisonView } from './audio-comparison-view';
import { ProcessingDetailsPanel } from './processing-details-panel';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  DownloadIcon,
  CompareIcon,
  InfoIcon,
  CheckCircleIcon,
  ClockIcon,
  AudioIcon,
  PlayIcon,
  PauseIcon,
  CheckIcon,
} from './icons';
import { cn } from '@/lib/utils';
import { DownloadUtils, downloadSingleFile } from './download-utils';

export interface GeneratedAudioFile {
  id: string;
  originalAudioId: string;
  originalAudioName: string;
  originalAudioUrl: string;
  generatedAudioName: string;
  generatedAudioUrl: string;
  processingDetails: {
    processingType:
      | 'enhancement'
      | 'transcription'
      | 'translation'
      | 'noise-reduction'
      | 'format-conversion';
    processingSteps: Array<{
      id: string;
      name: string;
      status: 'completed' | 'running' | 'error';
      duration: number;
      details?: string;
    }>;
    totalProcessingTime: number;
    qualityMetrics?: {
      signalToNoiseRatio?: number;
      clarityScore?: number;
      fidelityScore?: number;
    };
  };
  metadata: {
    format: string;
    bitrate: number;
    sampleRate: number;
    channels: number;
    duration: number;
    fileSize: number;
  };
  createdAt: Date;
}

interface GeneratedAudioDisplayProps {
  generatedAudio: GeneratedAudioFile;
  className?: string;
  chatId?: string;
  onDownload?: (audioId: string, format?: string) => void;
  onCompare?: (originalId: string, generatedId: string) => void;
  onDownloadComplete?: (downloadInfo: any[]) => void;
  onDownloadError?: (error: string) => void;
}

export const GeneratedAudioDisplay: React.FC<GeneratedAudioDisplayProps> = ({
  generatedAudio,
  className,
  chatId,
  onDownload,
  onCompare,
  onDownloadComplete,
  onDownloadError,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('mp3');

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

  const getQualityColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 8) return 'bg-green-100 text-green-800';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card
      className={cn('w-full', className)}
      data-testid="generated-audio-display"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AudioIcon size={16} />
            <CardTitle className="text-sm font-medium">
              Generated Audio: {generatedAudio.generatedAudioName}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {getProcessingTypeLabel(
                generatedAudio.processingDetails.processingType,
              )}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              <InfoIcon size={14} />
            </Button>
            {onCompare && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
                className="h-6 w-6 p-0"
              >
                <CompareIcon size={14} />
              </Button>
            )}
            {chatId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                className="h-6 w-6 p-0"
              >
                <DownloadIcon size={14} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Audio Player */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Generated Audio</span>
            <span>•</span>
            <span>{formatDuration(generatedAudio.metadata.duration)}</span>
            <span>•</span>
            <span>{formatFileSize(generatedAudio.metadata.fileSize)}</span>
          </div>

          <AudioPlayerWithControls
            src={generatedAudio.generatedAudioUrl}
            title={generatedAudio.generatedAudioName}
            className="w-full"
            showControls={true}
            showWaveform={true}
            metadata={{
              format: generatedAudio.metadata.format,
              duration: generatedAudio.metadata.duration,
              fileSize: generatedAudio.metadata.fileSize,
              bitrate: generatedAudio.metadata.bitrate,
            }}
            onDownload={() => {
              // Handle download functionality
              if (onDownload) {
                onDownload(generatedAudio.id, generatedAudio.metadata.format);
              }
            }}
            onShare={() => {
              // Handle share functionality
              console.log('Share generated audio:', generatedAudio.id);
            }}
          />
        </div>

        {/* Comparison View */}
        {showComparison && (
          <AudioComparisonView
            originalAudio={{
              url: generatedAudio.originalAudioUrl,
              name: generatedAudio.originalAudioName,
              metadata: {
                format: 'audio', // Would be determined from actual metadata
                duration: undefined,
                fileSize: undefined,
                bitrate: undefined,
              },
            }}
            generatedAudio={{
              url: generatedAudio.generatedAudioUrl,
              name: generatedAudio.generatedAudioName,
              metadata: generatedAudio.metadata,
            }}
            processingType={generatedAudio.processingDetails.processingType}
            qualityMetrics={generatedAudio.processingDetails.qualityMetrics}
            onClose={() => setShowComparison(false)}
          />
        )}

        {/* Processing Details */}
        {isExpanded && (
          <ProcessingDetailsPanel
            processingType={generatedAudio.processingDetails.processingType}
            processingSteps={generatedAudio.processingDetails.processingSteps}
            totalProcessingTime={generatedAudio.processingDetails.totalProcessingTime}
            qualityMetrics={generatedAudio.processingDetails.qualityMetrics}
            isActive={false}
            className="border-0 shadow-none"
          />
        )}

              {/* Download Options */}
              {chatId && showDownloadOptions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4 border-t pt-4"
                >
                  <h5 className="text-xs font-medium flex items-center gap-2">
                    <DownloadIcon size={14} />
                    Download Options
                  </h5>

                  <DownloadUtils
                    chatId={chatId}
                    audioIds={[generatedAudio.id]}
                    onDownloadComplete={onDownloadComplete}
                    onDownloadError={onDownloadError}
                    className="text-sm"
                  />
                </motion.div>
              )}

              {/* Legacy Download Options */}
              {onDownload && !chatId && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium">Download Options</h5>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedFormat}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                      className="text-xs border rounded px-2 py-1"
                    >
                      <option value="mp3">MP3</option>
                      <option value="wav">WAV</option>
                      <option value="flac">FLAC</option>
                      <option value="m4a">M4A</option>
                    </select>
                    <Button
                      size="sm"
                      onClick={() =>
                        onDownload(generatedAudio.id, selectedFormat)
                      }
                      className="h-6 px-2 text-xs"
                    >
                      <DownloadIcon size={12} />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
