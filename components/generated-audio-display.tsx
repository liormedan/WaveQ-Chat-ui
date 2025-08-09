'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioPlayer } from './audio-player';
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

          <AudioPlayer
            src={generatedAudio.generatedAudioUrl}
            title={generatedAudio.generatedAudioName}
            className="w-full"
          />
        </div>

        {/* Comparison View */}
        {showComparison && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-3 border-t pt-4"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Original Audio</span>
              <span>•</span>
              <span>{generatedAudio.originalAudioName}</span>
            </div>

            <AudioPlayer
              src={generatedAudio.originalAudioUrl}
              title={generatedAudio.originalAudioName}
              className="w-full"
            />
          </motion.div>
        )}

        {/* Processing Details */}
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-4 border-t pt-4"
          >
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <ClockIcon size={14} />
                Processing Details
              </h4>

              {/* Processing Steps */}
              <div className="space-y-2">
                {generatedAudio.processingDetails.processingSteps.map(
                  (step) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {step.status === 'completed' && (
                          <CheckCircleIcon
                            size={12}
                          />
                        )}
                        {step.status === 'running' && (
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
                        )}
                        {step.status === 'error' && (
                          <div className="h-3 w-3 rounded-full bg-red-500" />
                        )}
                        <span className="truncate">{step.name}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {step.duration}s
                      </span>
                    </div>
                  ),
                )}
              </div>

              {/* Quality Metrics */}
              {generatedAudio.processingDetails.qualityMetrics && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium">Quality Metrics</h5>
                  <div className="grid grid-cols-3 gap-2">
                    {generatedAudio.processingDetails.qualityMetrics
                      .signalToNoiseRatio && (
                      <div className="text-center">
                        <div className="text-xs font-medium">SNR</div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            getQualityColor(
                              generatedAudio.processingDetails.qualityMetrics
                                .signalToNoiseRatio,
                            ),
                          )}
                        >
                          {generatedAudio.processingDetails.qualityMetrics.signalToNoiseRatio.toFixed(
                            1,
                          )}{' '}
                          dB
                        </Badge>
                      </div>
                    )}
                    {generatedAudio.processingDetails.qualityMetrics
                      .clarityScore && (
                      <div className="text-center">
                        <div className="text-xs font-medium">Clarity</div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            getQualityColor(
                              generatedAudio.processingDetails.qualityMetrics
                                .clarityScore,
                            ),
                          )}
                        >
                          {generatedAudio.processingDetails.qualityMetrics.clarityScore.toFixed(
                            1,
                          )}
                          /10
                        </Badge>
                      </div>
                    )}
                    {generatedAudio.processingDetails.qualityMetrics
                      .fidelityScore && (
                      <div className="text-center">
                        <div className="text-xs font-medium">Fidelity</div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            getQualityColor(
                              generatedAudio.processingDetails.qualityMetrics
                                .fidelityScore,
                            ),
                          )}
                        >
                          {generatedAudio.processingDetails.qualityMetrics.fidelityScore.toFixed(
                            1,
                          )}
                          /10
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Technical Metadata */}
              <div className="space-y-2">
                <h5 className="text-xs font-medium">Technical Details</h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Format:</span>
                    <span className="ml-1 font-medium">
                      {generatedAudio.metadata.format.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bitrate:</span>
                    <span className="ml-1 font-medium">
                      {generatedAudio.metadata.bitrate} kbps
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sample Rate:</span>
                    <span className="ml-1 font-medium">
                      {generatedAudio.metadata.sampleRate} Hz
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Channels:</span>
                    <span className="ml-1 font-medium">
                      {generatedAudio.metadata.channels}
                    </span>
                  </div>
                </div>
              </div>

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
